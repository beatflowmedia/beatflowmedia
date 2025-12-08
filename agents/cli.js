#!/usr/bin/env node

const { Command } = require('commander');
const AgentOrchestrator = require('./core/AgentOrchestrator');
const ScaffoldAgent = require('./core/ScaffoldAgent');
const TestGenAgent = require('./core/TestGenAgent');
const LintTypeAgent = require('./core/LintTypeAgent');
const PRAgent = require('./core/PRAgent');
const DeployAgent = require('./core/DeployAgent');
const SecurityAgent = require('./core/SecurityAgent');
const ParallelExpertResolver = require('./ParallelExpertResolver');
const UIUXExpertAgent = require('./UIUXExpertAgent');
const ContentIngestionAgent = require('./experts/ContentIngestionAgent');
const AnalyticsAgent = require('./experts/AnalyticsAgent');
const DocumentationAgent = require('./experts/DocumentationAgent');
const RecommendationAgent = require('./experts/RecommendationAgent');
const ModerationAgent = require('./experts/ModerationAgent');
const NotificationAgent = require('./experts/NotificationAgent');
const fs = require('fs').promises;
const path = require('path');

/**
 * BeatFlow Agentic CLI - Command-line interface for development automation
 * Provides access to all agentic capabilities with comprehensive workflow management
 */

const program = new Command();

// Global configuration
const globalConfig = {
  logLevel: 'info',
  timeout: 1800000, // 30 minutes
  retries: 3
};

program
  .name('beatflow-agents')
  .description('🤖 BeatFlow Agentic Development Suite - Intelligent automation for React development')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Enable quiet mode')
  .option('--config <path>', 'Path to configuration file')
  .hook('preAction', async (thisCommand) => {
    // Load configuration
    if (thisCommand.opts().config) {
      try {
        const configPath = path.resolve(thisCommand.opts().config);
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        Object.assign(globalConfig, config);
      } catch (error) {
        console.warn('⚠️ Could not load configuration file:', error.message);
      }
    }

    // Set log level
    if (thisCommand.opts().verbose) {
      globalConfig.logLevel = 'debug';
    } else if (thisCommand.opts().quiet) {
      globalConfig.logLevel = 'error';
    }
  });

// Component scaffolding commands
const scaffoldCmd = program
  .command('scaffold')
  .description('🏗️ Generate React components with tests and stories');

scaffoldCmd
  .command('component')
  .description('Generate a new React component')
  .argument('<name>', 'Component name (PascalCase)')
  .option('-t, --type <type>', 'Component type (atom|molecule|organism|page)', 'molecule')
  .option('-l, --libraries <libs>', 'Required libraries (comma-separated)', '')
  .option('--props <props>', 'Component props as JSON string', '{}')
  .option('--no-test', 'Skip test generation')
  .option('--no-story', 'Skip story generation')
  .option('--accessibility', 'Include accessibility features', true)
  .option('--performance', 'Include performance optimizations', true)
  .action(async (name, options) => {
    try {
      console.log(`🏗️ Scaffolding component: ${name}`);

      const agent = new ScaffoldAgent(globalConfig);
      const libraries = options.libraries ? options.libraries.split(',').map(l => l.trim()) : [];
      const props = JSON.parse(options.props);

      const result = await agent.generateComponent({
        name,
        type: options.type.toUpperCase(),
        props,
        libraries,
        accessibility: options.accessibility,
        performance: options.performance
      });

      if (result.success) {
        console.log('✅ Component scaffolded successfully!');
        console.log('📁 Files created:');
        result.files.forEach(file => console.log(`   ${file}`));
        console.log('📊 Metrics:', JSON.stringify(result.metrics, null, 2));
      } else {
        console.error('❌ Scaffolding failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Test generation commands
const testCmd = program
  .command('test')
  .description('🧪 Generate and run comprehensive tests');

testCmd
  .command('generate')
  .description('Generate test suite for component')
  .argument('<componentPath>', 'Path to component file')
  .option('-c, --coverage <target>', 'Target coverage percentage', '90')
  .option('--accessibility', 'Include accessibility tests', true)
  .option('--performance', 'Include performance tests', true)
  .option('--integration', 'Include integration tests', false)
  .action(async (componentPath, options) => {
    try {
      console.log(`🧪 Generating tests for: ${componentPath}`);

      const agent = new TestGenAgent(globalConfig);
      const result = await agent.generateTestSuite(componentPath, {
        coverageTarget: parseInt(options.coverage),
        includeAccessibility: options.accessibility,
        includePerformance: options.performance,
        includeIntegration: options.integration,
        testTypes: ['UNIT', 'INTEGRATION', ...(options.accessibility ? ['ACCESSIBILITY'] : []), ...(options.performance ? ['PERFORMANCE'] : [])]
      });

      if (result.success) {
        console.log('✅ Test suite generated successfully!');
        console.log('📁 Test files:', result.tests);
        console.log('📊 Coverage:', `${result.coverage.percentage}%`);
        console.log('📊 Metrics:', JSON.stringify(result.metrics, null, 2));
      } else {
        console.error('❌ Test generation failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Quality and linting commands
const qualityCmd = program
  .command('quality')
  .description('🧹 Code quality analysis and fixing');

qualityCmd
  .command('check')
  .description('Run comprehensive quality checks')
  .option('-p, --path <path>', 'Target path to analyze', 'src/')
  .option('--fix', 'Apply automatic fixes', true)
  .option('--types', 'Include TypeScript checking', true)
  .option('--security', 'Include security analysis', true)
  .option('--performance', 'Include performance analysis', true)
  .option('--accessibility', 'Include accessibility analysis', true)
  .option('--exit-on-error', 'Exit with error code if issues found', false)
  .action(async (options) => {
    try {
      console.log(`🧹 Running quality check on: ${options.path}`);

      const agent = new LintTypeAgent(globalConfig);
      const result = await agent.runQualityCheck(options.path, {
        autoFix: options.fix,
        includeTypes: options.types,
        includeSecurity: options.security,
        includePerformance: options.performance,
        includeAccessibility: options.accessibility,
        exitOnError: options.exitOnError
      });

      if (result.success) {
        console.log('✅ Quality check completed!');
        console.log('📊 Results:');
        console.log(`   Quality Score: ${result.results.summary?.qualityScore || 0}/100`);
        console.log(`   Issues Found: ${result.results.summary?.totalIssues || 0}`);
        console.log(`   Errors: ${result.results.summary?.totalErrors || 0}`);
        console.log(`   Warnings: ${result.results.summary?.totalWarnings || 0}`);
      } else {
        console.error('❌ Quality check failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Security scanning commands
const securityCmd = program
  .command('security')
  .description('🔒 Security analysis and compliance checking');

securityCmd
  .command('audit')
  .description('Run comprehensive security audit')
  .option('-p, --path <path>', 'Target path to analyze', 'src/')
  .option('--secrets', 'Scan for hardcoded secrets', true)
  .option('--dependencies', 'Audit npm dependencies', true)
  .option('--code-analysis', 'Analyze code for vulnerabilities', true)
  .option('--compliance', 'Check compliance standards', true)
  .option('--auto-fix', 'Apply automatic fixes', true)
  .action(async (options) => {
    try {
      console.log(`🔒 Running security audit on: ${options.path}`);

      const agent = new SecurityAgent(globalConfig);
      const result = await agent.executeSecurityAudit(options.path, {
        includeSecrets: options.secrets,
        includeDependencies: options.dependencies,
        includeCodeAnalysis: options.codeAnalysis,
        includeCompliance: options.compliance,
        autoRemediate: options.autoFix
      });

      if (result.success) {
        console.log('✅ Security audit completed!');
        console.log('📊 Results:');
        console.log(`   Risk Score: ${result.audit.summary.riskScore}/100`);
        console.log(`   Vulnerabilities: ${result.audit.summary.totalVulnerabilities}`);
        console.log(`   High Severity: ${result.audit.summary.highSeverity}`);
        console.log(`   Medium Severity: ${result.audit.summary.mediumSeverity}`);
        console.log(`   Low Severity: ${result.audit.summary.lowSeverity}`);

        if (result.audit.summary.highSeverity > 0) {
          console.error('⚠️ Critical vulnerabilities found! Please review the security report.');
          process.exit(1);
        }
      } else {
        console.error('❌ Security audit failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// PR and Git workflow commands
const prCmd = program
  .command('pr')
  .description('📋 Pull request automation and Git workflows');

prCmd
  .command('create')
  .description('Create pull request with automated workflow')
  .option('-t, --type <type>', 'Change type (feat|fix|docs|style|refactor|perf|test|chore)', 'feat')
  .option('-s, --scope <scope>', 'Change scope')
  .option('-d, --description <desc>', 'Change description', 'Automated changes')
  .option('-b, --branch <branch>', 'Branch name (auto-generated if not provided)')
  .option('--breaking <breaking>', 'Breaking change description')
  .option('--body <body>', 'Additional commit body')
  .option('--files <files>', 'Specific files to include (comma-separated)')
  .option('--reviewers <reviewers>', 'PR reviewers (comma-separated)')
  .option('--assignees <assignees>', 'PR assignees (comma-separated)')
  .option('--draft', 'Create as draft PR', false)
  .action(async (options) => {
    try {
      console.log('📋 Creating pull request...');

      const agent = new PRAgent(globalConfig);
      const changes = {
        type: options.type,
        scope: options.scope,
        description: options.description,
        body: options.body,
        breaking: options.breaking,
        files: options.files ? options.files.split(',').map(f => f.trim()) : undefined
      };

      const result = await agent.executeWorkflow(changes, {
        branchName: options.branch,
        draft: options.draft,
        reviewers: options.reviewers ? options.reviewers.split(',').map(r => r.trim()) : [],
        assignees: options.assignees ? options.assignees.split(',').map(a => a.trim()) : []
      });

      if (result.success) {
        console.log('✅ Pull request created successfully!');
        console.log('🔗 PR URL:', result.workflow.pr.url);
        console.log('🌿 Branch:', result.workflow.branch.name);
        console.log('📊 Metrics:', JSON.stringify(result.metrics, null, 2));
      } else {
        console.error('❌ PR creation failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Deployment commands
const deployCmd = program
  .command('deploy')
  .description('🚀 Automated deployment management');

deployCmd
  .command('preview')
  .description('Deploy preview environment')
  .option('-b, --branch <branch>', 'Source branch', 'main')
  .option('-p, --pr <number>', 'PR number for preview deployment')
  .option('--skip-build', 'Skip build step', false)
  .option('--skip-tests', 'Skip test step', false)
  .action(async (options) => {
    try {
      console.log('🚀 Deploying preview environment...');

      const agent = new DeployAgent(globalConfig);
      const result = await agent.executeDeployment({
        type: 'PREVIEW',
        branch: options.branch,
        prNumber: options.pr ? parseInt(options.pr) : null,
        environment: 'preview',
        skipBuild: options.skipBuild,
        skipTests: options.skipTests
      });

      if (result.success) {
        console.log('✅ Preview deployment successful!');
        console.log('🔗 Deployment URL:', result.deployment.url);
        console.log('⏱️ Duration:', `${Math.round(result.metrics.duration / 1000)}s`);
        console.log('📊 Metrics:', JSON.stringify(result.metrics, null, 2));
      } else {
        console.error('❌ Deployment failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

deployCmd
  .command('production')
  .description('Deploy to production environment')
  .option('-b, --branch <branch>', 'Source branch', 'main')
  .option('--confirm', 'Confirm production deployment', false)
  .action(async (options) => {
    try {
      if (!options.confirm) {
        console.error('❌ Production deployment requires --confirm flag for safety');
        process.exit(1);
      }

      console.log('🚀 Deploying to production...');

      const agent = new DeployAgent(globalConfig);
      const result = await agent.executeDeployment({
        type: 'PRODUCTION',
        branch: options.branch,
        environment: 'production'
      });

      if (result.success) {
        console.log('✅ Production deployment successful!');
        console.log('🔗 Deployment URL:', result.deployment.url);
        console.log('⏱️ Duration:', `${Math.round(result.metrics.duration / 1000)}s`);
      } else {
        console.error('❌ Production deployment failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Workflow orchestration commands
const workflowCmd = program
  .command('workflow')
  .description('🎯 Execute complete development workflows');

workflowCmd
  .command('full-feature')
  .description('Complete feature development workflow')
  .argument('<componentName>', 'Component name')
  .argument('<description>', 'Feature description')
  .option('--type <type>', 'Component type', 'molecule')
  .option('--libraries <libs>', 'Required libraries (comma-separated)', '')
  .option('--props <props>', 'Component props as JSON', '{}')
  .option('--no-pr', 'Skip PR creation')
  .option('--no-deploy', 'Skip deployment')
  .action(async (componentName, description, options) => {
    try {
      console.log(`🎯 Executing full feature workflow for: ${componentName}`);

      const orchestrator = new AgentOrchestrator(globalConfig);
      const result = await orchestrator.executeWorkflow('FULL_FEATURE', {
        componentSpec: {
          name: componentName,
          type: options.type.toUpperCase(),
          props: JSON.parse(options.props),
          libraries: options.libraries ? options.libraries.split(',').map(l => l.trim()) : []
        },
        featureDescription: description,
        createPR: !options.noPr,
        deploy: !options.noDeploy
      });

      if (result.success) {
        console.log('✅ Full feature workflow completed!');
        console.log('📊 Results:', JSON.stringify(result.result, null, 2));
      } else {
        console.error('❌ Workflow failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

workflowCmd
  .command('hotfix')
  .description('Emergency hotfix workflow')
  .argument('<description>', 'Hotfix description')
  .option('--files <files>', 'Files to include (comma-separated)')
  .action(async (description, options) => {
    try {
      console.log(`🚨 Executing hotfix workflow: ${description}`);

      const orchestrator = new AgentOrchestrator(globalConfig);
      const result = await orchestrator.executeWorkflow('HOTFIX', {
        fix: {
          description,
          files: options.files ? options.files.split(',').map(f => f.trim()) : []
        }
      });

      if (result.success) {
        console.log('✅ Hotfix workflow completed!');
        console.log('📊 Results:', JSON.stringify(result.result, null, 2));
      } else {
        console.error('❌ Hotfix workflow failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Expert review commands
const expertCmd = program
  .command('expert')
  .description('🎯 Multi-expert parallel code analysis');

expertCmd
  .command('review')
  .description('Run comprehensive multi-expert analysis')
  .option('-p, --path <path>', 'Target path to analyze', 'src')
  .option('--profile <profile>', 'Analysis profile (quick|comprehensive|security-focused|performance-focused)', 'comprehensive')
  .option('--experts <experts>', 'Experts to run (comma-separated: codeQuality,performance,security)', 'codeQuality,performance,security')
  .option('--format <format>', 'Output format (console|json|markdown|all)', 'console')
  .option('--auto-fix', 'Attempt automatic remediation', false)
  .option('--save', 'Save detailed report', true)
  .option('--exit-on-critical', 'Exit with error code if critical issues found', false)
  .action(async (options) => {
    try {
      console.log(`🎯 Starting parallel expert review (profile: ${options.profile})`);
      console.log(`📂 Target: ${options.path}\n`);

      const resolver = new ParallelExpertResolver({
        outputFormat: options.format,
        enableAutoRemediation: options.autoFix,
        saveReport: options.save,
        ...globalConfig
      });

      await resolver.initialize();

      const result = await resolver.analyzeWithExperts({
        targetPath: options.path,
        profile: options.profile,
        experts: options.experts.split(',').map(e => e.trim())
      });

      // Check for critical issues
      if (options.exitOnCritical && result.summary.criticalIssues > 0) {
        console.error(`\n⚠️ Found ${result.summary.criticalIssues} critical issues!`);
        process.exit(1);
      }

      await resolver.cleanup();

      console.log('\n✅ Expert review completed successfully!');
      console.log(`📊 Composite Score: ${result.metrics.compositeScore}/100`);
      console.log(`📝 View detailed report in agents/reports/`);

    } catch (error) {
      console.error('❌ Expert review failed:', error.message);
      process.exit(1);
    }
  });

expertCmd
  .command('quick')
  .description('Quick security-focused review')
  .option('-p, --path <path>', 'Target path to analyze', 'src')
  .action(async (options) => {
    try {
      console.log(`⚡ Running quick security review on: ${options.path}\n`);

      const resolver = new ParallelExpertResolver({
        outputFormat: 'console',
        saveReport: false,
        ...globalConfig
      });

      await resolver.initialize();

      const result = await resolver.analyzeWithExperts({
        targetPath: options.path,
        profile: 'quick',
        experts: ['security']
      });

      await resolver.cleanup();

      console.log('\n✅ Quick review completed!');
      console.log(`🔒 Security Score: ${result.metrics.securityScore}/100`);

      if (result.summary.criticalIssues > 0) {
        console.error(`\n⚠️ Found ${result.summary.criticalIssues} critical security issues!`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Quick review failed:', error.message);
      process.exit(1);
    }
  });

// UI/UX review commands
const uiuxCmd = program
  .command('uiux')
  .description('🎨 UI/UX design system and accessibility analysis');

uiuxCmd
  .command('review')
  .description('Run comprehensive UI/UX analysis')
  .option('-p, --path <path>', 'Target path to analyze', 'src')
  .option('--profile <profile>', 'Analysis profile (quick|design-focused|accessibility-audit|music-ux|comprehensive|pre-commit)', 'comprehensive')
  .option('--wcag-level <level>', 'WCAG compliance level (A|AA|AAA)', 'AA')
  .option('--format <format>', 'Output format (console|json|markdown)', 'console')
  .option('--auto-fix', 'Attempt automatic remediation', false)
  .option('--save', 'Save detailed report', true)
  .option('--exit-on-critical', 'Exit with error code if critical issues found', false)
  .option('--components', 'Analyze components', true)
  .option('--pages', 'Analyze pages', true)
  .option('--design-system', 'Analyze design system files', true)
  .action(async (options) => {
    try {
      console.log(`🎨 Starting UI/UX review (profile: ${options.profile})`);
      console.log(`📂 Target: ${options.path}`);
      console.log(`♿ WCAG Level: ${options.wcagLevel}\n`);

      const agent = new UIUXExpertAgent({
        wcagLevel: options.wcagLevel,
        autoFixEnabled: options.autoFix,
        ...globalConfig
      });

      await agent.initialize();

      const result = await agent.analyzeDesignSystem({
        targetPath: options.path,
        includeComponents: options.components,
        includePages: options.pages,
        includeDesignSystem: options.designSystem
      });

      // Auto-fix if requested
      if (options.autoFix) {
        console.log('\n🔧 Attempting auto-remediation...');
        const fixResults = await agent.autoFix();
        console.log(`✅ Auto-fixed: ${fixResults.fixed}`);
        console.log(`❌ Failed: ${fixResults.failed}`);
      }

      // Generate report
      if (options.save || options.format !== 'console') {
        await agent.generateReport(options.format);
      }

      // Check for critical issues
      const criticalCount = result.designSystemViolations.filter(v => v.severity === 'CRITICAL').length +
                           result.accessibilityIssues.filter(i => i.severity === 'CRITICAL').length +
                           result.musicUXIssues.filter(i => i.severity === 'CRITICAL').length;

      if (options.exitOnCritical && criticalCount > 0) {
        console.error(`\n⚠️ Found ${criticalCount} critical issues!`);
        process.exit(1);
      }

      await agent.cleanup();

      console.log('\n✅ UI/UX review completed successfully!');
      console.log(`📊 Composite Score: ${result.scores.composite}/100`);
      console.log(`🎨 Design System: ${result.scores.designSystem}/100`);
      console.log(`♿ Accessibility: ${result.scores.accessibility}/100`);
      console.log(`🎵 Music UX: ${result.scores.musicUX}/100`);

    } catch (error) {
      console.error('❌ UI/UX review failed:', error.message);
      process.exit(1);
    }
  });

uiuxCmd
  .command('accessibility')
  .description('Quick accessibility-only audit')
  .option('-p, --path <path>', 'Target path to analyze', 'src')
  .option('--wcag-level <level>', 'WCAG compliance level (A|AA|AAA)', 'AA')
  .action(async (options) => {
    try {
      console.log(`♿ Running accessibility audit (WCAG ${options.wcagLevel}): ${options.path}\n`);

      const agent = new UIUXExpertAgent({
        wcagLevel: options.wcagLevel,
        ...globalConfig
      });

      await agent.initialize();

      const result = await agent.analyzeDesignSystem({
        targetPath: options.path
      });

      await agent.cleanup();

      console.log('\n✅ Accessibility audit completed!');
      console.log(`♿ Accessibility Score: ${result.scores.accessibility}/100`);
      console.log(`📊 Total Issues: ${result.accessibilityIssues.length}`);

      const critical = result.accessibilityIssues.filter(i => i.severity === 'CRITICAL').length;
      if (critical > 0) {
        console.error(`\n⚠️ Found ${critical} critical accessibility issues!`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Accessibility audit failed:', error.message);
      process.exit(1);
    }
  });

uiuxCmd
  .command('design-tokens')
  .description('Validate design token usage')
  .option('-p, --path <path>', 'Target path to analyze', 'src')
  .option('--auto-fix', 'Attempt automatic remediation', false)
  .action(async (options) => {
    try {
      console.log(`🎨 Validating design token usage: ${options.path}\n`);

      const agent = new UIUXExpertAgent({
        designSystemStrict: true,
        autoFixEnabled: options.autoFix,
        ...globalConfig
      });

      await agent.initialize();

      const result = await agent.analyzeDesignSystem({
        targetPath: options.path
      });

      if (options.autoFix) {
        console.log('\n🔧 Attempting auto-remediation...');
        const fixResults = await agent.autoFix();
        console.log(`✅ Auto-fixed: ${fixResults.fixed}`);
        console.log(`❌ Failed: ${fixResults.failed}`);
      }

      await agent.cleanup();

      console.log('\n✅ Design token validation completed!');
      console.log(`🎨 Design System Score: ${result.scores.designSystem}/100`);
      console.log(`📊 Total Violations: ${result.designSystemViolations.length}`);

      const autoRemediable = result.designSystemViolations.filter(v => v.autoRemediable).length;
      console.log(`🔧 Auto-remediable: ${autoRemediable}`);

    } catch (error) {
      console.error('❌ Design token validation failed:', error.message);
      process.exit(1);
    }
  });

// Content Ingestion commands
const ingestCmd = program
  .command('ingest')
  .description('📥 Content ingestion and validation workflow');

ingestCmd
  .command('file')
  .description('Process a single file')
  .argument('<filePath>', 'Path to file')
  .option('--title <title>', 'Content title')
  .option('--artist <artist>', 'Artist name')
  .option('--album <album>', 'Album name')
  .option('--genre <genre>', 'Genre')
  .option('--profile <profile>', 'Ingestion profile (quick|standard|comprehensive|music-focus|video-focus)', 'standard')
  .option('--strict', 'Enable strict mode', false)
  .action(async (filePath, options) => {
    try {
      console.log(`📥 Processing file: ${filePath}\n`);

      // Load workflow profile
      const workflowPath = path.join(__dirname, 'workflows', 'content-ingestion.json');
      const workflow = JSON.parse(await fs.readFile(workflowPath, 'utf8'));
      const profile = workflow.profiles[options.profile] || workflow.profiles.standard;

      console.log(`📋 Using profile: ${profile.name}`);
      console.log(`⏱️ Estimated duration: ${profile.estimatedDuration}\n`);

      const agent = new ContentIngestionAgent({
        ...profile.config,
        strictMode: options.strict || profile.config.strictMode,
        ...globalConfig
      });

      await agent.initialize();

      // Get file stats
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      // Determine MIME type from extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska'
      };

      const fileInfo = {
        filePath: path.resolve(filePath),
        fileName,
        fileSize: stats.size,
        mimeType: mimeTypes[ext] || 'application/octet-stream'
      };

      const metadata = {
        title: options.title,
        artist: options.artist,
        album: options.album,
        genre: options.genre
      };

      const result = await agent.processFile(fileInfo, metadata);

      await agent.cleanup();

      if (result.status === 'validated') {
        console.log('\n✅ File processing completed successfully!');
        console.log(`📋 Session ID: ${result.id}`);
        console.log(`📊 Status: ${result.status}`);
        console.log(`📝 Title: ${result.metadata.title}`);
        console.log(`🎵 Artist: ${result.metadata.artist}`);

        if (result.processingSteps.metadataExtraction.status === 'completed') {
          console.log('\n📊 Extracted Metadata:');
          console.log(`   Format: ${result.metadata.format || 'N/A'}`);
          console.log(`   Duration: ${result.metadata.duration || 'N/A'}`);
          console.log(`   Bitrate: ${result.metadata.bitrate || 'N/A'}`);
        }
      } else {
        console.error('\n❌ File processing failed!');
        console.error(`Status: ${result.status}`);
        console.error(`Error: ${result.error}`);

        if (result.errors.length > 0) {
          console.error('\nErrors:');
          result.errors.forEach(err => {
            console.error(`  - [${err.severity}] ${err.message}`);
          });
        }

        process.exit(1);
      }

    } catch (error) {
      console.error('❌ File processing error:', error.message);
      process.exit(1);
    }
  });

ingestCmd
  .command('batch')
  .description('Process multiple files')
  .argument('<directory>', 'Directory containing files')
  .option('--pattern <pattern>', 'File pattern (glob)', '**/*.{mp3,wav,flac,aac,mp4,mov}')
  .option('--profile <profile>', 'Ingestion profile', 'standard')
  .option('--strict', 'Enable strict mode', false)
  .option('--limit <number>', 'Maximum files to process', '100')
  .action(async (directory, options) => {
    try {
      console.log(`📥 Batch processing files from: ${directory}\n`);

      const glob = require('glob').glob;
      const files = await glob(options.pattern, { cwd: directory });
      const limitedFiles = files.slice(0, parseInt(options.limit));

      console.log(`📁 Found ${files.length} files (processing ${limitedFiles.length})\n`);

      // Load workflow profile
      const workflowPath = path.join(__dirname, 'workflows', 'content-ingestion.json');
      const workflow = JSON.parse(await fs.readFile(workflowPath, 'utf8'));
      const profile = workflow.profiles[options.profile] || workflow.profiles.standard;

      const agent = new ContentIngestionAgent({
        ...profile.config,
        strictMode: options.strict || profile.config.strictMode,
        ...globalConfig
      });

      await agent.initialize();

      const fileInfos = await Promise.all(limitedFiles.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        const ext = path.extname(file).toLowerCase();

        const mimeTypes = {
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.flac': 'audio/flac',
          '.aac': 'audio/aac',
          '.m4a': 'audio/mp4',
          '.ogg': 'audio/ogg',
          '.mp4': 'video/mp4',
          '.mov': 'video/quicktime',
          '.avi': 'video/x-msvideo',
          '.mkv': 'video/x-matroska'
        };

        return {
          filePath,
          fileName: path.basename(file),
          fileSize: stats.size,
          mimeType: mimeTypes[ext] || 'application/octet-stream'
        };
      }));

      const result = await agent.processBatch(fileInfos);

      await agent.cleanup();

      console.log('\n✅ Batch processing completed!');
      console.log(`📊 Total Files: ${result.totalFiles}`);
      console.log(`✅ Successful: ${result.successful}`);
      console.log(`❌ Failed: ${result.failed}`);
      console.log(`📝 View detailed report in agents/reports/`);

    } catch (error) {
      console.error('❌ Batch processing error:', error.message);
      process.exit(1);
    }
  });

ingestCmd
  .command('validate')
  .description('Validate file without full processing')
  .argument('<filePath>', 'Path to file')
  .option('--strict', 'Enable strict mode', false)
  .action(async (filePath, options) => {
    try {
      console.log(`✓ Validating file: ${filePath}\n`);

      const AudioFileValidator = require('./core/AudioFileValidator');
      const validator = new AudioFileValidator({
        strictMode: options.strict,
        requireMinBitrate: true
      });

      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();

      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska'
      };

      const result = await validator.validateFile({
        filePath: path.resolve(filePath),
        fileName,
        fileSize: stats.size,
        mimeType: mimeTypes[ext] || 'application/octet-stream'
      });

      if (result.passed) {
        console.log('✅ Validation passed!');
        console.log(`📊 Format: ${result.details.format?.extensions?.join(', ')}`);
        console.log(`📊 Size: ${result.details.sizeCheck?.sizeInMB} MB`);

        if (result.warnings.length > 0) {
          console.log('\n⚠️ Warnings:');
          result.warnings.forEach(warn => {
            console.log(`  - [${warn.severity}] ${warn.message}`);
          });
        }
      } else {
        console.error('\n❌ Validation failed!');
        result.errors.forEach(err => {
          console.error(`  - [${err.severity}] ${err.message}`);
        });
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Validation error:', error.message);
      process.exit(1);
    }
  });

ingestCmd
  .command('formats')
  .description('List supported file formats')
  .action(async () => {
    try {
      const AudioFileValidator = require('./core/AudioFileValidator');
      const validator = new AudioFileValidator();
      const formats = validator.getSupportedFormats();

      console.log('📁 Supported File Formats\n');

      console.log('🎵 Audio Formats:');
      formats.audio.forEach(format => {
        console.log(`   ${format.extensions.join(', ')} - Max size: ${format.maxSizeMB}MB`);
      });

      console.log('\n🎬 Video Formats:');
      formats.video.forEach(format => {
        console.log(`   ${format.extensions.join(', ')} - Max size: ${format.maxSizeMB}MB`);
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

ingestCmd
  .command('profiles')
  .description('List available ingestion profiles')
  .action(async () => {
    try {
      const workflowPath = path.join(__dirname, 'workflows', 'content-ingestion.json');
      const workflow = JSON.parse(await fs.readFile(workflowPath, 'utf8'));

      console.log('📋 Available Ingestion Profiles\n');

      Object.entries(workflow.profiles).forEach(([key, profile]) => {
        console.log(`${key}:`);
        console.log(`  Name: ${profile.name}`);
        console.log(`  Description: ${profile.description}`);
        console.log(`  Duration: ${profile.estimatedDuration}`);
        console.log(`  Stages: ${profile.stages.join(', ')}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Analytics commands
const analyticsCmd = program
  .command('analytics')
  .description('📈 Analytics collection, processing, and reporting');

analyticsCmd
  .command('analyze')
  .description('Analyze analytics data')
  .option('--source <source>', 'Data source (file|mock)', 'mock')
  .option('--file <path>', 'Path to analytics data file')
  .option('--focus <focus>', 'Analysis focus (playback|engagement|performance|revenue|all)', 'all')
  .option('--format <format>', 'Output format (json|markdown|csv)', 'json')
  .option('--save', 'Save report to file', true)
  .action(async (options) => {
    try {
      console.log(`📈 Analyzing analytics data...\n`);
      console.log(`📊 Focus: ${options.focus}`);
      console.log(`📁 Source: ${options.source}\n`);

      const agent = new AnalyticsAgent({
        enableCompliance: true,
        trackPlaybackQuality: true,
        trackEngagement: true,
        trackPerformance: true,
        trackRevenue: true,
        enableAnomalyDetection: true,
        ...globalConfig
      });

      await agent.initialize();

      const analysisOptions = {
        source: options.source,
        sourcePath: options.file,
        focus: options.focus
      };

      const results = await agent.analyze(analysisOptions);

      if (results.status === 'completed') {
        console.log('✅ Analysis completed successfully!\n');

        console.log('📊 Metrics Summary:');
        console.log(`   Events Analyzed: ${results.eventsAnalyzed}`);
        console.log(`   Insights: ${results.insights.length}`);
        console.log(`   Recommendations: ${results.recommendations.length}`);
        console.log(`   Alerts: ${results.alerts.length}`);

        if (results.alerts.length > 0) {
          console.log('\n🚨 Alerts:');
          results.alerts.forEach(alert => {
            console.log(`   [${alert.severity}] ${alert.message}`);
          });
        }

        if (options.save) {
          const reportPath = await agent.saveReport(results, options.format);
          console.log(`\n📝 Report saved: ${reportPath}`);
        } else {
          const report = await agent.generateReport(results, options.format);
          console.log(`\n${report}`);
        }
      } else {
        console.error('❌ Analysis failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Analytics analysis error:', error.message);
      process.exit(1);
    }
  });

analyticsCmd
  .command('metrics')
  .description('View current metrics summary')
  .action(async () => {
    try {
      console.log('📊 Current Analytics Metrics\n');

      const MetricsCollector = require('./core/MetricsCollector');
      const collector = new MetricsCollector();

      // Generate sample data
      console.log('Generating sample metrics...\n');

      const summary = collector.getMetricsSummary();

      console.log('Collection:');
      console.log(`  Events Collected: ${summary.collection.eventsCollected}`);
      console.log(`  Events Processed: ${summary.collection.eventsProcessed}`);
      console.log(`  Error Rate: ${summary.collection.errorRate}`);

      console.log('\nPlayback:');
      console.log(`  Total Plays: ${summary.playback.totalPlays}`);
      console.log(`  Unique Tracks: ${summary.playback.uniqueTracks}`);
      console.log(`  Average Completion: ${summary.playback.averageCompletion}`);

      console.log('\nEngagement:');
      console.log(`  Total Sessions: ${summary.engagement.totalSessions}`);
      console.log(`  Active Users: ${summary.engagement.activeUsers}`);
      console.log(`  Total Likes: ${summary.engagement.totalLikes}`);

      console.log('\nRevenue:');
      console.log(`  Total Royalties: $${summary.revenue.totalRoyalties}`);
      console.log(`  Track Count: ${summary.revenue.trackCount}`);
      console.log(`  Artist Count: ${summary.revenue.artistCount}`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Documentation commands
const docsCmd = program
  .command('docs')
  .description('📚 Generate project documentation');

docsCmd
  .command('generate')
  .description('Generate documentation')
  .option('--target <path>', 'Target path to document', 'src')
  .option('--type <type>', 'Documentation type (readme|api|component|changelog|all)', 'readme')
  .option('--output <path>', 'Output directory', './docs')
  .action(async (options) => {
    try {
      console.log(`📚 Generating ${options.type} documentation...\n`);

      const agent = new DocumentationAgent({
        generateReadme: true,
        generateApiDocs: true,
        generateComponentDocs: true,
        includeExamples: true,
        ...globalConfig
      });

      await agent.initialize();

      const results = await agent.generateDocumentation({
        target: options.target,
        type: options.type,
        output: options.output
      });

      if (results.status === 'completed') {
        console.log('✅ Documentation generated successfully!\n');
        console.log(`📊 Files Generated: ${results.filesGenerated.length}`);

        console.log('\n📝 Generated Files:');
        results.filesGenerated.forEach(file => {
          console.log(`   [${file.type}] ${file.path}`);
        });

        await agent.saveReport(results);
      } else {
        console.error('❌ Documentation generation failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Documentation error:', error.message);
      process.exit(1);
    }
  });

docsCmd
  .command('readme')
  .description('Generate README.md from project analysis')
  .option('--target <path>', 'Target directory', '.')
  .action(async (options) => {
    try {
      console.log('📚 Generating README.md...\n');

      const agent = new DocumentationAgent(globalConfig);
      await agent.initialize();

      const results = await agent.generateDocumentation({
        target: options.target,
        type: 'readme',
        output: '.'
      });

      if (results.status === 'completed') {
        console.log('✅ README.md generated successfully!');
        console.log(`📄 Location: ${results.filesGenerated[0].path}`);
      } else {
        console.error('❌ Failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

docsCmd
  .command('changelog')
  .description('Generate CHANGELOG.md from git history')
  .option('--output <path>', 'Output directory', '.')
  .action(async (options) => {
    try {
      console.log('📚 Generating CHANGELOG.md...\n');

      const agent = new DocumentationAgent(globalConfig);
      await agent.initialize();

      const results = await agent.generateDocumentation({
        target: '.',
        type: 'changelog',
        output: options.output
      });

      if (results.status === 'completed') {
        console.log('✅ CHANGELOG.md generated successfully!');
        console.log(`📄 Location: ${results.filesGenerated[0].path}`);
      } else {
        console.error('❌ Failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// ==========================================
// Recommendation Commands
// ==========================================

const recommendCmd = program
  .command('recommend')
  .description('📊 Generate personalized content recommendations');

recommendCmd
  .command('generate')
  .description('Generate recommendations for a user')
  .requiredOption('--user-id <userId>', 'User ID to generate recommendations for')
  .option('--context <context>', 'Context (home|search|playlist|artist)', 'home')
  .option('--limit <limit>', 'Number of recommendations', '20')
  .option('--algorithm <algorithm>', 'Algorithm (collaborative|content-based|hybrid)', 'hybrid')
  .action(async (options) => {
    try {
      console.log(`📊 Generating recommendations for user ${options.userId}...\n`);

      const agent = new RecommendationAgent({
        ...globalConfig,
        algorithm: options.algorithm
      });
      await agent.initialize();

      const results = await agent.generateRecommendations({
        userId: options.userId,
        context: options.context,
        limit: parseInt(options.limit)
      });

      if (results.status === 'completed') {
        console.log('✅ Recommendations generated successfully!\n');
        console.log(`📊 Total: ${results.recommendations.length}`);
        console.log(`🎯 Diversity Score: ${(results.metadata.diversityScore * 100).toFixed(1)}%\n`);

        console.log('Top 5 Recommendations:');
        results.recommendations.slice(0, 5).forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec.title} by ${rec.artist}`);
          console.log(`     Score: ${rec.score.toFixed(2)} | ${rec.reason}`);
        });

        await agent.saveReport(results);
      } else {
        console.error('❌ Failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

recommendCmd
  .command('track')
  .description('Track recommendation interaction')
  .requiredOption('--user-id <userId>', 'User ID')
  .requiredOption('--track-id <trackId>', 'Track ID')
  .requiredOption('--interaction <type>', 'Interaction type (click|play|complete)')
  .action(async (options) => {
    try {
      const agent = new RecommendationAgent(globalConfig);
      await agent.initialize();

      await agent.trackInteraction(
        options.userId,
        options.trackId,
        options.interaction
      );

      console.log(`✅ Tracked ${options.interaction} interaction`);
      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// ==========================================
// Moderation Commands
// ==========================================

const moderateCmd = program
  .command('moderate')
  .description('🛡️ Content moderation and compliance checking');

moderateCmd
  .command('review')
  .description('Moderate content item')
  .requiredOption('--content-id <id>', 'Content ID to review')
  .option('--content-type <type>', 'Content type (track|album|playlist|user)', 'track')
  .option('--strict', 'Enable strict mode')
  .action(async (options) => {
    try {
      console.log(`🛡️ Moderating ${options.contentType}: ${options.contentId}...\n`);

      const agent = new ModerationAgent({
        ...globalConfig,
        strictMode: options.strict || false
      });
      await agent.initialize();

      // Mock content for demonstration
      const mockContent = {
        id: options.contentId,
        title: 'Sample Track',
        artist: 'Sample Artist',
        genre: 'Pop',
        copyrightOwner: 'Rights Holder Inc.',
        licenseType: 'Standard License',
        territories: ['US', 'GB', 'DE']
      };

      const results = await agent.moderateContent({
        contentType: options.contentType,
        content: mockContent,
        submittedBy: 'user123'
      });

      if (results.status === 'completed') {
        console.log(`✅ Moderation completed!\n`);
        console.log(`📊 Decision: ${results.decision.toUpperCase()}`);
        console.log(`🎯 Confidence: ${(results.confidence * 100).toFixed(1)}%`);
        console.log(`👤 Review Required: ${results.reviewRequired ? 'Yes' : 'No'}\n`);

        if (results.violations.length > 0) {
          console.log(`⚠️  Violations (${results.violations.length}):`);
          results.violations.forEach(v => {
            console.log(`  - [${v.severity}] ${v.message}`);
          });
          console.log();
        }

        if (results.flags.length > 0) {
          console.log(`🚩 Flags (${results.flags.length}):`);
          results.flags.forEach(f => {
            console.log(`  - [${f.severity}] ${f.message}`);
          });
          console.log();
        }

        await agent.saveReport(results);
      } else {
        console.error('❌ Failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// ==========================================
// Notification Commands
// ==========================================

const notifyCmd = program
  .command('notify')
  .description('🔔 Send notifications and alerts');

notifyCmd
  .command('send')
  .description('Send notification to user(s)')
  .requiredOption('--recipient <userId>', 'User ID or comma-separated list')
  .requiredOption('--title <title>', 'Notification title')
  .requiredOption('--message <message>', 'Notification message')
  .option('--type <type>', 'Type (alert|update|promotional|system)', 'update')
  .option('--category <category>', 'Category (playback|content|account|revenue)', 'content')
  .option('--priority <priority>', 'Priority (high|normal|low)', 'normal')
  .option('--channels <channels>', 'Channels (email,sms,push,inApp)', 'email,push,inApp')
  .action(async (options) => {
    try {
      const recipients = options.recipient.split(',').map(r => r.trim());
      const channels = options.channels.split(',').map(c => c.trim());

      console.log(`🔔 Sending notification to ${recipients.length} recipient(s)...\n`);

      const agent = new NotificationAgent(globalConfig);
      await agent.initialize();

      const results = await agent.sendNotification({
        recipients,
        type: options.type,
        category: options.category,
        title: options.title,
        message: options.message,
        priority: options.priority,
        channels
      });

      if (results.status === 'completed' || results.status === 'partial') {
        console.log('✅ Notification sent!\n');
        console.log(`📊 Recipients: ${results.recipients.length}`);
        console.log(`📡 Channels: ${results.channels.join(', ')}\n`);

        console.log('Delivery Status:');
        for (const [channel, delivery] of Object.entries(results.delivery)) {
          if (results.channels.includes(channel)) {
            console.log(`  ${channel}: ${delivery.delivered ? '✅' : '❌'}`);
          }
        }

        if (results.errors.length > 0) {
          console.log(`\n⚠️ Errors: ${results.errors.length}`);
        }

        await agent.saveReport(results);
      } else {
        console.error('❌ Failed:', results.error);
        process.exit(1);
      }

      await agent.cleanup();

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Status and monitoring commands
const statusCmd = program
  .command('status')
  .description('📊 View system status and metrics');

statusCmd
  .command('overview')
  .description('Show overall system status')
  .action(async () => {
    try {
      const orchestrator = new AgentOrchestrator(globalConfig);
      const status = orchestrator.getStatus();

      console.log('📊 BeatFlow Agentic Suite Status\n');
      console.log(`Active Workflows: ${status.activeWorkflows}`);
      console.log(`Total Workflows: ${status.totalWorkflows}`);
      console.log(`Success Rate: ${status.successRate.toFixed(1)}%`);
      console.log(`Average Duration: ${Math.round(status.averageDuration / 1000)}s`);

      if (Object.keys(status.agentUsage).length > 0) {
        console.log('\n🤖 Agent Usage:');
        Object.entries(status.agentUsage).forEach(([agent, count]) => {
          console.log(`   ${agent}: ${count} executions`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

statusCmd
  .command('history')
  .description('Show workflow execution history')
  .option('-l, --limit <number>', 'Number of workflows to show', '10')
  .action(async (options) => {
    try {
      const orchestrator = new AgentOrchestrator(globalConfig);
      const history = orchestrator.getWorkflowHistory(parseInt(options.limit));

      console.log(`📜 Recent Workflow History (${history.length} workflows)\n`);

      history.forEach((workflow, index) => {
        const duration = workflow.duration ? `${Math.round(workflow.duration / 1000)}s` : 'N/A';
        const status = workflow.status === 'completed' ? '✅' : '❌';

        console.log(`${index + 1}. ${status} ${workflow.type} (${workflow.id})`);
        console.log(`   Duration: ${duration}`);
        console.log(`   Started: ${new Date(workflow.startTime).toLocaleString()}`);
        if (workflow.error) {
          console.log(`   Error: ${workflow.error}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Configuration commands
program
  .command('config')
  .description('⚙️ Manage configuration')
  .option('--init', 'Initialize configuration file')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    try {
      if (options.init) {
        const defaultConfig = {
          logLevel: 'info',
          timeout: 1800000,
          retries: 3,
          scaffold: {
            componentsDir: 'src/components',
            designTokens: {
              spacing: [0, 4, 8, 16, 32, 64],
              colors: {
                primary: '#1976d2',
                secondary: '#dc004e'
              }
            }
          },
          test: {
            coverageThreshold: 90,
            accessibilityTesting: true,
            performanceTesting: true
          },
          lint: {
            autoFix: true,
            enforceSecurity: true
          },
          pr: {
            defaultBranch: 'main',
            signCommits: true
          },
          deploy: {
            platform: 'netlify',
            buildDir: 'build'
          },
          security: {
            complianceStandards: ['OWASP', 'GDPR', 'SOC2']
          }
        };

        await fs.writeFile('beatflow-agents.config.json', JSON.stringify(defaultConfig, null, 2));
        console.log('✅ Configuration file created: beatflow-agents.config.json');
      } else if (options.show) {
        console.log('⚙️ Current Configuration:');
        console.log(JSON.stringify(globalConfig, null, 2));
      } else {
        console.log('Use --init to create a configuration file or --show to view current settings');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Help command with examples
program
  .command('examples')
  .description('📖 Show usage examples')
  .action(() => {
    console.log(`
📖 BeatFlow Agentic Suite - Usage Examples

🏗️ Component Scaffolding:
   beatflow-agents scaffold component MyButton --type atom --libraries @mui/material
   beatflow-agents scaffold component DataChart --libraries recharts --props '{"data": {"type": "array", "required": true}}'

🧪 Test Generation:
   beatflow-agents test generate src/components/MyButton/MyButton.js --coverage 95
   beatflow-agents test generate src/components/DataChart.js --accessibility --performance

🧹 Quality Checks:
   beatflow-agents quality check --fix --security --performance
   beatflow-agents quality check --path src/components --exit-on-error

🔒 Security Audits:
   beatflow-agents security audit --auto-fix
   beatflow-agents security audit --path src --compliance

📋 Pull Requests:
   beatflow-agents pr create --type feat --description "Add new data visualization component"
   beatflow-agents pr create --type fix --scope auth --description "Fix login validation" --reviewers john,jane

🚀 Deployments:
   beatflow-agents deploy preview --branch feature/new-charts --pr 123
   beatflow-agents deploy production --confirm

🎯 Complete Workflows:
   beatflow-agents workflow full-feature MyChart "Interactive chart component" --libraries recharts
   beatflow-agents workflow hotfix "Fix critical auth bug" --files src/auth/login.js

🎯 Expert Reviews:
   beatflow-agents expert review --profile comprehensive
   beatflow-agents expert review --path src/components --format markdown --save
   beatflow-agents expert quick --path src
   beatflow-agents expert review --profile security-focused --exit-on-critical

🎨 UI/UX Analysis:
   beatflow-agents uiux review --profile comprehensive
   beatflow-agents uiux review --path src/components --wcag-level AAA --auto-fix
   beatflow-agents uiux accessibility --path src
   beatflow-agents uiux design-tokens --auto-fix

📥 Content Ingestion:
   beatflow-agents ingest file song.mp3 --title "My Song" --artist "Artist Name"
   beatflow-agents ingest file video.mp4 --profile comprehensive
   beatflow-agents ingest batch ./uploads --profile music-focus
   beatflow-agents ingest validate song.mp3 --strict
   beatflow-agents ingest formats
   beatflow-agents ingest profiles

📈 Analytics:
   beatflow-agents analytics analyze --focus all
   beatflow-agents analytics analyze --focus playback --format markdown
   beatflow-agents analytics analyze --source file --file ./data/events.json
   beatflow-agents analytics metrics

📚 Documentation:
   beatflow-agents docs generate --type readme
   beatflow-agents docs generate --type all --output ./docs
   beatflow-agents docs readme
   beatflow-agents docs changelog

📊 Status & Monitoring:
   beatflow-agents status overview
   beatflow-agents status history --limit 20

⚙️ Configuration:
   beatflow-agents config --init
   beatflow-agents config --show

🤖 All commands support:
   --verbose    Enable detailed logging
   --quiet      Suppress non-error output
   --config     Use custom configuration file

For more information, visit: https://github.com/BeatFlowMedia/music-license-app
`);
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}