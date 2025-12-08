#!/usr/bin/env node

/**
 * Performance Analysis Agent
 *
 * Analyzes code for performance issues including:
 * - Bundle size optimization opportunities
 * - React performance anti-patterns
 * - Memory leak detection
 * - Unnecessary re-renders
 * - Inefficient algorithms
 * - Database query optimization
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalysisAgent {
  constructor() {
    this.analysisResults = {
      bundleIssues: [],
      reactPerformance: [],
      memoryLeaks: [],
      rerenderIssues: [],
      algorithmicIssues: [],
      databaseIssues: [],
      performanceScore: 0,
      optimizations: []
    };
  }

  // Main analysis entry point
  async analyzePerformance() {
    console.log('⚡ Starting performance analysis...\n');

    try {
      const files = this.findSourceFiles('src');
      let totalScore = 100;

      for (const file of files) {
        console.log(`Analyzing: ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        await this.analyzeFile(file, content);
      }

      this.calculatePerformanceScore();
      this.generateOptimizations();
      this.generatePerformanceReport();

    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message);
    }
  }

  // Analyze individual file for performance issues
  async analyzeFile(filePath, content) {
    // Bundle size analysis
    this.analyzeBundleSize(filePath, content);

    // React-specific performance analysis
    if (filePath.includes('.js') || filePath.includes('.jsx')) {
      this.analyzeReactPerformance(filePath, content);
      this.analyzeMemoryLeaks(filePath, content);
      this.analyzeRerenderIssues(filePath, content);
    }

    // Algorithm efficiency analysis
    this.analyzeAlgorithmicComplexity(filePath, content);

    // Database query analysis
    this.analyzeDatabaseQueries(filePath, content);
  }

  // Bundle size optimization analysis
  analyzeBundleSize(filePath, content) {
    const issues = [];

    // Large imports
    const largeLibraryImports = [
      { pattern: /import.*from\s+['"]lodash['"]/, library: 'lodash', suggestion: 'Use lodash/es for tree shaking' },
      { pattern: /import.*from\s+['"]moment['"]/, library: 'moment', suggestion: 'Consider date-fns or dayjs (smaller)' },
      { pattern: /import.*from\s+['"]@mui\/material['"]/, library: '@mui/material', suggestion: 'Import specific components' },
      { pattern: /import.*from\s+['"]@mui\/icons-material['"]/, library: '@mui/icons-material', suggestion: 'Import specific icons' }
    ];

    largeLibraryImports.forEach(({ pattern, library, suggestion }) => {
      if (pattern.test(content)) {
        issues.push({
          type: 'LARGE_LIBRARY_IMPORT',
          file: filePath,
          library,
          suggestion,
          severity: 'MEDIUM',
          impact: 'Bundle size increase'
        });
      }
    });

    // Unused CSS imports
    const cssImports = content.match(/import\s+['"][^'"]*\.css['"];?/g) || [];
    cssImports.forEach(cssImport => {
      // Simple heuristic: if CSS file is imported but no className usage found
      if (!content.includes('className')) {
        issues.push({
          type: 'UNUSED_CSS_IMPORT',
          file: filePath,
          import: cssImport,
          severity: 'LOW',
          impact: 'Unnecessary CSS bundle size'
        });
      }
    });

    // Heavy third-party libraries
    const heavyLibraries = [
      'recharts', 'react-beautiful-dnd', 'firebase', '@emotion/react'
    ];

    heavyLibraries.forEach(lib => {
      if (content.includes(`from '${lib}'`) || content.includes(`from "${lib}"`)) {
        issues.push({
          type: 'HEAVY_LIBRARY_USAGE',
          file: filePath,
          library: lib,
          severity: 'LOW',
          impact: 'Large bundle contribution',
          suggestion: 'Consider lazy loading or lighter alternatives'
        });
      }
    });

    this.analysisResults.bundleIssues.push(...issues);
  }

  // React performance analysis
  analyzeReactPerformance(filePath, content) {
    const issues = [];

    // Missing React.memo or useMemo
    if (content.includes('export default function') && !content.includes('React.memo')) {
      const componentSize = content.split('\n').length;
      if (componentSize > 100) {
        issues.push({
          type: 'MISSING_MEMO',
          file: filePath,
          severity: 'MEDIUM',
          message: 'Large component without React.memo optimization',
          suggestion: 'Wrap in React.memo to prevent unnecessary re-renders'
        });
      }
    }

    // Inline object/function creation in JSX
    const inlineObjects = content.match(/\w+\s*=\s*\{\{/g) || [];
    if (inlineObjects.length > 3) {
      issues.push({
        type: 'INLINE_OBJECT_CREATION',
        file: filePath,
        severity: 'HIGH',
        count: inlineObjects.length,
        message: `${inlineObjects.length} inline objects detected`,
        suggestion: 'Move object creation outside render or use useMemo'
      });
    }

    // Missing dependency arrays in useEffect
    const useEffectWithoutDeps = content.match(/useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\}\s*\)/g) || [];
    if (useEffectWithoutDeps.length > 0) {
      issues.push({
        type: 'MISSING_EFFECT_DEPENDENCIES',
        file: filePath,
        severity: 'HIGH',
        count: useEffectWithoutDeps.length,
        message: 'useEffect without dependency array',
        suggestion: 'Add dependency array to prevent infinite re-renders'
      });
    }

    // Large lists without virtualization
    if (content.includes('.map(') && content.includes('key=')) {
      const mapUsages = content.match(/\.map\s*\(/g) || [];
      if (mapUsages.length > 0) {
        issues.push({
          type: 'LARGE_LIST_RENDERING',
          file: filePath,
          severity: 'MEDIUM',
          message: 'Large list rendering detected',
          suggestion: 'Consider virtualization for lists >100 items'
        });
      }
    }

    // Inefficient state updates
    const directStateModification = content.match(/set\w+\s*\(\s*\w+\.\w+/g) || [];
    if (directStateModification.length > 0) {
      issues.push({
        type: 'DIRECT_STATE_MODIFICATION',
        file: filePath,
        severity: 'HIGH',
        count: directStateModification.length,
        message: 'Direct state modification detected',
        suggestion: 'Use functional updates or immutable patterns'
      });
    }

    this.analysisResults.reactPerformance.push(...issues);
  }

  // Memory leak detection
  analyzeMemoryLeaks(filePath, content) {
    const issues = [];

    // Missing cleanup in useEffect
    const useEffectPatterns = content.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([^}]+)\}/g) || [];
    useEffectPatterns.forEach((effect, index) => {
      if (effect.includes('setInterval') || effect.includes('setTimeout')) {
        if (!effect.includes('return') || !effect.includes('clear')) {
          issues.push({
            type: 'MISSING_TIMER_CLEANUP',
            file: filePath,
            severity: 'HIGH',
            effect: index + 1,
            message: 'Timer without cleanup in useEffect',
            suggestion: 'Return cleanup function to clear timers'
          });
        }
      }

      if (effect.includes('addEventListener')) {
        if (!effect.includes('removeEventListener')) {
          issues.push({
            type: 'MISSING_EVENT_CLEANUP',
            file: filePath,
            severity: 'HIGH',
            effect: index + 1,
            message: 'Event listener without cleanup',
            suggestion: 'Remove event listeners in cleanup function'
          });
        }
      }

      if (effect.includes('onSnapshot') || effect.includes('subscribe')) {
        if (!effect.includes('unsubscribe') && !effect.includes('return')) {
          issues.push({
            type: 'MISSING_SUBSCRIPTION_CLEANUP',
            file: filePath,
            severity: 'HIGH',
            effect: index + 1,
            message: 'Subscription without cleanup',
            suggestion: 'Unsubscribe in cleanup function'
          });
        }
      }
    });

    // Potential closure memory leaks
    const closureLeaks = content.match(/const\s+\w+\s*=\s*useCallback\s*\([^)]*\)\s*=>/g) || [];
    closureLeaks.forEach(callback => {
      if (!callback.includes('[') || callback.includes('[]')) {
        issues.push({
          type: 'POTENTIAL_CLOSURE_LEAK',
          file: filePath,
          severity: 'MEDIUM',
          message: 'useCallback without proper dependencies',
          suggestion: 'Review dependency array to prevent stale closures'
        });
      }
    });

    this.analysisResults.memoryLeaks.push(...issues);
  }

  // Re-render analysis
  analyzeRerenderIssues(filePath, content) {
    const issues = [];

    // Missing useCallback for event handlers
    const eventHandlers = content.match(/on\w+\s*=\s*\{[^}]*\}/g) || [];
    const useCallbacks = content.match(/useCallback/g) || [];

    if (eventHandlers.length > useCallbacks.length + 2) {
      issues.push({
        type: 'MISSING_USECALLBACK',
        file: filePath,
        severity: 'MEDIUM',
        handlers: eventHandlers.length,
        callbacks: useCallbacks.length,
        message: 'Event handlers without useCallback',
        suggestion: 'Wrap event handlers in useCallback'
      });
    }

    // Props drilling
    const propsPassing = content.match(/\w+\s*=\s*\{props\.\w+\}/g) || [];
    if (propsPassing.length > 5) {
      issues.push({
        type: 'PROPS_DRILLING',
        file: filePath,
        severity: 'MEDIUM',
        count: propsPassing.length,
        message: 'Potential props drilling detected',
        suggestion: 'Consider context or state management'
      });
    }

    // Expensive computations without useMemo
    const expensiveOperations = [
      '.filter(', '.map(', '.reduce(', '.sort(', 'JSON.parse', 'JSON.stringify'
    ];

    expensiveOperations.forEach(op => {
      const matches = content.match(new RegExp(`\\${op}`, 'g')) || [];
      const memoUsages = content.match(/useMemo/g) || [];

      if (matches.length > memoUsages.length + 1) {
        issues.push({
          type: 'MISSING_USEMEMO',
          file: filePath,
          severity: 'MEDIUM',
          operation: op,
          count: matches.length,
          message: `Expensive ${op} operations without memoization`,
          suggestion: 'Consider wrapping in useMemo'
        });
      }
    });

    this.analysisResults.rerenderIssues.push(...issues);
  }

  // Algorithmic complexity analysis
  analyzeAlgorithmicComplexity(filePath, content) {
    const issues = [];

    // Nested loops (O(n²) complexity)
    const nestedLoops = content.match(/for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/g) || [];
    if (nestedLoops.length > 0) {
      issues.push({
        type: 'NESTED_LOOPS',
        file: filePath,
        severity: 'HIGH',
        count: nestedLoops.length,
        message: 'Nested loops detected (O(n²) complexity)',
        suggestion: 'Consider hash maps or more efficient algorithms'
      });
    }

    // Inefficient array operations
    const inefficientOps = [
      { pattern: /\.indexOf\s*\([^)]*\)\s*>\s*-1/g, suggestion: 'Use .includes() instead of indexOf' },
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*\.push\([^)]*\)/g, suggestion: 'Consider map() instead of push in loop' },
      { pattern: /\.concat\s*\(/g, suggestion: 'Consider spread operator for better performance' }
    ];

    inefficientOps.forEach(({ pattern, suggestion }) => {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        issues.push({
          type: 'INEFFICIENT_OPERATION',
          file: filePath,
          severity: 'LOW',
          count: matches.length,
          suggestion
        });
      }
    });

    // Synchronous operations that could be async
    if (content.includes('JSON.parse') && content.includes('localStorage')) {
      issues.push({
        type: 'SYNC_STORAGE_ACCESS',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Synchronous localStorage access',
        suggestion: 'Consider async storage solutions for large data'
      });
    }

    this.analysisResults.algorithmicIssues.push(...issues);
  }

  // Database query optimization analysis
  analyzeDatabaseQueries(filePath, content) {
    const issues = [];

    // Missing query limits
    const firestoreQueries = content.match(/query\s*\([^)]*\)/g) || [];
    firestoreQueries.forEach(queryMatch => {
      if (!queryMatch.includes('limit')) {
        issues.push({
          type: 'MISSING_QUERY_LIMIT',
          file: filePath,
          severity: 'HIGH',
          message: 'Firestore query without limit',
          suggestion: 'Add limit() to prevent large data fetches'
        });
      }
    });

    // N+1 query problems
    const mapWithQuery = content.match(/\.map\s*\([^)]*\)\s*=>\s*[^}]*(?:getDoc|getDocs)/g) || [];
    if (mapWithQuery.length > 0) {
      issues.push({
        type: 'N_PLUS_ONE_QUERIES',
        file: filePath,
        severity: 'HIGH',
        count: mapWithQuery.length,
        message: 'Potential N+1 query pattern detected',
        suggestion: 'Batch queries or use compound queries'
      });
    }

    // Missing indexes
    const whereQueries = content.match(/where\s*\([^)]*\)/g) || [];
    if (whereQueries.length > 2) {
      issues.push({
        type: 'POTENTIAL_MISSING_INDEX',
        file: filePath,
        severity: 'MEDIUM',
        count: whereQueries.length,
        message: 'Multiple where clauses may need composite indexes',
        suggestion: 'Verify Firestore indexes for compound queries'
      });
    }

    // Real-time listeners without cleanup
    const realtimeListeners = content.match(/onSnapshot/g) || [];
    const unsubscribeCalls = content.match(/unsubscribe|return\s*\(\)/g) || [];

    if (realtimeListeners.length > unsubscribeCalls.length) {
      issues.push({
        type: 'LISTENER_MEMORY_LEAK',
        file: filePath,
        severity: 'HIGH',
        listeners: realtimeListeners.length,
        cleanups: unsubscribeCalls.length,
        message: 'Real-time listeners without cleanup',
        suggestion: 'Ensure all listeners are unsubscribed'
      });
    }

    this.analysisResults.databaseIssues.push(...issues);
  }

  // Calculate overall performance score
  calculatePerformanceScore() {
    let score = 100;

    // Deduct points for different types of issues
    const deductions = {
      'HIGH': 10,
      'MEDIUM': 5,
      'LOW': 2
    };

    const allIssues = [
      ...this.analysisResults.bundleIssues,
      ...this.analysisResults.reactPerformance,
      ...this.analysisResults.memoryLeaks,
      ...this.analysisResults.rerenderIssues,
      ...this.analysisResults.algorithmicIssues,
      ...this.analysisResults.databaseIssues
    ];

    allIssues.forEach(issue => {
      score -= deductions[issue.severity] || 1;
    });

    this.analysisResults.performanceScore = Math.max(score, 0);
  }

  // Generate optimization recommendations
  generateOptimizations() {
    const optimizations = [];

    // Bundle size optimizations
    const bundleIssues = this.analysisResults.bundleIssues;
    if (bundleIssues.length > 0) {
      optimizations.push({
        category: 'Bundle Size',
        priority: 'HIGH',
        title: 'Optimize Bundle Size',
        description: `${bundleIssues.length} bundle optimization opportunities found`,
        actions: [
          'Implement tree shaking for large libraries',
          'Use dynamic imports for code splitting',
          'Replace heavy libraries with lighter alternatives',
          'Remove unused CSS and dependencies'
        ],
        estimatedImprovement: '20-40% bundle size reduction'
      });
    }

    // React performance optimizations
    const reactIssues = this.analysisResults.reactPerformance;
    if (reactIssues.length > 0) {
      optimizations.push({
        category: 'React Performance',
        priority: 'HIGH',
        title: 'Optimize React Components',
        description: `${reactIssues.length} React performance issues detected`,
        actions: [
          'Add React.memo to prevent unnecessary re-renders',
          'Move object creation outside render functions',
          'Use useCallback and useMemo appropriately',
          'Implement component virtualization for large lists'
        ],
        estimatedImprovement: '30-50% render performance boost'
      });
    }

    // Memory optimization
    const memoryIssues = this.analysisResults.memoryLeaks;
    if (memoryIssues.length > 0) {
      optimizations.push({
        category: 'Memory Management',
        priority: 'CRITICAL',
        title: 'Fix Memory Leaks',
        description: `${memoryIssues.length} potential memory leaks found`,
        actions: [
          'Add cleanup functions to useEffect hooks',
          'Unsubscribe from event listeners and subscriptions',
          'Clear timers and intervals',
          'Fix closure memory leaks in callbacks'
        ],
        estimatedImprovement: 'Prevent memory leaks and crashes'
      });
    }

    // Database optimization
    const dbIssues = this.analysisResults.databaseIssues;
    if (dbIssues.length > 0) {
      optimizations.push({
        category: 'Database Performance',
        priority: 'HIGH',
        title: 'Optimize Database Queries',
        description: `${dbIssues.length} database optimization opportunities`,
        actions: [
          'Add query limits to prevent large data fetches',
          'Implement query batching to reduce N+1 problems',
          'Create composite indexes for complex queries',
          'Use pagination for large datasets'
        ],
        estimatedImprovement: '50-80% faster data loading'
      });
    }

    this.analysisResults.optimizations = optimizations;
  }

  // Helper method to find source files
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

  // Generate comprehensive performance report
  generatePerformanceReport() {
    const totalIssues = Object.values(this.analysisResults)
      .filter(Array.isArray)
      .reduce((sum, arr) => sum + arr.length, 0);

    const criticalIssues = Object.values(this.analysisResults)
      .filter(Array.isArray)
      .flat()
      .filter(issue => issue.severity === 'HIGH' || issue.severity === 'CRITICAL').length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        performanceScore: Math.round(this.analysisResults.performanceScore),
        totalIssues,
        criticalIssues,
        optimizations: this.analysisResults.optimizations.length
      },
      categories: {
        bundleSize: this.analysisResults.bundleIssues.length,
        reactPerformance: this.analysisResults.reactPerformance.length,
        memoryLeaks: this.analysisResults.memoryLeaks.length,
        rerenderIssues: this.analysisResults.rerenderIssues.length,
        algorithmicIssues: this.analysisResults.algorithmicIssues.length,
        databaseIssues: this.analysisResults.databaseIssues.length
      },
      details: this.analysisResults
    };

    // Console output
    console.log('\n⚡ PERFORMANCE ANALYSIS REPORT');
    console.log('===============================');
    console.log(`Performance Score: ${report.summary.performanceScore}/100`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Optimization Opportunities: ${report.summary.optimizations}\n`);

    // Category breakdown
    console.log('📈 ISSUE BREAKDOWN:');
    console.log('-------------------');
    Object.entries(report.categories).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`${category}: ${count} issues`);
      }
    });

    // Top optimizations
    if (this.analysisResults.optimizations.length > 0) {
      console.log('\n🚀 OPTIMIZATION OPPORTUNITIES:');
      console.log('------------------------------');
      this.analysisResults.optimizations.forEach((opt, index) => {
        console.log(`${index + 1}. [${opt.priority}] ${opt.title}`);
        console.log(`   ${opt.description}`);
        console.log(`   Expected: ${opt.estimatedImprovement}\n`);
      });
    }

    // Save detailed report
    fs.writeFileSync(
      'performance-analysis-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed report saved to: performance-analysis-report.json');

    return report;
  }
}

// CLI execution
if (require.main === module) {
  const agent = new PerformanceAnalysisAgent();
  agent.analyzePerformance().catch(console.error);
}

module.exports = PerformanceAnalysisAgent;