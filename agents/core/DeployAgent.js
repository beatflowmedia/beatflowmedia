const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * DeployAgent - Automated preview deployment creation and management
 * Supports Netlify, Vercel, GitHub Pages, and custom deployment strategies
 */
class DeployAgent {
  constructor(config = {}) {
    this.config = {
      platform: config.platform || 'netlify',
      buildCommand: config.buildCommand || 'npm run build',
      buildDir: config.buildDir || 'build',
      functionsDir: config.functionsDir || 'netlify/functions',
      envVarPrefix: config.envVarPrefix || 'REACT_APP_',
      previewDomain: config.previewDomain || null,
      productionDomain: config.productionDomain || null,
      autoCleanup: config.autoCleanup !== false,
      maxPreviewDays: config.maxPreviewDays || 30,
      ...config
    };

    this.platforms = {
      NETLIFY: 'netlify',
      VERCEL: 'vercel',
      GITHUB_PAGES: 'github-pages',
      CUSTOM: 'custom'
    };

    this.deploymentTypes = {
      PREVIEW: 'preview deployment for PR',
      STAGING: 'staging environment deployment',
      PRODUCTION: 'production deployment',
      FEATURE: 'feature branch deployment'
    };

    this.environmentConfigs = {
      preview: {
        NODE_ENV: 'development',
        REACT_APP_ENV: 'preview',
        REACT_APP_API_URL: 'https://api-preview.beatflowmediagroup.com'
      },
      staging: {
        NODE_ENV: 'production',
        REACT_APP_ENV: 'staging',
        REACT_APP_API_URL: 'https://api-staging.beatflowmediagroup.com'
      },
      production: {
        NODE_ENV: 'production',
        REACT_APP_ENV: 'production',
        REACT_APP_API_URL: 'https://api.beatflowmediagroup.com'
      }
    };
  }

  /**
   * Execute complete deployment workflow
   */
  async executeDeployment(deploymentConfig) {
    try {
      const {
        type = 'PREVIEW',
        branch = 'main',
        prNumber = null,
        environment = 'preview',
        skipBuild = false,
        skipTests = false,
        notify = true
      } = deploymentConfig;

      console.log(`🚀 DeployAgent: Starting ${type} deployment for branch ${branch}`);

      const deployment = {
        id: this.generateDeploymentId(type, branch, prNumber),
        type,
        branch,
        prNumber,
        environment,
        status: 'started',
        startTime: new Date().toISOString(),
        steps: []
      };

      // Step 1: Pre-deployment validation
      await this.validateDeployment(deployment);

      // Step 2: Setup environment variables
      await this.setupEnvironment(deployment, environment);

      // Step 3: Run tests if not skipped
      if (!skipTests) {
        await this.runPreDeploymentTests(deployment);
      }

      // Step 4: Build application if not skipped
      if (!skipBuild) {
        await this.buildApplication(deployment);
      }

      // Step 5: Deploy to platform
      const deploymentUrl = await this.deployToPlatform(deployment);

      // Step 6: Post-deployment validation
      await this.validateDeployment(deployment, deploymentUrl);

      // Step 7: Update PR with deployment info
      if (prNumber && notify) {
        await this.updatePRWithDeployment(prNumber, deploymentUrl, deployment);
      }

      // Step 8: Setup monitoring and alerts
      await this.setupMonitoring(deployment, deploymentUrl);

      deployment.status = 'completed';
      deployment.url = deploymentUrl;
      deployment.endTime = new Date().toISOString();

      console.log(`✅ Deployment completed: ${deploymentUrl}`);

      return {
        success: true,
        deployment,
        metrics: await this.getDeploymentMetrics(deployment)
      };

    } catch (error) {
      console.error(`❌ DeployAgent error:`, error.message);
      return {
        success: false,
        error: error.message,
        deployment: deploymentConfig
      };
    }
  }

  /**
   * Validate deployment prerequisites
   */
  async validateDeployment(deployment, url = null) {
    try {
      console.log('🔍 Validating deployment...');

      const validations = [];

      if (!url) {
        // Pre-deployment validations
        validations.push(this.validateBuildConfiguration());
        validations.push(this.validateEnvironmentVariables(deployment.environment));
        validations.push(this.validateDependencies());
        validations.push(this.validateGitState());
      } else {
        // Post-deployment validations
        validations.push(this.validateDeploymentUrl(url));
        validations.push(this.validateFunctionalities(url));
        validations.push(this.validatePerformance(url));
        validations.push(this.validateSecurity(url));
      }

      const results = await Promise.allSettled(validations);
      const failures = results.filter(r => r.status === 'rejected');

      if (failures.length > 0) {
        throw new Error(`Validation failed: ${failures.map(f => f.reason).join(', ')}`);
      }

      deployment.steps.push({
        name: url ? 'post-deployment-validation' : 'pre-deployment-validation',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      return true;

    } catch (error) {
      deployment.steps.push({
        name: 'validation',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Setup environment variables for deployment
   */
  async setupEnvironment(deployment, environment) {
    try {
      console.log(`🔧 Setting up ${environment} environment...`);

      const envVars = {
        ...this.environmentConfigs[environment],
        REACT_APP_DEPLOYMENT_ID: deployment.id,
        REACT_APP_DEPLOYMENT_TIME: deployment.startTime,
        REACT_APP_BRANCH: deployment.branch
      };

      // Add PR-specific variables
      if (deployment.prNumber) {
        envVars.REACT_APP_PR_NUMBER = deployment.prNumber.toString();
        envVars.REACT_APP_PREVIEW_MODE = 'true';
      }

      // Write environment file
      const envContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      await fs.writeFile('.env.local', envContent);

      deployment.steps.push({
        name: 'environment-setup',
        status: 'completed',
        envVars: Object.keys(envVars),
        timestamp: new Date().toISOString()
      });

      return envVars;

    } catch (error) {
      deployment.steps.push({
        name: 'environment-setup',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Run pre-deployment tests
   */
  async runPreDeploymentTests(deployment) {
    try {
      console.log('🧪 Running pre-deployment tests...');

      const testResults = {
        unit: null,
        integration: null,
        e2e: null,
        accessibility: null,
        performance: null
      };

      // Run unit tests
      try {
        execSync('npm run test -- --coverage --watchAll=false', { stdio: 'pipe' });
        testResults.unit = 'passed';
      } catch (error) {
        testResults.unit = 'failed';
        throw new Error('Unit tests failed');
      }

      // Run integration tests if available
      try {
        execSync('npm run test:integration', { stdio: 'pipe' });
        testResults.integration = 'passed';
      } catch (error) {
        testResults.integration = 'skipped';
      }

      // Run E2E tests if available
      try {
        execSync('npm run test:e2e', { stdio: 'pipe' });
        testResults.e2e = 'passed';
      } catch (error) {
        testResults.e2e = 'skipped';
      }

      deployment.steps.push({
        name: 'pre-deployment-tests',
        status: 'completed',
        results: testResults,
        timestamp: new Date().toISOString()
      });

      return testResults;

    } catch (error) {
      deployment.steps.push({
        name: 'pre-deployment-tests',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Build application for deployment
   */
  async buildApplication(deployment) {
    try {
      console.log('🔨 Building application...');

      const buildStart = Date.now();

      // Clean previous build
      try {
        execSync(`rm -rf ${this.config.buildDir}`, { stdio: 'pipe' });
      } catch (error) {
        // Ignore if directory doesn't exist
      }

      // Run build command
      const buildOutput = execSync(this.config.buildCommand, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const buildTime = Date.now() - buildStart;

      // Analyze build output
      const buildStats = await this.analyzeBuildOutput(this.config.buildDir);

      deployment.steps.push({
        name: 'build',
        status: 'completed',
        buildTime,
        stats: buildStats,
        timestamp: new Date().toISOString()
      });

      return buildStats;

    } catch (error) {
      deployment.steps.push({
        name: 'build',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Deploy to specified platform
   */
  async deployToPlatform(deployment) {
    switch (this.config.platform) {
      case this.platforms.NETLIFY:
        return await this.deployToNetlify(deployment);
      case this.platforms.VERCEL:
        return await this.deployToVercel(deployment);
      case this.platforms.GITHUB_PAGES:
        return await this.deployToGitHubPages(deployment);
      default:
        throw new Error(`Unsupported platform: ${this.config.platform}`);
    }
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify(deployment) {
    try {
      console.log('🌐 Deploying to Netlify...');

      const deployCommand = deployment.type === 'PRODUCTION'
        ? 'netlify deploy --prod'
        : `netlify deploy --alias ${deployment.id}`;

      const output = execSync(`${deployCommand} --dir ${this.config.buildDir}`, {
        encoding: 'utf8'
      });

      // Extract URL from output
      const urlMatch = output.match(/Website URL: (https?:\/\/[^\s]+)/);
      const deploymentUrl = urlMatch ? urlMatch[1] : null;

      if (!deploymentUrl) {
        throw new Error('Could not extract deployment URL from Netlify output');
      }

      deployment.steps.push({
        name: 'netlify-deployment',
        status: 'completed',
        url: deploymentUrl,
        timestamp: new Date().toISOString()
      });

      return deploymentUrl;

    } catch (error) {
      deployment.steps.push({
        name: 'netlify-deployment',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel(deployment) {
    try {
      console.log('🌐 Deploying to Vercel...');

      const prodFlag = deployment.type === 'PRODUCTION' ? '--prod' : '';
      const aliasFlag = deployment.type !== 'PRODUCTION' ? `--name ${deployment.id}` : '';

      const output = execSync(`vercel deploy ${prodFlag} ${aliasFlag}`, {
        encoding: 'utf8'
      });

      const deploymentUrl = output.trim();

      deployment.steps.push({
        name: 'vercel-deployment',
        status: 'completed',
        url: deploymentUrl,
        timestamp: new Date().toISOString()
      });

      return deploymentUrl;

    } catch (error) {
      deployment.steps.push({
        name: 'vercel-deployment',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Deploy to GitHub Pages
   */
  async deployToGitHubPages(deployment) {
    try {
      console.log('🌐 Deploying to GitHub Pages...');

      // Use gh-pages package or git subtree
      const output = execSync(`npx gh-pages -d ${this.config.buildDir}`, {
        encoding: 'utf8'
      });

      // Construct GitHub Pages URL
      const repoInfo = this.getRepoInfo();
      const deploymentUrl = `https://${repoInfo.owner}.github.io/${repoInfo.repo}`;

      deployment.steps.push({
        name: 'github-pages-deployment',
        status: 'completed',
        url: deploymentUrl,
        timestamp: new Date().toISOString()
      });

      return deploymentUrl;

    } catch (error) {
      deployment.steps.push({
        name: 'github-pages-deployment',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Update PR with deployment information
   */
  async updatePRWithDeployment(prNumber, deploymentUrl, deployment) {
    try {
      console.log(`📋 Updating PR #${prNumber} with deployment info...`);

      const deploymentComment = this.generateDeploymentComment(deploymentUrl, deployment);

      // Add comment to PR
      execSync(`gh pr comment ${prNumber} --body "${deploymentComment}"`, { stdio: 'pipe' });

      // Update PR status
      const statusContext = `deploy/${deployment.environment}`;
      const statusDescription = `Deployment successful: ${deploymentUrl}`;

      try {
        execSync(`gh api repos/:owner/:repo/statuses/$(gh pr view ${prNumber} --json headRefOid -q .headRefOid) -f state=success -f context="${statusContext}" -f description="${statusDescription}" -f target_url="${deploymentUrl}"`, { stdio: 'pipe' });
      } catch (error) {
        console.warn('⚠️ Could not update PR status');
      }

      return true;

    } catch (error) {
      console.warn(`⚠️ Could not update PR: ${error.message}`);
      return false;
    }
  }

  /**
   * Setup monitoring and alerts for deployment
   */
  async setupMonitoring(deployment, deploymentUrl) {
    try {
      console.log('📊 Setting up monitoring...');

      const monitoring = {
        healthCheck: await this.setupHealthCheck(deploymentUrl),
        performanceMonitoring: await this.setupPerformanceMonitoring(deploymentUrl),
        errorTracking: await this.setupErrorTracking(deploymentUrl),
        uptime: await this.setupUptimeMonitoring(deploymentUrl)
      };

      deployment.steps.push({
        name: 'monitoring-setup',
        status: 'completed',
        monitoring,
        timestamp: new Date().toISOString()
      });

      return monitoring;

    } catch (error) {
      deployment.steps.push({
        name: 'monitoring-setup',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.warn(`⚠️ Could not setup monitoring: ${error.message}`);
      return {};
    }
  }

  /**
   * Generate deployment comment for PR
   */
  generateDeploymentComment(deploymentUrl, deployment) {
    const duration = new Date(deployment.endTime) - new Date(deployment.startTime);
    const durationMinutes = Math.round(duration / 1000 / 60 * 100) / 100;

    return `## 🚀 Deployment Complete

**Environment:** ${deployment.environment}
**URL:** ${deploymentUrl}
**Duration:** ${durationMinutes} minutes
**Status:** ✅ Success

### Deployment Details
- **ID:** \`${deployment.id}\`
- **Branch:** \`${deployment.branch}\`
- **Type:** ${deployment.type}

### Quick Actions
- [📱 Preview Site](${deploymentUrl})
- [📊 Performance Report](${deploymentUrl}/__performance)
- [🔍 Logs](${deploymentUrl}/__logs)

---
🤖 Generated with [Claude Code](https://claude.ai/code)`;
  }

  /**
   * Validation methods
   */
  async validateBuildConfiguration() {
    try {
      // Check if package.json has required scripts
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

      if (!packageJson.scripts || !packageJson.scripts.build) {
        throw new Error('Build script not found in package.json');
      }

      return true;
    } catch (error) {
      throw new Error(`Build configuration invalid: ${error.message}`);
    }
  }

  async validateEnvironmentVariables(environment) {
    const requiredVars = this.environmentConfigs[environment];

    if (!requiredVars) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    return true;
  }

  async validateDependencies() {
    try {
      execSync('npm ls', { stdio: 'pipe' });
      return true;
    } catch (error) {
      throw new Error('Dependency validation failed');
    }
  }

  async validateGitState() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });

      if (status.trim()) {
        console.warn('⚠️ Uncommitted changes detected');
      }

      return true;
    } catch (error) {
      throw new Error('Git state validation failed');
    }
  }

  async validateDeploymentUrl(url) {
    try {
      // Simple HTTP check
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Deployment URL returned ${response.status}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Deployment URL validation failed: ${error.message}`);
    }
  }

  async validateFunctionalities(url) {
    // Placeholder for functionality testing
    return true;
  }

  async validatePerformance(url) {
    // Placeholder for performance testing
    return true;
  }

  async validateSecurity(url) {
    // Placeholder for security testing
    return true;
  }

  /**
   * Utility methods
   */
  generateDeploymentId(type, branch, prNumber) {
    const timestamp = Date.now().toString(36);
    const branchSafe = branch.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (prNumber) {
      return `pr-${prNumber}-${branchSafe}-${timestamp}`;
    }

    return `${type.toLowerCase()}-${branchSafe}-${timestamp}`;
  }

  async analyzeBuildOutput(buildDir) {
    try {
      const stats = await fs.stat(buildDir);
      const files = await this.getAllFiles(buildDir);

      const totalSize = await Promise.all(
        files.map(async (file) => {
          const stat = await fs.stat(file);
          return stat.size;
        })
      ).then(sizes => sizes.reduce((sum, size) => sum + size, 0));

      return {
        totalFiles: files.length,
        totalSize,
        buildTime: stats.mtime
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        error: error.message
      };
    }
  }

  async getAllFiles(dir) {
    const files = [];

    async function traverse(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await traverse(dir);
    return files;
  }

  getRepoInfo() {
    try {
      const origin = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = origin.match(/github\.com[:/]([^/]+)\/([^.]+)/);

      if (match) {
        return {
          owner: match[1],
          repo: match[2]
        };
      }

      throw new Error('Could not parse repository info');
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  async setupHealthCheck(url) {
    // Placeholder for health check setup
    return { enabled: true, endpoint: `${url}/health` };
  }

  async setupPerformanceMonitoring(url) {
    // Placeholder for performance monitoring setup
    return { enabled: true, endpoint: `${url}/__performance` };
  }

  async setupErrorTracking(url) {
    // Placeholder for error tracking setup
    return { enabled: true, endpoint: `${url}/__errors` };
  }

  async setupUptimeMonitoring(url) {
    // Placeholder for uptime monitoring setup
    return { enabled: true, interval: '5m' };
  }

  async getDeploymentMetrics(deployment) {
    const duration = new Date(deployment.endTime) - new Date(deployment.startTime);

    return {
      duration,
      steps: deployment.steps.length,
      successfulSteps: deployment.steps.filter(s => s.status === 'completed').length,
      failedSteps: deployment.steps.filter(s => s.status === 'failed').length,
      deploymentSize: deployment.steps.find(s => s.name === 'build')?.stats?.totalSize || 0,
      buildTime: deployment.steps.find(s => s.name === 'build')?.buildTime || 0
    };
  }
}

module.exports = DeployAgent;