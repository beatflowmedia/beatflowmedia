# 🎯 Parallel Expert Resolver System

> Multi-expert parallel code analysis with intelligent consensus generation and conflict resolution

## Overview

The **Parallel Expert Resolver** is an advanced code analysis system that coordinates multiple specialized expert agents to analyze your codebase from different perspectives simultaneously. It then synthesizes their findings into comprehensive, prioritized, and actionable recommendations.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                  ParallelExpertResolver                      │
│                    (Main Orchestrator)                       │
└──────────────┬──────────────────────────────────┬────────────┘
               │                                  │
       ┌───────▼──────────┐           ┌──────────▼─────────┐
       │  Expert Agents   │           │ Consensus Engine   │
       │   (Parallel)     │           │  (Synthesizer)     │
       └───────┬──────────┘           └──────────┬─────────┘
               │                                  │
       ┌───────┴──────────┐                      │
       │                  │                      │
   ┌───▼───┐  ┌──────▼───────┐  ┌──────▼────────▼──────┐
   │ Code  │  │ Performance  │  │ Security Audit  │
   │Quality│  │  Analysis    │  │     Agent       │
   │Review │  │    Agent     │  │                 │
   └───────┘  └──────────────┘  └─────────────────┘
```

### Expert Agents

1. **CodeQualityReviewAgent**
   - Code complexity analysis
   - Anti-pattern detection
   - Best practices compliance
   - Code smell identification
   - Maintainability scoring

2. **PerformanceAnalysisAgent**
   - Bundle size optimization
   - React performance anti-patterns
   - Memory leak detection
   - Re-render analysis
   - Algorithmic complexity
   - Database query optimization

3. **SecurityAuditAgent**
   - Authentication vulnerabilities
   - Data exposure risks
   - XSS prevention
   - Sensitive data detection
   - API security assessment
   - Firebase security rules audit

### ExpertConsensusEngine

The consensus engine synthesizes findings from all expert agents:

- **Issue Normalization**: Converts expert-specific findings to unified format
- **Deduplication**: Removes duplicate issues found by multiple experts
- **Conflict Resolution**: Resolves competing recommendations (e.g., performance vs security)
- **Priority Scoring**: Calculates weighted priority scores based on severity, impact, and expert weights
- **Recommendation Generation**: Creates actionable recommendations grouped by category
- **Roadmap Creation**: Organizes recommendations into immediate, short-term, medium-term, and long-term actions

## Features

### 🚀 Parallel Execution
- All expert agents run simultaneously
- 60-70% faster than sequential analysis
- Efficient resource utilization

### 🤝 Intelligent Consensus
- Weighted expert opinions based on domain priority
- Automatic conflict resolution
- Cross-expert validation

### 📊 Comprehensive Reporting
- Console output with color-coded priorities
- JSON export for CI/CD integration
- Markdown reports for documentation
- HTML reports (coming soon)

### 🔧 Auto-Remediation
- Quick-win automatic fixes
- Safe transformations only
- Configurable remediation types

### 🎯 Flexible Profiles
- **Quick**: Fast security-focused scan
- **Comprehensive**: Full multi-expert analysis
- **Security-Focused**: Deep security audit
- **Performance-Focused**: Performance optimization analysis
- **Pre-Commit**: Fast checks with auto-fix
- **CI-Pipeline**: Complete pipeline validation

## Installation

The Parallel Expert Resolver is included in the BeatFlow Agentic Suite:

```bash
npm install @beatflowmedia/agentic-suite
# or
yarn add @beatflowmedia/agentic-suite
```

## Usage

### CLI Usage

#### Comprehensive Review
```bash
# Run full multi-expert analysis
npx beatflow-agents expert review --profile comprehensive

# Analyze specific path
npx beatflow-agents expert review --path src/components

# Output to markdown
npx beatflow-agents expert review --format markdown

# With auto-remediation
npx beatflow-agents expert review --auto-fix

# Security-focused analysis
npx beatflow-agents expert review --profile security-focused

# Exit on critical issues (for CI/CD)
npx beatflow-agents expert review --exit-on-critical
```

#### Quick Security Scan
```bash
# Fast security-only scan
npx beatflow-agents expert quick

# Specific path
npx beatflow-agents expert quick --path src/auth
```

### Programmatic Usage

```javascript
const { ParallelExpertResolver } = require('@beatflowmedia/agentic-suite');

async function analyzeCode() {
  const resolver = new ParallelExpertResolver({
    outputFormat: 'json',
    enableAutoRemediation: false,
    saveReport: true
  });

  await resolver.initialize();

  const result = await resolver.analyzeWithExperts({
    targetPath: 'src',
    profile: 'comprehensive',
    experts: ['codeQuality', 'performance', 'security']
  });

  console.log('Composite Score:', result.metrics.compositeScore);
  console.log('Critical Issues:', result.summary.criticalIssues);
  console.log('Recommendations:', result.recommendations.length);

  await resolver.cleanup();

  return result;
}
```

### Integration with AgentOrchestrator

```javascript
const { AgentOrchestrator } = require('@beatflowmedia/agentic-suite');

async function runExpertReview() {
  const orchestrator = new AgentOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.expertReviewWorkflow({
    targetPath: 'src',
    profile: 'comprehensive',
    autoRemediation: false
  });

  console.log('Review passed:', result.passed.overall);
  console.log('Recommendations:', result.recommendations);

  await orchestrator.cleanup();
}
```

## Configuration

### Default Configuration

Located in `agents/config/default.json`:

```json
{
  "expertResolver": {
    "enableParallelExecution": true,
    "enableConsensusGeneration": true,
    "enableAutoRemediation": false,
    "enableConflictResolution": true,
    "maxConcurrentExperts": 3,
    "outputFormat": "console",
    "saveReport": true,
    "expertWeights": {
      "security": 35,
      "quality": 30,
      "performance": 25,
      "maintainability": 10
    },
    "thresholds": {
      "compositeScore": 70,
      "securityScore": 80,
      "qualityScore": 75,
      "performanceScore": 70,
      "criticalIssues": 0,
      "highPriorityIssues": 5
    },
    "autoRemediationThreshold": 8,
    "maxRecommendations": 20
  }
}
```

### Custom Configuration

Create a custom config file:

```javascript
const resolver = new ParallelExpertResolver({
  // Expert weights (must sum to 100)
  expertWeights: {
    security: 50,      // Prioritize security
    quality: 25,
    performance: 20,
    maintainability: 5
  },

  // Thresholds for pass/fail
  thresholds: {
    compositeScore: 80,
    securityScore: 90,
    criticalIssues: 0
  },

  // Auto-remediation settings
  enableAutoRemediation: true,
  autoRemediationThreshold: 8,

  // Output settings
  outputFormat: 'all',  // console, json, markdown, all
  saveReport: true
});
```

## Analysis Profiles

### Quick Profile
- **Experts**: Security only
- **Timeout**: 5 minutes
- **Use Case**: Pre-commit hooks, quick checks
- **Speed**: ⚡⚡⚡

### Comprehensive Profile
- **Experts**: Code Quality, Performance, Security
- **Timeout**: 30 minutes
- **Use Case**: Regular code reviews, PR checks
- **Speed**: ⚡⚡

### Security-Focused Profile
- **Experts**: Security, Code Quality
- **Expert Weights**: Security 60%, Quality 30%, Performance 10%
- **Use Case**: Security audits, compliance checks
- **Speed**: ⚡⚡

### Performance-Focused Profile
- **Experts**: Performance, Code Quality
- **Expert Weights**: Performance 50%, Quality 30%, Security 20%
- **Use Case**: Performance optimization, bottleneck analysis
- **Speed**: ⚡⚡

### Pre-Commit Profile
- **Experts**: Code Quality, Security
- **Auto-Remediation**: Enabled
- **Timeout**: 5 minutes
- **Use Case**: Git pre-commit hooks
- **Speed**: ⚡⚡⚡

### CI-Pipeline Profile
- **Experts**: All three
- **Fail on Critical**: True
- **Generate Artifacts**: True
- **Use Case**: CI/CD pipelines, gating deployments
- **Speed**: ⚡

## Output Formats

### Console Output

```
================================================================================
🎯 PARALLEL EXPERT RESOLVER - COMPREHENSIVE ANALYSIS REPORT
================================================================================

📊 Analysis Summary
   Target: src
   Execution Time: 45.23s
   Parallel Efficiency: 62.5%
   Experts: codeQuality, performance, security

⭐ Overall Scores
   Composite Score: 78/100
   Security: 85/100
   Quality: 75/100
   Performance: 72/100

🔍 Issues Detected
   Total Issues: 127
   Unique Issues: 89 (38 duplicates removed)
   Critical: 3
   High Priority: 15
   Conflicts Resolved: 5

🗺️  Action Roadmap
   Immediate (Critical): 3 items
   Short Term (High): 15 items
   Medium Term: 28 items
   Long Term: 43 items
   Quick Wins: 12 items

🎯 Top Priority Recommendations

1. [CRITICAL] Fix Memory Leaks
   Found 3 memoryLeaks issues, including 3 critical
   Issues: 3 | Effort: high | Impact: high
   Files: src/components/Dashboard.js, src/hooks/useDataFetch.js...
   Actions:
     - Add cleanup functions to useEffect hooks
     - Unsubscribe from event listeners and subscriptions
     - Clear timers and intervals
```

### JSON Output

```json
{
  "meta": {
    "timestamp": "2025-01-07T10:30:00.000Z",
    "targetPath": "src",
    "executionTime": "45.23s",
    "parallelEfficiency": "62.5%"
  },
  "summary": {
    "compositeScore": 78,
    "totalIssues": 127,
    "uniqueIssues": 89,
    "criticalIssues": 3,
    "conflictsResolved": 5
  },
  "metrics": {
    "compositeScore": 78,
    "securityScore": 85,
    "qualityScore": 75,
    "performanceScore": 72
  },
  "recommendations": [...],
  "roadmap": {...},
  "conflicts": [...]
}
```

### Markdown Output

See generated markdown reports in `agents/reports/expert-analysis-*.md`

## Consensus Algorithm

### 1. Issue Normalization
All issues from different experts are converted to a unified format:

```javascript
{
  id: "unique-issue-id",
  expert: "security",
  category: "authVulnerabilities",
  type: "INSECURE_TOKEN_STORAGE",
  severity: "HIGH",
  file: "src/auth/login.js",
  message: "JWT tokens stored in localStorage",
  recommendation: "Use httpOnly cookies",
  impact: "high",
  effort: "medium",
  autoRemediable: false
}
```

### 2. Deduplication
Similar issues from multiple experts are merged:
- Same file + same type + similar message = duplicate
- Multiple expert agreement increases severity
- Recommendations are combined

### 3. Conflict Resolution

**Performance vs Security**
```
If security.severity === 'CRITICAL':
  Prioritize security over performance
```

**Quality vs Performance**
```
If performance.type === 'MEMORY_LEAK':
  Prioritize performance over code quality
```

### 4. Priority Scoring

```javascript
priorityScore = (
  baseScore *
  expertWeight *
  severityMultiplier *
  sourceMultiplier
) / 100

where:
  baseScore = 1-10 based on issue type
  expertWeight = from configuration (35 for security)
  severityMultiplier = CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1
  sourceMultiplier = 1 + (number_of_experts_agreeing * 0.2)
```

### 5. Recommendation Generation

Issues are grouped by category and top issues per category become recommendations:
- Top 5 issues per category
- Estimated effort and impact
- Action items for remediation
- Quick wins identified

## Expert Weights

Configure how much influence each expert has on the final composite score:

```javascript
{
  security: 35,        // 35% weight (highest)
  quality: 30,         // 30% weight
  performance: 25,     // 25% weight
  maintainability: 10  // 10% weight
}
```

**Use Cases:**
- **Security-First**: `{ security: 60, quality: 25, performance: 15 }`
- **Balanced**: `{ security: 30, quality: 30, performance: 30, maintainability: 10 }`
- **Performance-First**: `{ security: 20, quality: 25, performance: 50, maintainability: 5 }`

## Metrics

### Execution Metrics
- **Total Duration**: Wall clock time for entire analysis
- **Expert Durations**: Time taken by each expert
- **Parallel Efficiency**: How much faster parallel vs sequential

### Analysis Metrics
- **Composite Score**: Weighted average of all expert scores (0-100)
- **Security Score**: Security audit score (0-100)
- **Quality Score**: Code quality score (0-100)
- **Performance Score**: Performance analysis score (0-100)

### Issue Metrics
- **Total Issues**: Raw count before deduplication
- **Unique Issues**: After deduplication
- **Duplicates Removed**: Issues found by multiple experts
- **Critical Issues**: Severity = CRITICAL
- **High Priority Issues**: Severity = HIGH
- **Conflicts Resolved**: Number of expert conflicts resolved

## CI/CD Integration

### GitHub Actions

```yaml
name: Expert Code Review

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  expert-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm install

      - name: Run Expert Review
        run: |
          npx beatflow-agents expert review \
            --profile ci-pipeline \
            --format json \
            --exit-on-critical

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: expert-analysis-report
          path: agents/reports/*.json
```

### Pre-Commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running expert review..."
npx beatflow-agents expert quick --auto-fix

if [ $? -ne 0 ]; then
  echo "❌ Expert review failed! Please fix critical issues before committing."
  exit 1
fi

echo "✅ Expert review passed!"
exit 0
```

## Examples

### Example 1: Basic Analysis

```bash
npx beatflow-agents expert review
```

Output:
- Composite Score: 78/100
- 89 unique issues found
- 3 critical, 15 high priority
- Detailed console report

### Example 2: Security Audit

```bash
npx beatflow-agents expert review --profile security-focused --exit-on-critical
```

Output:
- Deep security analysis
- Exits with error code if critical vulnerabilities found
- Suitable for CI/CD gating

### Example 3: Performance Optimization

```bash
npx beatflow-agents expert review --profile performance-focused --format markdown
```

Output:
- Performance-focused analysis
- Markdown report saved to `agents/reports/`
- Actionable performance recommendations

### Example 4: Pre-Commit Quick Check

```bash
npx beatflow-agents expert quick --auto-fix
```

Output:
- Fast security scan (~30 seconds)
- Auto-fixes simple issues
- Perfect for pre-commit hooks

## Troubleshooting

### Issue: Analysis takes too long
**Solution**: Use a faster profile or analyze specific directories
```bash
npx beatflow-agents expert quick --path src/components
```

### Issue: Too many issues reported
**Solution**: Focus on critical/high priority only
```bash
npx beatflow-agents expert review --exit-on-critical
```

### Issue: Memory issues with large codebases
**Solution**: Increase Node.js memory limit
```bash
NODE_OPTIONS=--max-old-space-size=4096 npx beatflow-agents expert review
```

### Issue: Conflicting recommendations
**Solution**: Check the conflicts section in the report
```bash
npx beatflow-agents expert review --format json
# Check report.conflicts for details
```

## Roadmap

- [ ] HTML report generation with interactive charts
- [ ] Visual Studio Code extension
- [ ] IDE integration (JetBrains, Sublime)
- [ ] Custom expert agent plugins
- [ ] Machine learning-based priority scoring
- [ ] Historical trend analysis
- [ ] Team collaboration features
- [ ] Slack/Discord notifications
- [ ] SonarQube integration
- [ ] SARIF format export

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to the Parallel Expert Resolver.

## License

MIT License - see [LICENSE](../LICENSE)

---

**Generated with [Claude Code](https://claude.ai/code)**

Co-Authored-By: Claude <noreply@anthropic.com>
