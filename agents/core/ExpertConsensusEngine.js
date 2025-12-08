/**
 * ExpertConsensusEngine - Intelligent Recommendation Synthesis
 *
 * Synthesizes findings from multiple expert agents to produce
 * prioritized, actionable recommendations with conflict resolution.
 *
 * Features:
 * - Weighted scoring for different expert domains
 * - Intelligent conflict resolution
 * - Priority-based recommendation ranking
 * - Impact analysis and estimation
 * - Deduplication and consolidation
 */

class ExpertConsensusEngine {
  constructor(config = {}) {
    this.config = {
      // Expert weights (sum should equal 100)
      expertWeights: {
        security: 35,        // Security has highest priority
        quality: 30,         // Code quality second
        performance: 25,     // Performance third
        maintainability: 10  // Maintainability fourth
      },

      // Severity impact multipliers
      severityMultipliers: {
        CRITICAL: 10,
        HIGH: 5,
        MEDIUM: 2,
        LOW: 1
      },

      // Threshold for auto-remediation
      autoRemediationThreshold: 8, // Score out of 10

      // Maximum recommendations to return
      maxRecommendations: 20,

      // Enable conflict resolution
      resolveConflicts: true,

      ...config
    };

    // Track conflicts detected during analysis
    this.conflicts = [];

    // Track deduplication statistics
    this.deduplicationStats = {
      totalIssues: 0,
      uniqueIssues: 0,
      duplicatesRemoved: 0
    };
  }

  /**
   * Main consensus generation method
   *
   * @param {Object} expertResults - Results from all expert agents
   * @returns {Object} Consensus recommendations and analysis
   */
  async generateConsensus(expertResults) {
    const {
      codeQuality = {},
      performance = {},
      security = {},
      uiux = {}
    } = expertResults;

    // Step 1: Extract and normalize all issues
    const normalizedIssues = this.normalizeIssues({
      codeQuality,
      performance,
      security,
      uiux
    });

    // Step 2: Deduplicate similar issues
    const uniqueIssues = this.deduplicateIssues(normalizedIssues);

    // Step 3: Detect and resolve conflicts
    const resolvedIssues = this.config.resolveConflicts
      ? this.resolveConflicts(uniqueIssues)
      : uniqueIssues;

    // Step 4: Calculate priority scores
    const scoredIssues = this.calculatePriorityScores(resolvedIssues);

    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations(scoredIssues);

    // Step 6: Create action roadmap
    const roadmap = this.createActionRoadmap(recommendations);

    // Step 7: Calculate overall metrics
    const metrics = this.calculateMetrics({
      codeQuality,
      performance,
      security,
      recommendations
    });

    return {
      summary: {
        totalIssues: normalizedIssues.length,
        uniqueIssues: uniqueIssues.length,
        criticalIssues: scoredIssues.filter(i => i.severity === 'CRITICAL').length,
        highPriorityIssues: scoredIssues.filter(i => i.severity === 'HIGH').length,
        conflictsResolved: this.conflicts.length,
        autoRemediationCandidates: recommendations.filter(r => r.autoRemediable).length
      },
      metrics,
      recommendations,
      roadmap,
      conflicts: this.conflicts,
      deduplicationStats: this.deduplicationStats,
      expertScores: {
        security: security.securityScore || 0,
        quality: codeQuality.maintainabilityScore || 0,
        performance: performance.performanceScore || 0,
        uiux: uiux?.scores?.composite || 0
      }
    };
  }

  /**
   * Normalize issues from different expert formats into unified structure
   */
  normalizeIssues(expertResults) {
    const issues = [];

    // Track total issues before deduplication
    let totalCount = 0;

    // Normalize code quality issues
    if (expertResults.codeQuality) {
      const cq = expertResults.codeQuality;

      // Complexity issues
      if (cq.complexityIssues) {
        cq.complexityIssues.forEach(issue => {
          totalCount++;
          issues.push(this.normalizeIssue(issue, 'quality', 'complexity'));
        });
      }

      // Anti-patterns
      if (cq.antiPatterns) {
        cq.antiPatterns.forEach(issue => {
          totalCount++;
          issues.push(this.normalizeIssue(issue, 'quality', 'anti-pattern'));
        });
      }

      // Code smells
      if (cq.codeSmells) {
        cq.codeSmells.forEach(issue => {
          totalCount++;
          issues.push(this.normalizeIssue(issue, 'quality', 'code-smell'));
        });
      }

      // Best practice violations
      if (cq.bestPracticeViolations) {
        cq.bestPracticeViolations.forEach(issue => {
          totalCount++;
          issues.push(this.normalizeIssue(issue, 'quality', 'best-practice'));
        });
      }
    }

    // Normalize performance issues
    if (expertResults.performance) {
      const perf = expertResults.performance;

      const perfCategories = [
        'bundleIssues', 'reactPerformance', 'memoryLeaks',
        'rerenderIssues', 'algorithmicIssues', 'databaseIssues'
      ];

      perfCategories.forEach(category => {
        if (perf[category]) {
          perf[category].forEach(issue => {
            totalCount++;
            issues.push(this.normalizeIssue(issue, 'performance', category));
          });
        }
      });
    }

    // Normalize security issues
    if (expertResults.security) {
      const sec = expertResults.security;

      const secCategories = [
        'authVulnerabilities', 'dataExposureRisks', 'xssVulnerabilities',
        'sensitiveDataLeaks', 'apiSecurityIssues', 'firebaseSecurityIssues',
        'dependencyVulnerabilities'
      ];

      secCategories.forEach(category => {
        if (sec[category]) {
          sec[category].forEach(issue => {
            totalCount++;
            issues.push(this.normalizeIssue(issue, 'security', category));
          });
        }
      });
    }

    this.deduplicationStats.totalIssues = totalCount;

    return issues;
  }

  /**
   * Normalize individual issue to standard format
   */
  normalizeIssue(issue, expertDomain, category) {
    return {
      id: this.generateIssueId(issue, expertDomain, category),
      expert: expertDomain,
      category: category,
      type: issue.type,
      severity: issue.severity || 'MEDIUM',
      file: issue.file || issue.filePath || 'unknown',
      line: issue.line || issue.lineNumber || 0,
      message: issue.message || issue.description || '',
      recommendation: issue.recommendation || issue.suggestion || '',
      impact: issue.impact || this.estimateImpact(issue),
      effort: this.estimateEffort(issue),
      autoRemediable: this.canAutoRemediate(issue),
      metadata: {
        ...issue,
        originalExpert: expertDomain,
        originalCategory: category
      }
    };
  }

  /**
   * Generate unique ID for an issue
   */
  generateIssueId(issue, expert, category) {
    const key = `${expert}-${category}-${issue.type}-${issue.file || 'global'}`;
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  /**
   * Deduplicate similar issues from different experts
   */
  deduplicateIssues(issues) {
    const uniqueMap = new Map();

    issues.forEach(issue => {
      // Create similarity key based on file, type, and message similarity
      const similarityKey = this.createSimilarityKey(issue);

      if (uniqueMap.has(similarityKey)) {
        // Issue is duplicate - merge with existing
        const existing = uniqueMap.get(similarityKey);
        this.mergeIssues(existing, issue);
        this.deduplicationStats.duplicatesRemoved++;
      } else {
        // New unique issue
        uniqueMap.set(similarityKey, { ...issue, sources: [issue.expert] });
      }
    });

    const uniqueIssues = Array.from(uniqueMap.values());
    this.deduplicationStats.uniqueIssues = uniqueIssues.length;

    return uniqueIssues;
  }

  /**
   * Create similarity key for issue deduplication
   */
  createSimilarityKey(issue) {
    const normalizedFile = (issue.file || '').toLowerCase().replace(/\\/g, '/');
    const normalizedType = (issue.type || '').toLowerCase();
    const normalizedMessage = (issue.message || '').toLowerCase().substring(0, 50);

    return `${normalizedFile}::${normalizedType}::${normalizedMessage}`;
  }

  /**
   * Merge duplicate issues
   */
  mergeIssues(existing, duplicate) {
    // Track that multiple experts found this issue
    if (!existing.sources.includes(duplicate.expert)) {
      existing.sources.push(duplicate.expert);
    }

    // Increase severity if multiple experts agree
    if (duplicate.severity === 'CRITICAL' && existing.severity !== 'CRITICAL') {
      existing.severity = 'CRITICAL';
    } else if (duplicate.severity === 'HIGH' && existing.severity === 'MEDIUM') {
      existing.severity = 'HIGH';
    }

    // Combine recommendations
    if (duplicate.recommendation && !existing.recommendation.includes(duplicate.recommendation)) {
      existing.recommendation += ` | ${duplicate.recommendation}`;
    }
  }

  /**
   * Resolve conflicting recommendations
   */
  resolveConflicts(issues) {
    const conflictPatterns = [
      {
        // Performance vs Security conflict
        pattern: (i1, i2) =>
          i1.expert === 'performance' &&
          i2.expert === 'security' &&
          i1.file === i2.file,
        resolver: (i1, i2) => this.resolvePerformanceVsSecurityConflict(i1, i2)
      },
      {
        // Quality vs Performance conflict
        pattern: (i1, i2) =>
          i1.expert === 'quality' &&
          i2.expert === 'performance' &&
          i1.file === i2.file,
        resolver: (i1, i2) => this.resolveQualityVsPerformanceConflict(i1, i2)
      }
    ];

    const resolvedIssues = [...issues];

    // Check for conflicts
    for (let i = 0; i < resolvedIssues.length; i++) {
      for (let j = i + 1; j < resolvedIssues.length; j++) {
        const issue1 = resolvedIssues[i];
        const issue2 = resolvedIssues[j];

        conflictPatterns.forEach(({ pattern, resolver }) => {
          if (pattern(issue1, issue2)) {
            const resolution = resolver(issue1, issue2);

            if (resolution) {
              this.conflicts.push({
                issue1: issue1.id,
                issue2: issue2.id,
                type: resolution.type,
                resolution: resolution.decision,
                rationale: resolution.rationale
              });

              // Apply resolution
              if (resolution.modify) {
                Object.assign(issue1, resolution.modify.issue1 || {});
                Object.assign(issue2, resolution.modify.issue2 || {});
              }
            }
          }
        });
      }
    }

    return resolvedIssues;
  }

  /**
   * Resolve performance vs security conflicts
   */
  resolvePerformanceVsSecurityConflict(perfIssue, secIssue) {
    // Security generally takes precedence over performance
    if (secIssue.severity === 'CRITICAL' || secIssue.severity === 'HIGH') {
      return {
        type: 'performance-vs-security',
        decision: 'prioritize-security',
        rationale: 'Security vulnerabilities take precedence over performance optimizations',
        modify: {
          issue2: { priority: 10 }, // Boost security priority
          issue1: { priority: 5 }   // Lower performance priority
        }
      };
    }

    return null;
  }

  /**
   * Resolve quality vs performance conflicts
   */
  resolveQualityVsPerformanceConflict(qualityIssue, perfIssue) {
    // Balance quality and performance based on severity
    if (perfIssue.type === 'MEMORY_LEAK' || perfIssue.type === 'N_PLUS_ONE_QUERIES') {
      return {
        type: 'quality-vs-performance',
        decision: 'prioritize-performance',
        rationale: 'Critical performance issues (memory leaks, N+1) take precedence',
        modify: {
          issue2: { priority: 9 },
          issue1: { priority: 6 }
        }
      };
    }

    return null;
  }

  /**
   * Calculate priority scores for all issues
   */
  calculatePriorityScores(issues) {
    return issues.map(issue => {
      const baseScore = this.calculateBaseScore(issue);
      const expertWeight = this.getExpertWeight(issue.expert);
      const severityMultiplier = this.config.severityMultipliers[issue.severity] || 1;
      const sourceMultiplier = issue.sources ? 1 + (issue.sources.length * 0.2) : 1;

      const priorityScore = (baseScore * expertWeight * severityMultiplier * sourceMultiplier) / 100;

      return {
        ...issue,
        priorityScore: Math.min(priorityScore, 10), // Cap at 10
        priority: this.getPriorityLevel(priorityScore)
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Calculate base score for an issue
   */
  calculateBaseScore(issue) {
    let score = 5; // Base score

    // Increase for certain types
    const criticalTypes = ['MEMORY_LEAK', 'HARDCODED_CREDENTIALS', 'SQL_INJECTION', 'XSS'];
    if (criticalTypes.includes(issue.type)) {
      score += 3;
    }

    // Increase for auto-remediable issues (quick wins)
    if (issue.autoRemediable) {
      score += 1;
    }

    // Increase for high impact
    if (issue.impact === 'high') {
      score += 2;
    }

    return Math.min(score, 10);
  }

  /**
   * Get expert weight from configuration
   */
  getExpertWeight(expert) {
    const mapping = {
      security: this.config.expertWeights.security,
      performance: this.config.expertWeights.performance,
      quality: this.config.expertWeights.quality + this.config.expertWeights.maintainability
    };

    return mapping[expert] || 20;
  }

  /**
   * Convert numeric priority to level
   */
  getPriorityLevel(score) {
    if (score >= 8) return 'CRITICAL';
    if (score >= 6) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate actionable recommendations from scored issues
   */
  generateRecommendations(scoredIssues) {
    const recommendations = [];
    const grouped = this.groupIssuesByCategory(scoredIssues);

    Object.entries(grouped).forEach(([category, issues]) => {
      if (issues.length === 0) return;

      const topIssues = issues.slice(0, 5); // Top 5 per category
      const avgPriority = issues.reduce((sum, i) => sum + i.priorityScore, 0) / issues.length;

      recommendations.push({
        category: this.formatCategoryName(category),
        priority: this.getPriorityLevel(avgPriority),
        issueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'CRITICAL').length,
        title: this.generateRecommendationTitle(category, issues),
        description: this.generateRecommendationDescription(category, issues),
        actions: this.generateActionItems(topIssues),
        estimatedEffort: this.estimateTotalEffort(issues),
        estimatedImpact: this.estimateTotalImpact(issues),
        autoRemediable: issues.every(i => i.autoRemediable),
        files: [...new Set(issues.map(i => i.file).filter(f => f !== 'unknown'))],
        issues: topIssues.map(i => ({
          type: i.type,
          severity: i.severity,
          file: i.file,
          message: i.message,
          recommendation: i.recommendation
        }))
      });
    });

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, this.config.maxRecommendations);
  }

  /**
   * Group issues by category
   */
  groupIssuesByCategory(issues) {
    return issues.reduce((groups, issue) => {
      const key = `${issue.expert}-${issue.category}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
      return groups;
    }, {});
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate recommendation title
   */
  generateRecommendationTitle(category, issues) {
    const titles = {
      'security-authVulnerabilities': 'Strengthen Authentication Security',
      'security-dataExposureRisks': 'Protect Sensitive Data',
      'security-xssVulnerabilities': 'Prevent Cross-Site Scripting',
      'performance-memoryLeaks': 'Fix Memory Leaks',
      'performance-bundleIssues': 'Optimize Bundle Size',
      'quality-complexity': 'Reduce Code Complexity',
      'quality-anti-pattern': 'Refactor Anti-Patterns'
    };

    return titles[category] || `Address ${this.formatCategoryName(category)} Issues`;
  }

  /**
   * Generate recommendation description
   */
  generateRecommendationDescription(category, issues) {
    const count = issues.length;
    const critical = issues.filter(i => i.severity === 'CRITICAL').length;

    let desc = `Found ${count} ${category} issue${count !== 1 ? 's' : ''}`;
    if (critical > 0) {
      desc += `, including ${critical} critical`;
    }

    return desc;
  }

  /**
   * Generate action items from issues
   */
  generateActionItems(issues) {
    return issues
      .slice(0, 5)
      .map(issue => ({
        action: issue.recommendation || `Fix ${issue.type}`,
        file: issue.file,
        priority: issue.priority,
        autoRemediable: issue.autoRemediable
      }));
  }

  /**
   * Estimate total effort for issues
   */
  estimateTotalEffort(issues) {
    const effortMap = { low: 1, medium: 3, high: 5 };
    const total = issues.reduce((sum, i) => sum + (effortMap[i.effort] || 3), 0);

    if (total < 10) return 'low';
    if (total < 30) return 'medium';
    return 'high';
  }

  /**
   * Estimate total impact
   */
  estimateTotalImpact(issues) {
    const critical = issues.filter(i => i.severity === 'CRITICAL').length;
    const high = issues.filter(i => i.severity === 'HIGH').length;

    if (critical > 0) return 'high';
    if (high > 3) return 'high';
    if (high > 0) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort for individual issue
   */
  estimateEffort(issue) {
    // Auto-remediable issues are low effort
    if (this.canAutoRemediate(issue)) return 'low';

    // Large refactoring issues are high effort
    const highEffortTypes = ['GOD_COMPONENT', 'NESTED_LOOPS', 'CALLBACK_HELL'];
    if (highEffortTypes.includes(issue.type)) return 'high';

    return 'medium';
  }

  /**
   * Estimate impact of issue
   */
  estimateImpact(issue) {
    if (issue.severity === 'CRITICAL') return 'high';
    if (issue.severity === 'HIGH') return 'high';
    if (issue.severity === 'MEDIUM') return 'medium';
    return 'low';
  }

  /**
   * Check if issue can be auto-remediated
   */
  canAutoRemediate(issue) {
    const autoRemediableTypes = [
      'UNUSED_IMPORTS',
      'MISSING_SEMICOLON',
      'FORMATTING',
      'CONSOLE_LOGS',
      'COMMENTED_OUT_CODE'
    ];

    return autoRemediableTypes.includes(issue.type);
  }

  /**
   * Create action roadmap
   */
  createActionRoadmap(recommendations) {
    return {
      immediate: recommendations.filter(r => r.priority === 'CRITICAL'),
      shortTerm: recommendations.filter(r => r.priority === 'HIGH'),
      mediumTerm: recommendations.filter(r => r.priority === 'MEDIUM'),
      longTerm: recommendations.filter(r => r.priority === 'LOW'),
      quickWins: recommendations.filter(r => r.autoRemediable && r.estimatedEffort === 'low')
    };
  }

  /**
   * Calculate overall metrics
   */
  calculateMetrics(data) {
    const { codeQuality, performance, security, recommendations } = data;

    // Calculate composite score
    const securityScore = security.securityScore || 0;
    const qualityScore = codeQuality.maintainabilityScore || 0;
    const performanceScore = performance.performanceScore || 0;

    const compositeScore = (
      securityScore * (this.config.expertWeights.security / 100) +
      qualityScore * (this.config.expertWeights.quality / 100) +
      performanceScore * (this.config.expertWeights.performance / 100)
    );

    return {
      compositeScore: Math.round(compositeScore),
      securityScore: Math.round(securityScore),
      qualityScore: Math.round(qualityScore),
      performanceScore: Math.round(performanceScore),
      criticalIssues: recommendations.filter(r => r.priority === 'CRITICAL').length,
      highPriorityIssues: recommendations.filter(r => r.priority === 'HIGH').length,
      totalRecommendations: recommendations.length,
      autoRemediablePct: Math.round(
        (recommendations.filter(r => r.autoRemediable).length / recommendations.length) * 100
      )
    };
  }
}

module.exports = ExpertConsensusEngine;
