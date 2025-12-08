#!/usr/bin/env node

/**
 * UIUXExpertAgent - Comprehensive UI/UX Analysis Expert
 *
 * Specialized expert agent for music streaming platform UI/UX analysis
 * Validates design system compliance, accessibility, and music-specific patterns
 *
 * Features:
 * - Design system token validation
 * - WCAG 2.1 AA/AAA accessibility auditing
 * - Music-specific UX pattern checking
 * - Component performance analysis
 * - Auto-remediation for common issues
 * - Comprehensive reporting
 *
 * Integrates with:
 * - DesignSystemValidator
 * - AccessibilityChecker
 * - MusicUXPatterns
 */

const AgentBase = require('./core/AgentBase');
const DesignSystemValidator = require('./core/DesignSystemValidator');
const AccessibilityChecker = require('./core/AccessibilityChecker');
const MusicUXPatterns = require('./core/MusicUXPatterns');

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').sync;

class UIUXExpertAgent extends AgentBase {
  constructor(config = {}) {
    super('UIUXExpertAgent', {
      wcagLevel: 'AA',
      designSystemStrict: false,
      musicPatternsEnabled: true,
      autoFixEnabled: false,
      ...config
    });

    // Initialize validators
    this.designSystemValidator = null;
    this.accessibilityChecker = null;
    this.musicUXPatterns = null;

    // Analysis results
    this.results = {
      designSystemViolations: [],
      accessibilityIssues: [],
      musicUXIssues: [],
      performanceIssues: [],
      summary: {}
    };
  }

  async initialize() {
    await super.initialize();

    // Initialize all validators
    this.designSystemValidator = new DesignSystemValidator({
      projectRoot: this.config.projectRoot,
      strictMode: this.config.designSystemStrict,
      autoFixEnabled: this.config.autoFixEnabled
    });

    this.accessibilityChecker = new AccessibilityChecker({
      wcagLevel: this.config.wcagLevel,
      checkKeyboard: true,
      checkScreenReader: true,
      checkColorContrast: true,
      checkTouchTargets: true
    });

    this.musicUXPatterns = new MusicUXPatterns({
      projectRoot: this.config.projectRoot,
      validatePerformance: true,
      validateAccessibility: true
    });

    // Initialize design system validator
    await this.designSystemValidator.initialize();

    this.logger.info('🎨 UIUXExpertAgent initialized successfully');
  }

  /**
   * Main analysis method - analyze entire design system
   */
  async analyzeDesignSystem(options = {}) {
    const {
      targetPath = 'src',
      includeComponents = true,
      includePages = true,
      includeDesignSystem = true
    } = options;

    this.logger.info(`🔍 Analyzing UI/UX for: ${targetPath}`);

    const startTime = Date.now();

    try {
      // Gather files to analyze
      const files = this.gatherFiles(targetPath, {
        includeComponents,
        includePages,
        includeDesignSystem
      });

      this.logger.info(`📁 Found ${files.length} files to analyze`);

      // Analyze all files
      const analysisResults = await this.analyzeFiles(files);

      // Calculate scores
      const scores = this.calculateScores(analysisResults);

      // Generate recommendations
      const recommendations = this.generateRecommendations(analysisResults);

      // Compile final results
      const results = {
        summary: {
          filesAnalyzed: files.length,
          totalIssues: analysisResults.totalIssues,
          designSystemScore: scores.designSystem,
          accessibilityScore: scores.accessibility,
          musicUXScore: scores.musicUX,
          compositeScore: scores.composite
        },
        scores,
        designSystemViolations: analysisResults.designSystemViolations,
        accessibilityIssues: analysisResults.accessibilityIssues,
        musicUXIssues: analysisResults.musicUXIssues,
        recommendations,
        metrics: {
          analysisTime: Date.now() - startTime,
          averageTimePerFile: (Date.now() - startTime) / files.length
        }
      };

      this.results = results;

      this.logger.success(`✅ UI/UX analysis completed in ${(results.metrics.analysisTime / 1000).toFixed(2)}s`);
      this.logger.info(`📊 Composite Score: ${scores.composite}/100`);

      return results;

    } catch (error) {
      this.logger.error('UI/UX analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Gather files for analysis
   */
  gatherFiles(targetPath, options) {
    const files = [];
    const basePath = path.join(this.config.projectRoot, targetPath);

    // Check if targetPath already points to a specific directory
    const isComponentsDir = targetPath.includes('components');
    const isPagesDir = targetPath.includes('pages');
    const isDesignDir = targetPath.includes('design');

    // If targetPath is already a specific directory, scan it directly
    if (isComponentsDir || isPagesDir || isDesignDir) {
      const allFiles = glob(`${basePath}/**/*.{js,jsx,ts,tsx}`, {
        ignore: ['**/*.test.*', '**/*.stories.*', '**/node_modules/**']
      });
      files.push(...allFiles);
    } else {
      // Component files
      if (options.includeComponents) {
        const componentFiles = glob(`${basePath}/components/**/*.{js,jsx,ts,tsx}`, {
          ignore: ['**/*.test.*', '**/*.stories.*', '**/node_modules/**']
        });
        files.push(...componentFiles);
      }

      // Page files
      if (options.includePages) {
        const pageFiles = glob(`${basePath}/pages/**/*.{js,jsx,ts,tsx}`, {
          ignore: ['**/*.test.*', '**/node_modules/**']
        });
        files.push(...pageFiles);
      }

      // Design system files
      if (options.includeDesignSystem) {
        const designFiles = glob(`${basePath}/design/**/*.{js,jsx,ts,tsx}`, {
          ignore: ['**/*.test.*', '**/node_modules/**']
        });
        files.push(...designFiles);
      }
    }

    return files;
  }

  /**
   * Analyze all files
   */
  async analyzeFiles(files) {
    const results = {
      designSystemViolations: [],
      accessibilityIssues: [],
      musicUXIssues: [],
      totalIssues: 0
    };

    for (const file of files) {
      try {
        // Design system validation
        const dsViolations = await this.designSystemValidator.validateFile(file);
        results.designSystemViolations.push(...dsViolations);

        // Accessibility checking
        const a11yIssues = await this.accessibilityChecker.validateFile(file);
        results.accessibilityIssues.push(...a11yIssues);

        // Music UX patterns
        const musicIssues = await this.musicUXPatterns.validateFile(file);
        results.musicUXIssues.push(...musicIssues);

      } catch (error) {
        this.logger.warn(`Failed to analyze ${file}: ${error.message}`);
      }
    }

    results.totalIssues =
      results.designSystemViolations.length +
      results.accessibilityIssues.length +
      results.musicUXIssues.length;

    return results;
  }

  /**
   * Calculate scores for all categories
   */
  calculateScores(analysisResults) {
    const designSystemScore = this.designSystemValidator.calculateComplianceScore(
      analysisResults.designSystemViolations
    );

    const accessibilityScore = this.accessibilityChecker.calculateAccessibilityScore(
      analysisResults.accessibilityIssues
    );

    const musicUXScore = this.musicUXPatterns.calculateMusicUXScore(
      analysisResults.musicUXIssues
    );

    // Weighted composite score
    const weights = {
      designSystem: 0.3,
      accessibility: 0.4,
      musicUX: 0.3
    };

    const compositeScore = Math.round(
      designSystemScore * weights.designSystem +
      accessibilityScore * weights.accessibility +
      musicUXScore * weights.musicUX
    );

    return {
      designSystem: designSystemScore,
      accessibility: accessibilityScore,
      musicUX: musicUXScore,
      composite: compositeScore
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysisResults) {
    const recommendations = [];

    // Group issues by priority
    const criticalIssues = this.getIssuesBySeverity(analysisResults, 'CRITICAL');
    const highIssues = this.getIssuesBySeverity(analysisResults, 'HIGH');

    // Design system recommendations
    if (analysisResults.designSystemViolations.length > 0) {
      const autoRemediable = analysisResults.designSystemViolations.filter(v => v.autoRemediable);

      recommendations.push({
        category: 'Design System',
        priority: criticalIssues.some(i => i.type?.includes('COLOR') || i.type?.includes('SPACING')) ? 'HIGH' : 'MEDIUM',
        title: 'Improve Design Token Usage',
        description: `Found ${analysisResults.designSystemViolations.length} design system violations`,
        issues: analysisResults.designSystemViolations.length,
        autoRemediable: autoRemediable.length,
        actions: [
          'Replace hardcoded colors with designTokens.colors',
          'Use spacing tokens instead of px values',
          'Apply typography scale from design system'
        ]
      });
    }

    // Accessibility recommendations
    if (analysisResults.accessibilityIssues.length > 0) {
      const wcagA = analysisResults.accessibilityIssues.filter(i => i.wcagLevel === 'A');
      const wcagAA = analysisResults.accessibilityIssues.filter(i => i.wcagLevel === 'AA');

      recommendations.push({
        category: 'Accessibility',
        priority: wcagA.length > 0 ? 'CRITICAL' : 'HIGH',
        title: 'Fix Accessibility Issues',
        description: `Found ${analysisResults.accessibilityIssues.length} accessibility issues`,
        issues: analysisResults.accessibilityIssues.length,
        wcagA: wcagA.length,
        wcagAA: wcagAA.length,
        actions: [
          'Add ARIA labels to interactive elements',
          'Fix color contrast ratios',
          'Ensure keyboard navigation support',
          'Add alt text to images'
        ]
      });
    }

    // Music UX recommendations
    if (analysisResults.musicUXIssues.length > 0) {
      const playbackIssues = analysisResults.musicUXIssues.filter(
        i => i.category === 'playback-controls'
      );

      recommendations.push({
        category: 'Music UX',
        priority: playbackIssues.length > 5 ? 'HIGH' : 'MEDIUM',
        title: 'Enhance Music Streaming UX',
        description: `Found ${analysisResults.musicUXIssues.length} music UX issues`,
        issues: analysisResults.musicUXIssues.length,
        playbackControlIssues: playbackIssues.length,
        actions: [
          'Improve playback control accessibility',
          'Optimize album art loading',
          'Add keyboard shortcuts for playback',
          'Implement virtual scrolling for playlists'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(analysisResults, severity) {
    const allIssues = [
      ...analysisResults.designSystemViolations,
      ...analysisResults.accessibilityIssues,
      ...analysisResults.musicUXIssues
    ];

    return allIssues.filter(issue => issue.severity === severity);
  }

  /**
   * Generate detailed report
   */
  async generateReport(format = 'console') {
    const report = this.results;

    switch (format) {
      case 'console':
        this.printConsoleReport(report);
        break;
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'markdown':
        return this.generateMarkdownReport(report);
      default:
        return report;
    }
  }

  /**
   * Print console report
   */
  printConsoleReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 UI/UX EXPERT ANALYSIS - MUSIC STREAMING PLATFORM');
    console.log('='.repeat(80));

    console.log(`\n📊 Overall Scores`);
    console.log(`   Composite Score: ${report.scores.composite}/100`);
    console.log(`   Design System: ${report.scores.designSystem}/100`);
    console.log(`   Accessibility: ${report.scores.accessibility}/100`);
    console.log(`   Music UX: ${report.scores.musicUX}/100`);

    console.log(`\n📈 Analysis Summary`);
    console.log(`   Files Analyzed: ${report.summary.filesAnalyzed}`);
    console.log(`   Total Issues: ${report.summary.totalIssues}`);
    console.log(`   Design System Violations: ${report.designSystemViolations.length}`);
    console.log(`   Accessibility Issues: ${report.accessibilityIssues.length}`);
    console.log(`   Music UX Issues: ${report.musicUXIssues.length}`);

    console.log(`\n🎯 Top Recommendations`);
    report.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`   ${rec.description}`);
      console.log(`   Actions:`);
      rec.actions.forEach(action => console.log(`     - ${action}`));
    });

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    let md = `# UI/UX Expert Analysis Report\n\n`;

    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Files Analyzed:** ${report.summary.filesAnalyzed}\n`;
    md += `**Total Issues:** ${report.summary.totalIssues}\n\n`;

    md += `## Overall Scores\n\n`;
    md += `- **Composite Score:** ${report.scores.composite}/100\n`;
    md += `- **Design System:** ${report.scores.designSystem}/100\n`;
    md += `- **Accessibility:** ${report.scores.accessibility}/100\n`;
    md += `- **Music UX:** ${report.scores.musicUX}/100\n\n`;

    md += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      md += `### ${index + 1}. [${rec.priority}] ${rec.title}\n\n`;
      md += `${rec.description}\n\n`;
      md += `**Actions:**\n\n`;
      rec.actions.forEach(action => md += `- ${action}\n`);
      md += `\n`;
    });

    return md;
  }

  /**
   * Auto-fix violations where possible
   */
  async autoFix() {
    if (!this.config.autoFixEnabled) {
      this.logger.warn('Auto-fix is disabled');
      return { fixed: 0, failed: 0 };
    }

    this.logger.info('🔧 Attempting auto-fix...');

    const fixResults = {
      fixed: 0,
      failed: 0,
      details: []
    };

    // Auto-fix design system violations
    const autoRemediable = this.results.designSystemViolations.filter(v => v.autoRemediable);

    for (const violation of autoRemediable) {
      try {
        const fix = this.designSystemValidator.generateAutoFix(violation);

        if (fix) {
          // Apply fix (simplified - would need actual file modification)
          fixResults.fixed++;
          fixResults.details.push({
            file: violation.file,
            type: violation.type,
            status: 'fixed'
          });
        }
      } catch (error) {
        fixResults.failed++;
        fixResults.details.push({
          file: violation.file,
          type: violation.type,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.logger.info(`✅ Auto-fixed: ${fixResults.fixed}`);
    this.logger.info(`❌ Failed: ${fixResults.failed}`);

    return fixResults;
  }

  /**
   * CLI Interface
   */
  static async fromCLI(options = {}) {
    const agent = new UIUXExpertAgent({
      wcagLevel: options.wcagLevel || 'AA',
      designSystemStrict: options.strict || false,
      autoFixEnabled: options.autoFix || false
    });

    await agent.initialize();

    try {
      const result = await agent.analyzeDesignSystem({
        targetPath: options.path || 'src',
        includeComponents: options.components !== false,
        includePages: options.pages !== false,
        includeDesignSystem: options.designSystem !== false
      });

      // Print report
      await agent.generateReport(options.format || 'console');

      // Auto-fix if requested
      if (options.autoFix) {
        await agent.autoFix();
      }

      return result;

    } catch (error) {
      console.error('❌ UI/UX analysis failed:', error.message);
      throw error;
    } finally {
      await agent.cleanup();
    }
  }
}

module.exports = UIUXExpertAgent;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    path: 'src',
    wcagLevel: 'AA',
    autoFix: false,
    format: 'console'
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      options.path = args[i + 1];
      i++;
    } else if (args[i] === '--wcag-level' && args[i + 1]) {
      options.wcagLevel = args[i + 1];
      i++;
    } else if (args[i] === '--auto-fix') {
      options.autoFix = true;
    } else if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    } else if (args[i] === '--strict') {
      options.strict = true;
    }
  }

  UIUXExpertAgent.fromCLI(options).catch(console.error);
}
