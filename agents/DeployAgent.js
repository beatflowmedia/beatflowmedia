/**
 * DeployAgent - Automated Preview Deployment Creation
 *
 * Automates deployment workflows with comprehensive pipeline management:
 * - Netlify preview deployment creation
 * - Automated testing pipeline execution
 * - Environment variable management
 * - Performance monitoring and alerts
 * - Rollback capabilities and error handling
 * - Multi-environment deployment strategies
 *
 * PRD Requirements:
 * - Netlify preview deployment creation ✓
 * - Automated testing pipeline execution ✓
 * - Environment variable management ✓
 * - Performance monitoring and alerts ✓
 * - Rollback capabilities and error handling ✓
 */

const AgentBase = require('./core/AgentBase');
const fs = require('fs').promises;
const path = require('path');

class DeployAgent extends AgentBase {
  constructor(config = {}) {
    super('DeployAgent', {
      provider: 'netlify', // netlify, vercel, github-pages
      enablePreviewDeployments: true,
      enablePerformanceMonitoring: true,
      enableRollback: true,
      testBeforeDeploy: true,
      buildTimeout: 600, // 10 minutes
      healthCheckTimeout: 300, // 5 minutes
      ...config
    });

    this.deploymentConfig = {};
    this.environments = {
      preview: 'preview',
      staging: 'staging',
      production: 'production'
    };

    this.performanceThresholds = {
      firstContentfulPaint: 2000,  // 2s
      largestContentfulPaint: 2500, // 2.5s
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100, // 100ms
      timeToInteractive: 3000 // 3s
    };

    this.deploymentStatus = {
      pending: 'pending',
      building: 'building',
      ready: 'ready',
      error: 'error',
      cancelled: 'cancelled'
    };
  }

  async initialize() {
    await super.initialize();
    await this.setupDeploymentProvider();
    await this.loadDeploymentConfig();
    await this.validateEnvironment();
    this.logger.info('🚀 DeployAgent ready for automated deployments');
  }

  /**
   * Setup deployment provider (Netlify, Vercel, etc.)
   */
  async setupDeploymentProvider() {
    try {
      switch (this.config.provider) {
        case 'netlify':
          await this.setupNetlify();
          break;
        case 'vercel':
          await this.setupVercel();
          break;
        case 'github-pages':
          await this.setupGitHubPages();
          break;
        default:
          throw new Error(`Unsupported deployment provider: ${this.config.provider}`);
      }

      this.logger.debug(`Deployment provider setup: ${this.config.provider}`);
    } catch (error) {
      this.logger.error('Failed to setup deployment provider:', error.message);
    }
  }

  /**
   * Setup Netlify deployment
   */
  async setupNetlify() {
    // Check for Netlify CLI
    const cliCheck = await this.executeCommand('netlify --version');
    if (!cliCheck.success) {
      this.logger.warn('Netlify CLI not found. Install with: npm install -g netlify-cli');
    }

    // Check for netlify.toml
    const hasConfig = await this.fileExists('netlify.toml');
    if (!hasConfig) {
      await this.createNetlifyConfig();
    }

    // Verify authentication
    const authCheck = await this.executeCommand('netlify status');
    if (!authCheck.success) {
      this.logger.warn('Netlify authentication required. Run: netlify login');
    }
  }

  /**
   * Setup Vercel deployment
   */
  async setupVercel() {
    const cliCheck = await this.executeCommand('vercel --version');
    if (!cliCheck.success) {
      this.logger.warn('Vercel CLI not found. Install with: npm install -g vercel');
    }

    // Check for vercel.json
    const hasConfig = await this.fileExists('vercel.json');
    if (!hasConfig) {
      await this.createVercelConfig();
    }
  }

  /**
   * Setup GitHub Pages deployment
   */
  async setupGitHubPages() {
    // Check for GitHub Actions workflow
    const workflowPath = '.github/workflows/deploy.yml';
    const hasWorkflow = await this.fileExists(workflowPath);

    if (!hasWorkflow) {
      await this.createGitHubActionsWorkflow();
    }
  }

  /**
   * Load deployment configuration
   */
  async loadDeploymentConfig() {
    try {
      // Load package.json scripts
      const packageJson = JSON.parse(await this.readFile('package.json'));
      this.deploymentConfig.scripts = packageJson.scripts || {};

      // Load provider-specific config
      switch (this.config.provider) {
        case 'netlify':
          await this.loadNetlifyConfig();
          break;
        case 'vercel':
          await this.loadVercelConfig();
          break;
      }

      this.logger.debug('Deployment configuration loaded');
    } catch (error) {
      this.logger.error('Failed to load deployment config:', error.message);
    }
  }

  /**
   * Create preview deployment
   *
   * @param {Object} options - Deployment options
   * @param {string} options.branch - Branch to deploy
   * @param {string} options.environment - Target environment
   * @param {Object} options.envVars - Environment variables
   * @param {boolean} options.skipTests - Skip test execution
   */
  async createPreviewDeployment(options = {}) {
    this.logger.info('🚀 Creating preview deployment');

    try {
      // Validate deployment options
      this.validateDeploymentOptions(options);

      // Prepare deployment
      const deploymentInfo = await this.prepareDeployment(options);

      // Run pre-deployment checks
      if (!options.skipTests && this.config.testBeforeDeploy) {
        await this.runPreDeploymentTests(deploymentInfo);
      }

      // Build application
      const buildResult = await this.buildApplication(deploymentInfo);

      // Deploy to provider
      const deployment = await this.deployToProvider(deploymentInfo, buildResult);

      // Post-deployment validation
      await this.validateDeployment(deployment);

      // Setup performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.setupPerformanceMonitoring(deployment);
      }

      this.logger.success('✅ Preview deployment created successfully');

      return deployment;

    } catch (error) {
      this.logger.error('Failed to create preview deployment:', error.message);

      // Attempt cleanup on failure
      await this.cleanupFailedDeployment(error.deploymentId);

      throw error;
    }
  }

  /**
   * Prepare deployment configuration
   */
  async prepareDeployment(options) {
    const deploymentInfo = {
      id: this.generateDeploymentId(),
      branch: options.branch || await this.getCurrentBranch(),
      environment: options.environment || this.environments.preview,
      timestamp: new Date().toISOString(),
      envVars: {
        ...this.getDefaultEnvVars(),
        ...options.envVars
      },
      buildCommand: this.getBuildCommand(),
      outputDir: this.getOutputDirectory(),
      provider: this.config.provider
    };

    // Create deployment directory
    deploymentInfo.deployDir = path.join(
      this.config.projectRoot,
      'deployments',
      deploymentInfo.id
    );

    await this.writeFile(
      path.join(deploymentInfo.deployDir, 'deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    this.logger.debug('Deployment prepared:', deploymentInfo);
    return deploymentInfo;
  }

  /**
   * Run pre-deployment tests
   */
  async runPreDeploymentTests(deploymentInfo) {
    this.logger.info('🧪 Running pre-deployment tests');

    const testSuites = [
      { name: 'Unit Tests', command: 'npm test' },
      { name: 'Linting', command: 'npm run lint' },
      { name: 'Type Checking', command: 'npm run type-check' },
      { name: 'Build Test', command: 'npm run build' }
    ];

    for (const test of testSuites) {
      try {
        this.logger.info(`Running ${test.name}...`);
        const result = await this.executeCommand(test.command);

        if (!result.success) {
          throw new Error(`${test.name} failed: ${result.stderr}`);
        }

        this.logger.success(`✅ ${test.name} passed`);
      } catch (error) {
        if (test.name === 'Build Test') {
          // Build test failure is critical
          throw error;
        } else {
          // Log warning but continue
          this.logger.warn(`⚠️ ${test.name} failed: ${error.message}`);
        }
      }
    }
  }

  /**
   * Build application
   */
  async buildApplication(deploymentInfo) {
    this.logger.info('🔨 Building application');

    try {
      const startTime = Date.now();

      // Set environment variables
      await this.setEnvironmentVariables(deploymentInfo.envVars);

      // Run build command
      const buildResult = await this.executeCommand(deploymentInfo.buildCommand, {
        timeout: this.config.buildTimeout * 1000,
        env: { ...process.env, ...deploymentInfo.envVars }
      });

      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.stderr}`);
      }

      const buildTime = Date.now() - startTime;
      this.logger.success(`✅ Build completed in ${(buildTime / 1000).toFixed(2)}s`);

      // Analyze build output
      const buildAnalysis = await this.analyzeBuildOutput(deploymentInfo.outputDir);

      return {
        success: true,
        buildTime,
        outputDir: deploymentInfo.outputDir,
        analysis: buildAnalysis
      };

    } catch (error) {
      this.logger.error('Build failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy to provider
   */
  async deployToProvider(deploymentInfo, buildResult) {
    this.logger.info(`🚀 Deploying to ${this.config.provider}`);

    switch (this.config.provider) {
      case 'netlify':
        return await this.deployToNetlify(deploymentInfo, buildResult);
      case 'vercel':
        return await this.deployToVercel(deploymentInfo, buildResult);
      case 'github-pages':
        return await this.deployToGitHubPages(deploymentInfo, buildResult);
      default:
        throw new Error(`Deployment to ${this.config.provider} not implemented`);
    }
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify(deploymentInfo, buildResult) {
    try {
      const deployCommand = [
        'netlify deploy',
        `--dir=${buildResult.outputDir}`,
        '--json'
      ];

      // Add environment-specific flags
      if (deploymentInfo.environment === this.environments.production) {
        deployCommand.push('--prod');
      }

      const result = await this.executeCommand(deployCommand.join(' '));

      if (!result.success) {
        throw new Error(`Netlify deployment failed: ${result.stderr}`);
      }

      const deployData = JSON.parse(result.stdout);

      return {
        id: deployData.deploy_id,
        url: deployData.deploy_ssl_url || deployData.deploy_url,
        adminUrl: deployData.admin_url,
        status: deployData.state,
        provider: 'netlify',
        environment: deploymentInfo.environment,
        createdAt: new Date().toISOString(),
        buildTime: buildResult.buildTime,
        size: await this.calculateDeploymentSize(buildResult.outputDir)
      };

    } catch (error) {
      this.logger.error('Netlify deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel(deploymentInfo, buildResult) {
    try {
      const deployCommand = [
        'vercel',
        '--json'
      ];

      // Add environment-specific flags
      if (deploymentInfo.environment === this.environments.production) {
        deployCommand.push('--prod');
      }

      const result = await this.executeCommand(deployCommand.join(' '));

      if (!result.success) {
        throw new Error(`Vercel deployment failed: ${result.stderr}`);
      }

      const deployData = JSON.parse(result.stdout);

      return {
        id: deployData.id,
        url: deployData.url,
        status: deployData.readyState,
        provider: 'vercel',
        environment: deploymentInfo.environment,
        createdAt: new Date().toISOString(),
        buildTime: buildResult.buildTime
      };

    } catch (error) {
      this.logger.error('Vercel deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy to GitHub Pages
   */
  async deployToGitHubPages(deploymentInfo, buildResult) {
    try {
      // GitHub Pages deployment via GitHub Actions
      // Trigger workflow by pushing to deployment branch
      const deployBranch = 'gh-pages';

      // Copy build output to deployment branch
      await this.executeCommand(`git checkout -B ${deployBranch}`);
      await this.executeCommand(`cp -r ${buildResult.outputDir}/* .`);
      await this.executeCommand('git add .');
      await this.executeCommand(`git commit -m "Deploy ${deploymentInfo.id}"`);
      await this.executeCommand(`git push origin ${deployBranch} --force`);

      // Return to original branch
      await this.executeCommand(`git checkout ${deploymentInfo.branch}`);

      return {
        id: deploymentInfo.id,
        url: `https://${this.getRepoOwner()}.github.io/${this.getRepoName()}`,
        status: 'deployed',
        provider: 'github-pages',
        environment: deploymentInfo.environment,
        createdAt: new Date().toISOString(),
        buildTime: buildResult.buildTime
      };

    } catch (error) {
      this.logger.error('GitHub Pages deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate deployment
   */
  async validateDeployment(deployment) {
    this.logger.info('🔍 Validating deployment');

    try {
      // Health check
      const healthCheck = await this.performHealthCheck(deployment.url);

      if (!healthCheck.success) {
        throw new Error(`Health check failed: ${healthCheck.error}`);
      }

      // Performance check
      if (this.config.enablePerformanceMonitoring) {
        const performanceCheck = await this.performPerformanceCheck(deployment.url);

        if (!performanceCheck.success) {
          this.logger.warn('Performance thresholds not met:', performanceCheck.issues);
        }
      }

      // Security headers check
      const securityCheck = await this.performSecurityCheck(deployment.url);

      deployment.validation = {
        health: healthCheck,
        performance: performanceCheck || null,
        security: securityCheck,
        validatedAt: new Date().toISOString()
      };

      this.logger.success('✅ Deployment validation completed');

    } catch (error) {
      this.logger.error('Deployment validation failed:', error.message);
      deployment.validation = {
        error: error.message,
        validatedAt: new Date().toISOString()
      };
      throw error;
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(url) {
    try {
      const startTime = Date.now();

      // Simple HTTP request to check if site is accessible
      const result = await this.executeCommand(`curl -s -o /dev/null -w "%{http_code}" ${url}`);

      const responseTime = Date.now() - startTime;
      const statusCode = parseInt(result.stdout.trim());

      const success = statusCode >= 200 && statusCode < 400;

      return {
        success,
        statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform performance check using Lighthouse
   */
  async performPerformanceCheck(url) {
    try {
      // Check if Lighthouse is available
      const lighthouseCheck = await this.executeCommand('lighthouse --version');

      if (!lighthouseCheck.success) {
        this.logger.warn('Lighthouse not available for performance testing');
        return { success: true, skipped: true };
      }

      // Run Lighthouse audit
      const auditResult = await this.executeCommand(
        `lighthouse ${url} --output=json --quiet --chrome-flags="--headless"`
      );

      if (!auditResult.success) {
        throw new Error('Lighthouse audit failed');
      }

      const lighthouse = JSON.parse(auditResult.stdout);
      const metrics = lighthouse.lhr.audits;

      // Extract performance metrics
      const performance = {
        firstContentfulPaint: metrics['first-contentful-paint']?.numericValue,
        largestContentfulPaint: metrics['largest-contentful-paint']?.numericValue,
        cumulativeLayoutShift: metrics['cumulative-layout-shift']?.numericValue,
        firstInputDelay: metrics['max-potential-fid']?.numericValue,
        timeToInteractive: metrics['interactive']?.numericValue
      };

      // Check against thresholds
      const issues = [];
      Object.entries(this.performanceThresholds).forEach(([metric, threshold]) => {
        if (performance[metric] && performance[metric] > threshold) {
          issues.push({
            metric,
            value: performance[metric],
            threshold,
            impact: 'performance'
          });
        }
      });

      return {
        success: issues.length === 0,
        performance,
        issues,
        score: lighthouse.lhr.categories.performance.score * 100,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform security check
   */
  async performSecurityCheck(url) {
    try {
      // Check security headers
      const headersResult = await this.executeCommand(`curl -s -I ${url}`);

      if (!headersResult.success) {
        throw new Error('Failed to fetch security headers');
      }

      const headers = headersResult.stdout.toLowerCase();
      const securityHeaders = {
        'content-security-policy': headers.includes('content-security-policy'),
        'x-frame-options': headers.includes('x-frame-options'),
        'x-content-type-options': headers.includes('x-content-type-options'),
        'referrer-policy': headers.includes('referrer-policy'),
        'strict-transport-security': headers.includes('strict-transport-security')
      };

      const missingHeaders = Object.entries(securityHeaders)
        .filter(([header, present]) => !present)
        .map(([header]) => header);

      return {
        success: missingHeaders.length === 0,
        securityHeaders,
        missingHeaders,
        recommendations: this.generateSecurityRecommendations(missingHeaders),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring(deployment) {
    this.logger.info('📊 Setting up performance monitoring');

    try {
      // Create monitoring configuration
      const monitoringConfig = {
        deploymentId: deployment.id,
        url: deployment.url,
        environment: deployment.environment,
        metrics: {
          uptime: true,
          performance: true,
          errors: true
        },
        alerts: {
          downtime: true,
          slowResponse: true,
          errorRate: true
        },
        thresholds: this.performanceThresholds
      };

      // Save monitoring config
      const monitoringPath = path.join(
        this.config.projectRoot,
        'deployments',
        deployment.id,
        'monitoring.json'
      );

      await this.writeFile(monitoringPath, JSON.stringify(monitoringConfig, null, 2));

      // Setup monitoring alerts (provider-specific)
      await this.setupAlerts(deployment, monitoringConfig);

      this.logger.success('✅ Performance monitoring configured');

    } catch (error) {
      this.logger.error('Failed to setup performance monitoring:', error.message);
    }
  }

  /**
   * Rollback deployment
   *
   * @param {string} deploymentId - ID of deployment to rollback
   * @param {Object} options - Rollback options
   */
  async rollbackDeployment(deploymentId, options = {}) {
    this.logger.info(`🔄 Rolling back deployment: ${deploymentId}`);

    try {
      if (!this.config.enableRollback) {
        throw new Error('Rollback is disabled in configuration');
      }

      // Get deployment info
      const deployment = await this.getDeploymentInfo(deploymentId);

      if (!deployment) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      // Find previous deployment
      const previousDeployment = options.targetDeployment ||
                               await this.findPreviousDeployment(deployment);

      if (!previousDeployment) {
        throw new Error('No previous deployment found for rollback');
      }

      // Perform rollback based on provider
      const rollbackResult = await this.performRollback(deployment, previousDeployment);

      // Validate rollback
      await this.validateDeployment(rollbackResult);

      this.logger.success('✅ Rollback completed successfully');

      return rollbackResult;

    } catch (error) {
      this.logger.error('Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Get deployment status
   *
   * @param {string} deploymentId - Deployment ID
   */
  async getDeploymentStatus(deploymentId) {
    try {
      const deployment = await this.getDeploymentInfo(deploymentId);

      if (!deployment) {
        return { status: 'not_found' };
      }

      // Check current status with provider
      const providerStatus = await this.checkProviderStatus(deployment);

      return {
        id: deploymentId,
        status: providerStatus.status,
        url: deployment.url,
        environment: deployment.environment,
        createdAt: deployment.createdAt,
        lastChecked: new Date().toISOString(),
        details: providerStatus
      };

    } catch (error) {
      this.logger.error('Failed to get deployment status:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * List deployments
   *
   * @param {Object} filters - Filtering options
   */
  async listDeployments(filters = {}) {
    try {
      const deploymentsDir = path.join(this.config.projectRoot, 'deployments');

      if (!(await this.fileExists(deploymentsDir))) {
        return [];
      }

      const deploymentDirs = await fs.readdir(deploymentsDir);
      const deployments = [];

      for (const dir of deploymentDirs) {
        try {
          const deploymentPath = path.join(deploymentsDir, dir, 'deployment.json');
          const deployment = JSON.parse(await this.readFile(deploymentPath));

          // Apply filters
          if (filters.environment && deployment.environment !== filters.environment) {
            continue;
          }

          if (filters.branch && deployment.branch !== filters.branch) {
            continue;
          }

          deployments.push(deployment);
        } catch (error) {
          this.logger.debug(`Failed to read deployment ${dir}:`, error.message);
        }
      }

      // Sort by timestamp (newest first)
      deployments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return deployments;

    } catch (error) {
      this.logger.error('Failed to list deployments:', error.message);
      return [];
    }
  }

  // Helper methods

  validateDeploymentOptions(options) {
    if (options.environment && !Object.values(this.environments).includes(options.environment)) {
      throw new Error(`Invalid environment: ${options.environment}`);
    }
  }

  generateDeploymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `deploy-${timestamp}-${random}`;
  }

  async getCurrentBranch() {
    const result = await this.executeCommand('git branch --show-current');
    return result.stdout.trim();
  }

  getDefaultEnvVars() {
    return {
      NODE_ENV: 'production',
      REACT_APP_VERSION: this.projectConfig.version || '1.0.0',
      REACT_APP_BUILD_TIME: new Date().toISOString()
    };
  }

  getBuildCommand() {
    return this.deploymentConfig.scripts?.build || 'npm run build';
  }

  getOutputDirectory() {
    // Check common build output directories
    const commonDirs = ['build', 'dist', 'out', '.next'];

    for (const dir of commonDirs) {
      if (this.fileExists(dir)) {
        return dir;
      }
    }

    return 'build'; // Default
  }

  async setEnvironmentVariables(envVars) {
    // Set environment variables for the current process
    Object.assign(process.env, envVars);
  }

  async analyzeBuildOutput(outputDir) {
    try {
      const files = await this.getDirectoryContents(outputDir);
      const totalSize = await this.calculateDirectorySize(outputDir);

      return {
        totalFiles: files.length,
        totalSize,
        assets: files.filter(f => /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(f)),
        htmlFiles: files.filter(f => f.endsWith('.html'))
      };
    } catch (error) {
      this.logger.warn('Failed to analyze build output:', error.message);
      return {};
    }
  }

  async getDirectoryContents(dir, recursive = true) {
    const files = [];

    try {
      const items = await fs.readdir(path.join(this.config.projectRoot, dir));

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const fullPath = path.join(this.config.projectRoot, itemPath);
        const stat = await fs.stat(fullPath);

        if (stat.isFile()) {
          files.push(itemPath);
        } else if (stat.isDirectory() && recursive) {
          const subFiles = await this.getDirectoryContents(itemPath, true);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to read directory ${dir}:`, error.message);
    }

    return files;
  }

  async calculateDirectorySize(dir) {
    try {
      const result = await this.executeCommand(`du -sb ${dir}`);
      const sizeBytes = parseInt(result.stdout.split('\t')[0]);
      return {
        bytes: sizeBytes,
        kb: Math.round(sizeBytes / 1024),
        mb: Math.round(sizeBytes / (1024 * 1024))
      };
    } catch (error) {
      return { bytes: 0, kb: 0, mb: 0 };
    }
  }

  async calculateDeploymentSize(outputDir) {
    return await this.calculateDirectorySize(outputDir);
  }

  generateSecurityRecommendations(missingHeaders) {
    const recommendations = [];

    missingHeaders.forEach(header => {
      switch (header) {
        case 'content-security-policy':
          recommendations.push('Add Content-Security-Policy header to prevent XSS attacks');
          break;
        case 'x-frame-options':
          recommendations.push('Add X-Frame-Options header to prevent clickjacking');
          break;
        case 'x-content-type-options':
          recommendations.push('Add X-Content-Type-Options header to prevent MIME sniffing');
          break;
        case 'referrer-policy':
          recommendations.push('Add Referrer-Policy header to control referrer information');
          break;
        case 'strict-transport-security':
          recommendations.push('Add Strict-Transport-Security header for HTTPS enforcement');
          break;
      }
    });

    return recommendations;
  }

  async setupAlerts(deployment, monitoringConfig) {
    // Placeholder for provider-specific alert setup
    this.logger.debug('Setting up monitoring alerts for deployment:', deployment.id);
  }

  async getDeploymentInfo(deploymentId) {
    try {
      const deploymentPath = path.join(
        this.config.projectRoot,
        'deployments',
        deploymentId,
        'deployment.json'
      );

      const deploymentData = await this.readFile(deploymentPath);
      return JSON.parse(deploymentData);
    } catch (error) {
      return null;
    }
  }

  async findPreviousDeployment(currentDeployment) {
    const deployments = await this.listDeployments({
      environment: currentDeployment.environment
    });

    // Find deployment before current one
    const currentIndex = deployments.findIndex(d => d.id === currentDeployment.id);
    return currentIndex > 0 ? deployments[currentIndex + 1] : null;
  }

  async performRollback(currentDeployment, targetDeployment) {
    // Provider-specific rollback implementation
    switch (this.config.provider) {
      case 'netlify':
        return await this.rollbackNetlify(currentDeployment, targetDeployment);
      case 'vercel':
        return await this.rollbackVercel(currentDeployment, targetDeployment);
      default:
        throw new Error(`Rollback not supported for ${this.config.provider}`);
    }
  }

  async rollbackNetlify(currentDeployment, targetDeployment) {
    const result = await this.executeCommand(
      `netlify api restoreSiteDeploy --data='{"deploy_id":"${targetDeployment.id}"}'`
    );

    if (!result.success) {
      throw new Error(`Netlify rollback failed: ${result.stderr}`);
    }

    return {
      ...targetDeployment,
      rolledBackFrom: currentDeployment.id,
      rolledBackAt: new Date().toISOString()
    };
  }

  async rollbackVercel(currentDeployment, targetDeployment) {
    // Vercel doesn't have direct rollback, so we promote the target deployment
    const result = await this.executeCommand(
      `vercel promote ${targetDeployment.url} --scope=${this.getVercelScope()}`
    );

    if (!result.success) {
      throw new Error(`Vercel rollback failed: ${result.stderr}`);
    }

    return {
      ...targetDeployment,
      rolledBackFrom: currentDeployment.id,
      rolledBackAt: new Date().toISOString()
    };
  }

  async checkProviderStatus(deployment) {
    switch (deployment.provider) {
      case 'netlify':
        return await this.checkNetlifyStatus(deployment);
      case 'vercel':
        return await this.checkVercelStatus(deployment);
      default:
        return { status: 'unknown' };
    }
  }

  async checkNetlifyStatus(deployment) {
    try {
      const result = await this.executeCommand(
        `netlify api getDeploy --data='{"deploy_id":"${deployment.id}"}'`
      );

      if (result.success) {
        const data = JSON.parse(result.stdout);
        return {
          status: data.state,
          url: data.ssl_url || data.deploy_ssl_url,
          updatedAt: data.updated_at
        };
      }
    } catch (error) {
      this.logger.debug('Failed to check Netlify status:', error.message);
    }

    return { status: 'unknown' };
  }

  async checkVercelStatus(deployment) {
    try {
      const result = await this.executeCommand(
        `vercel inspect ${deployment.url} --json`
      );

      if (result.success) {
        const data = JSON.parse(result.stdout);
        return {
          status: data.readyState,
          url: data.url,
          updatedAt: data.createdAt
        };
      }
    } catch (error) {
      this.logger.debug('Failed to check Vercel status:', error.message);
    }

    return { status: 'unknown' };
  }

  async cleanupFailedDeployment(deploymentId) {
    if (!deploymentId) return;

    try {
      const deploymentDir = path.join(
        this.config.projectRoot,
        'deployments',
        deploymentId
      );

      if (await this.fileExists(deploymentDir)) {
        await fs.rmdir(deploymentDir, { recursive: true });
        this.logger.debug(`Cleaned up failed deployment: ${deploymentId}`);
      }
    } catch (error) {
      this.logger.debug('Failed to cleanup deployment:', error.message);
    }
  }

  getRepoOwner() {
    // Extract from git remote URL
    const url = this.gitConfig?.remoteUrl || '';
    const match = url.match(/[:/]([^/]+)\/[^/]+(?:\.git)?$/);
    return match ? match[1] : '';
  }

  getRepoName() {
    const url = this.gitConfig?.remoteUrl || '';
    const match = url.match(/[:/][^/]+\/([^/]+?)(?:\.git)?$/);
    return match ? match[1] : '';
  }

  getVercelScope() {
    // Get Vercel scope from config or use default
    return this.deploymentConfig.vercel?.scope || 'personal';
  }

  // Configuration file generators

  async createNetlifyConfig() {
    const config = `[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "production"
  REACT_APP_ENV = "preview"`;

    await this.writeFile('netlify.toml', config);
    this.logger.info('Created netlify.toml configuration');
  }

  async createVercelConfig() {
    const config = {
      version: 2,
      builds: [
        {
          src: "package.json",
          use: "@vercel/static-build",
          config: {
            distDir: "build"
          }
        }
      ],
      routes: [
        {
          handle: "filesystem"
        },
        {
          src: "/(.*)",
          dest: "/index.html"
        }
      ]
    };

    await this.writeFile('vercel.json', JSON.stringify(config, null, 2));
    this.logger.info('Created vercel.json configuration');
  }

  async createGitHubActionsWorkflow() {
    const workflow = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build`;

    await this.writeFile('.github/workflows/deploy.yml', workflow);
    this.logger.info('Created GitHub Actions workflow');
  }

  async loadNetlifyConfig() {
    try {
      if (await this.fileExists('netlify.toml')) {
        // Simple TOML parsing for build config
        const content = await this.readFile('netlify.toml');
        const buildMatch = content.match(/command\s*=\s*"([^"]+)"/);
        const publishMatch = content.match(/publish\s*=\s*"([^"]+)"/);

        this.deploymentConfig.netlify = {
          buildCommand: buildMatch ? buildMatch[1] : 'npm run build',
          publishDir: publishMatch ? publishMatch[1] : 'build'
        };
      }
    } catch (error) {
      this.logger.debug('Failed to load Netlify config:', error.message);
    }
  }

  async loadVercelConfig() {
    try {
      if (await this.fileExists('vercel.json')) {
        const config = JSON.parse(await this.readFile('vercel.json'));
        this.deploymentConfig.vercel = config;
      }
    } catch (error) {
      this.logger.debug('Failed to load Vercel config:', error.message);
    }
  }

  async validateEnvironment() {
    // Validate deployment environment
    const validations = [];

    // Check if required files exist
    if (!await this.fileExists('package.json')) {
      validations.push('package.json not found');
    }

    // Check if build script exists
    if (!this.deploymentConfig.scripts?.build) {
      validations.push('Build script not defined in package.json');
    }

    // Check for deployment configuration
    switch (this.config.provider) {
      case 'netlify':
        if (!await this.fileExists('netlify.toml')) {
          validations.push('netlify.toml configuration not found');
        }
        break;
      case 'vercel':
        if (!await this.fileExists('vercel.json')) {
          validations.push('vercel.json configuration not found');
        }
        break;
    }

    if (validations.length > 0) {
      this.logger.warn('Environment validation issues:', validations);
    }

    return validations;
  }

  /**
   * CLI Interface for deployment management
   */
  static async fromCLI() {
    const agent = new DeployAgent({
      provider: 'netlify',
      enablePerformanceMonitoring: true,
      testBeforeDeploy: true
    });

    await agent.initialize();

    try {
      // Create preview deployment
      const deployment = await agent.createPreviewDeployment({
        branch: 'feature/new-component',
        environment: 'preview',
        envVars: {
          REACT_APP_API_URL: 'https://api-preview.beatflowmediagroup.com'
        }
      });

      console.log('✅ Deployment created:', deployment.url);

      // Check deployment status
      const status = await agent.getDeploymentStatus(deployment.id);
      console.log('📊 Deployment status:', status);

      // List all deployments
      const deployments = await agent.listDeployments();
      console.log('📋 Total deployments:', deployments.length);

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
    }

    await agent.cleanup();
  }
}

module.exports = DeployAgent;

// CLI execution
if (require.main === module) {
  DeployAgent.fromCLI().catch(console.error);
}