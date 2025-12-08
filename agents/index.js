/**
 * BeatFlow Agentic Suite - Main Entry Point
 *
 * Intelligent automation agents for React development workflows
 * Provides comprehensive development automation including:
 * - Component scaffolding with design system integration
 * - Intelligent test generation with high coverage
 * - Code quality and security analysis
 * - Git workflow automation and PR management
 * - Automated deployment and monitoring
 * - Workflow orchestration and error handling
 */

// Core agents
const AgentOrchestrator = require('./core/AgentOrchestrator');
const ScaffoldAgent = require('./core/ScaffoldAgent');
const TestGenAgent = require('./core/TestGenAgent');
const LintTypeAgent = require('./core/LintTypeAgent');
const PRAgent = require('./core/PRAgent');
const DeployAgent = require('./core/DeployAgent');
const SecurityAgent = require('./core/SecurityAgent');

// Configuration and utilities
const defaultConfig = require('./config/default.json');

/**
 * Main Agentic Suite class providing simplified access to all agents
 */
class AgenticSuite {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };

    // Initialize orchestrator
    this.orchestrator = new AgentOrchestrator(this.config);

    // Initialize individual agents
    this.scaffold = new ScaffoldAgent(this.config.scaffold || {});
    this.test = new TestGenAgent(this.config.test || {});
    this.lint = new LintTypeAgent(this.config.lint || {});
    this.pr = new PRAgent(this.config.pr || {});
    this.deploy = new DeployAgent(this.config.deploy || {});
    this.security = new SecurityAgent(this.config.security || {});
  }

  /**
   * Execute a complete development workflow
   */
  async executeWorkflow(type, params = {}) {
    return await this.orchestrator.executeWorkflow(type, params);
  }

  /**
   * Generate a complete feature with component, tests, and deployment
   */
  async generateFeature(componentSpec, options = {}) {
    return await this.executeWorkflow('FULL_FEATURE', {
      componentSpec,
      ...options
    });
  }

  /**
   * Run comprehensive quality check
   */
  async checkQuality(targetPath = 'src/', options = {}) {
    return await this.lint.runQualityCheck(targetPath, options);
  }

  /**
   * Run security audit
   */
  async auditSecurity(targetPath = 'src/', options = {}) {
    return await this.security.executeSecurityAudit(targetPath, options);
  }

  /**
   * Create pull request with automated workflow
   */
  async createPR(changes, options = {}) {
    return await this.pr.executeWorkflow(changes, options);
  }

  /**
   * Deploy application
   */
  async deploy(config) {
    return await this.deploy.executeDeployment(config);
  }

  /**
   * Get system status
   */
  getStatus() {
    return this.orchestrator.getStatus();
  }

  /**
   * Get workflow history
   */
  getHistory(limit = 10) {
    return this.orchestrator.getWorkflowHistory(limit);
  }

  /**
   * Get agent metrics
   */
  async getMetrics() {
    const status = this.getStatus();
    return {
      totalWorkflows: status.totalWorkflows,
      successRate: status.successRate,
      averageDuration: status.averageDuration,
      agentUsage: status.agentUsage,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Convenience factory function
 */
function createAgenticSuite(config = {}) {
  return new AgenticSuite(config);
}

/**
 * Quick workflow executors
 */
const workflows = {
  /**
   * Generate component with tests and stories
   */
  async scaffold(componentSpec, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.scaffold.generateComponent(componentSpec);
  },

  /**
   * Generate comprehensive test suite
   */
  async test(componentPath, options = {}, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.test.generateTestSuite(componentPath, options);
  },

  /**
   * Run quality checks with auto-fixing
   */
  async quality(targetPath = 'src/', options = {}, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.checkQuality(targetPath, options);
  },

  /**
   * Execute security audit
   */
  async security(targetPath = 'src/', options = {}, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.auditSecurity(targetPath, options);
  },

  /**
   * Create PR with automated workflow
   */
  async pr(changes, options = {}, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.createPR(changes, options);
  },

  /**
   * Deploy to specified environment
   */
  async deploy(deployConfig, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.deploy(deployConfig);
  },

  /**
   * Complete feature development workflow
   */
  async feature(componentSpec, description, options = {}, config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.generateFeature(componentSpec, {
      featureDescription: description,
      ...options
    });
  },

  /**
   * Emergency hotfix workflow
   */
  async hotfix(fixDescription, files = [], config = {}) {
    const suite = createAgenticSuite(config);
    return await suite.executeWorkflow('HOTFIX', {
      fix: {
        description: fixDescription,
        files
      }
    });
  }
};

// Export individual agents for direct access
module.exports = {
  // Main suite
  AgenticSuite,
  createAgenticSuite,

  // Individual agents
  AgentOrchestrator,
  ScaffoldAgent,
  TestGenAgent,
  LintTypeAgent,
  PRAgent,
  DeployAgent,
  SecurityAgent,

  // Convenience workflows
  workflows,

  // Configuration
  defaultConfig
};

// Export default suite instance for quick access
module.exports.default = createAgenticSuite();