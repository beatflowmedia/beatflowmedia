# 🤖 BeatFlow Agentic Suite

[![Version](https://img.shields.io/npm/v/@beatflowmedia/agentic-suite.svg)](https://www.npmjs.com/package/@beatflowmedia/agentic-suite)
[![License](https://img.shields.io/npm/l/@beatflowmedia/agentic-suite.svg)](https://github.com/BeatFlowMedia/music-license-app/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/BeatFlowMedia/music-license-app/Agentic%20CI%20Pipeline)](https://github.com/BeatFlowMedia/music-license-app/actions)

Intelligent agentic automation suite for React development with comprehensive workflow management. Accelerate development cycles with AI-powered agents that handle scaffolding, testing, quality assurance, security, and deployment.

## 🌟 Features

### 🏗️ **ScaffoldAgent** - Intelligent Component Generation
- **React Components** with Material-UI, react-beautiful-dnd, and recharts integration
- **Automatic Test Generation** with Jest + React Testing Library
- **Storybook Stories** with interactive controls and variants
- **TypeScript Definitions** with proper type safety
- **Performance Optimization** with React.memo and useMemo
- **Accessibility Compliance** with ARIA attributes and keyboard navigation

### 🧪 **TestGenAgent** - Comprehensive Test Generation
- **High Coverage Testing** (90%+ target) with intelligent test case generation
- **Accessibility Testing** with jest-axe integration
- **Performance Testing** with render time and memory usage validation
- **Integration Testing** with component interaction scenarios
- **Edge Case Testing** with null/undefined props and error boundaries
- **Mock Generation** for APIs, hooks, and external dependencies

### 🧹 **LintTypeAgent** - Code Quality & Type Checking
- **ESLint Integration** with auto-fixing and custom rules
- **TypeScript Checking** with comprehensive type validation
- **Prettier Formatting** with consistent code style
- **Security Scanning** for vulnerabilities and code injection
- **Performance Analysis** with anti-pattern detection
- **Accessibility Auditing** with WCAG compliance checking

### 📋 **PRAgent** - Git Workflow Automation
- **Branch Management** with semantic naming conventions
- **Conventional Commits** with automated message generation
- **PR Creation** with comprehensive templates and checklists
- **Code Review Automation** with intelligent reviewer assignment
- **CI/CD Integration** with automated checks and deployment triggers
- **Conflict Resolution** with merge assistance and guidance

### 🚀 **DeployAgent** - Automated Deployment
- **Multi-Platform Support** (Netlify, Vercel, GitHub Pages)
- **Environment Management** with automated variable configuration
- **Preview Deployments** with PR integration and status updates
- **Production Deployments** with safety checks and rollback capabilities
- **Performance Monitoring** with Lighthouse CI and Web Vitals
- **Auto-Cleanup** with ephemeral environment management

### 🔒 **SecurityAgent** - Security & Compliance
- **Secret Scanning** with pattern detection and remediation
- **Dependency Auditing** with vulnerability assessment and fixes
- **Code Analysis** with OWASP Top 10 compliance checking
- **GDPR & SOC2 Compliance** with automated policy enforcement
- **Access Control** with permission validation and audit trails
- **Encryption Validation** with data protection compliance

### 🎯 **AgentOrchestrator** - Workflow Management
- **Multi-Agent Coordination** with intelligent task distribution
- **Error Handling & Recovery** with automatic retry mechanisms
- **Performance Monitoring** with real-time metrics and alerts
- **Workflow Persistence** with state management and resumption
- **Resource Management** with concurrent execution limits
- **Audit Logging** with comprehensive activity tracking

## 🚀 Quick Start

### Installation

```bash
npm install @beatflowmedia/agentic-suite
# or
yarn add @beatflowmedia/agentic-suite
```

### Basic Usage

```javascript
const { createAgenticSuite } = require('@beatflowmedia/agentic-suite');

// Initialize the suite
const suite = createAgenticSuite({
  logLevel: 'info',
  timeout: 1800000
});

// Generate a complete component with tests
await suite.generateFeature({
  name: 'DataChart',
  type: 'MOLECULE',
  props: {
    data: { type: 'array', required: true },
    width: { type: 'number', default: 400 },
    height: { type: 'number', default: 300 }
  },
  libraries: ['recharts', '@mui/material']
}, 'Interactive data visualization component');
```

### CLI Usage

```bash
# Initialize configuration
npx beatflow-agents config --init

# Generate a component with tests and stories
npx beatflow-agents scaffold component DataChart --libraries recharts --props '{"data": {"type": "array", "required": true}}'

# Run comprehensive quality check
npx beatflow-agents quality check --fix --security --performance

# Create PR with automated workflow
npx beatflow-agents pr create --type feat --description "Add data visualization component"

# Deploy to preview environment
npx beatflow-agents deploy preview --branch feature/data-charts

# Execute complete feature workflow
npx beatflow-agents workflow full-feature DataChart "Interactive chart component" --libraries recharts
```

## 📖 Detailed Documentation

### Component Scaffolding

The ScaffoldAgent generates production-ready React components with comprehensive tooling:

```javascript
const { ScaffoldAgent } = require('@beatflowmedia/agentic-suite');

const agent = new ScaffoldAgent({
  componentsDir: 'src/components',
  designTokens: {
    colors: { primary: '#1976d2' },
    spacing: [0, 4, 8, 16, 32]
  }
});

const result = await agent.generateComponent({
  name: 'InteractiveButton',
  type: 'ATOM',
  props: {
    variant: { type: 'string', default: 'contained' },
    onClick: { type: 'func', required: true },
    disabled: { type: 'boolean', default: false }
  },
  libraries: ['@mui/material'],
  accessibility: true,
  performance: true
});

// Generated files:
// - src/components/InteractiveButton/InteractiveButton.js
// - src/components/InteractiveButton/InteractiveButton.stories.js
// - src/components/InteractiveButton/InteractiveButton.test.js
// - src/components/InteractiveButton/InteractiveButton.types.js
```

### Test Generation

The TestGenAgent creates comprehensive test suites with high coverage:

```javascript
const { TestGenAgent } = require('@beatflowmedia/agentic-suite');

const agent = new TestGenAgent({
  coverageThreshold: 95,
  accessibilityTesting: true,
  performanceTesting: true
});

const result = await agent.generateTestSuite(
  'src/components/InteractiveButton/InteractiveButton.js',
  {
    testTypes: ['UNIT', 'INTEGRATION', 'ACCESSIBILITY', 'PERFORMANCE'],
    coverageTarget: 95
  }
);

// Generated comprehensive tests with:
// - Rendering tests with various props
// - User interaction tests with userEvent
// - Accessibility tests with jest-axe
// - Performance tests with render timing
// - Error boundary and edge case tests
```

### Quality Assurance

The LintTypeAgent ensures code quality and security:

```javascript
const { LintTypeAgent } = require('@beatflowmedia/agentic-suite');

const agent = new LintTypeAgent({
  autoFix: true,
  enforceSecurity: true,
  performanceCheck: true
});

const result = await agent.runQualityCheck('src/', {
  includeTypes: true,
  includeSecurity: true,
  includePerformance: true,
  includeAccessibility: true
});

// Quality report with:
// - ESLint issues and auto-fixes
// - TypeScript type errors
// - Security vulnerabilities
// - Performance recommendations
// - Accessibility violations
```

### Workflow Orchestration

The AgentOrchestrator manages complex development workflows:

```javascript
const { AgentOrchestrator } = require('@beatflowmedia/agentic-suite');

const orchestrator = new AgentOrchestrator({
  workflowTimeout: 1800000,
  maxConcurrentWorkflows: 3,
  retryAttempts: 3
});

// Execute complete feature development workflow
const result = await orchestrator.executeWorkflow('FULL_FEATURE', {
  componentSpec: {
    name: 'DataDashboard',
    type: 'ORGANISM',
    libraries: ['recharts', 'react-beautiful-dnd']
  },
  featureDescription: 'Interactive analytics dashboard',
  createPR: true,
  deploy: true
});

// Workflow includes:
// 1. Component scaffolding with design system integration
// 2. Comprehensive test generation
// 3. Code quality and security analysis
// 4. PR creation with automated workflow
// 5. Preview deployment with monitoring
```

## 🔧 Configuration

### Configuration File

Create `beatflow-agents.config.json`:

```json
{
  "logLevel": "info",
  "timeout": 1800000,
  "retries": 3,

  "scaffold": {
    "componentsDir": "src/components",
    "designTokens": {
      "colors": {
        "primary": "#1976d2",
        "secondary": "#dc004e"
      },
      "spacing": [0, 4, 8, 16, 32, 64]
    }
  },

  "test": {
    "coverageThreshold": 90,
    "accessibilityTesting": true,
    "performanceTesting": true
  },

  "lint": {
    "autoFix": true,
    "enforceSecurity": true,
    "performanceCheck": true
  },

  "pr": {
    "defaultBranch": "main",
    "signCommits": true,
    "enforceConventionalCommits": true
  },

  "deploy": {
    "platform": "netlify",
    "autoCleanup": true
  },

  "security": {
    "complianceStandards": ["OWASP", "GDPR", "SOC2"],
    "autoRemediation": true
  }
}
```

### Environment Variables

```bash
# Required for deployment
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id

# Optional for enhanced features
GITHUB_TOKEN=your_github_token
SONAR_TOKEN=your_sonar_token
```

## 🔄 CI/CD Integration

### GitHub Actions Integration

The suite integrates seamlessly with GitHub Actions:

```yaml
name: Agentic CI/CD Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security Audit
        run: npx beatflow-agents security audit --auto-fix

  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Quality Check
        run: npx beatflow-agents quality check --fix

  deploy:
    runs-on: ubuntu-latest
    needs: [security-audit, quality-check]
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: npx beatflow-agents deploy preview
```

## 📊 Monitoring & Analytics

### Success Metrics

The agentic suite tracks key performance indicators:

- **mean_time_to_pr_open_by_agents_minutes**: ≤20 minutes
- **developer_cycle_time_reduction_pct**: ≥30% improvement
- **code_quality_score**: ≥90/100
- **security_compliance_score**: ≥95/100
- **test_coverage_percentage**: ≥90%
- **deployment_success_rate**: ≥99%

### Real-time Monitoring

```javascript
// Get current system status
const status = suite.getStatus();
console.log(`Active workflows: ${status.activeWorkflows}`);
console.log(`Success rate: ${status.successRate}%`);

// Get workflow history
const history = suite.getHistory(10);
history.forEach(workflow => {
  console.log(`${workflow.type}: ${workflow.status} (${workflow.duration}ms)`);
});

// Get detailed metrics
const metrics = await suite.getMetrics();
console.log('Performance metrics:', metrics);
```

## 🛡️ Security & Compliance

### Security Features

- **Secret Detection**: Automated scanning for hardcoded credentials
- **Dependency Auditing**: Continuous monitoring of npm vulnerabilities
- **Code Analysis**: Static analysis for security vulnerabilities
- **Compliance Checking**: OWASP, GDPR, SOC2 compliance validation
- **Access Control**: Role-based permissions and audit trails
- **Signed Commits**: GPG signature validation and enforcement

### Compliance Standards

- **OWASP Top 10**: Web application security compliance
- **GDPR**: Data protection and privacy compliance
- **SOC2 Type II**: Security and availability controls
- **PCI DSS**: Payment card industry security standards

## 🚨 Error Handling & Recovery

### Automatic Recovery

The suite includes comprehensive error handling:

- **Retry Mechanisms**: Automatic retry with exponential backoff
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Continue operation with reduced functionality
- **State Persistence**: Resume workflows after interruption
- **Rollback Capabilities**: Automatic rollback on deployment failures

### Monitoring & Alerts

- **Real-time Monitoring**: Health checks and performance metrics
- **Alert System**: Notifications for critical failures
- **Audit Logging**: Comprehensive activity tracking
- **Performance Analysis**: Resource usage and bottleneck detection

## 📈 Performance Optimization

### Optimization Features

- **Concurrent Execution**: Parallel workflow processing
- **Resource Management**: Memory and CPU usage optimization
- **Caching**: Intelligent caching of build artifacts and dependencies
- **Bundle Analysis**: Automated bundle size optimization
- **Performance Budgets**: Automated performance regression detection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/BeatFlowMedia/music-license-app.git
cd music-license-app/agents

# Install dependencies
npm install

# Run tests
npm test

# Run validation
npm run validate

# Start development
npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent development platform
- **Jest & Testing Library** for comprehensive testing capabilities
- **Material-UI** for the design system foundation
- **Netlify** for seamless deployment platform
- **GitHub** for workflow automation and CI/CD

## 🔗 Links

- [Documentation](https://github.com/BeatFlowMedia/music-license-app/tree/main/agents/docs)
- [API Reference](https://github.com/BeatFlowMedia/music-license-app/tree/main/agents/docs/api)
- [Examples](https://github.com/BeatFlowMedia/music-license-app/tree/main/agents/examples)
- [Changelog](CHANGELOG.md)
- [Roadmap](https://github.com/BeatFlowMedia/music-license-app/projects)

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**

Co-Authored-By: Claude <noreply@anthropic.com>