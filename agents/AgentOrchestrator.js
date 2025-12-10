/**
 * AgentOrchestrator - Intelligent Agent Coordination and Workflow Management
 *
 * Orchestrates the complete agentic suite with intelligent workflows:
 * - Agent coordination and workflow management
 * - Inter-agent communication and data sharing
 * - Error handling and recovery mechanisms
 * - Logging and monitoring for agent performance
 * - Configuration management and customization
 * - Workflow automation and pipeline execution
 *
 * PRD Requirements:
 * - Agent coordination and workflow management ✓
 * - Inter-agent communication and data sharing ✓
 * - Error handling and recovery mechanisms ✓
 * - Logging and monitoring for agent performance ✓
 * - Configuration management and customization ✓
 */

const AgentBase = require('./core/AgentBase');
const ScaffoldAgent = require('./ScaffoldAgent');
const TestGenAgent = require('./TestGenAgent');
const LintTypeAgent = require('./LintTypeAgent');
const PRAgent = require('./PRAgent');
const DeployAgent = require('./DeployAgent');
const ParallelExpertResolver = require('./ParallelExpertResolver');
const UIUXExpertAgent = require('./UIUXExpertAgent');

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class AgentOrchestrator extends AgentBase {
  constructor(config = {}) {
    super('AgentOrchestrator', {
      maxConcurrentAgents: 3,
      enableWorkflowPersistence: true,
      enableInterAgentComm: true,
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetricsTracking: true,
      ...config
    });

    // Agent registry
    this.agents = {
      scaffold: null,
      testGen: null,
      lintType: null,
      pr: null,
      deploy: null,
      expertResolver: null,
      uiux: null
    };

    // Workflow management
    this.workflows = new Map();
    this.activeWorkflows = new Set();
    this.workflowHistory = [];

    // Inter-agent communication
    this.eventBus = new EventEmitter();
    this.agentData = new Map();

    // Metrics and monitoring
    this.metrics = {
      workflowsExecuted: 0,
      successfulWorkflows: 0,
      failedWorkflows: 0,
      averageExecutionTime: 0,
      agentUtilization: {},
      errorRate: 0
    };

    // Predefined workflows
    this.predefinedWorkflows = {
      fullComponentPipeline: 'complete component development pipeline',
      quickScaffold: 'rapid component scaffolding',
      qualityCheck: 'comprehensive quality assurance',
      deploymentPipeline: 'automated deployment workflow',
      prWorkflow: 'pull request creation and management',
      expertReview: 'parallel multi-expert code analysis with consensus',
      uiuxReview: 'comprehensive UI/UX design system and accessibility audit'
    };
  }

  async initialize() {
    await super.initialize();
    await this.initializeAgents();
    await this.setupEventBus();
    await this.loadWorkflowDefinitions();
    await this.loadMetrics();
    this.logger.info('🎭 AgentOrchestrator ready for workflow management');
  }

  /**
   * Initialize all agents
   */
  async initializeAgents() {
    this.logger.info('🚀 Initializing agent suite');

    try {
      // Initialize agents with shared configuration
      const agentConfig = {
        projectRoot: this.config.projectRoot,
        logLevel: this.config.logLevel
      };

      // Initialize each agent
      this.agents.scaffold = new ScaffoldAgent(agentConfig);
      this.agents.testGen = new TestGenAgent(agentConfig);
      this.agents.lintType = new LintTypeAgent(agentConfig);
      this.agents.pr = new PRAgent(agentConfig);
      this.agents.deploy = new DeployAgent(agentConfig);
      this.agents.expertResolver = new ParallelExpertResolver(agentConfig);
      this.agents.uiux = new UIUXExpertAgent(agentConfig);

      // Initialize all agents in parallel
      await Promise.all([
        this.agents.scaffold.initialize(),
        this.agents.testGen.initialize(),
        this.agents.lintType.initialize(),
        this.agents.pr.initialize(),
        this.agents.deploy.initialize(),
        this.agents.expertResolver.initialize(),
        this.agents.uiux.initialize()
      ]);

      // Setup agent communication
      if (this.config.enableInterAgentComm) {
        this.setupAgentCommunication();
      }

      this.logger.success('✅ All agents initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize agents:', error.message);
      throw error;
    }
  }

  /**
   * Setup event bus for inter-agent communication
   */
  async setupEventBus() {
    this.eventBus.setMaxListeners(50);

    // Global event handlers
    this.eventBus.on('workflow:started', this.handleWorkflowStarted.bind(this));
    this.eventBus.on('workflow:completed', this.handleWorkflowCompleted.bind(this));
    this.eventBus.on('workflow:failed', this.handleWorkflowFailed.bind(this));
    this.eventBus.on('agent:data:shared', this.handleAgentDataShared.bind(this));
    this.eventBus.on('agent:error', this.handleAgentError.bind(this));

    this.logger.debug('Event bus configured');
  }

  /**
   * Setup communication between agents
   */
  setupAgentCommunication() {
    Object.entries(this.agents).forEach(([name, agent]) => {
      // Extend agents with communication capabilities
      agent.emit = (event, data) => {
        this.eventBus.emit(`agent:${name}:${event}`, data);
      };

      agent.subscribe = (event, handler) => {
        this.eventBus.on(event, handler);
      };

      agent.shareData = (key, data) => {
        this.agentData.set(`${name}:${key}`, data);
        this.eventBus.emit('agent:data:shared', { agent: name, key, data });
      };

      agent.getData = (agentName, key) => {
        return this.agentData.get(`${agentName}:${key}`);
      };
    });

    this.logger.debug('Inter-agent communication established');
  }

  /**
   * Execute predefined workflow
   *
   * @param {string} workflowName - Name of predefined workflow
   * @param {Object} options - Workflow execution options
   */
  async executeWorkflow(workflowName, options = {}) {
    this.logger.info(`🎯 Executing workflow: ${workflowName}`);

    const workflowId = this.generateWorkflowId(workflowName);

    try {
      // Get workflow definition
      const workflow = await this.getWorkflowDefinition(workflowName);

      if (!workflow) {
        throw new Error(`Workflow '${workflowName}' not found`);
      }

      // Create workflow execution context
      const context = this.createWorkflowContext(workflowId, workflow, options);

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(context);

      // Update metrics
      this.updateMetrics(context, result);

      // Save workflow execution
      if (this.config.enableWorkflowPersistence) {
        await this.saveWorkflowExecution(context, result);
      }

      this.logger.success(`✅ Workflow '${workflowName}' completed successfully`);
      return result;

    } catch (error) {
      this.logger.error(`Workflow '${workflowName}' failed:`, error.message);
      await this.handleWorkflowError(workflowId, error);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute custom workflow from definition
   *
   * @param {Object} workflowDef - Custom workflow definition
   * @param {Object} options - Execution options
   */
  async executeCustomWorkflow(workflowDef, options = {}) {
    this.logger.info('🔧 Executing custom workflow');

    const workflowId = this.generateWorkflowId('custom');

    try {
      // Validate workflow definition
      this.validateWorkflowDefinition(workflowDef);

      // Create execution context
      const context = this.createWorkflowContext(workflowId, workflowDef, options);

      // Execute workflow
      const result = await this.executeWorkflowSteps(context);

      this.logger.success('✅ Custom workflow completed successfully');
      return result;

    } catch (error) {
      this.logger.error('Custom workflow failed:', error.message);
      await this.handleWorkflowError(workflowId, error);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Full Component Pipeline - Complete development workflow
   *
   * @param {Object} componentSpec - Component specification
   * @param {Object} options - Pipeline options
   */
  async fullComponentPipeline(componentSpec, options = {}) {
    this.logger.info('🏭 Running full component development pipeline');

    const workflowId = this.generateWorkflowId('fullComponentPipeline');
    const startTime = Date.now();

    try {
      this.activeWorkflows.add(workflowId);
      this.eventBus.emit('workflow:started', { workflowId, type: 'fullComponentPipeline' });

      const results = {};

      // Step 1: Scaffold Component
      this.logger.info('📋 Step 1: Scaffolding component');
      results.scaffold = await this.executeWithRetry(
        () => this.agents.scaffold.generateComponent(componentSpec),
        'scaffold'
      );

      // Share scaffolding results
      this.agentData.set('scaffold:component', results.scaffold);

      // Step 2: Generate Tests
      this.logger.info('🧪 Step 2: Generating tests');
      results.tests = await this.executeWithRetry(
        () => this.agents.testGen.generateTests(results.scaffold.component, {
          integration: true,
          accessibility: true,
          performance: true
        }),
        'testGen'
      );

      // Step 3: Quality Check
      this.logger.info('🔍 Step 3: Running quality checks');
      results.quality = await this.executeWithRetry(
        () => this.agents.lintType.runQualityCheck([results.scaffold.component]),
        'lintType'
      );

      // Step 4: Create PR (if requested)
      if (options.createPR !== false) {
        this.logger.info('🔄 Step 4: Creating pull request');

        // First create branch and commit
        const branchResult = await this.agents.pr.createBranch({
          type: 'feature',
          description: `add-${componentSpec.name.toLowerCase()}-component`
        });

        const commitResult = await this.agents.pr.createCommit({
          type: 'feat',
          scope: 'components',
          description: `add ${componentSpec.name} component`,
          files: [results.scaffold.component, results.scaffold.story, results.tests.testPath]
        });

        results.pr = await this.executeWithRetry(
          () => this.agents.pr.createPullRequest({
            title: `feat(components): add ${componentSpec.name} component`,
            description: `Implements new ${componentSpec.name} component with full test coverage and documentation.`,
            reviewers: options.reviewers
          }),
          'pr'
        );
      }

      // Step 5: Deploy Preview (if PR created and requested)
      if (results.pr && options.deployPreview !== false) {
        this.logger.info('🚀 Step 5: Creating preview deployment');
        results.deployment = await this.executeWithRetry(
          () => this.agents.deploy.createPreviewDeployment({
            branch: results.pr.branch,
            environment: 'preview'
          }),
          'deploy'
        );
      }

      const duration = Date.now() - startTime;

      const pipelineResult = {
        workflowId,
        componentName: componentSpec.name,
        duration,
        results,
        success: true,
        timestamp: new Date().toISOString()
      };

      this.eventBus.emit('workflow:completed', pipelineResult);
      this.logger.success(`✅ Full component pipeline completed in ${(duration / 1000).toFixed(2)}s`);

      return pipelineResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Full component pipeline failed:', error.message);

      const pipelineResult = {
        workflowId,
        componentName: componentSpec.name,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.eventBus.emit('workflow:failed', pipelineResult);
      throw error;

    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Quality Check Workflow - Comprehensive quality assurance
   *
   * @param {string[]} targets - Files or patterns to check
   * @param {Object} options - Quality check options
   */
  async qualityCheckWorkflow(targets, options = {}) {
    this.logger.info('🔍 Running comprehensive quality check workflow');

    const workflowId = this.generateWorkflowId('qualityCheck');

    try {
      this.activeWorkflows.add(workflowId);

      const results = {};

      // Run quality checks in parallel
      const qualityChecks = await Promise.allSettled([
        this.agents.lintType.runQualityCheck(targets, options),
        this.agents.testGen.generateBatchTests(targets, { dryRun: true }),
        this.agents.pr.detectMergeConflicts(options.targetBranch || 'main')
      ]);

      results.lint = qualityChecks[0].status === 'fulfilled' ? qualityChecks[0].value : { error: qualityChecks[0].reason };
      results.testCoverage = qualityChecks[1].status === 'fulfilled' ? qualityChecks[1].value : { error: qualityChecks[1].reason };
      results.conflicts = qualityChecks[2].status === 'fulfilled' ? qualityChecks[2].value : { error: qualityChecks[2].reason };

      // Generate quality report
      const qualityReport = this.generateQualityReport(results);

      this.logger.success('✅ Quality check workflow completed');
      return { workflowId, results, report: qualityReport };

    } catch (error) {
      this.logger.error('Quality check workflow failed:', error.message);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Deployment Pipeline - Automated deployment with validation
   *
   * @param {Object} deploymentSpec - Deployment specification
   * @param {Object} options - Deployment options
   */
  async deploymentPipeline(deploymentSpec, options = {}) {
    this.logger.info('🚀 Running deployment pipeline');

    const workflowId = this.generateWorkflowId('deployment');

    try {
      this.activeWorkflows.add(workflowId);

      const results = {};

      // Step 1: Pre-deployment quality check
      if (options.skipQualityCheck !== true) {
        this.logger.info('🔍 Pre-deployment quality check');
        results.qualityCheck = await this.agents.lintType.runQualityCheck();

        if (results.qualityCheck.summary.totalErrors > 0) {
          throw new Error(`Quality check failed with ${results.qualityCheck.summary.totalErrors} errors`);
        }
      }

      // Step 2: Create deployment
      this.logger.info('🚀 Creating deployment');
      results.deployment = await this.agents.deploy.createPreviewDeployment(deploymentSpec);

      // Step 3: Validate deployment
      this.logger.info('✅ Validating deployment');
      const deploymentStatus = await this.agents.deploy.getDeploymentStatus(results.deployment.id);

      if (deploymentStatus.status !== 'ready') {
        throw new Error(`Deployment validation failed: ${deploymentStatus.status}`);
      }

      results.validation = deploymentStatus;

      this.logger.success('✅ Deployment pipeline completed successfully');
      return { workflowId, results };

    } catch (error) {
      this.logger.error('Deployment pipeline failed:', error.message);

      // Attempt rollback if deployment was created
      if (results.deployment?.id) {
        try {
          await this.agents.deploy.rollbackDeployment(results.deployment.id);
          this.logger.info('🔄 Rollback completed');
        } catch (rollbackError) {
          this.logger.error('Rollback failed:', rollbackError.message);
        }
      }

      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute workflow steps based on definition
   */
  async executeWorkflowSteps(context) {
    const { workflow, options } = context;
    const results = {};

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      this.logger.info(`📋 Step ${i + 1}/${workflow.steps.length}: ${step.name}`);

      try {
        // Execute step with timeout
        const stepResult = await this.executeStep(step, context, results);
        results[step.id] = stepResult;

        // Check if step should halt workflow on failure
        if (!stepResult.success && step.haltOnFailure) {
          throw new Error(`Step '${step.name}' failed: ${stepResult.error}`);
        }

      } catch (error) {
        this.logger.error(`Step '${step.name}' failed:`, error.message);

        if (step.haltOnFailure !== false) {
          throw error;
        }

        // Continue with error recorded
        results[step.id] = { success: false, error: error.message };
      }
    }

    return {
      workflowId: context.workflowId,
      results,
      success: true,
      duration: Date.now() - context.startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute individual workflow step
   */
  async executeStep(step, context, previousResults) {
    const { agent, action, params } = step;

    // Get agent instance
    const agentInstance = this.agents[agent];
    if (!agentInstance) {
      throw new Error(`Agent '${agent}' not found`);
    }

    // Prepare step parameters with context
    const stepParams = this.prepareStepParams(params, context, previousResults);

    // Execute step action
    const startTime = Date.now();

    try {
      let result;

      switch (action) {
        case 'generateComponent':
          result = await agentInstance.generateComponent(stepParams);
          break;
        case 'generateTests':
          result = await agentInstance.generateTests(stepParams.componentPath, stepParams.options);
          break;
        case 'runQualityCheck':
          result = await agentInstance.runQualityCheck(stepParams.targets, stepParams.options);
          break;
        case 'createBranch':
          result = await agentInstance.createBranch(stepParams);
          break;
        case 'createCommit':
          result = await agentInstance.createCommit(stepParams.changes, stepParams.options);
          break;
        case 'createPullRequest':
          result = await agentInstance.createPullRequest(stepParams);
          break;
        case 'createPreviewDeployment':
          result = await agentInstance.createPreviewDeployment(stepParams);
          break;
        default:
          throw new Error(`Unknown action '${action}' for agent '${agent}'`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        duration,
        agent,
        action,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        duration,
        agent,
        action,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operation, agentName, maxRetries = null) {
    const retries = maxRetries || this.config.retryAttempts;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`Executing ${agentName} operation (attempt ${attempt}/${retries})`);
        return await operation();

      } catch (error) {
        this.logger.warn(`${agentName} operation failed (attempt ${attempt}/${retries}):`, error.message);

        if (attempt === retries) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }
  }

  /**
   * Generate quality report from check results
   */
  generateQualityReport(results) {
    const report = {
      overall: 'pass',
      issues: [],
      recommendations: [],
      metrics: {
        codeQuality: 0,
        testCoverage: 0,
        security: 0,
        performance: 0
      }
    };

    // Analyze lint results
    if (results.lint && !results.lint.error) {
      const { summary } = results.lint;

      if (summary.totalErrors > 0) {
        report.overall = 'fail';
        report.issues.push(`${summary.totalErrors} linting errors found`);
      }

      if (summary.totalWarnings > 10) {
        report.issues.push(`${summary.totalWarnings} linting warnings (consider addressing)`);
      }

      // Calculate code quality score
      const totalIssues = summary.totalErrors + summary.totalWarnings;
      report.metrics.codeQuality = Math.max(0, 100 - (totalIssues * 5));
    }

    // Analyze test coverage
    if (results.testCoverage && !results.testCoverage.error) {
      const coverage = results.testCoverage.averageCoverage || 0;

      if (coverage < 80) {
        report.issues.push(`Test coverage below threshold: ${coverage.toFixed(1)}%`);
      }

      report.metrics.testCoverage = coverage;
    }

    // Analyze conflicts
    if (results.conflicts && results.conflicts.hasConflicts) {
      report.overall = 'fail';
      report.issues.push('Merge conflicts detected');
      report.recommendations.push('Resolve merge conflicts before proceeding');
    }

    // Generate recommendations
    if (report.metrics.codeQuality < 90) {
      report.recommendations.push('Address linting issues to improve code quality');
    }

    if (report.metrics.testCoverage < 80) {
      report.recommendations.push('Increase test coverage to meet quality standards');
    }

    return report;
  }

  /**
   * Get workflow definition
   */
  async getWorkflowDefinition(workflowName) {
    // Check for custom workflows first
    if (this.workflows.has(workflowName)) {
      return this.workflows.get(workflowName);
    }

    // Return predefined workflow definitions
    return this.getPredefinedWorkflow(workflowName);
  }

  /**
   * Get predefined workflow definition
   */
  getPredefinedWorkflow(workflowName) {
    const workflows = {
      fullComponentPipeline: {
        name: 'Full Component Pipeline',
        description: 'Complete component development workflow',
        steps: [
          {
            id: 'scaffold',
            name: 'Scaffold Component',
            agent: 'scaffold',
            action: 'generateComponent',
            params: { spec: '${componentSpec}' },
            haltOnFailure: true
          },
          {
            id: 'tests',
            name: 'Generate Tests',
            agent: 'testGen',
            action: 'generateTests',
            params: {
              componentPath: '${scaffold.result.component}',
              options: { integration: true, accessibility: true }
            },
            haltOnFailure: false
          },
          {
            id: 'quality',
            name: 'Quality Check',
            agent: 'lintType',
            action: 'runQualityCheck',
            params: {
              targets: ['${scaffold.result.component}'],
              options: { autoFix: true }
            },
            haltOnFailure: false
          }
        ]
      },

      qualityCheck: {
        name: 'Quality Check',
        description: 'Comprehensive quality assurance',
        steps: [
          {
            id: 'lint',
            name: 'Lint and Type Check',
            agent: 'lintType',
            action: 'runQualityCheck',
            params: { targets: '${targets}', options: '${options}' },
            haltOnFailure: false
          }
        ]
      },

      deploymentPipeline: {
        name: 'Deployment Pipeline',
        description: 'Automated deployment with validation',
        steps: [
          {
            id: 'deploy',
            name: 'Create Deployment',
            agent: 'deploy',
            action: 'createPreviewDeployment',
            params: '${deploymentSpec}',
            haltOnFailure: true
          }
        ]
      }
    };

    return workflows[workflowName] || null;
  }

  /**
   * Validate workflow definition
   */
  validateWorkflowDefinition(workflow) {
    if (!workflow.name || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow definition: missing name or steps');
    }

    for (const step of workflow.steps) {
      if (!step.id || !step.agent || !step.action) {
        throw new Error('Invalid step definition: missing id, agent, or action');
      }

      if (!this.agents[step.agent]) {
        throw new Error(`Unknown agent: ${step.agent}`);
      }
    }
  }

  /**
   * Create workflow execution context
   */
  createWorkflowContext(workflowId, workflow, options) {
    return {
      workflowId,
      workflow,
      options,
      startTime: Date.now(),
      data: new Map(),
      metadata: {
        createdBy: 'AgentOrchestrator',
        createdAt: new Date().toISOString(),
        projectRoot: this.config.projectRoot
      }
    };
  }

  /**
   * Prepare step parameters with context substitution
   */
  prepareStepParams(params, context, previousResults) {
    if (typeof params === 'string') {
      return this.substituteVariables(params, context, previousResults);
    }

    if (typeof params === 'object' && params !== null) {
      const result = {};

      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
          result[key] = this.substituteVariables(value, context, previousResults);
        } else if (typeof value === 'object') {
          result[key] = this.prepareStepParams(value, context, previousResults);
        } else {
          result[key] = value;
        }
      }

      return result;
    }

    return params;
  }

  /**
   * Substitute variables in step parameters
   */
  substituteVariables(value, context, previousResults) {
    if (typeof value !== 'string') return value;

    // Substitute context variables
    value = value.replace(/\$\{(\w+)\}/g, (match, varName) => {
      if (context.options[varName] !== undefined) {
        return context.options[varName];
      }
      return match;
    });

    // Substitute previous step results
    value = value.replace(/\$\{(\w+)\.([^}]+)\}/g, (match, stepId, path) => {
      const stepResult = previousResults[stepId];
      if (stepResult && stepResult.result) {
        return this.getNestedProperty(stepResult.result, path) || match;
      }
      return match;
    });

    return value;
  }

  /**
   * Get nested property from object
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Event handlers

  handleWorkflowStarted(data) {
    this.logger.debug('Workflow started:', data.workflowId);
    this.metrics.workflowsExecuted++;
  }

  handleWorkflowCompleted(data) {
    this.logger.debug('Workflow completed:', data.workflowId);
    this.metrics.successfulWorkflows++;
    this.updateExecutionTimeMetrics(data.duration);
  }

  handleWorkflowFailed(data) {
    this.logger.debug('Workflow failed:', data.workflowId);
    this.metrics.failedWorkflows++;
    this.updateExecutionTimeMetrics(data.duration);
  }

  handleAgentDataShared(data) {
    this.logger.debug(`Agent ${data.agent} shared data:`, data.key);
  }

  handleAgentError(data) {
    this.logger.error(`Agent ${data.agent} error:`, data.error);
  }

  // Utility methods

  generateWorkflowId(workflowName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${workflowName}-${timestamp}-${random}`;
  }

  updateExecutionTimeMetrics(duration) {
    const totalWorkflows = this.metrics.successfulWorkflows + this.metrics.failedWorkflows;

    if (totalWorkflows === 1) {
      this.metrics.averageExecutionTime = duration;
    } else {
      const currentAvg = this.metrics.averageExecutionTime;
      this.metrics.averageExecutionTime = ((currentAvg * (totalWorkflows - 1)) + duration) / totalWorkflows;
    }

    // Update error rate
    this.metrics.errorRate = (this.metrics.failedWorkflows / this.metrics.workflowsExecuted) * 100;
  }

  updateMetrics(context, result) {
    // Track agent utilization
    const workflowSteps = context.workflow.steps;

    workflowSteps.forEach(step => {
      const agentName = step.agent;

      if (!this.metrics.agentUtilization[agentName]) {
        this.metrics.agentUtilization[agentName] = {
          executions: 0,
          totalDuration: 0,
          errors: 0
        };
      }

      this.metrics.agentUtilization[agentName].executions++;

      const stepResult = result.results[step.id];
      if (stepResult) {
        this.metrics.agentUtilization[agentName].totalDuration += stepResult.duration || 0;

        if (!stepResult.success) {
          this.metrics.agentUtilization[agentName].errors++;
        }
      }
    });
  }

  async saveWorkflowExecution(context, result) {
    const executionData = {
      workflowId: context.workflowId,
      workflow: context.workflow.name,
      startTime: context.startTime,
      endTime: Date.now(),
      duration: result.duration,
      success: result.success,
      results: result.results,
      options: context.options,
      metadata: context.metadata
    };

    const executionPath = path.join(
      this.config.projectRoot,
      'agents/executions',
      `${context.workflowId}.json`
    );

    await this.writeFile(executionPath, JSON.stringify(executionData, null, 2));
    this.workflowHistory.push(executionData);
  }

  async handleWorkflowError(workflowId, error) {
    this.logger.error(`Workflow ${workflowId} error:`, error.message);

    // Save error details
    const errorData = {
      workflowId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    const errorPath = path.join(
      this.config.projectRoot,
      'agents/errors',
      `${workflowId}.json`
    );

    await this.writeFile(errorPath, JSON.stringify(errorData, null, 2));
  }

  async loadWorkflowDefinitions() {
    try {
      const workflowsPath = path.join(this.config.projectRoot, 'agents/workflows');

      if (await this.fileExists(workflowsPath)) {
        const workflowFiles = await fs.readdir(workflowsPath);

        for (const file of workflowFiles) {
          if (file.endsWith('.json')) {
            const workflowData = JSON.parse(
              await this.readFile(path.join(workflowsPath, file))
            );

            this.workflows.set(workflowData.name, workflowData);
          }
        }
      }
    } catch (error) {
      this.logger.debug('No custom workflows found');
    }
  }

  async loadMetrics() {
    try {
      const metricsPath = path.join(this.config.projectRoot, 'agents/metrics.json');

      if (await this.fileExists(metricsPath)) {
        const savedMetrics = JSON.parse(await this.readFile(metricsPath));
        Object.assign(this.metrics, savedMetrics);
      }
    } catch (error) {
      this.logger.debug('No saved metrics found');
    }
  }

  async saveMetrics() {
    const metricsPath = path.join(this.config.projectRoot, 'agents/metrics.json');
    await this.writeFile(metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  /**
   * Get orchestrator status and metrics
   */
  getStatus() {
    return {
      agents: Object.keys(this.agents).reduce((status, name) => {
        status[name] = {
          initialized: !!this.agents[name],
          active: this.activeWorkflows.size > 0
        };
        return status;
      }, {}),
      workflows: {
        active: this.activeWorkflows.size,
        total: this.workflows.size + Object.keys(this.predefinedWorkflows).length
      },
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.metrics.startTime
      },
      eventBus: {
        listenerCount: this.eventBus.listenerCount(),
        maxListeners: this.eventBus.getMaxListeners()
      }
    };
  }

  /**
   * Expert Review Workflow - Multi-expert parallel analysis
   *
   * @param {Object} options - Expert review options
   */
  async expertReviewWorkflow(options = {}) {
    this.logger.info('🎯 Running expert review workflow');

    const workflowId = this.generateWorkflowId('expertReview');

    try {
      this.activeWorkflows.add(workflowId);

      const {
        targetPath = 'src',
        profile = 'comprehensive',
        autoRemediation = false,
        generateReport = true
      } = options;

      this.logger.info(`📊 Profile: ${profile}`);
      this.logger.info(`📂 Target: ${targetPath}`);

      // Execute expert analysis
      const results = await this.agents.expertResolver.analyzeWithExperts({
        targetPath,
        profile,
        experts: options.experts || ['codeQuality', 'performance', 'security']
      });

      // Generate comprehensive assessment
      const assessment = {
        workflowId,
        profile,
        targetPath,
        timestamp: new Date().toISOString(),
        results,
        passed: this.assessExpertResults(results),
        recommendations: results.recommendations,
        roadmap: results.roadmap
      };

      this.logger.success('✅ Expert review workflow completed');
      return assessment;

    } catch (error) {
      this.logger.error('Expert review workflow failed:', error.message);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Assess expert review results against thresholds
   */
  assessExpertResults(results) {
    const thresholds = {
      compositeScore: 70,
      securityScore: 80,
      criticalIssues: 0
    };

    const passed = {
      compositeScore: results.metrics.compositeScore >= thresholds.compositeScore,
      securityScore: results.metrics.securityScore >= thresholds.securityScore,
      noCriticalIssues: results.summary.criticalIssues === thresholds.criticalIssues,
      overall: false
    };

    passed.overall = passed.compositeScore && passed.securityScore && passed.noCriticalIssues;

    return passed;
  }

  /**
   * UI/UX Review Workflow - Comprehensive design system and accessibility audit
   *
   * @param {Object} options - UI/UX review options
   */
  async uiuxReviewWorkflow(options = {}) {
    this.logger.info('🎨 Running UI/UX review workflow');

    const workflowId = this.generateWorkflowId('uiuxReview');

    try {
      this.activeWorkflows.add(workflowId);

      const {
        targetPath = 'src',
        profile = 'comprehensive',
        wcagLevel = 'AA',
        autoFix = false,
        generateReport = true
      } = options;

      this.logger.info(`📊 Profile: ${profile}`);
      this.logger.info(`📂 Target: ${targetPath}`);
      this.logger.info(`♿ WCAG Level: ${wcagLevel}`);

      // Execute UI/UX analysis
      const results = await this.agents.uiux.analyzeDesignSystem({
        targetPath,
        includeComponents: options.includeComponents !== false,
        includePages: options.includePages !== false,
        includeDesignSystem: options.includeDesignSystem !== false
      });

      // Auto-fix if requested
      let fixResults = null;
      if (autoFix) {
        this.logger.info('🔧 Attempting auto-remediation...');
        fixResults = await this.agents.uiux.autoFix();
      }

      // Generate report
      let report = null;
      if (generateReport) {
        report = await this.agents.uiux.generateReport(options.reportFormat || 'console');
      }

      // Generate comprehensive assessment
      const assessment = {
        workflowId,
        profile,
        targetPath,
        wcagLevel,
        timestamp: new Date().toISOString(),
        results,
        fixResults,
        report,
        passed: this.assessUIUXResults(results),
        recommendations: results.recommendations
      };

      this.logger.success('✅ UI/UX review workflow completed');
      return assessment;

    } catch (error) {
      this.logger.error('UI/UX review workflow failed:', error.message);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Assess UI/UX review results against thresholds
   */
  assessUIUXResults(results) {
    const thresholds = {
      compositeScore: 85,
      designSystemScore: 85,
      accessibilityScore: 95,
      musicUXScore: 90,
      criticalIssues: 0
    };

    const passed = {
      compositeScore: results.scores.composite >= thresholds.compositeScore,
      designSystemScore: results.scores.designSystem >= thresholds.designSystemScore,
      accessibilityScore: results.scores.accessibility >= thresholds.accessibilityScore,
      musicUXScore: results.scores.musicUX >= thresholds.musicUXScore,
      noCriticalIssues: this.countCriticalIssues(results) === thresholds.criticalIssues,
      overall: false
    };

    passed.overall = passed.compositeScore && passed.accessibilityScore && passed.noCriticalIssues;

    return passed;
  }

  /**
   * Count critical issues in UI/UX results
   */
  countCriticalIssues(results) {
    const allIssues = [
      ...results.designSystemViolations,
      ...results.accessibilityIssues,
      ...results.musicUXIssues
    ];

    return allIssues.filter(issue => issue.severity === 'CRITICAL').length;
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup() {
    this.logger.info('🧹 Shutting down AgentOrchestrator');

    // Save metrics
    await this.saveMetrics();

    // Cleanup agents
    await Promise.all(
      Object.values(this.agents).map(agent => agent?.cleanup?.())
    );

    // Remove event listeners
    this.eventBus.removeAllListeners();

    await super.cleanup();
  }

  /**
   * CLI Interface for orchestrator
   */
  static async fromCLI() {
    const orchestrator = new AgentOrchestrator({
      enableWorkflowPersistence: true,
      enableMetricsTracking: true
    });

    await orchestrator.initialize();

    try {
      // Example: Run full component pipeline
      const componentSpec = {
        name: 'MusicCard',
        type: 'molecule',
        description: 'Card component for displaying music track information',
        props: {
          track: {
            type: 'object',
            required: true,
            description: 'Track data object'
          },
          onPlay: {
            type: 'function',
            required: false,
            description: 'Play button click handler'
          },
          showLikeButton: {
            type: 'boolean',
            required: false,
            defaultValue: true,
            description: 'Whether to show like button'
          }
        },
        styling: {
          element: 'div',
          tokens: {
            padding: 'spacing.md',
            borderRadius: 'radius.card',
            backgroundColor: 'colors.surface.800'
          }
        },
        accessibility: {
          keyboard: true,
          screenReader: true
        }
      };

      const result = await orchestrator.fullComponentPipeline(componentSpec, {
        createPR: true,
        deployPreview: true,
        reviewers: ['@frontend-team']
      });

      console.log('✅ Full component pipeline completed:', result);

      // Show orchestrator status
      const status = orchestrator.getStatus();
      console.log('📊 Orchestrator status:', status);

    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
    }

    await orchestrator.cleanup();
  }
}

module.exports = AgentOrchestrator;

// CLI execution
if (require.main === module) {
  AgentOrchestrator.fromCLI().catch(console.error);
}