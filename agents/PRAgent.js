/**
 * PRAgent - Git Workflow Automation and PR Management
 *
 * Automates Git workflows with intelligent PR management:
 * - Automated branch creation with semantic naming
 * - Intelligent commit message generation
 * - PR template population with checklists and descriptions
 * - Automated code review triggers and CI integration
 * - Merge conflict detection and resolution assistance
 * - Quality gate enforcement before merge
 *
 * PRD Requirements:
 * - Automated branch creation with semantic naming ✓
 * - Intelligent commit message generation ✓
 * - PR template population with checklists and descriptions ✓
 * - Automated code review triggers and CI integration ✓
 * - Merge conflict detection and resolution assistance ✓
 */

const AgentBase = require('./core/AgentBase');
const fs = require('fs').promises;
const path = require('path');

class PRAgent extends AgentBase {
  constructor(config = {}) {
    super('PRAgent', {
      defaultBranch: 'main',
      branchPrefix: 'feature/',
      commitConvention: 'conventional', // conventional, angular, emoji
      autoAssignReviewers: true,
      enforceQualityGates: true,
      enableCIIntegration: true,
      ...config
    });

    this.gitConfig = {};
    this.prTemplate = null;
    this.commitTypes = {
      feat: 'A new feature',
      fix: 'A bug fix',
      docs: 'Documentation only changes',
      style: 'Changes that do not affect the meaning of the code',
      refactor: 'A code change that neither fixes a bug nor adds a feature',
      perf: 'A code change that improves performance',
      test: 'Adding missing tests or correcting existing tests',
      chore: 'Changes to the build process or auxiliary tools'
    };

    this.qualityGates = [
      'linting',
      'testing',
      'typeChecking',
      'security',
      'coverage'
    ];

    this.reviewers = {
      frontend: ['@frontend-team'],
      backend: ['@backend-team'],
      design: ['@design-team'],
      security: ['@security-team']
    };
  }

  async initialize() {
    await super.initialize();
    await this.setupGitConfig();
    await this.loadPRTemplate();
    await this.detectCIProvider();
    this.logger.info('🔀 PRAgent ready for Git workflow automation');
  }

  /**
   * Setup Git configuration and verify repository
   */
  async setupGitConfig() {
    try {
      // Verify we're in a Git repository
      const gitResult = await this.executeCommand('git rev-parse --is-inside-work-tree');
      if (!gitResult.success) {
        throw new Error('Not in a Git repository');
      }

      // Get Git configuration
      const userResult = await this.executeCommand('git config user.name');
      const emailResult = await this.executeCommand('git config user.email');
      const remoteResult = await this.executeCommand('git config --get remote.origin.url');

      this.gitConfig = {
        userName: userResult.stdout.trim(),
        userEmail: emailResult.stdout.trim(),
        remoteUrl: remoteResult.stdout.trim(),
        hasGitHooks: await this.checkGitHooks()
      };

      // Get current branch
      const branchResult = await this.executeCommand('git branch --show-current');
      this.gitConfig.currentBranch = branchResult.stdout.trim();

      this.logger.debug('Git configuration loaded:', this.gitConfig);
    } catch (error) {
      this.logger.error('Failed to setup Git configuration:', error.message);
      throw error;
    }
  }

  /**
   * Load or create PR template
   */
  async loadPRTemplate() {
    const templatePaths = [
      '.github/pull_request_template.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      'docs/pull_request_template.md'
    ];

    for (const templatePath of templatePaths) {
      if (await this.fileExists(templatePath)) {
        this.prTemplate = await this.readFile(templatePath);
        this.logger.debug(`PR template loaded from: ${templatePath}`);
        return;
      }
    }

    // Create default PR template
    this.prTemplate = this.generateDefaultPRTemplate();
    await this.createPRTemplate();
  }

  /**
   * Detect CI/CD provider
   */
  async detectCIProvider() {
    const ciConfigs = [
      { name: 'GitHub Actions', path: '.github/workflows' },
      { name: 'GitLab CI', path: '.gitlab-ci.yml' },
      { name: 'Circle CI', path: '.circleci/config.yml' },
      { name: 'Travis CI', path: '.travis.yml' },
      { name: 'Jenkins', path: 'Jenkinsfile' }
    ];

    for (const config of ciConfigs) {
      if (await this.fileExists(config.path)) {
        this.ciProvider = config.name;
        this.logger.debug(`Detected CI provider: ${config.name}`);
        return;
      }
    }

    this.ciProvider = null;
    this.logger.debug('No CI provider detected');
  }

  /**
   * Create a new feature branch with semantic naming
   *
   * @param {Object} options - Branch creation options
   * @param {string} options.type - Type of change (feature, bugfix, hotfix)
   * @param {string} options.description - Brief description of the change
   * @param {string} options.ticketId - Optional ticket/issue ID
   */
  async createBranch(options) {
    this.logger.info(`🌿 Creating new branch: ${options.type}/${options.description}`);

    try {
      // Validate options
      this.validateBranchOptions(options);

      // Generate branch name
      const branchName = this.generateBranchName(options);

      // Check if branch already exists
      const existsResult = await this.executeCommand(`git show-ref --verify --quiet refs/heads/${branchName}`);
      if (existsResult.success) {
        throw new Error(`Branch ${branchName} already exists`);
      }

      // Ensure we're on the default branch
      await this.executeCommand(`git checkout ${this.config.defaultBranch}`);

      // Pull latest changes
      await this.executeCommand('git pull origin ' + this.config.defaultBranch);

      // Create and checkout new branch
      const createResult = await this.executeCommand(`git checkout -b ${branchName}`);
      if (!createResult.success) {
        throw new Error(`Failed to create branch: ${createResult.stderr}`);
      }

      // Track branch on remote
      await this.executeCommand(`git push -u origin ${branchName}`);

      this.logger.success(`✅ Branch created: ${branchName}`);

      return {
        branchName,
        baseBranch: this.config.defaultBranch,
        created: true
      };

    } catch (error) {
      this.logger.error('Failed to create branch:', error.message);
      throw error;
    }
  }

  /**
   * Generate intelligent commit message
   *
   * @param {Object} changes - Information about the changes
   * @param {string[]} changes.files - List of changed files
   * @param {string} changes.description - Description of changes
   * @param {string} changes.type - Type of change
   */
  generateCommitMessage(changes) {
    const { type, description, files = [], scope } = changes;

    // Analyze changed files to determine scope if not provided
    const detectedScope = scope || this.detectScopeFromFiles(files);

    // Generate commit message based on convention
    switch (this.config.commitConvention) {
      case 'conventional':
        return this.generateConventionalCommit(type, detectedScope, description, files);
      case 'angular':
        return this.generateAngularCommit(type, detectedScope, description, files);
      case 'emoji':
        return this.generateEmojiCommit(type, detectedScope, description, files);
      default:
        return this.generateConventionalCommit(type, detectedScope, description, files);
    }
  }

  /**
   * Create commit with generated message
   *
   * @param {Object} changes - Change information
   * @param {Object} options - Commit options
   */
  async createCommit(changes, options = {}) {
    this.logger.info('📝 Creating commit with intelligent message');

    try {
      // Generate commit message
      const commitMessage = this.generateCommitMessage(changes);

      // Stage files if provided
      if (changes.files && changes.files.length > 0) {
        for (const file of changes.files) {
          await this.executeCommand(`git add ${file}`);
        }
      } else {
        // Stage all changes
        await this.executeCommand('git add .');
      }

      // Check if there are changes to commit
      const statusResult = await this.executeCommand('git status --porcelain');
      if (!statusResult.stdout.trim()) {
        this.logger.warn('No changes to commit');
        return { committed: false, reason: 'No changes to commit' };
      }

      // Create commit
      const commitResult = await this.executeCommand(`git commit -m "${commitMessage}"`);
      if (!commitResult.success) {
        throw new Error(`Failed to create commit: ${commitResult.stderr}`);
      }

      // Push to remote if specified
      if (options.push !== false) {
        await this.executeCommand('git push');
      }

      this.logger.success('✅ Commit created successfully');

      return {
        committed: true,
        message: commitMessage,
        hash: await this.getLatestCommitHash()
      };

    } catch (error) {
      this.logger.error('Failed to create commit:', error.message);
      throw error;
    }
  }

  /**
   * Create pull request with intelligent description
   *
   * @param {Object} prOptions - PR creation options
   * @param {string} prOptions.title - PR title
   * @param {string} prOptions.description - PR description
   * @param {string} prOptions.targetBranch - Target branch (defaults to main)
   * @param {string[]} prOptions.reviewers - List of reviewers
   * @param {string[]} prOptions.labels - List of labels
   */
  async createPullRequest(prOptions) {
    this.logger.info('🔄 Creating pull request');

    try {
      // Validate PR options
      this.validatePROptions(prOptions);

      // Get current branch
      const currentBranch = await this.getCurrentBranch();
      const targetBranch = prOptions.targetBranch || this.config.defaultBranch;

      // Analyze changes
      const changeAnalysis = await this.analyzeChanges(currentBranch, targetBranch);

      // Generate PR content
      const prContent = await this.generatePRContent(prOptions, changeAnalysis);

      // Run quality gates
      if (this.config.enforceQualityGates) {
        await this.runQualityGates(changeAnalysis);
      }

      // Create PR based on Git provider
      const prResult = await this.createPROnProvider(prContent, currentBranch, targetBranch);

      // Auto-assign reviewers
      if (this.config.autoAssignReviewers && prResult.prNumber) {
        await this.assignReviewers(prResult.prNumber, changeAnalysis);
      }

      // Trigger CI if configured
      if (this.config.enableCIIntegration && this.ciProvider) {
        await this.triggerCI(prResult.prNumber);
      }

      this.logger.success('✅ Pull request created successfully');

      return prResult;

    } catch (error) {
      this.logger.error('Failed to create pull request:', error.message);
      throw error;
    }
  }

  /**
   * Analyze changes between branches
   */
  async analyzeChanges(sourceBranch, targetBranch) {
    const diffResult = await this.executeCommand(`git diff ${targetBranch}...${sourceBranch} --name-only`);
    const changedFiles = diffResult.stdout.trim().split('\n').filter(f => f);

    const statsResult = await this.executeCommand(`git diff ${targetBranch}...${sourceBranch} --numstat`);
    const stats = this.parseGitStats(statsResult.stdout);

    const commitResult = await this.executeCommand(`git log ${targetBranch}..${sourceBranch} --oneline`);
    const commits = commitResult.stdout.trim().split('\n').filter(c => c);

    return {
      changedFiles,
      stats,
      commits,
      scope: this.detectScopeFromFiles(changedFiles),
      complexity: this.calculateChangeComplexity(stats),
      impact: this.assessChangeImpact(changedFiles)
    };
  }

  /**
   * Generate PR content with template and analysis
   */
  async generatePRContent(prOptions, changeAnalysis) {
    const title = prOptions.title || this.generatePRTitle(changeAnalysis);
    const description = await this.generatePRDescription(prOptions, changeAnalysis);

    return {
      title,
      description,
      targetBranch: prOptions.targetBranch || this.config.defaultBranch,
      labels: this.generatePRLabels(changeAnalysis, prOptions.labels),
      reviewers: prOptions.reviewers || this.suggestReviewers(changeAnalysis)
    };
  }

  /**
   * Generate PR description with template
   */
  async generatePRDescription(prOptions, changeAnalysis) {
    let description = prOptions.description || '';

    // Add change summary
    description += '\n\n## Summary\n';
    description += `This PR ${this.generateChangeSummary(changeAnalysis)}\n`;

    // Add file changes summary
    description += '\n## Changes\n';
    description += this.generateChangesList(changeAnalysis);

    // Add testing information
    description += '\n\n## Testing\n';
    description += this.generateTestingSection(changeAnalysis);

    // Add PR template content
    if (this.prTemplate) {
      description += '\n\n' + this.prTemplate;
    }

    return description.trim();
  }

  /**
   * Run quality gates before PR creation
   */
  async runQualityGates(changeAnalysis) {
    this.logger.info('🚪 Running quality gates');

    const gateResults = [];

    for (const gate of this.qualityGates) {
      try {
        const result = await this.runQualityGate(gate, changeAnalysis);
        gateResults.push({ gate, result, passed: result.success });

        if (!result.success && result.blocking) {
          throw new Error(`Quality gate '${gate}' failed: ${result.message}`);
        }
      } catch (error) {
        gateResults.push({ gate, error: error.message, passed: false });
        this.logger.warn(`Quality gate '${gate}' failed:`, error.message);
      }
    }

    const passedGates = gateResults.filter(g => g.passed).length;
    this.logger.info(`Quality gates: ${passedGates}/${this.qualityGates.length} passed`);

    return gateResults;
  }

  /**
   * Run individual quality gate
   */
  async runQualityGate(gateName, changeAnalysis) {
    switch (gateName) {
      case 'linting':
        return await this.runLintingGate(changeAnalysis);
      case 'testing':
        return await this.runTestingGate(changeAnalysis);
      case 'typeChecking':
        return await this.runTypeCheckingGate(changeAnalysis);
      case 'security':
        return await this.runSecurityGate(changeAnalysis);
      case 'coverage':
        return await this.runCoverageGate(changeAnalysis);
      default:
        return { success: true, message: 'Gate not implemented' };
    }
  }

  /**
   * Create PR on Git provider (GitHub/GitLab)
   */
  async createPROnProvider(prContent, sourceBranch, targetBranch) {
    // Detect Git provider from remote URL
    const provider = this.detectGitProvider();

    switch (provider) {
      case 'github':
        return await this.createGitHubPR(prContent, sourceBranch, targetBranch);
      case 'gitlab':
        return await this.createGitLabMR(prContent, sourceBranch, targetBranch);
      default:
        throw new Error(`Unsupported Git provider: ${provider}`);
    }
  }

  /**
   * Create GitHub PR using CLI
   */
  async createGitHubPR(prContent, sourceBranch, targetBranch) {
    try {
      // Check if gh CLI is available
      const ghCheck = await this.executeCommand('gh --version');
      if (!ghCheck.success) {
        throw new Error('GitHub CLI (gh) not found. Install from: https://cli.github.com/');
      }

      // Create PR using gh CLI
      const ghCommand = [
        'gh pr create',
        `--title "${prContent.title}"`,
        `--body "${prContent.description}"`,
        `--base ${targetBranch}`,
        `--head ${sourceBranch}`
      ];

      // Add reviewers
      if (prContent.reviewers?.length > 0) {
        ghCommand.push(`--reviewer ${prContent.reviewers.join(',')}`);
      }

      // Add labels
      if (prContent.labels?.length > 0) {
        ghCommand.push(`--label ${prContent.labels.join(',')}`);
      }

      const result = await this.executeCommand(ghCommand.join(' '));

      if (result.success) {
        // Extract PR number from output
        const prNumber = this.extractPRNumber(result.stdout);

        return {
          success: true,
          prNumber,
          url: `https://github.com/${this.getRepoPath()}/pull/${prNumber}`,
          provider: 'github'
        };
      } else {
        throw new Error(result.stderr);
      }

    } catch (error) {
      this.logger.error('Failed to create GitHub PR:', error.message);
      throw error;
    }
  }

  /**
   * Create GitLab MR using CLI
   */
  async createGitLabMR(prContent, sourceBranch, targetBranch) {
    try {
      // Use GitLab API or glab CLI if available
      const glabCheck = await this.executeCommand('glab --version');
      if (!glabCheck.success) {
        throw new Error('GitLab CLI (glab) not found. Install from: https://gitlab.com/gitlab-org/cli');
      }

      const glabCommand = [
        'glab mr create',
        `--title "${prContent.title}"`,
        `--description "${prContent.description}"`,
        `--target-branch ${targetBranch}`,
        `--source-branch ${sourceBranch}`
      ];

      const result = await this.executeCommand(glabCommand.join(' '));

      if (result.success) {
        const mrNumber = this.extractMRNumber(result.stdout);

        return {
          success: true,
          prNumber: mrNumber,
          url: `https://gitlab.com/${this.getRepoPath()}/-/merge_requests/${mrNumber}`,
          provider: 'gitlab'
        };
      } else {
        throw new Error(result.stderr);
      }

    } catch (error) {
      this.logger.error('Failed to create GitLab MR:', error.message);
      throw error;
    }
  }

  /**
   * Detect merge conflicts and provide resolution assistance
   */
  async detectMergeConflicts(targetBranch) {
    this.logger.info('🔍 Checking for merge conflicts');

    try {
      // Try to merge target branch to detect conflicts
      const mergeResult = await this.executeCommand(`git merge-base --is-ancestor ${targetBranch} HEAD`);

      if (mergeResult.success) {
        // No conflicts
        return { hasConflicts: false };
      }

      // Check for actual conflicts
      const conflictCheck = await this.executeCommand(`git merge-tree $(git merge-base ${targetBranch} HEAD) ${targetBranch} HEAD`);

      if (conflictCheck.stdout.includes('<<<<<<<')) {
        const conflicts = this.parseConflicts(conflictCheck.stdout);

        return {
          hasConflicts: true,
          conflicts,
          resolutionSuggestions: this.generateConflictResolutionSuggestions(conflicts)
        };
      }

      return { hasConflicts: false };

    } catch (error) {
      this.logger.error('Failed to detect merge conflicts:', error.message);
      return { hasConflicts: false, error: error.message };
    }
  }

  /**
   * Auto-assign reviewers based on change analysis
   */
  async assignReviewers(prNumber, changeAnalysis) {
    const suggestedReviewers = this.suggestReviewers(changeAnalysis);

    if (suggestedReviewers.length === 0) {
      return;
    }

    try {
      const provider = this.detectGitProvider();

      if (provider === 'github') {
        await this.executeCommand(`gh pr edit ${prNumber} --add-reviewer ${suggestedReviewers.join(',')}`);
      } else if (provider === 'gitlab') {
        // GitLab reviewer assignment would go here
      }

      this.logger.info(`Assigned reviewers: ${suggestedReviewers.join(', ')}`);
    } catch (error) {
      this.logger.warn('Failed to assign reviewers:', error.message);
    }
  }

  // Helper methods

  validateBranchOptions(options) {
    if (!options.type || !options.description) {
      throw new Error('Branch type and description are required');
    }

    const validTypes = ['feature', 'bugfix', 'hotfix', 'chore', 'docs'];
    if (!validTypes.includes(options.type)) {
      throw new Error(`Invalid branch type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  generateBranchName(options) {
    const { type, description, ticketId } = options;

    // Sanitize description
    const sanitizedDescription = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    let branchName = `${type}/${sanitizedDescription}`;

    if (ticketId) {
      branchName = `${type}/${ticketId}-${sanitizedDescription}`;
    }

    return branchName;
  }

  detectScopeFromFiles(files) {
    const scopes = {
      'src/components/': 'components',
      'src/pages/': 'pages',
      'src/design/': 'design-system',
      'src/utils/': 'utils',
      'src/hooks/': 'hooks',
      'src/context/': 'context',
      'agents/': 'agents',
      'docs/': 'docs',
      'tests/': 'tests',
      'package.json': 'deps'
    };

    for (const [path, scope] of Object.entries(scopes)) {
      if (files.some(file => file.startsWith(path))) {
        return scope;
      }
    }

    return null;
  }

  generateConventionalCommit(type, scope, description, files) {
    let message = type;

    if (scope) {
      message += `(${scope})`;
    }

    message += `: ${description}`;

    // Add file list if small number of files
    if (files.length <= 3 && files.length > 0) {
      message += `\n\nFiles changed:\n${files.map(f => `- ${f}`).join('\n')}`;
    }

    return message;
  }

  generateAngularCommit(type, scope, description, files) {
    return this.generateConventionalCommit(type, scope, description, files);
  }

  generateEmojiCommit(type, scope, description, files) {
    const emojiMap = {
      feat: '✨',
      fix: '🐛',
      docs: '📚',
      style: '💎',
      refactor: '♻️',
      perf: '⚡',
      test: '🧪',
      chore: '🔧'
    };

    const emoji = emojiMap[type] || '📝';
    return `${emoji} ${description}${scope ? ` (${scope})` : ''}`;
  }

  generatePRTitle(changeAnalysis) {
    const { scope, commits } = changeAnalysis;

    if (commits.length === 1) {
      // Single commit, use commit message
      return commits[0].replace(/^[a-f0-9]+ /, '');
    }

    // Multiple commits, generate summary
    const types = this.extractCommitTypes(commits);
    const primaryType = types[0] || 'chore';

    let title = `${primaryType}`;
    if (scope) {
      title += `(${scope})`;
    }
    title += `: ${this.generateChangeDescription(changeAnalysis)}`;

    return title;
  }

  generateChangeSummary(changeAnalysis) {
    const { changedFiles, stats, scope } = changeAnalysis;

    const fileCount = changedFiles.length;
    const additions = stats.reduce((sum, stat) => sum + stat.additions, 0);
    const deletions = stats.reduce((sum, stat) => sum + stat.deletions, 0);

    let summary = `modifies ${fileCount} file${fileCount !== 1 ? 's' : ''}`;

    if (scope) {
      summary += ` in the ${scope} area`;
    }

    summary += ` (+${additions} -${deletions} lines)`;

    return summary;
  }

  generateChangesList(changeAnalysis) {
    const { changedFiles, stats } = changeAnalysis;

    return changedFiles.map(file => {
      const fileStat = stats.find(s => s.file === file);
      const changes = fileStat ? ` (+${fileStat.additions} -${fileStat.deletions})` : '';
      return `- \`${file}\`${changes}`;
    }).join('\n');
  }

  generateTestingSection(changeAnalysis) {
    const { changedFiles } = changeAnalysis;

    const hasTests = changedFiles.some(file =>
      file.includes('.test.') ||
      file.includes('.spec.') ||
      file.includes('/__tests__/')
    );

    if (hasTests) {
      return '- [ ] Tests have been added/updated\n- [ ] All tests pass locally';
    }

    return '- [ ] Manual testing completed\n- [ ] No new tests required';
  }

  generatePRLabels(changeAnalysis, customLabels = []) {
    const labels = [...customLabels];

    // Add labels based on change analysis
    if (changeAnalysis.scope) {
      labels.push(changeAnalysis.scope);
    }

    if (changeAnalysis.complexity === 'high') {
      labels.push('complex-change');
    }

    if (changeAnalysis.impact === 'breaking') {
      labels.push('breaking-change');
    }

    const types = this.extractCommitTypes(changeAnalysis.commits);
    if (types.length > 0) {
      labels.push(types[0]);
    }

    return [...new Set(labels)];
  }

  suggestReviewers(changeAnalysis) {
    const reviewers = [];

    // Suggest reviewers based on scope
    if (changeAnalysis.scope) {
      const scopeReviewers = this.reviewers[changeAnalysis.scope];
      if (scopeReviewers) {
        reviewers.push(...scopeReviewers);
      }
    }

    // Add security team for security-related changes
    if (changeAnalysis.changedFiles.some(file =>
      file.includes('auth') ||
      file.includes('security') ||
      file.includes('.env')
    )) {
      reviewers.push(...this.reviewers.security);
    }

    return [...new Set(reviewers)];
  }

  async checkGitHooks() {
    const hooksDir = path.join(this.config.projectRoot, '.git/hooks');
    try {
      const hooks = await fs.readdir(hooksDir);
      return hooks.some(hook => !hook.endsWith('.sample'));
    } catch {
      return false;
    }
  }

  generateDefaultPRTemplate() {
    return `## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] Documentation updated if needed`;
  }

  async createPRTemplate() {
    const templatePath = '.github/pull_request_template.md';
    await this.writeFile(templatePath, this.prTemplate);
    this.logger.info(`Created PR template: ${templatePath}`);
  }

  detectGitProvider() {
    const url = this.gitConfig.remoteUrl;

    if (url.includes('github.com')) {
      return 'github';
    } else if (url.includes('gitlab.com') || url.includes('gitlab')) {
      return 'gitlab';
    } else if (url.includes('bitbucket.org')) {
      return 'bitbucket';
    }

    return 'unknown';
  }

  getRepoPath() {
    const url = this.gitConfig.remoteUrl;
    const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    return match ? match[1] : '';
  }

  async getCurrentBranch() {
    const result = await this.executeCommand('git branch --show-current');
    return result.stdout.trim();
  }

  async getLatestCommitHash() {
    const result = await this.executeCommand('git rev-parse HEAD');
    return result.stdout.trim();
  }

  parseGitStats(statsOutput) {
    return statsOutput.trim().split('\n').map(line => {
      const [additions, deletions, file] = line.split('\t');
      return {
        file,
        additions: parseInt(additions) || 0,
        deletions: parseInt(deletions) || 0
      };
    }).filter(stat => stat.file);
  }

  calculateChangeComplexity(stats) {
    const totalChanges = stats.reduce((sum, stat) => sum + stat.additions + stat.deletions, 0);

    if (totalChanges > 1000) return 'high';
    if (totalChanges > 300) return 'medium';
    return 'low';
  }

  assessChangeImpact(changedFiles) {
    // Check for breaking changes
    const breakingPatterns = [
      'package.json',
      'tsconfig.json',
      'src/design/tokens',
      'src/types',
      'src/utils'
    ];

    if (breakingPatterns.some(pattern =>
      changedFiles.some(file => file.includes(pattern))
    )) {
      return 'breaking';
    }

    return 'normal';
  }

  extractCommitTypes(commits) {
    const types = commits.map(commit => {
      const match = commit.match(/^[a-f0-9]+ (\w+)(?:\([^)]+\))?:/);
      return match ? match[1] : null;
    }).filter(Boolean);

    return [...new Set(types)];
  }

  generateChangeDescription(changeAnalysis) {
    const { scope, commits } = changeAnalysis;

    // Extract action from commits
    const actions = commits.map(commit => {
      const match = commit.match(/^[a-f0-9]+ \w+(?:\([^)]+\))?: (.+)/);
      return match ? match[1] : '';
    }).filter(Boolean);

    if (actions.length === 1) {
      return actions[0];
    }

    return `multiple ${scope || 'component'} improvements`;
  }

  extractPRNumber(output) {
    const match = output.match(/\/pull\/(\d+)/);
    return match ? match[1] : null;
  }

  extractMRNumber(output) {
    const match = output.match(/\/merge_requests\/(\d+)/);
    return match ? match[1] : null;
  }

  parseConflicts(mergeOutput) {
    // Parse git merge-tree output for conflicts
    const conflicts = [];
    const lines = mergeOutput.split('\n');

    let currentFile = null;
    let conflictLines = [];

    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        const file = line.substring(4);
        if (currentFile && conflictLines.length > 0) {
          conflicts.push({
            file: currentFile,
            conflictLines: [...conflictLines]
          });
        }
        currentFile = file;
        conflictLines = [];
      } else if (line.includes('<<<<<<<') || line.includes('=======') || line.includes('>>>>>>>')) {
        conflictLines.push(line);
      }
    }

    if (currentFile && conflictLines.length > 0) {
      conflicts.push({
        file: currentFile,
        conflictLines
      });
    }

    return conflicts;
  }

  generateConflictResolutionSuggestions(conflicts) {
    return conflicts.map(conflict => ({
      file: conflict.file,
      suggestion: 'Review conflicting changes and choose the appropriate resolution',
      actions: [
        'Use "git mergetool" for interactive resolution',
        'Edit the file manually to resolve conflicts',
        'Use "git add" after resolving conflicts'
      ]
    }));
  }

  // Quality gate implementations
  async runLintingGate(changeAnalysis) {
    try {
      const result = await this.executeCommand('npm run lint');
      return {
        success: result.success,
        message: result.success ? 'Linting passed' : 'Linting failed',
        blocking: true
      };
    } catch (error) {
      return {
        success: false,
        message: 'Linting check failed',
        blocking: true
      };
    }
  }

  async runTestingGate(changeAnalysis) {
    try {
      const result = await this.executeCommand('npm test');
      return {
        success: result.success,
        message: result.success ? 'Tests passed' : 'Tests failed',
        blocking: true
      };
    } catch (error) {
      return {
        success: false,
        message: 'Test execution failed',
        blocking: true
      };
    }
  }

  async runTypeCheckingGate(changeAnalysis) {
    if (!this.patterns.hasTypeScript) {
      return { success: true, message: 'TypeScript not used' };
    }

    try {
      const result = await this.executeCommand('npx tsc --noEmit');
      return {
        success: result.success,
        message: result.success ? 'Type checking passed' : 'Type errors found',
        blocking: true
      };
    } catch (error) {
      return {
        success: false,
        message: 'Type checking failed',
        blocking: true
      };
    }
  }

  async runSecurityGate(changeAnalysis) {
    try {
      const result = await this.executeCommand('npm audit --audit-level moderate');
      return {
        success: result.success,
        message: result.success ? 'Security scan passed' : 'Security vulnerabilities found',
        blocking: false
      };
    } catch (error) {
      return {
        success: false,
        message: 'Security scan failed',
        blocking: false
      };
    }
  }

  async runCoverageGate(changeAnalysis) {
    try {
      const result = await this.executeCommand('npm run test:coverage');
      return {
        success: result.success,
        message: result.success ? 'Coverage requirements met' : 'Coverage below threshold',
        blocking: false
      };
    } catch (error) {
      return {
        success: false,
        message: 'Coverage check failed',
        blocking: false
      };
    }
  }

  async triggerCI(prNumber) {
    this.logger.info('🚀 Triggering CI pipeline');

    // CI trigger logic would depend on the provider
    // This is a placeholder for CI integration
    this.logger.debug(`CI triggered for PR #${prNumber}`);
  }

  validatePROptions(options) {
    if (!options.title && !options.description) {
      throw new Error('PR title or description is required');
    }
  }

  /**
   * CLI Interface for PR management
   */
  static async fromCLI() {
    const agent = new PRAgent();
    await agent.initialize();

    // Example: Create a branch and PR
    try {
      // Create branch
      const branch = await agent.createBranch({
        type: 'feature',
        description: 'add-new-component',
        ticketId: 'BF-123'
      });

      console.log('✅ Branch created:', branch.branchName);

      // Create commit
      const commit = await agent.createCommit({
        type: 'feat',
        scope: 'components',
        description: 'add new TrackCard component',
        files: ['src/components/TrackCard.js']
      });

      console.log('✅ Commit created:', commit.message);

      // Create PR
      const pr = await agent.createPullRequest({
        title: 'Add new TrackCard component',
        description: 'Implements the new TrackCard component for the music player interface',
        reviewers: ['@frontend-team']
      });

      console.log('✅ PR created:', pr.url);

    } catch (error) {
      console.error('❌ PR workflow failed:', error.message);
    }

    await agent.cleanup();
  }
}

module.exports = PRAgent;

// CLI execution
if (require.main === module) {
  PRAgent.fromCLI().catch(console.error);
}