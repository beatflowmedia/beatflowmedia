#!/usr/bin/env node

/**
 * Code Quality Review Agent
 *
 * Performs comprehensive code quality analysis including:
 * - Code complexity analysis
 * - Anti-pattern detection
 * - Best practices compliance
 * - Code smell identification
 * - Maintainability scoring
 */

const fs = require('fs');
const path = require('path');

class CodeQualityReviewAgent {
  constructor() {
    this.analysisResults = {
      complexityIssues: [],
      antiPatterns: [],
      codeSmells: [],
      bestPracticeViolations: [],
      maintainabilityScore: 0,
      recommendations: []
    };
  }

  // Main analysis entry point
  async analyzeCodebase() {
    console.log('🔍 Starting comprehensive code quality analysis...\n');

    try {
      const files = this.findSourceFiles('src');
      let totalScore = 0;
      let fileCount = 0;

      for (const file of files) {
        console.log(`Analyzing: ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        const fileScore = await this.analyzeFile(file, content);
        totalScore += fileScore;
        fileCount++;
      }

      this.analysisResults.maintainabilityScore = totalScore / fileCount;
      this.generateRecommendations();
      this.generateReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  // Analyze individual file
  async analyzeFile(filePath, content) {
    const analysis = {
      complexity: this.analyzeCyclomaticComplexity(content),
      antiPatterns: this.detectAntiPatterns(content, filePath),
      codeSmells: this.detectCodeSmells(content, filePath),
      bestPractices: this.checkBestPractices(content, filePath)
    };

    // Calculate file score (0-100)
    let score = 100;
    score -= Math.min(analysis.complexity.violations * 10, 30);
    score -= Math.min(analysis.antiPatterns.length * 5, 20);
    score -= Math.min(analysis.codeSmells.length * 3, 15);
    score -= Math.min(analysis.bestPractices.violations * 2, 10);

    return Math.max(score, 0);
  }

  // Cyclomatic complexity analysis
  analyzeCyclomaticComplexity(content) {
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+.*:/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?.*:/g // ternary
    ];

    let totalComplexity = 1; // Base complexity
    const violations = [];

    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern) || [];
      totalComplexity += matches.length;
    }

    // Detect functions with high complexity
    const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\w+\s*=>))/g) || [];
    const lines = content.split('\n');

    functionMatches.forEach((func, index) => {
      // Estimate function complexity (simplified)
      const funcStart = content.indexOf(func);
      const lineNumber = content.substring(0, funcStart).split('\n').length;

      if (totalComplexity > 10) {
        violations.push({
          type: 'HIGH_COMPLEXITY',
          line: lineNumber,
          function: func.substring(0, 50),
          complexity: totalComplexity,
          message: `Function has high cyclomatic complexity (${totalComplexity})`
        });
      }
    });

    this.analysisResults.complexityIssues.push(...violations);

    return {
      total: totalComplexity,
      violations: violations.length,
      functions: functionMatches.length
    };
  }

  // Anti-pattern detection
  detectAntiPatterns(content, filePath) {
    const antiPatterns = [];

    // God Object/Component (too many responsibilities)
    const componentLines = content.split('\n').length;
    if (componentLines > 500) {
      antiPatterns.push({
        type: 'GOD_COMPONENT',
        file: filePath,
        severity: 'HIGH',
        message: `Component has ${componentLines} lines - consider breaking it down`,
        lines: componentLines
      });
    }

    // Duplicate Code
    const duplicateBlocks = this.findDuplicateCodeBlocks(content);
    if (duplicateBlocks.length > 0) {
      antiPatterns.push({
        type: 'DUPLICATE_CODE',
        file: filePath,
        severity: 'MEDIUM',
        message: `Found ${duplicateBlocks.length} potential duplicate code blocks`,
        blocks: duplicateBlocks
      });
    }

    // Long Parameter Lists
    const longParameterLists = content.match(/\([^)]{100,}\)/g) || [];
    if (longParameterLists.length > 0) {
      antiPatterns.push({
        type: 'LONG_PARAMETER_LIST',
        file: filePath,
        severity: 'MEDIUM',
        message: `Found ${longParameterLists.length} functions with long parameter lists`,
        occurrences: longParameterLists.length
      });
    }

    // Nested Callbacks (Callback Hell)
    const nestedCallbacks = (content.match(/\}\s*\)\s*\.\s*then\s*\(/g) || []).length;
    if (nestedCallbacks > 3) {
      antiPatterns.push({
        type: 'CALLBACK_HELL',
        file: filePath,
        severity: 'HIGH',
        message: `Deep callback nesting detected (${nestedCallbacks} levels)`,
        depth: nestedCallbacks
      });
    }

    // Direct DOM Manipulation in React
    if (filePath.includes('.js') || filePath.includes('.jsx')) {
      const domManipulation = content.match(/document\.(getElementById|querySelector|createElement)/g) || [];
      if (domManipulation.length > 0) {
        antiPatterns.push({
          type: 'DIRECT_DOM_MANIPULATION',
          file: filePath,
          severity: 'HIGH',
          message: 'Direct DOM manipulation detected in React component',
          occurrences: domManipulation.length
        });
      }
    }

    this.analysisResults.antiPatterns.push(...antiPatterns);
    return antiPatterns;
  }

  // Code smell detection
  detectCodeSmells(content, filePath) {
    const codeSmells = [];

    // Dead Code
    const unusedImports = this.findUnusedImports(content);
    if (unusedImports.length > 0) {
      codeSmells.push({
        type: 'UNUSED_IMPORTS',
        file: filePath,
        severity: 'LOW',
        message: `Found ${unusedImports.length} unused imports`,
        imports: unusedImports
      });
    }

    // Magic Numbers
    const magicNumbers = content.match(/(?<![\w.])\d{3,}(?![\w.])/g) || [];
    if (magicNumbers.length > 0) {
      codeSmells.push({
        type: 'MAGIC_NUMBERS',
        file: filePath,
        severity: 'LOW',
        message: `Found ${magicNumbers.length} potential magic numbers`,
        numbers: magicNumbers
      });
    }

    // Long Method Names
    const longMethodNames = content.match(/(?:function\s+|const\s+)(\w{30,})/g) || [];
    if (longMethodNames.length > 0) {
      codeSmells.push({
        type: 'LONG_METHOD_NAMES',
        file: filePath,
        severity: 'LOW',
        message: `Found ${longMethodNames.length} very long method names`,
        methods: longMethodNames
      });
    }

    // Inconsistent Naming
    const camelCase = content.match(/\b[a-z][a-zA-Z0-9]*\b/g) || [];
    const snake_case = content.match(/\b[a-z][a-z0-9_]*_[a-z0-9_]*\b/g) || [];
    if (camelCase.length > 0 && snake_case.length > 0) {
      codeSmells.push({
        type: 'INCONSISTENT_NAMING',
        file: filePath,
        severity: 'LOW',
        message: 'Mixed naming conventions detected (camelCase and snake_case)',
        camelCase: camelCase.length,
        snakeCase: snake_case.length
      });
    }

    // Commented Out Code
    const commentedCode = content.match(/\/\/\s*[a-zA-Z].*[;{}]/g) || [];
    if (commentedCode.length > 5) {
      codeSmells.push({
        type: 'COMMENTED_OUT_CODE',
        file: filePath,
        severity: 'LOW',
        message: `Found ${commentedCode.length} lines of commented out code`,
        lines: commentedCode.length
      });
    }

    this.analysisResults.codeSmells.push(...codeSmells);
    return codeSmells;
  }

  // Best practices compliance check
  checkBestPractices(content, filePath) {
    const violations = [];

    // React-specific best practices
    if (filePath.includes('.js') || filePath.includes('.jsx')) {
      // Missing PropTypes
      if (content.includes('function ') && !content.includes('PropTypes')) {
        violations.push({
          type: 'MISSING_PROPTYPES',
          severity: 'MEDIUM',
          message: 'Component missing PropTypes validation'
        });
      }

      // Missing key prop in lists
      if (content.includes('.map(') && !content.includes('key=')) {
        violations.push({
          type: 'MISSING_KEY_PROP',
          severity: 'HIGH',
          message: 'Missing key prop in mapped components'
        });
      }

      // Inline styles instead of CSS classes
      const inlineStyles = content.match(/style=\{\{/g) || [];
      if (inlineStyles.length > 3) {
        violations.push({
          type: 'EXCESSIVE_INLINE_STYLES',
          severity: 'LOW',
          message: `${inlineStyles.length} inline styles found - consider CSS classes`
        });
      }
    }

    // JavaScript best practices
    // Missing error handling
    if (content.includes('async ') && !content.includes('try {')) {
      violations.push({
        type: 'MISSING_ERROR_HANDLING',
        severity: 'HIGH',
        message: 'Async function without error handling'
      });
    }

    // console.log in production code
    const consoleLogs = content.match(/console\.log/g) || [];
    if (consoleLogs.length > 0) {
      violations.push({
        type: 'CONSOLE_LOGS',
        severity: 'LOW',
        message: `${consoleLogs.length} console.log statements found`
      });
    }

    // Hardcoded values
    const hardcodedUrls = content.match(/https?:\/\/[^\s"'`]+/g) || [];
    if (hardcodedUrls.length > 0) {
      violations.push({
        type: 'HARDCODED_VALUES',
        severity: 'MEDIUM',
        message: `${hardcodedUrls.length} hardcoded URLs found`
      });
    }

    this.analysisResults.bestPracticeViolations.push(...violations);
    return { violations: violations.length, details: violations };
  }

  // Helper methods
  findDuplicateCodeBlocks(content) {
    const lines = content.split('\n');
    const blocks = [];
    const minBlockSize = 5;

    for (let i = 0; i < lines.length - minBlockSize; i++) {
      const block = lines.slice(i, i + minBlockSize).join('\n');
      const restOfContent = lines.slice(i + minBlockSize).join('\n');

      if (restOfContent.includes(block)) {
        blocks.push({
          startLine: i + 1,
          endLine: i + minBlockSize,
          content: block.substring(0, 100) + '...'
        });
      }
    }

    return blocks;
  }

  findUnusedImports(content) {
    const imports = content.match(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g) || [];
    const unused = [];

    imports.forEach(importStatement => {
      const match = importStatement.match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (match) {
        const importedItems = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];

        importedItems.forEach(item => {
          const usage = new RegExp(`\\b${item}\\b`, 'g');
          const usageCount = (content.match(usage) || []).length;

          // If used only once (the import itself), it's unused
          if (usageCount <= 1) {
            unused.push(item);
          }
        });
      }
    });

    return unused;
  }

  findSourceFiles(dir) {
    const files = [];

    function traverse(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          traverse(fullPath);
        } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    traverse(dir);
    return files;
  }

  // Generate actionable recommendations
  generateRecommendations() {
    const recommendations = [];

    // High complexity recommendations
    const highComplexityFiles = this.analysisResults.complexityIssues.filter(
      issue => issue.complexity > 15
    );
    if (highComplexityFiles.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Complexity',
        title: 'Reduce Cyclomatic Complexity',
        description: `${highComplexityFiles.length} functions have high complexity. Consider refactoring into smaller functions.`,
        action: 'Break down complex functions using Extract Method refactoring',
        files: highComplexityFiles.map(f => f.function)
      });
    }

    // God component recommendations
    const godComponents = this.analysisResults.antiPatterns.filter(
      pattern => pattern.type === 'GOD_COMPONENT'
    );
    if (godComponents.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Architecture',
        title: 'Break Down Large Components',
        description: `${godComponents.length} components are too large (>500 lines)`,
        action: 'Split into smaller, focused components using composition',
        files: godComponents.map(c => c.file)
      });
    }

    // Performance recommendations
    const callbackHell = this.analysisResults.antiPatterns.filter(
      pattern => pattern.type === 'CALLBACK_HELL'
    );
    if (callbackHell.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        title: 'Simplify Async Code',
        description: 'Replace nested callbacks with async/await pattern',
        action: 'Refactor Promise chains to use async/await syntax',
        files: callbackHell.map(c => c.file)
      });
    }

    // Code quality recommendations
    const unusedImports = this.analysisResults.codeSmells.filter(
      smell => smell.type === 'UNUSED_IMPORTS'
    );
    if (unusedImports.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Maintenance',
        title: 'Remove Unused Imports',
        description: 'Clean up unused imports to reduce bundle size',
        action: 'Run import cleanup tools and remove unused dependencies',
        files: unusedImports.map(u => u.file)
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        maintainabilityScore: Math.round(this.analysisResults.maintainabilityScore),
        totalIssues: this.analysisResults.complexityIssues.length +
                    this.analysisResults.antiPatterns.length +
                    this.analysisResults.codeSmells.length +
                    this.analysisResults.bestPracticeViolations.length,
        criticalIssues: this.analysisResults.antiPatterns.filter(p => p.severity === 'HIGH').length,
        recommendations: this.analysisResults.recommendations.length
      },
      details: this.analysisResults
    };

    // Console output
    console.log('\n📊 CODE QUALITY ANALYSIS REPORT');
    console.log('================================');
    console.log(`Overall Maintainability Score: ${report.summary.maintainabilityScore}/100`);
    console.log(`Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Recommendations: ${report.summary.recommendations}\n`);

    // Top recommendations
    if (this.analysisResults.recommendations.length > 0) {
      console.log('🎯 TOP RECOMMENDATIONS:');
      console.log('-----------------------');
      this.analysisResults.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Action: ${rec.action}\n`);
      });
    }

    // Save detailed report
    fs.writeFileSync(
      'code-quality-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed report saved to: code-quality-report.json');

    return report;
  }
}

// CLI execution
if (require.main === module) {
  const agent = new CodeQualityReviewAgent();
  agent.analyzeCodebase().catch(console.error);
}

module.exports = CodeQualityReviewAgent;