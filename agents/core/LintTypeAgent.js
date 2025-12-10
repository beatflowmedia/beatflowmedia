const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * LintTypeAgent - Automated code quality and TypeScript checking
 * Supports ESLint, Prettier, TypeScript, security scanning, and performance optimization
 */
class LintTypeAgent {
  constructor(config = {}) {
    this.config = {
      srcDir: config.srcDir || 'src',
      eslintConfig: config.eslintConfig || '.eslintrc.js',
      prettierConfig: config.prettierConfig || '.prettierrc',
      tsConfig: config.tsConfig || 'tsconfig.json',
      autoFix: config.autoFix !== false,
      enforceSecurity: config.enforceSecurity !== false,
      performanceCheck: config.performanceCheck !== false,
      accessibilityCheck: config.accessibilityCheck !== false,
      ...config
    };

    this.lintRules = {
      REACT: 'React-specific linting rules',
      TYPESCRIPT: 'TypeScript type checking and best practices',
      SECURITY: 'Security vulnerability detection',
      PERFORMANCE: 'Performance optimization suggestions',
      ACCESSIBILITY: 'Accessibility compliance checking',
      IMPORTS: 'Import/export organization and optimization'
    };

    this.fixStrategies = {
      AUTO: 'automatically fixable issues',
      SEMI_AUTO: 'partially fixable with user confirmation',
      MANUAL: 'requires manual intervention'
    };

    this.severityLevels = {
      ERROR: 'blocking issues that prevent build',
      WARNING: 'issues that should be addressed',
      INFO: 'suggestions for improvement'
    };
  }

  /**
   * Run comprehensive code quality analysis and fixing
   */
  async runQualityCheck(targetPath = this.config.srcDir, options = {}) {
    try {
      const {
        autoFix = this.config.autoFix,
        includeTypes = true,
        includeSecurity = this.config.enforceSecurity,
        includePerformance = this.config.performanceCheck,
        includeAccessibility = this.config.accessibilityCheck,
        exitOnError = false
      } = options;

      console.log(`🔍 LintTypeAgent: Running quality check on ${targetPath}`);

      const results = {
        eslint: null,
        typescript: null,
        prettier: null,
        security: null,
        performance: null,
        accessibility: null,
        summary: null
      };

      // Run ESLint analysis
      results.eslint = await this.runESLintCheck(targetPath, autoFix);

      // Run TypeScript checking
      if (includeTypes) {
        results.typescript = await this.runTypeScriptCheck(targetPath);
      }

      // Run Prettier formatting
      results.prettier = await this.runPrettierCheck(targetPath, autoFix);

      // Run security scanning
      if (includeSecurity) {
        results.security = await this.runSecurityCheck(targetPath);
      }

      // Run performance analysis
      if (includePerformance) {
        results.performance = await this.runPerformanceCheck(targetPath);
      }

      // Run accessibility checking
      if (includeAccessibility) {
        results.accessibility = await this.runAccessibilityCheck(targetPath);
      }

      // Generate comprehensive summary
      results.summary = await this.generateQualitySummary(results);

      // Apply automatic fixes
      if (autoFix) {
        await this.applyAutomaticFixes(results, targetPath);
      }

      // Generate quality report
      await this.generateQualityReport(results, targetPath);

      // Check if should exit on error
      if (exitOnError && results.summary.hasErrors) {
        throw new Error('Quality check failed with errors');
      }

      console.log(`✅ Quality check completed - ${results.summary.totalIssues} issues found`);

      return {
        success: true,
        results,
        metrics: await this.getQualityMetrics(results)
      };

    } catch (error) {
      console.error(`❌ LintTypeAgent error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run ESLint analysis with custom rules
   */
  async runESLintCheck(targetPath, autoFix) {
    try {
      console.log('🔧 Running ESLint analysis...');

      const eslintCommand = `npx eslint ${targetPath} --ext .js,.jsx,.ts,.tsx --format json ${autoFix ? '--fix' : ''}`;

      let output;
      let exitCode = 0;

      try {
        output = execSync(eslintCommand, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        output = error.stdout || error.stderr;
        exitCode = error.status;
      }

      const results = this.parseESLintResults(output);

      return {
        success: exitCode === 0,
        results,
        fixed: autoFix ? results.fixedCount || 0 : 0,
        exitCode
      };

    } catch (error) {
      console.warn('⚠️ ESLint check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Run TypeScript type checking
   */
  async runTypeScriptCheck(targetPath) {
    try {
      console.log('🔧 Running TypeScript analysis...');

      const tscCommand = 'npx tsc --noEmit --pretty false';

      let output;
      let exitCode = 0;

      try {
        output = execSync(tscCommand, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        output = error.stdout || error.stderr;
        exitCode = error.status;
      }

      const results = this.parseTypeScriptResults(output);

      return {
        success: exitCode === 0,
        results,
        exitCode
      };

    } catch (error) {
      console.warn('⚠️ TypeScript check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Run Prettier formatting check
   */
  async runPrettierCheck(targetPath, autoFix) {
    try {
      console.log('🔧 Running Prettier analysis...');

      const prettierCommand = `npx prettier ${targetPath} --check --ignore-unknown ${autoFix ? '--write' : ''}`;

      let output;
      let exitCode = 0;

      try {
        output = execSync(prettierCommand, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        output = error.stdout || error.stderr;
        exitCode = error.status;
      }

      const results = this.parsePrettierResults(output, exitCode);

      return {
        success: exitCode === 0,
        results,
        fixed: autoFix && exitCode !== 0,
        exitCode
      };

    } catch (error) {
      console.warn('⚠️ Prettier check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Run security vulnerability scanning
   */
  async runSecurityCheck(targetPath) {
    try {
      console.log('🔧 Running security analysis...');

      const results = [];

      // Check for common security issues
      results.push(...await this.scanForSecurityPatterns(targetPath));

      // Check dependencies for vulnerabilities
      results.push(...await this.checkDependencyVulnerabilities());

      // Check for secrets in code
      results.push(...await this.scanForSecrets(targetPath));

      return {
        success: results.length === 0,
        results,
        vulnerabilities: results.filter(r => r.severity === 'ERROR').length,
        warnings: results.filter(r => r.severity === 'WARNING').length
      };

    } catch (error) {
      console.warn('⚠️ Security check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Run performance analysis
   */
  async runPerformanceCheck(targetPath) {
    try {
      console.log('🔧 Running performance analysis...');

      const results = [];

      // Check for performance anti-patterns
      results.push(...await this.scanForPerformanceIssues(targetPath));

      // Check bundle size impact
      results.push(...await this.analyzeBundleImpact(targetPath));

      // Check for accessibility issues
      results.push(...await this.checkRenderPerformance(targetPath));

      return {
        success: results.filter(r => r.severity === 'ERROR').length === 0,
        results,
        suggestions: results.length
      };

    } catch (error) {
      console.warn('⚠️ Performance check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Run accessibility compliance checking
   */
  async runAccessibilityCheck(targetPath) {
    try {
      console.log('🔧 Running accessibility analysis...');

      const results = [];

      // Check for accessibility patterns
      results.push(...await this.scanForA11yIssues(targetPath));

      // Check ARIA usage
      results.push(...await this.checkAriaUsage(targetPath));

      // Check keyboard navigation support
      results.push(...await this.checkKeyboardSupport(targetPath));

      return {
        success: results.filter(r => r.severity === 'ERROR').length === 0,
        results,
        violations: results.filter(r => r.severity === 'ERROR').length,
        warnings: results.filter(r => r.severity === 'WARNING').length
      };

    } catch (error) {
      console.warn('⚠️ Accessibility check failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Parse ESLint JSON output
   */
  parseESLintResults(output) {
    try {
      if (!output || output.trim() === '') {
        return [];
      }

      const data = JSON.parse(output);
      return data.map(file => ({
        file: file.filePath,
        messages: file.messages.map(msg => ({
          rule: msg.ruleId,
          message: msg.message,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'ERROR' : 'WARNING',
          fixable: msg.fix ? true : false
        })),
        errorCount: file.errorCount,
        warningCount: file.warningCount
      }));
    } catch (error) {
      console.warn('⚠️ Could not parse ESLint output');
      return [];
    }
  }

  /**
   * Parse TypeScript compiler output
   */
  parseTypeScriptResults(output) {
    if (!output || output.trim() === '') {
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim());
    const results = [];

    for (const line of lines) {
      const match = line.match(/^(.+)\((\d+),(\d+)\): (\w+) TS(\d+): (.+)$/);
      if (match) {
        const [, file, lineNum, column, severity, code, message] = match;
        results.push({
          file,
          line: parseInt(lineNum),
          column: parseInt(column),
          severity: severity.toUpperCase(),
          code: `TS${code}`,
          message
        });
      }
    }

    return results;
  }

  /**
   * Parse Prettier output
   */
  parsePrettierResults(output, exitCode) {
    if (exitCode === 0) {
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim());
    return lines.map(file => ({
      file,
      message: 'Code formatting issues detected',
      severity: 'WARNING',
      fixable: true
    }));
  }

  /**
   * Scan for security patterns and vulnerabilities
   */
  async scanForSecurityPatterns(targetPath) {
    const results = [];
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Use of eval() can lead to code injection vulnerabilities',
        severity: 'ERROR'
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
        severity: 'WARNING'
      },
      {
        pattern: /document\.write\s*\(/g,
        message: 'document.write() can lead to XSS vulnerabilities',
        severity: 'WARNING'
      },
      {
        pattern: /Math\.random\s*\(\s*\)/g,
        message: 'Math.random() is not cryptographically secure',
        severity: 'INFO'
      }
    ];

    try {
      const files = await this.getAllFiles(targetPath, ['.js', '.jsx', '.ts', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');

        for (const { pattern, message, severity } of securityPatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              results.push({
                file,
                line: i + 1,
                message,
                severity,
                type: 'security'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Security pattern scan failed:', error.message);
    }

    return results;
  }

  /**
   * Check dependency vulnerabilities
   */
  async checkDependencyVulnerabilities() {
    try {
      const output = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(output);
      const results = [];

      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
          results.push({
            file: 'package.json',
            message: `Vulnerability in ${pkg}: ${vuln.title}`,
            severity: this.mapAuditSeverity(vuln.severity),
            type: 'dependency'
          });
        });
      }

      return results;
    } catch (error) {
      console.warn('⚠️ Dependency audit failed:', error.message);
      return [];
    }
  }

  /**
   * Scan for secrets and sensitive information
   */
  async scanForSecrets(targetPath) {
    const results = [];
    const secretPatterns = [
      {
        pattern: /(['"])(AKIA[0-9A-Z]{16})\1/g,
        message: 'AWS Access Key ID detected',
        severity: 'ERROR'
      },
      {
        pattern: /(['"])([0-9a-zA-Z\/+]{40})\1/g,
        message: 'Potential AWS Secret Access Key detected',
        severity: 'ERROR'
      },
      {
        pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Hardcoded password detected',
        severity: 'ERROR'
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Hardcoded API key detected',
        severity: 'ERROR'
      }
    ];

    try {
      const files = await this.getAllFiles(targetPath, ['.js', '.jsx', '.ts', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');

        for (const { pattern, message, severity } of secretPatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              results.push({
                file,
                line: i + 1,
                message,
                severity,
                type: 'secret'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Secret scan failed:', error.message);
    }

    return results;
  }

  /**
   * Scan for performance issues
   */
  async scanForPerformanceIssues(targetPath) {
    const results = [];
    const performancePatterns = [
      {
        pattern: /useEffect\s*\(\s*[^,]+\s*\)\s*$/gm,
        message: 'useEffect without dependency array can cause infinite re-renders',
        severity: 'WARNING'
      },
      {
        pattern: /\.map\s*\([^)]*\)\s*\.map\s*\(/g,
        message: 'Chained map operations can be optimized',
        severity: 'INFO'
      },
      {
        pattern: /console\.(log|warn|error|info)/g,
        message: 'Console statements should be removed in production',
        severity: 'WARNING'
      }
    ];

    try {
      const files = await this.getAllFiles(targetPath, ['.js', '.jsx', '.ts', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');

        for (const { pattern, message, severity } of performancePatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              results.push({
                file,
                line: i + 1,
                message,
                severity,
                type: 'performance'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Performance scan failed:', error.message);
    }

    return results;
  }

  /**
   * Scan for accessibility issues
   */
  async scanForA11yIssues(targetPath) {
    const results = [];
    const a11yPatterns = [
      {
        pattern: /<img(?![^>]*alt=)/gi,
        message: 'Images must have alt attributes for accessibility',
        severity: 'ERROR'
      },
      {
        pattern: /<button[^>]*onClick[^>]*>(?![^<]*<\/button>)/gi,
        message: 'Interactive elements should have accessible text content',
        severity: 'WARNING'
      },
      {
        pattern: /tabIndex\s*=\s*['"][^01-]['"]/gi,
        message: 'Avoid positive tabIndex values',
        severity: 'WARNING'
      }
    ];

    try {
      const files = await this.getAllFiles(targetPath, ['.js', '.jsx', '.ts', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');

        for (const { pattern, message, severity } of a11yPatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              results.push({
                file,
                line: i + 1,
                message,
                severity,
                type: 'accessibility'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Accessibility scan failed:', error.message);
    }

    return results;
  }

  /**
   * Apply automatic fixes where possible
   */
  async applyAutomaticFixes(results, targetPath) {
    console.log('🔧 Applying automatic fixes...');

    let fixCount = 0;

    // ESLint auto-fixes are already applied during the check
    if (results.eslint && results.eslint.fixed) {
      fixCount += results.eslint.fixed;
    }

    // Prettier auto-fixes are already applied during the check
    if (results.prettier && results.prettier.fixed) {
      fixCount += 1;
    }

    // Apply custom fixes for security and performance issues
    if (results.security) {
      fixCount += await this.applySecurityFixes(results.security.results, targetPath);
    }

    if (results.performance) {
      fixCount += await this.applyPerformanceFixes(results.performance.results, targetPath);
    }

    console.log(`✅ Applied ${fixCount} automatic fixes`);
    return fixCount;
  }

  /**
   * Apply security-related fixes
   */
  async applySecurityFixes(securityIssues, targetPath) {
    let fixCount = 0;

    for (const issue of securityIssues) {
      if (issue.type === 'security' && issue.message.includes('innerHTML')) {
        // Fix innerHTML usage by suggesting textContent
        try {
          const content = await fs.readFile(issue.file, 'utf8');
          const lines = content.split('\n');

          // Simple replacement - in production, this would be more sophisticated
          lines[issue.line - 1] = lines[issue.line - 1].replace(
            /\.innerHTML\s*=/g,
            '.textContent ='
          );

          await fs.writeFile(issue.file, lines.join('\n'));
          fixCount++;
        } catch (error) {
          console.warn(`⚠️ Could not fix security issue in ${issue.file}:`, error.message);
        }
      }
    }

    return fixCount;
  }

  /**
   * Apply performance-related fixes
   */
  async applyPerformanceFixes(performanceIssues, targetPath) {
    let fixCount = 0;

    for (const issue of performanceIssues) {
      if (issue.type === 'performance' && issue.message.includes('console')) {
        // Remove console statements
        try {
          const content = await fs.readFile(issue.file, 'utf8');
          const lines = content.split('\n');

          // Comment out console statements
          lines[issue.line - 1] = lines[issue.line - 1].replace(
            /console\.(log|warn|error|info)/g,
            '// console.$1'
          );

          await fs.writeFile(issue.file, lines.join('\n'));
          fixCount++;
        } catch (error) {
          console.warn(`⚠️ Could not fix performance issue in ${issue.file}:`, error.message);
        }
      }
    }

    return fixCount;
  }

  /**
   * Generate comprehensive quality summary
   */
  async generateQualitySummary(results) {
    const summary = {
      totalIssues: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      hasErrors: false,
      categories: {
        eslint: 0,
        typescript: 0,
        prettier: 0,
        security: 0,
        performance: 0,
        accessibility: 0
      }
    };

    // Process each category
    Object.entries(results).forEach(([category, result]) => {
      if (result && result.results) {
        const issues = Array.isArray(result.results) ? result.results : [result.results];
        const categoryCount = issues.length;

        summary.categories[category] = categoryCount;
        summary.totalIssues += categoryCount;

        issues.forEach(issue => {
          if (issue.severity === 'ERROR') {
            summary.totalErrors++;
            summary.hasErrors = true;
          } else if (issue.severity === 'WARNING') {
            summary.totalWarnings++;
          } else {
            summary.totalInfo++;
          }
        });
      }
    });

    return summary;
  }

  /**
   * Generate detailed quality report
   */
  async generateQualityReport(results, targetPath) {
    const reportContent = this.formatQualityReport(results);
    const reportPath = path.join(path.dirname(targetPath), 'quality-report.md');

    await fs.writeFile(reportPath, reportContent);
    console.log(`📄 Quality report generated: ${reportPath}`);
  }

  /**
   * Format quality report as markdown
   */
  formatQualityReport(results) {
    const timestamp = new Date().toISOString();

    let report = `# Code Quality Report

Generated: ${timestamp}

## Summary

`;

    if (results.summary) {
      report += `
- Total Issues: ${results.summary.totalIssues}
- Errors: ${results.summary.totalErrors}
- Warnings: ${results.summary.totalWarnings}
- Info: ${results.summary.totalInfo}

`;
    }

    // Add detailed results for each category
    Object.entries(results).forEach(([category, result]) => {
      if (result && result.results && category !== 'summary') {
        report += `
## ${category.charAt(0).toUpperCase() + category.slice(1)}

`;
        if (Array.isArray(result.results) && result.results.length > 0) {
          result.results.forEach(issue => {
            report += `- **${issue.severity}**: ${issue.message}`;
            if (issue.file) {
              report += ` (${path.basename(issue.file)}:${issue.line || 0})`;
            }
            report += '\n';
          });
        } else {
          report += '✅ No issues found\n';
        }
      }
    });

    return report;
  }

  /**
   * Utility methods
   */
  async getAllFiles(dir, extensions) {
    const files = [];

    async function traverse(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverse(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    await traverse(dir);
    return files;
  }

  mapAuditSeverity(severity) {
    const severityMap = {
      critical: 'ERROR',
      high: 'ERROR',
      moderate: 'WARNING',
      low: 'INFO'
    };
    return severityMap[severity] || 'INFO';
  }

  async analyzeBundleImpact(targetPath) {
    // Placeholder for bundle analysis
    return [];
  }

  async checkRenderPerformance(targetPath) {
    // Placeholder for render performance analysis
    return [];
  }

  async checkAriaUsage(targetPath) {
    // Placeholder for ARIA usage analysis
    return [];
  }

  async checkKeyboardSupport(targetPath) {
    // Placeholder for keyboard support analysis
    return [];
  }

  async getQualityMetrics(results) {
    const metrics = {
      timestamp: new Date().toISOString(),
      categories: {},
      overall: {
        totalIssues: results.summary?.totalIssues || 0,
        errorRate: 0,
        warningRate: 0,
        qualityScore: 0
      }
    };

    // Calculate category metrics
    Object.entries(results).forEach(([category, result]) => {
      if (result && category !== 'summary') {
        metrics.categories[category] = {
          success: result.success,
          issueCount: result.results ? (Array.isArray(result.results) ? result.results.length : 1) : 0
        };
      }
    });

    // Calculate overall quality score (0-100)
    const totalIssues = metrics.overall.totalIssues;
    if (totalIssues === 0) {
      metrics.overall.qualityScore = 100;
    } else {
      const errorWeight = 3;
      const warningWeight = 1;

      const errorCount = results.summary?.totalErrors || 0;
      const warningCount = results.summary?.totalWarnings || 0;

      const weightedIssues = (errorCount * errorWeight) + (warningCount * warningWeight);
      metrics.overall.qualityScore = Math.max(0, 100 - (weightedIssues * 2));
    }

    return metrics;
  }
}

module.exports = LintTypeAgent;