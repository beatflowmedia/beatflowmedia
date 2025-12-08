/**
 * Base Agent Class
 * Foundation for all BeatFlowMedia automation agents
 * Provides core functionality, logging, error handling, and metrics tracking
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class AgentBase {
  constructor(agentName, config = {}) {
    this.agentName = agentName;
    this.config = {
      projectRoot: process.cwd(),
      logLevel: 'info',
      dryRun: false,
      ...config
    };

    this.metrics = {
      startTime: Date.now(),
      operations: 0,
      errors: 0,
      warnings: 0,
      filesCreated: 0,
      filesModified: 0,
      testsGenerated: 0,
      storiesCreated: 0
    };

    this.logger = this.createLogger();
    this.initialize();
  }

  /**
   * Initialize agent-specific setup
   */
  async initialize() {
    this.logger.info(`🤖 Initializing ${this.agentName} agent`);
    await this.ensureDirectories();
    await this.loadProjectConfig();
  }

  /**
   * Create structured logger with contextual information
   */
  createLogger() {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.config.logLevel] || 2;

    return {
      error: (message, meta = {}) => {
        if (currentLevel >= 0) {
          console.error(`❌ [${this.agentName}] ${message}`, meta);
          this.metrics.errors++;
        }
      },
      warn: (message, meta = {}) => {
        if (currentLevel >= 1) {
          console.warn(`⚠️  [${this.agentName}] ${message}`, meta);
          this.metrics.warnings++;
        }
      },
      info: (message, meta = {}) => {
        if (currentLevel >= 2) {
          console.log(`ℹ️  [${this.agentName}] ${message}`, meta);
        }
      },
      debug: (message, meta = {}) => {
        if (currentLevel >= 3) {
          console.debug(`🔍 [${this.agentName}] ${message}`, meta);
        }
      },
      success: (message, meta = {}) => {
        if (currentLevel >= 2) {
          console.log(`✅ [${this.agentName}] ${message}`, meta);
        }
      }
    };
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      'agents/logs',
      'agents/cache',
      'agents/temp',
      'agents/reports'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.config.projectRoot, dir);
      try {
        await fs.mkdir(fullPath, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          this.logger.error(`Failed to create directory ${fullPath}:`, error.message);
        }
      }
    }
  }

  /**
   * Load project configuration and detect patterns
   */
  async loadProjectConfig() {
    try {
      // Load package.json
      const packagePath = path.join(this.config.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      this.projectConfig = JSON.parse(packageContent);

      // Detect project patterns
      this.patterns = await this.detectProjectPatterns();

      this.logger.debug('Project configuration loaded', {
        name: this.projectConfig.name,
        patterns: Object.keys(this.patterns)
      });
    } catch (error) {
      this.logger.error('Failed to load project configuration:', error.message);
    }
  }

  /**
   * Detect existing project patterns and conventions
   */
  async detectProjectPatterns() {
    const patterns = {
      hasTypeScript: false,
      hasStorybook: false,
      hasJest: false,
      testFramework: null,
      componentDirs: [],
      designSystem: false,
      lintingSetup: false
    };

    try {
      // Check for TypeScript
      try {
        await fs.access(path.join(this.config.projectRoot, 'tsconfig.json'));
        patterns.hasTypeScript = true;
      } catch {}

      // Check for Storybook
      try {
        await fs.access(path.join(this.config.projectRoot, '.storybook'));
        patterns.hasStorybook = true;
      } catch {}

      // Check for Jest
      if (this.projectConfig.devDependencies?.jest ||
          this.projectConfig.dependencies?.jest ||
          this.projectConfig.scripts?.test?.includes('jest')) {
        patterns.hasJest = true;
        patterns.testFramework = 'jest';
      }

      // Detect component directories
      const srcPath = path.join(this.config.projectRoot, 'src');
      try {
        const srcContents = await fs.readdir(srcPath);
        if (srcContents.includes('components')) {
          patterns.componentDirs.push('src/components');
        }
        if (srcContents.includes('design')) {
          patterns.designSystem = true;
          patterns.componentDirs.push('src/design/components');
        }
      } catch {}

      // Check for linting setup
      const lintFiles = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'];
      for (const file of lintFiles) {
        try {
          await fs.access(path.join(this.config.projectRoot, file));
          patterns.lintingSetup = true;
          break;
        } catch {}
      }

      return patterns;
    } catch (error) {
      this.logger.error('Error detecting project patterns:', error.message);
      return patterns;
    }
  }

  /**
   * Execute shell command with proper error handling and logging
   */
  async executeCommand(command, options = {}) {
    this.logger.debug(`Executing command: ${command}`);

    if (this.config.dryRun) {
      this.logger.info(`[DRY RUN] Would execute: ${command}`);
      return { stdout: '', stderr: '', success: true };
    }

    try {
      const result = execSync(command, {
        cwd: this.config.projectRoot,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        ...options
      });

      this.metrics.operations++;
      return { stdout: result, stderr: '', success: true };
    } catch (error) {
      this.logger.error(`Command failed: ${command}`, {
        error: error.message,
        stderr: error.stderr?.toString()
      });
      this.metrics.errors++;
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        success: false
      };
    }
  }

  /**
   * Read file with error handling
   */
  async readFile(filePath, encoding = 'utf8') {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.config.projectRoot, filePath);

      const content = await fs.readFile(absolutePath, encoding);
      this.logger.debug(`Read file: ${filePath}`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to read file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Write file with error handling and metrics tracking
   */
  async writeFile(filePath, content, options = {}) {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.config.projectRoot, filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      if (this.config.dryRun) {
        this.logger.info(`[DRY RUN] Would write file: ${filePath}`);
        return;
      }

      // Check if file exists
      const exists = await fs.access(absolutePath).then(() => true).catch(() => false);

      await fs.writeFile(absolutePath, content, { encoding: 'utf8', ...options });

      if (exists) {
        this.metrics.filesModified++;
        this.logger.info(`📝 Modified: ${filePath}`);
      } else {
        this.metrics.filesCreated++;
        this.logger.info(`📄 Created: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to write file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.config.projectRoot, filePath);

      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate timestamped filename
   */
  generateTimestampedName(baseName, extension = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}${extension}`;
  }

  /**
   * Validate generated content for security and quality
   */
  validateContent(content, type = 'general') {
    const issues = [];

    // Security checks
    if (content.includes('eval(') || content.includes('Function(')) {
      issues.push('Contains potentially dangerous eval() or Function() calls');
    }

    if (content.includes('document.write') || content.includes('innerHTML')) {
      issues.push('Contains potentially unsafe DOM manipulation');
    }

    // Quality checks based on type
    if (type === 'component') {
      if (!content.includes('export default') && !content.includes('export {')) {
        issues.push('Component missing proper export statement');
      }

      if (!content.includes('PropTypes') && !content.includes('interface') && !content.includes('type')) {
        issues.push('Component missing type definitions or PropTypes');
      }
    }

    if (type === 'test') {
      if (!content.includes('describe') && !content.includes('test') && !content.includes('it')) {
        issues.push('Test file missing test blocks');
      }
    }

    if (type === 'story') {
      if (!content.includes('export default') || !content.includes('title:')) {
        issues.push('Story missing proper Storybook configuration');
      }
    }

    return issues;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.metrics.startTime;

    return {
      agent: this.agentName,
      duration: duration,
      durationFormatted: `${(duration / 1000).toFixed(2)}s`,
      ...this.metrics,
      successRate: this.metrics.operations > 0
        ? ((this.metrics.operations - this.metrics.errors) / this.metrics.operations * 100).toFixed(2) + '%'
        : '100%',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Save execution report
   */
  async saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(
      this.config.projectRoot,
      'agents/reports',
      this.generateTimestampedName(`${this.agentName}_report`, '.json')
    );

    try {
      await this.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.success(`Report saved: ${reportPath}`);
      return reportPath;
    } catch (error) {
      this.logger.error('Failed to save report:', error.message);
    }
  }

  /**
   * Cleanup and finalization
   */
  async cleanup() {
    this.logger.info(`🧹 Cleaning up ${this.agentName} agent`);

    // Log final metrics
    const report = this.generateReport();
    this.logger.info('Agent execution summary:', report);

    // Save report
    await this.saveReport();
  }
}

module.exports = AgentBase;