const ScaffoldAgent = require('./ScaffoldAgent');
const TestGenAgent = require('./TestGenAgent');
const LintTypeAgent = require('./LintTypeAgent');
const PRAgent = require('./PRAgent');
const DeployAgent = require('./DeployAgent');
const fs = require('fs').promises;
const path = require('path');

/**
 * AgentOrchestrator - Central coordination system for all development agents
 * Manages workflows, inter-agent communication, error handling, and monitoring
 */
class AgentOrchestrator {
  constructor(config = {}) {
    this.config = {
      workflowTimeout: config.workflowTimeout || 1800000, // 30 minutes
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 3,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      monitoringEnabled: config.monitoringEnabled !== false,
      notificationsEnabled: config.notificationsEnabled !== false,
      logLevel: config.logLevel || 'info',
      persistWorkflows: config.persistWorkflows !== false,
      ...config
    };

    // Initialize agents
    this.agents = {
      scaffold: new ScaffoldAgent(config.scaffold || {}),
      test: new TestGenAgent(config.test || {}),
      lint: new LintTypeAgent(config.lint || {}),
      pr: new PRAgent(config.pr || {}),
      deploy: new DeployAgent(config.deploy || {})
    };

    // Workflow state management
    this.activeWorkflows = new Map();
    this.workflowHistory = [];
    this.metrics = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      failedWorkflows: 0,
      averageDuration: 0,
      agentUsage: {}
    };

    // Event system for inter-agent communication
    this.eventBus = new (require('events'))();

    // Workflow definitions
    this.workflows = {
      FULL_FEATURE: 'complete feature development workflow',
      COMPONENT_SCAFFOLD: 'component generation with tests and stories',
      QUALITY_CHECK: 'code quality and testing workflow',
      DEPLOYMENT: 'build and deployment workflow',
      HOTFIX: 'emergency hotfix workflow',
      RELEASE: 'release preparation workflow'
    };

    this.initialize();
  }

  /**
   * Initialize orchestrator and setup monitoring
   */
  async initialize() {
    console.log('🎯 AgentOrchestrator: Initializing...');

    // Setup error handling
    this.setupErrorHandling();

    // Setup monitoring
    if (this.config.monitoringEnabled) {
      await this.setupMonitoring();
    }

    // Load persisted workflows
    if (this.config.persistWorkflows) {
      await this.loadPersistedWorkflows();
    }

    // Setup periodic cleanup
    setInterval(() => this.cleanupCompletedWorkflows(), 300000); // 5 minutes

    console.log('✅ AgentOrchestrator: Initialized successfully');
  }

  /**
   * Execute a complete development workflow
   */
  async executeWorkflow(workflowType, params = {}) {
    const workflowId = this.generateWorkflowId();

    try {
      console.log(`🚀 Starting ${workflowType} workflow: ${workflowId}`);

      const workflow = {
        id: workflowId,
        type: workflowType,
        status: 'running',
        startTime: new Date().toISOString(),
        params,
        steps: [],
        metrics: {},
        errors: []
      };

      // Check concurrent workflow limit
      if (this.activeWorkflows.size >= this.config.maxConcurrentWorkflows) {
        throw new Error(`Maximum concurrent workflows (${this.config.maxConcurrentWorkflows}) reached`);
      }

      // Register workflow
      this.activeWorkflows.set(workflowId, workflow);
      this.metrics.totalWorkflows++;

      // Execute workflow based on type
      let result;
      switch (workflowType) {
        case 'FULL_FEATURE':
          result = await this.executeFullFeatureWorkflow(workflow, params);
          break;
        case 'COMPONENT_SCAFFOLD':
          result = await this.executeComponentScaffoldWorkflow(workflow, params);
          break;
        case 'QUALITY_CHECK':
          result = await this.executeQualityCheckWorkflow(workflow, params);
          break;
        case 'DEPLOYMENT':
          result = await this.executeDeploymentWorkflow(workflow, params);
          break;
        case 'HOTFIX':
          result = await this.executeHotfixWorkflow(workflow, params);
          break;
        case 'RELEASE':
          result = await this.executeReleaseWorkflow(workflow, params);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }

      // Mark workflow as completed
      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();
      workflow.duration = new Date(workflow.endTime) - new Date(workflow.startTime);
      workflow.result = result;

      this.metrics.successfulWorkflows++;
      await this.persistWorkflow(workflow);

      console.log(`✅ Workflow ${workflowId} completed successfully`);

      return {
        success: true,
        workflowId,
        result,
        metrics: await this.getWorkflowMetrics(workflow)
      };

    } catch (error) {
      console.error(`❌ Workflow ${workflowId} failed:`, error.message);

      const workflow = this.activeWorkflows.get(workflowId);
      if (workflow) {
        workflow.status = 'failed';
        workflow.endTime = new Date().toISOString();
        workflow.error = error.message;
        this.metrics.failedWorkflows++;
        await this.persistWorkflow(workflow);
      }

      return {
        success: false,
        workflowId,
        error: error.message
      };

    } finally {
      // Cleanup
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute full feature development workflow
   */
  async executeFullFeatureWorkflow(workflow, params) {
    const {
      componentSpec,
      featureDescription,
      branchName,
      createPR = true,
      deploy = true
    } = params;

    const results = {};

    // Step 1: Scaffold component
    workflow.steps.push({ name: 'scaffold', status: 'running', startTime: new Date().toISOString() });

    const scaffoldResult = await this.executeAgentWithRetry(
      'scaffold',
      'generateComponent',
      [componentSpec],
      workflow
    );

    if (!scaffoldResult.success) {
      throw new Error(`Scaffold failed: ${scaffoldResult.error}`);
    }

    results.scaffold = scaffoldResult;
    workflow.steps[workflow.steps.length - 1].status = 'completed';
    workflow.steps[workflow.steps.length - 1].endTime = new Date().toISOString();

    // Step 2: Generate comprehensive tests
    workflow.steps.push({ name: 'test-generation', status: 'running', startTime: new Date().toISOString() });

    const testResult = await this.executeAgentWithRetry(
      'test',
      'generateTestSuite',
      [scaffoldResult.files[0], { coverageTarget: 95 }],
      workflow
    );

    if (!testResult.success) {
      throw new Error(`Test generation failed: ${testResult.error}`);
    }

    results.tests = testResult;
    workflow.steps[workflow.steps.length - 1].status = 'completed';
    workflow.steps[workflow.steps.length - 1].endTime = new Date().toISOString();

    // Step 3: Quality check
    workflow.steps.push({ name: 'quality-check', status: 'running', startTime: new Date().toISOString() });

    const qualityResult = await this.executeAgentWithRetry(
      'lint',
      'runQualityCheck',
      ['src/', { autoFix: true }],
      workflow
    );

    if (!qualityResult.success) {
      throw new Error(`Quality check failed: ${qualityResult.error}`);
    }

    results.quality = qualityResult;
    workflow.steps[workflow.steps.length - 1].status = 'completed';
    workflow.steps[workflow.steps.length - 1].endTime = new Date().toISOString();

    // Step 4: Create PR if requested
    if (createPR) {
      workflow.steps.push({ name: 'pr-creation', status: 'running', startTime: new Date().toISOString() });

      const prChanges = {
        type: 'feat',
        description: featureDescription,
        files: [...scaffoldResult.files, ...testResult.tests]
      };

      const prResult = await this.executeAgentWithRetry(
        'pr',
        'executeWorkflow',
        [prChanges, { branchName }],
        workflow
      );

      if (!prResult.success) {
        throw new Error(`PR creation failed: ${prResult.error}`);
      }

      results.pr = prResult;
      workflow.steps[workflow.steps.length - 1].status = 'completed';
      workflow.steps[workflow.steps.length - 1].endTime = new Date().toISOString();
    }

    // Step 5: Deploy if requested
    if (deploy && results.pr) {
      workflow.steps.push({ name: 'deployment', status: 'running', startTime: new Date().toISOString() });

      const deployResult = await this.executeAgentWithRetry(
        'deploy',
        'executeDeployment',
        [{
          type: 'PREVIEW',
          branch: branchName,
          prNumber: results.pr.workflow.pr.number,
          environment: 'preview'
        }],
        workflow
      );

      if (!deployResult.success) {
        console.warn('⚠️ Deployment failed, continuing without deployment');
      } else {
        results.deploy = deployResult;
      }

      workflow.steps[workflow.steps.length - 1].status = 'completed';
      workflow.steps[workflow.steps.length - 1].endTime = new Date().toISOString();
    }

    return results;
  }

  /**
   * Execute component scaffold workflow
   */
  async executeComponentScaffoldWorkflow(workflow, params) {
    const { componentSpec } = params;

    // Scaffold component
    const scaffoldResult = await this.executeAgentWithRetry(
      'scaffold',
      'generateComponent',
      [componentSpec],
      workflow
    );

    if (!scaffoldResult.success) {
      throw new Error(`Scaffold failed: ${scaffoldResult.error}`);
    }

    // Generate tests
    const testResult = await this.executeAgentWithRetry(
      'test',
      'generateTestSuite',
      [scaffoldResult.files[0]],
      workflow
    );

    if (!testResult.success) {
      console.warn('⚠️ Test generation failed, continuing without tests');
    }

    return {
      scaffold: scaffoldResult,
      tests: testResult
    };
  }

  /**
   * Execute quality check workflow
   */
  async executeQualityCheckWorkflow(workflow, params) {
    const { targetPath = 'src/', autoFix = true } = params;

    return await this.executeAgentWithRetry(
      'lint',
      'runQualityCheck',
      [targetPath, { autoFix }],
      workflow
    );
  }

  /**
   * Execute deployment workflow
   */
  async executeDeploymentWorkflow(workflow, params) {
    const { deploymentConfig } = params;

    return await this.executeAgentWithRetry(
      'deploy',
      'executeDeployment',
      [deploymentConfig],
      workflow
    );
  }

  /**
   * Execute hotfix workflow
   */
  async executeHotfixWorkflow(workflow, params) {
    const { fix, targetBranch = 'main' } = params;

    // Quality check first
    const qualityResult = await this.executeAgentWithRetry(
      'lint',
      'runQualityCheck',
      ['src/', { autoFix: true, exitOnError: true }],
      workflow
    );

    if (!qualityResult.success) {
      throw new Error(`Quality check failed for hotfix: ${qualityResult.error}`);
    }

    // Create hotfix PR
    const prChanges = {
      type: 'fix',
      description: fix.description,
      files: fix.files
    };

    const prResult = await this.executeAgentWithRetry(
      'pr',
      'executeWorkflow',
      [prChanges, { branchName: `hotfix/${fix.description.toLowerCase().replace(/\s+/g, '-')}` }],
      workflow
    );

    if (!prResult.success) {
      throw new Error(`Hotfix PR creation failed: ${prResult.error}`);
    }

    // Deploy immediately to staging
    const deployResult = await this.executeAgentWithRetry(
      'deploy',
      'executeDeployment',
      [{
        type: 'STAGING',
        branch: prResult.workflow.branch.name,
        environment: 'staging'
      }],
      workflow
    );

    return {
      quality: qualityResult,
      pr: prResult,
      deploy: deployResult
    };
  }

  /**
   * Execute release workflow
   */
  async executeReleaseWorkflow(workflow, params) {
    const { version, releaseNotes } = params;

    // Comprehensive quality check
    const qualityResult = await this.executeAgentWithRetry(
      'lint',
      'runQualityCheck',
      ['src/', {
        autoFix: false,
        exitOnError: true,
        includeSecurity: true,
        includePerformance: true
      }],
      workflow
    );

    if (!qualityResult.success) {
      throw new Error(`Release quality check failed: ${qualityResult.error}`);
    }

    // Deploy to production
    const deployResult = await this.executeAgentWithRetry(
      'deploy',
      'executeDeployment',
      [{
        type: 'PRODUCTION',
        branch: 'main',
        environment: 'production'
      }],
      workflow
    );

    if (!deployResult.success) {
      throw new Error(`Production deployment failed: ${deployResult.error}`);
    }

    return {
      quality: qualityResult,
      deploy: deployResult,
      version,
      releaseNotes
    };
  }

  /**
   * Execute agent method with retry logic
   */
  async executeAgentWithRetry(agentName, method, args, workflow) {
    let lastError;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Executing ${agentName}.${method} (attempt ${attempt}/${this.config.retryAttempts})`);

        const agent = this.agents[agentName];
        if (!agent) {
          throw new Error(`Agent not found: ${agentName}`);
        }

        const result = await agent[method](...args);

        // Update agent usage metrics
        if (!this.metrics.agentUsage[agentName]) {
          this.metrics.agentUsage[agentName] = 0;
        }
        this.metrics.agentUsage[agentName]++;

        return result;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed for ${agentName}.${method}:`, error.message);

        // Add error to workflow
        workflow.errors.push({
          agent: agentName,
          method,
          attempt,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw new Error(`${agentName}.${method} failed after ${this.config.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Setup error handling and recovery
   */
  setupErrorHandling() {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleCriticalError(reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.handleCriticalError(error);
    });
  }

  /**
   * Handle critical errors
   */
  async handleCriticalError(error) {
    console.error('🚨 Critical error detected, initiating emergency shutdown...');

    // Save current workflow states
    for (const [id, workflow] of this.activeWorkflows) {
      workflow.status = 'interrupted';
      workflow.error = error.message;
      await this.persistWorkflow(workflow);
    }

    // Send notifications if enabled
    if (this.config.notificationsEnabled) {
      await this.sendNotification('critical', 'System encountered critical error', error);
    }
  }

  /**
   * Setup monitoring and health checks
   */
  async setupMonitoring() {
    console.log('📊 Setting up monitoring...');

    // Periodic health check
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // 1 minute

    // Metrics collection
    setInterval(async () => {
      await this.collectMetrics();
    }, 300000); // 5 minutes

    // Performance monitoring
    setInterval(async () => {
      await this.monitorPerformance();
    }, 600000); // 10 minutes
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      orchestrator: 'healthy',
      agents: {},
      workflows: {
        active: this.activeWorkflows.size,
        total: this.metrics.totalWorkflows,
        successRate: this.calculateSuccessRate()
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Check agent health
    for (const [name, agent] of Object.entries(this.agents)) {
      try {
        // Basic health check - ensure agent is responsive
        health.agents[name] = typeof agent === 'object' ? 'healthy' : 'unhealthy';
      } catch (error) {
        health.agents[name] = 'unhealthy';
      }
    }

    // Log health status
    if (this.config.logLevel === 'debug') {
      console.log('💓 Health check:', JSON.stringify(health, null, 2));
    }

    return health;
  }

  /**
   * Collect and store metrics
   */
  async collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      averageDuration: this.calculateAverageDuration(),
      successRate: this.calculateSuccessRate(),
      systemLoad: process.cpuUsage(),
      memory: process.memoryUsage()
    };

    // Persist metrics
    await this.persistMetrics(metrics);

    return metrics;
  }

  /**
   * Monitor system performance
   */
  async monitorPerformance() {
    const performance = {
      timestamp: new Date().toISOString(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      activeWorkflows: this.activeWorkflows.size,
      eventLoopDelay: await this.measureEventLoopDelay()
    };

    // Check for performance issues
    if (performance.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High memory usage detected');
    }

    if (performance.activeWorkflows > this.config.maxConcurrentWorkflows * 0.8) {
      console.warn('⚠️ High workflow load detected');
    }

    return performance;
  }

  /**
   * Utility methods
   */
  generateWorkflowId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateSuccessRate() {
    const total = this.metrics.successfulWorkflows + this.metrics.failedWorkflows;
    return total > 0 ? (this.metrics.successfulWorkflows / total) * 100 : 100;
  }

  calculateAverageDuration() {
    if (this.workflowHistory.length === 0) return 0;

    const totalDuration = this.workflowHistory
      .filter(w => w.duration)
      .reduce((sum, w) => sum + w.duration, 0);

    return totalDuration / this.workflowHistory.length;
  }

  async measureEventLoopDelay() {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delta = process.hrtime.bigint() - start;
        resolve(Number(delta / 1000000n)); // Convert to milliseconds
      });
    });
  }

  async persistWorkflow(workflow) {
    if (!this.config.persistWorkflows) return;

    try {
      const workflowsDir = path.join(process.cwd(), '.agent-workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflowFile = path.join(workflowsDir, `${workflow.id}.json`);
      await fs.writeFile(workflowFile, JSON.stringify(workflow, null, 2));

      // Add to history
      this.workflowHistory.push(workflow);

      // Cleanup old workflows (keep last 100)
      if (this.workflowHistory.length > 100) {
        this.workflowHistory = this.workflowHistory.slice(-100);
      }

    } catch (error) {
      console.warn('⚠️ Could not persist workflow:', error.message);
    }
  }

  async persistMetrics(metrics) {
    try {
      const metricsFile = path.join(process.cwd(), '.agent-metrics.json');
      await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not persist metrics:', error.message);
    }
  }

  async loadPersistedWorkflows() {
    try {
      const workflowsDir = path.join(process.cwd(), '.agent-workflows');
      const files = await fs.readdir(workflowsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(workflowsDir, file), 'utf8');
          const workflow = JSON.parse(content);
          this.workflowHistory.push(workflow);
        }
      }

      console.log(`📂 Loaded ${this.workflowHistory.length} persisted workflows`);
    } catch (error) {
      console.log('📂 No persisted workflows found');
    }
  }

  cleanupCompletedWorkflows() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [id, workflow] of this.activeWorkflows) {
      if (workflow.status !== 'running' && new Date(workflow.startTime).getTime() < cutoff) {
        this.activeWorkflows.delete(id);
      }
    }
  }

  async sendNotification(level, message, details = null) {
    // Placeholder for notification system
    console.log(`🔔 Notification [${level}]: ${message}`);
    if (details) {
      console.log('Details:', details);
    }
  }

  async getWorkflowMetrics(workflow) {
    return {
      id: workflow.id,
      type: workflow.type,
      duration: workflow.duration,
      stepsCompleted: workflow.steps.filter(s => s.status === 'completed').length,
      totalSteps: workflow.steps.length,
      errorsEncountered: workflow.errors.length,
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * Public API methods
   */
  getStatus() {
    return {
      activeWorkflows: this.activeWorkflows.size,
      totalWorkflows: this.metrics.totalWorkflows,
      successRate: this.calculateSuccessRate(),
      averageDuration: this.calculateAverageDuration(),
      agentUsage: this.metrics.agentUsage
    };
  }

  getWorkflowHistory(limit = 10) {
    return this.workflowHistory.slice(-limit);
  }

  async getAgentStatus(agentName) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    return {
      name: agentName,
      status: 'healthy',
      usage: this.metrics.agentUsage[agentName] || 0
    };
  }
}

module.exports = AgentOrchestrator;