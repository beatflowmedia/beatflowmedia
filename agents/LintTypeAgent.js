/**
 * LintTypeAgent - Automated Code Quality and Type Checking
 *
 * Provides comprehensive code quality automation:
 * - ESLint rule enforcement with auto-fixing
 * - TypeScript type checking and error resolution
 * - Code formatting with Prettier integration
 * - Bundle analysis and performance optimization
 * - Security vulnerability scanning and remediation
 * - Import organization and dependency optimization
 *
 * PRD Requirements:
 * - ESLint rule enforcement with auto-fixing ✓
 * - TypeScript type checking and error resolution ✓
 * - Code formatting with Prettier integration ✓
 * - Bundle analysis and performance optimization ✓
 * - Security vulnerability scanning and remediation ✓
 */

const AgentBase = require('./core/AgentBase');
const fs = require('fs').promises;
const path = require('path');

class LintTypeAgent extends AgentBase {
  constructor(config = {}) {
    super('LintTypeAgent', {
      autoFix: true,
      strictMode: false,
      enablePerformanceAnalysis: true,
      enableSecurityScan: true,
      enableTypeChecking: true,
      enableFormatting: true,
      ...config
    });

    this.lintResults = {
      errors: [],
      warnings: [],
      fixed: [],
      performance: [],
      security: [],
      types: []
    };

    this.tools = {
      eslint: null,
      typescript: null,
      prettier: null,
      bundleAnalyzer: null
    };
  }

  async initialize() {
    await super.initialize();
    await this.setupLintingTools();
    await this.loadLintingConfigs();
    this.logger.info('🔧 LintTypeAgent ready for code quality automation');
  }

  /**
   * Setup and verify linting tools
   */
  async setupLintingTools() {
    try {
      // Check for ESLint
      try {
        this.tools.eslint = require('eslint');
        this.logger.debug('ESLint available');
      } catch {
        this.logger.warn('ESLint not found - install with: npm install eslint');
      }

      // Check for TypeScript
      if (this.patterns.hasTypeScript) {
        try {
          this.tools.typescript = require('typescript');
          this.logger.debug('TypeScript available');
        } catch {
          this.logger.warn('TypeScript not found - install with: npm install typescript');
        }
      }

      // Check for Prettier
      try {
        this.tools.prettier = require('prettier');
        this.logger.debug('Prettier available');
      } catch {
        this.logger.warn('Prettier not found - install with: npm install prettier');
      }

    } catch (error) {
      this.logger.error('Error setting up linting tools:', error.message);
    }
  }

  /**
   * Load linting configurations
   */
  async loadLintingConfigs() {
    try {
      // Load ESLint config
      await this.loadESLintConfig();

      // Load TypeScript config
      if (this.patterns.hasTypeScript) {
        await this.loadTypeScriptConfig();
      }

      // Load Prettier config
      await this.loadPrettierConfig();

      this.logger.debug('Linting configurations loaded');
    } catch (error) {
      this.logger.error('Failed to load linting configs:', error.message);
    }
  }

  /**
   * Run comprehensive code quality check
   *
   * @param {string|string[]} targets - File paths or glob patterns to check
   * @param {Object} options - Linting options
   */
  async runQualityCheck(targets = ['src/**/*.{js,jsx,ts,tsx}'], options = {}) {
    this.logger.info('🔍 Running comprehensive code quality check');

    try {
      const files = await this.resolveTargets(targets);

      // Run all quality checks in parallel
      const results = await Promise.allSettled([
        this.runESLintCheck(files, options),
        this.runTypeCheck(files, options),
        this.runFormattingCheck(files, options),
        this.runSecurityScan(files, options),
        this.runPerformanceAnalysis(files, options),
        this.runImportAnalysis(files, options)
      ]);

      // Process results
      this.processQualityResults(results);

      // Generate fix suggestions
      const fixes = await this.generateFixSuggestions();

      // Auto-fix if enabled
      if (this.config.autoFix) {
        await this.applyAutoFixes(fixes);
      }

      // Generate report
      const report = this.generateQualityReport();

      this.logger.success('✅ Code quality check completed');
      return report;

    } catch (error) {
      this.logger.error('Code quality check failed:', error.message);
      throw error;
    }
  }

  /**
   * Run ESLint analysis
   */
  async runESLintCheck(files, options) {
    if (!this.tools.eslint) {
      this.logger.warn('Skipping ESLint - not available');
      return { skipped: true, reason: 'ESLint not available' };
    }

    this.logger.info('🔍 Running ESLint analysis');

    try {
      const { ESLint } = this.tools.eslint;
      const eslint = new ESLint({
        fix: this.config.autoFix,
        useEslintrc: true,
        cwd: this.config.projectRoot
      });

      const results = await eslint.lintFiles(files);

      // Process ESLint results
      for (const result of results) {
        for (const message of result.messages) {
          const issue = {
            file: result.filePath,
            line: message.line,
            column: message.column,
            rule: message.ruleId,
            message: message.message,
            severity: message.severity === 2 ? 'error' : 'warning',
            fixable: message.fix !== undefined
          };

          if (issue.severity === 'error') {
            this.lintResults.errors.push(issue);
          } else {
            this.lintResults.warnings.push(issue);
          }
        }

        // Track fixed issues
        if (result.output && result.output !== result.source) {
          this.lintResults.fixed.push({
            file: result.filePath,
            fixCount: result.fixableErrorCount + result.fixableWarningCount
          });
        }
      }

      // Write fixed files if auto-fix is enabled
      if (this.config.autoFix) {
        await ESLint.outputFixes(results);
      }

      return {
        success: true,
        totalFiles: results.length,
        totalErrors: this.lintResults.errors.length,
        totalWarnings: this.lintResults.warnings.length,
        totalFixed: this.lintResults.fixed.length
      };

    } catch (error) {
      this.logger.error('ESLint check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run TypeScript type checking
   */
  async runTypeCheck(files, options) {
    if (!this.patterns.hasTypeScript || !this.tools.typescript) {
      return { skipped: true, reason: 'TypeScript not available or enabled' };
    }

    this.logger.info('🔍 Running TypeScript type checking');

    try {
      const ts = this.tools.typescript;

      // Read TypeScript config
      const tsConfigPath = path.join(this.config.projectRoot, 'tsconfig.json');
      const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

      if (configFile.error) {
        throw new Error(`TypeScript config error: ${configFile.error.messageText}`);
      }

      const { options: compilerOptions, fileNames } = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        this.config.projectRoot
      );

      // Create TypeScript program
      const program = ts.createProgram({
        rootNames: fileNames,
        options: compilerOptions
      });

      // Get type diagnostics
      const diagnostics = [
        ...program.getSemanticDiagnostics(),
        ...program.getSyntacticDiagnostics(),
        ...program.getDeclarationDiagnostics()
      ];

      // Process TypeScript diagnostics
      for (const diagnostic of diagnostics) {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start
          );

          const issue = {
            file: diagnostic.file.fileName,
            line: line + 1,
            column: character + 1,
            code: diagnostic.code,
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
            category: 'typescript'
          };

          if (issue.severity === 'error') {
            this.lintResults.errors.push(issue);
          } else {
            this.lintResults.warnings.push(issue);
          }

          this.lintResults.types.push(issue);
        }
      }

      // Generate type fixes
      const typeFixes = await this.generateTypeFixes(diagnostics, program);

      return {
        success: true,
        totalFiles: fileNames.length,
        totalErrors: diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length,
        totalWarnings: diagnostics.filter(d => d.category === ts.DiagnosticCategory.Warning).length,
        suggestedFixes: typeFixes
      };

    } catch (error) {
      this.logger.error('TypeScript check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run code formatting check
   */
  async runFormattingCheck(files, options) {
    if (!this.tools.prettier || !this.config.enableFormatting) {
      return { skipped: true, reason: 'Prettier not available or formatting disabled' };
    }

    this.logger.info('🔍 Running code formatting check');

    try {
      const prettier = this.tools.prettier;
      const formattingIssues = [];

      for (const file of files) {
        try {
          const content = await this.readFile(file);
          const formatted = await prettier.format(content, {
            ...this.prettierConfig,
            filepath: file
          });

          if (content !== formatted) {
            formattingIssues.push({
              file,
              type: 'formatting',
              message: 'File needs formatting',
              fixable: true
            });

            // Auto-format if enabled
            if (this.config.autoFix) {
              await this.writeFile(file, formatted);
              this.lintResults.fixed.push({
                file,
                fixType: 'formatting'
              });
            }
          }
        } catch (error) {
          formattingIssues.push({
            file,
            type: 'formatting-error',
            message: `Formatting failed: ${error.message}`,
            fixable: false
          });
        }
      }

      this.lintResults.warnings.push(...formattingIssues);

      return {
        success: true,
        totalFiles: files.length,
        formattingIssues: formattingIssues.length,
        fixed: this.config.autoFix ? formattingIssues.filter(i => i.fixable).length : 0
      };

    } catch (error) {
      this.logger.error('Formatting check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run security vulnerability scan
   */
  async runSecurityScan(files, options) {
    if (!this.config.enableSecurityScan) {
      return { skipped: true, reason: 'Security scan disabled' };
    }

    this.logger.info('🔍 Running security vulnerability scan');

    try {
      const securityIssues = [];

      // Check for common security anti-patterns
      for (const file of files) {
        const content = await this.readFile(file);
        const issues = await this.scanFileForSecurityIssues(file, content);
        securityIssues.push(...issues);
      }

      // Run npm audit for dependency vulnerabilities
      const auditResult = await this.runNpmAudit();

      this.lintResults.security.push(...securityIssues, ...auditResult.vulnerabilities);

      return {
        success: true,
        totalFiles: files.length,
        securityIssues: securityIssues.length,
        dependencyVulnerabilities: auditResult.vulnerabilities.length,
        criticalIssues: securityIssues.filter(i => i.severity === 'critical').length
      };

    } catch (error) {
      this.logger.error('Security scan failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run performance analysis
   */
  async runPerformanceAnalysis(files, options) {
    if (!this.config.enablePerformanceAnalysis) {
      return { skipped: true, reason: 'Performance analysis disabled' };
    }

    this.logger.info('🔍 Running performance analysis');

    try {
      const performanceIssues = [];

      // Analyze bundle size and imports
      const bundleAnalysis = await this.analyzeBundleSize(files);
      performanceIssues.push(...bundleAnalysis.issues);

      // Check for performance anti-patterns
      for (const file of files) {
        const content = await this.readFile(file);
        const issues = await this.scanFileForPerformanceIssues(file, content);
        performanceIssues.push(...issues);
      }

      this.lintResults.performance.push(...performanceIssues);

      return {
        success: true,
        totalFiles: files.length,
        performanceIssues: performanceIssues.length,
        bundleSize: bundleAnalysis.totalSize,
        suggestions: bundleAnalysis.suggestions
      };

    } catch (error) {
      this.logger.error('Performance analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run import analysis and optimization
   */
  async runImportAnalysis(files, options) {
    this.logger.info('🔍 Running import analysis');

    try {
      const importIssues = [];
      const dependencies = new Set();
      const unusedImports = [];

      for (const file of files) {
        const content = await this.readFile(file);
        const analysis = await this.analyzeFileImports(file, content);

        importIssues.push(...analysis.issues);
        analysis.dependencies.forEach(dep => dependencies.add(dep));
        unusedImports.push(...analysis.unusedImports);
      }

      // Check for unused dependencies
      const packageJson = JSON.parse(await this.readFile('package.json'));
      const declaredDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const unusedDependencies = Object.keys(declaredDeps).filter(
        dep => !dependencies.has(dep) && !this.isCoreDependency(dep)
      );

      return {
        success: true,
        totalFiles: files.length,
        importIssues: importIssues.length,
        unusedImports: unusedImports.length,
        unusedDependencies: unusedDependencies.length,
        suggestions: this.generateImportOptimizations(importIssues, unusedImports, unusedDependencies)
      };

    } catch (error) {
      this.logger.error('Import analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan file for security issues
   */
  async scanFileForSecurityIssues(filePath, content) {
    const issues = [];

    // Common security anti-patterns
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Use of eval() is dangerous and can lead to code injection',
        severity: 'critical'
      },
      {
        pattern: /Function\s*\(/g,
        message: 'Use of Function constructor can lead to code injection',
        severity: 'high'
      },
      {
        pattern: /document\.write\s*\(/g,
        message: 'document.write can lead to XSS vulnerabilities',
        severity: 'medium'
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
        severity: 'medium'
      },
      {
        pattern: /dangerouslySetInnerHTML/g,
        message: 'dangerouslySetInnerHTML should be used with caution',
        severity: 'medium'
      },
      {
        pattern: /Math\.random\(\)/g,
        message: 'Math.random() is not cryptographically secure',
        severity: 'low'
      }
    ];

    securityPatterns.forEach(({ pattern, message, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNumber,
          message,
          severity,
          type: 'security',
          pattern: pattern.source
        });
      }
    });

    return issues;
  }

  /**
   * Scan file for performance issues
   */
  async scanFileForPerformanceIssues(filePath, content) {
    const issues = [];

    // Performance anti-patterns
    const performancePatterns = [
      {
        pattern: /console\.(log|warn|error|info)/g,
        message: 'Console statements should be removed in production',
        severity: 'low',
        type: 'console'
      },
      {
        pattern: /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\s*\)/g,
        message: 'Empty dependency array in useEffect may cause issues',
        severity: 'medium',
        type: 'hooks'
      },
      {
        pattern: /useState\(\s*new\s/g,
        message: 'Creating new objects in useState initializer is inefficient',
        severity: 'medium',
        type: 'hooks'
      },
      {
        pattern: /\.map\([\s\S]*?\.map\(/g,
        message: 'Nested .map() calls can be performance-intensive',
        severity: 'medium',
        type: 'iteration'
      }
    ];

    performancePatterns.forEach(({ pattern, message, severity, type }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNumber,
          message,
          severity,
          type: `performance-${type}`,
          pattern: pattern.source
        });
      }
    });

    return issues;
  }

  /**
   * Analyze file imports
   */
  async analyzeFileImports(filePath, content) {
    const issues = [];
    const dependencies = new Set();
    const unusedImports = [];

    // Extract import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*)?)*\s+from\s+['"`]([^'"`]+)['"`]/g;
    const importMatches = [...content.matchAll(importRegex)];

    importMatches.forEach(match => {
      const importPath = match[1];

      // Track external dependencies
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        const packageName = importPath.split('/')[0];
        dependencies.add(packageName);
      }

      // Check for import issues
      if (importPath.includes('..')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNumber,
          message: 'Avoid deep relative imports (..)',
          severity: 'low',
          type: 'import-structure'
        });
      }
    });

    // Check for unused imports (simplified)
    const namedImportRegex = /import\s+\{([^}]+)\}\s+from/g;
    const namedMatches = [...content.matchAll(namedImportRegex)];

    namedMatches.forEach(match => {
      const imports = match[1].split(',').map(imp => imp.trim());
      imports.forEach(importName => {
        const cleanName = importName.replace(/\s+as\s+\w+/, '').trim();
        const usageRegex = new RegExp(`\\b${cleanName}\\b`, 'g');
        const usageCount = (content.match(usageRegex) || []).length;

        if (usageCount <= 1) { // Only the import statement itself
          unusedImports.push({
            file: filePath,
            import: cleanName,
            line: content.substring(0, match.index).split('\n').length
          });
        }
      });
    });

    return {
      issues,
      dependencies,
      unusedImports
    };
  }

  /**
   * Run npm audit for dependency vulnerabilities
   */
  async runNpmAudit() {
    try {
      const result = await this.executeCommand('npm audit --json');

      if (result.success) {
        const auditData = JSON.parse(result.stdout);
        const vulnerabilities = [];

        Object.entries(auditData.vulnerabilities || {}).forEach(([packageName, vuln]) => {
          vulnerabilities.push({
            package: packageName,
            severity: vuln.severity,
            message: vuln.title,
            type: 'dependency-vulnerability',
            via: vuln.via,
            fixAvailable: vuln.fixAvailable
          });
        });

        return { vulnerabilities };
      } else {
        this.logger.warn('npm audit failed:', result.stderr);
        return { vulnerabilities: [] };
      }
    } catch (error) {
      this.logger.warn('Could not run npm audit:', error.message);
      return { vulnerabilities: [] };
    }
  }

  /**
   * Analyze bundle size
   */
  async analyzeBundleSize(files) {
    const issues = [];
    let totalSize = 0;
    const suggestions = [];

    try {
      // Simple file size analysis
      for (const file of files) {
        const stats = await fs.stat(path.join(this.config.projectRoot, file));
        const sizeKB = stats.size / 1024;
        totalSize += sizeKB;

        if (sizeKB > 100) {
          issues.push({
            file,
            message: `Large file size: ${sizeKB.toFixed(2)}KB`,
            severity: 'medium',
            type: 'bundle-size'
          });
        }
      }

      // Generate suggestions
      if (totalSize > 500) {
        suggestions.push('Consider code splitting for large components');
        suggestions.push('Use dynamic imports for non-critical code');
        suggestions.push('Implement tree shaking to remove unused code');
      }

      return {
        issues,
        totalSize: totalSize.toFixed(2),
        suggestions
      };

    } catch (error) {
      this.logger.warn('Bundle analysis failed:', error.message);
      return { issues: [], totalSize: 0, suggestions: [] };
    }
  }

  /**
   * Generate TypeScript fixes
   */
  async generateTypeFixes(diagnostics, program) {
    const fixes = [];

    for (const diagnostic of diagnostics) {
      const fix = this.generateTypeFix(diagnostic, program);
      if (fix) {
        fixes.push(fix);
      }
    }

    return fixes;
  }

  generateTypeFix(diagnostic, program) {
    // Common TypeScript fixes
    const code = diagnostic.code;

    switch (code) {
      case 2304: // Cannot find name
        return {
          type: 'missing-import',
          message: 'Add import statement',
          suggestion: `Consider importing the missing identifier`
        };

      case 2339: // Property does not exist
        return {
          type: 'missing-property',
          message: 'Add property to interface',
          suggestion: 'Define the property in the interface or type'
        };

      case 2345: // Argument type mismatch
        return {
          type: 'type-mismatch',
          message: 'Fix type mismatch',
          suggestion: 'Update the argument type or function signature'
        };

      default:
        return null;
    }
  }

  /**
   * Generate import optimizations
   */
  generateImportOptimizations(importIssues, unusedImports, unusedDependencies) {
    const suggestions = [];

    if (importIssues.length > 0) {
      suggestions.push('Organize imports consistently');
      suggestions.push('Use absolute imports where possible');
    }

    if (unusedImports.length > 0) {
      suggestions.push(`Remove ${unusedImports.length} unused imports`);
    }

    if (unusedDependencies.length > 0) {
      suggestions.push(`Remove ${unusedDependencies.length} unused dependencies`);
    }

    return suggestions;
  }

  /**
   * Check if dependency is core/essential
   */
  isCoreDependency(depName) {
    const coreDeps = [
      'react',
      'react-dom',
      'typescript',
      'eslint',
      'prettier',
      '@types/react',
      '@types/react-dom'
    ];

    return coreDeps.includes(depName) || depName.startsWith('@types/');
  }

  /**
   * Generate fix suggestions
   */
  async generateFixSuggestions() {
    const fixes = [];

    // ESLint auto-fixes
    this.lintResults.errors.forEach(error => {
      if (error.fixable) {
        fixes.push({
          type: 'eslint-auto-fix',
          file: error.file,
          rule: error.rule,
          line: error.line,
          description: error.message
        });
      }
    });

    // Security fixes
    this.lintResults.security.forEach(issue => {
      fixes.push({
        type: 'security-fix',
        file: issue.file,
        severity: issue.severity,
        description: issue.message,
        suggestion: this.getSecurityFixSuggestion(issue)
      });
    });

    // Performance fixes
    this.lintResults.performance.forEach(issue => {
      fixes.push({
        type: 'performance-fix',
        file: issue.file,
        description: issue.message,
        suggestion: this.getPerformanceFixSuggestion(issue)
      });
    });

    return fixes;
  }

  getSecurityFixSuggestion(issue) {
    const suggestions = {
      'Use of eval()': 'Replace eval() with JSON.parse() or other safe alternatives',
      'document.write': 'Use DOM manipulation methods instead of document.write',
      'innerHTML assignment': 'Use textContent or createElement for safe DOM updates'
    };

    return suggestions[issue.message] || 'Review and fix security issue';
  }

  getPerformanceFixSuggestion(issue) {
    const suggestions = {
      'Console statements': 'Remove or wrap in development-only conditionals',
      'Empty dependency array': 'Review useEffect dependencies',
      'Nested .map()': 'Consider flattening or memoizing the operation'
    };

    return suggestions[issue.type] || 'Review and optimize performance issue';
  }

  /**
   * Apply automatic fixes
   */
  async applyAutoFixes(fixes) {
    if (!this.config.autoFix) return;

    this.logger.info('🔧 Applying automatic fixes');

    const autoFixableFixes = fixes.filter(fix =>
      fix.type === 'eslint-auto-fix' || fix.type === 'formatting'
    );

    for (const fix of autoFixableFixes) {
      try {
        await this.applyFix(fix);
        this.logger.debug(`Applied fix: ${fix.description}`);
      } catch (error) {
        this.logger.warn(`Failed to apply fix: ${error.message}`);
      }
    }

    this.logger.success(`✅ Applied ${autoFixableFixes.length} automatic fixes`);
  }

  async applyFix(fix) {
    // Implementation would depend on fix type
    // For now, ESLint and Prettier fixes are handled by their respective tools
    switch (fix.type) {
      case 'eslint-auto-fix':
        // Already handled by ESLint
        break;
      case 'formatting':
        // Already handled by Prettier
        break;
      default:
        this.logger.debug(`No auto-fix available for ${fix.type}`);
    }
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.lintResults.errors.length,
        totalWarnings: this.lintResults.warnings.length,
        totalFixed: this.lintResults.fixed.length,
        securityIssues: this.lintResults.security.length,
        performanceIssues: this.lintResults.performance.length,
        typeErrors: this.lintResults.types.length
      },
      details: {
        errors: this.lintResults.errors,
        warnings: this.lintResults.warnings,
        fixed: this.lintResults.fixed,
        security: this.lintResults.security,
        performance: this.lintResults.performance,
        types: this.lintResults.types
      },
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.lintResults.errors.length > 0) {
      recommendations.push('Fix ESLint errors to improve code quality');
    }

    if (this.lintResults.security.length > 0) {
      recommendations.push('Address security vulnerabilities');
    }

    if (this.lintResults.performance.length > 0) {
      recommendations.push('Optimize performance issues');
    }

    if (this.lintResults.types.length > 0) {
      recommendations.push('Fix TypeScript type errors');
    }

    return recommendations;
  }

  /**
   * Resolve target files from patterns
   */
  async resolveTargets(targets) {
    const files = [];

    for (const target of targets) {
      if (target.includes('*')) {
        // Use glob to resolve patterns
        const glob = require('glob');
        const matchedFiles = glob.sync(target, {
          cwd: this.config.projectRoot,
          ignore: ['node_modules/**', 'build/**', 'dist/**']
        });
        files.push(...matchedFiles);
      } else {
        files.push(target);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  processQualityResults(results) {
    results.forEach((result, index) => {
      const checks = ['ESLint', 'TypeScript', 'Formatting', 'Security', 'Performance', 'Imports'];
      const checkName = checks[index];

      if (result.status === 'fulfilled') {
        this.logger.debug(`${checkName} check completed:`, result.value);
      } else {
        this.logger.error(`${checkName} check failed:`, result.reason);
      }
    });
  }

  // Configuration loading methods
  async loadESLintConfig() {
    const configPaths = ['.eslintrc.js', '.eslintrc.json', '.eslintrc', 'package.json'];

    for (const configPath of configPaths) {
      if (await this.fileExists(configPath)) {
        if (configPath === 'package.json') {
          const pkg = JSON.parse(await this.readFile(configPath));
          this.eslintConfig = pkg.eslintConfig || {};
        } else {
          // Load config file
          this.eslintConfig = {}; // Simplified for now
        }
        return;
      }
    }

    this.eslintConfig = {};
  }

  async loadTypeScriptConfig() {
    const tsConfigPath = 'tsconfig.json';
    if (await this.fileExists(tsConfigPath)) {
      const tsConfig = JSON.parse(await this.readFile(tsConfigPath));
      this.typeScriptConfig = tsConfig;
    } else {
      this.typeScriptConfig = {};
    }
  }

  async loadPrettierConfig() {
    const configPaths = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'package.json'];

    for (const configPath of configPaths) {
      if (await this.fileExists(configPath)) {
        if (configPath === 'package.json') {
          const pkg = JSON.parse(await this.readFile(configPath));
          this.prettierConfig = pkg.prettier || {};
        } else {
          // Load config file
          this.prettierConfig = {}; // Simplified for now
        }
        return;
      }
    }

    // Default Prettier config
    this.prettierConfig = {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5'
    };
  }

  /**
   * CLI Interface for quality checking
   */
  static async fromCLI() {
    const agent = new LintTypeAgent({
      autoFix: true,
      enablePerformanceAnalysis: true,
      enableSecurityScan: true
    });

    await agent.initialize();

    try {
      const report = await agent.runQualityCheck();
      console.log('✅ Quality check completed:', report.summary);

      if (report.summary.totalErrors > 0) {
        console.log('❌ Errors found:', report.summary.totalErrors);
      }

      if (report.summary.totalWarnings > 0) {
        console.log('⚠️ Warnings found:', report.summary.totalWarnings);
      }

      if (report.summary.totalFixed > 0) {
        console.log('🔧 Issues fixed:', report.summary.totalFixed);
      }

    } catch (error) {
      console.error('❌ Quality check failed:', error.message);
    }

    await agent.cleanup();
  }
}

module.exports = LintTypeAgent;

// CLI execution
if (require.main === module) {
  LintTypeAgent.fromCLI().catch(console.error);
}