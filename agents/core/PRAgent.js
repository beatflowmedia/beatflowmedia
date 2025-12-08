const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * PRAgent - Intelligent Git workflow automation and PR management
 * Supports branch creation, commit automation, PR generation, and workflow orchestration
 */
class PRAgent {
  constructor(config = {}) {
    this.config = {
      defaultBranch: config.defaultBranch || 'main',
      branchPrefix: config.branchPrefix || 'feature/',
      commitPrefix: config.commitPrefix || '',
      prTemplate: config.prTemplate || '.github/pull_request_template.md',
      signCommits: config.signCommits !== false,
      enforceConventionalCommits: config.enforceConventionalCommits !== false,
      autoMergeStrategy: config.autoMergeStrategy || 'squash',
      requiredChecks: config.requiredChecks || ['ci', 'tests', 'lint'],
      ...config
    };

    this.commitTypes = {
      feat: 'new feature',
      fix: 'bug fix',
      docs: 'documentation',
      style: 'formatting, missing semi colons, etc',
      refactor: 'code change that neither fixes a bug nor adds a feature',
      perf: 'performance improvement',
      test: 'adding missing tests',
      chore: 'maintain',
      ci: 'CI/CD changes',
      build: 'build system changes'
    };

    this.prLabels = {
      FEATURE: ['enhancement', 'feature'],
      BUGFIX: ['bug', 'fix'],
      HOTFIX: ['hotfix', 'urgent'],
      DOCUMENTATION: ['documentation'],
      REFACTOR: ['refactor'],
      PERFORMANCE: ['performance'],
      SECURITY: ['security'],
      BREAKING: ['breaking change']
    };

    this.workflowSteps = {
      BRANCH_CREATE: 'create feature branch',
      COMMIT_CHANGES: 'commit changes with conventional format',
      PUSH_BRANCH: 'push branch to remote',
      CREATE_PR: 'create pull request',
      UPDATE_PR: 'update existing pull request',
      MERGE_PR: 'merge pull request'
    };
  }

  /**
   * Execute complete PR workflow from changes to merge
   */
  async executeWorkflow(changes, options = {}) {
    try {
      const {
        branchName = this.generateBranchName(changes.type, changes.description),
        commitMessage = this.generateCommitMessage(changes),
        prTitle = this.generatePRTitle(changes),
        prDescription = changes.description,
        autoMerge = false,
        draft = false,
        reviewers = [],
        assignees = []
      } = options;

      console.log(`🚀 PRAgent: Executing workflow for "${prTitle}"`);

      const workflow = {
        branch: null,
        commits: [],
        pr: null,
        status: 'started'
      };

      // Step 1: Create feature branch
      workflow.branch = await this.createFeatureBranch(branchName);

      // Step 2: Analyze and stage changes
      const stagedFiles = await this.analyzeAndStageChanges(changes);

      // Step 3: Create commit with conventional format
      const commit = await this.createConventionalCommit(commitMessage, stagedFiles);
      workflow.commits.push(commit);

      // Step 4: Push branch to remote
      await this.pushBranch(branchName);

      // Step 5: Create pull request
      workflow.pr = await this.createPullRequest({
        branch: branchName,
        title: prTitle,
        description: prDescription,
        draft,
        reviewers,
        assignees,
        changes
      });

      // Step 6: Apply labels and metadata
      await this.applyPRMetadata(workflow.pr.number, changes);

      // Step 7: Trigger CI/CD checks
      await this.triggerChecks(workflow.pr.number);

      // Step 8: Monitor PR status
      const status = await this.monitorPRStatus(workflow.pr.number);

      workflow.status = 'completed';
      workflow.pr.status = status;

      console.log(`✅ PR workflow completed - ${workflow.pr.url}`);

      return {
        success: true,
        workflow,
        metrics: await this.getWorkflowMetrics(workflow)
      };

    } catch (error) {
      console.error(`❌ PRAgent workflow error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create feature branch with semantic naming
   */
  async createFeatureBranch(branchName) {
    try {
      console.log(`🌿 Creating feature branch: ${branchName}`);

      // Ensure we're on the default branch
      execSync(`git checkout ${this.config.defaultBranch}`, { stdio: 'pipe' });

      // Pull latest changes
      execSync('git pull origin ' + this.config.defaultBranch, { stdio: 'pipe' });

      // Create and checkout new branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      return {
        name: branchName,
        base: this.config.defaultBranch,
        created: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Analyze changes and stage appropriate files
   */
  async analyzeAndStageChanges(changes) {
    try {
      // Get current status
      const status = execSync('git status --porcelain', { encoding: 'utf8' });

      if (!status.trim()) {
        throw new Error('No changes to commit');
      }

      const stagedFiles = [];

      // If specific files are provided, stage only those
      if (changes.files && changes.files.length > 0) {
        for (const file of changes.files) {
          execSync(`git add "${file}"`, { stdio: 'pipe' });
          stagedFiles.push(file);
        }
      } else {
        // Intelligent staging based on change type
        if (changes.type === 'feat' || changes.type === 'fix') {
          // Stage source files and related tests
          execSync('git add src/', { stdio: 'pipe' });
          execSync('git add tests/ || true', { stdio: 'pipe' });
        } else if (changes.type === 'docs') {
          // Stage documentation files
          execSync('git add *.md docs/', { stdio: 'pipe' });
        } else if (changes.type === 'chore') {
          // Stage configuration files
          execSync('git add package*.json *.config.js .github/', { stdio: 'pipe' });
        } else {
          // Stage all changes
          execSync('git add .', { stdio: 'pipe' });
        }

        // Get list of staged files
        const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        stagedFiles.push(...staged.trim().split('\n').filter(f => f));
      }

      return stagedFiles;

    } catch (error) {
      throw new Error(`Failed to stage changes: ${error.message}`);
    }
  }

  /**
   * Create conventional commit with proper formatting
   */
  async createConventionalCommit(message, stagedFiles) {
    try {
      console.log(`📝 Creating commit: ${message}`);

      // Validate conventional commit format
      if (this.config.enforceConventionalCommits && !this.isValidConventionalCommit(message)) {
        throw new Error(`Invalid conventional commit format: ${message}`);
      }

      // Add co-author information
      const coAuthorMessage = this.addCoAuthor(message);

      // Create commit
      const commitCommand = this.config.signCommits ? 'git commit -S' : 'git commit';
      execSync(`${commitCommand} -m "${coAuthorMessage}"`, { stdio: 'pipe' });

      // Get commit hash
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

      return {
        hash,
        message: coAuthorMessage,
        files: stagedFiles,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to create commit: ${error.message}`);
    }
  }

  /**
   * Push branch to remote repository
   */
  async pushBranch(branchName) {
    try {
      console.log(`📤 Pushing branch to remote: ${branchName}`);

      execSync(`git push -u origin ${branchName}`, { stdio: 'pipe' });

      return {
        branch: branchName,
        remote: 'origin',
        pushed: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to push branch: ${error.message}`);
    }
  }

  /**
   * Create pull request with comprehensive template
   */
  async createPullRequest(prData) {
    try {
      console.log(`📋 Creating pull request: ${prData.title}`);

      const prBody = await this.generatePRBody(prData);

      // Use GitHub CLI to create PR
      const draftFlag = prData.draft ? '--draft' : '';
      const reviewerFlags = prData.reviewers.length > 0 ? `--reviewer ${prData.reviewers.join(',')}` : '';
      const assigneeFlags = prData.assignees.length > 0 ? `--assignee ${prData.assignees.join(',')}` : '';

      const command = `gh pr create --title "${prData.title}" --body "${prBody}" ${draftFlag} ${reviewerFlags} ${assigneeFlags}`;

      const output = execSync(command, { encoding: 'utf8' });
      const prUrl = output.trim();

      // Extract PR number from URL
      const prNumber = this.extractPRNumber(prUrl);

      return {
        number: prNumber,
        url: prUrl,
        title: prData.title,
        branch: prData.branch,
        base: this.config.defaultBranch,
        created: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive PR body with templates
   */
  async generatePRBody(prData) {
    const sections = [];

    // Summary section
    sections.push(`## Summary\n${prData.description}`);

    // Changes section
    if (prData.changes) {
      sections.push(`## Changes\n${this.formatChanges(prData.changes)}`);
    }

    // Test plan section
    sections.push(`## Test Plan\n${this.generateTestPlan(prData.changes)}`);

    // Checklist section
    sections.push(`## Checklist\n${this.generatePRChecklist(prData.changes)}`);

    // Breaking changes section
    if (this.hasBreakingChanges(prData.changes)) {
      sections.push(`## Breaking Changes\n${this.formatBreakingChanges(prData.changes)}`);
    }

    // Screenshots section (if applicable)
    if (this.hasUIChanges(prData.changes)) {
      sections.push(`## Screenshots\n<!-- Add screenshots showing the changes -->`);
    }

    // Additional notes
    sections.push(`## Additional Notes\n<!-- Add any additional context or notes -->`);

    // Footer
    sections.push(`\n---\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`);

    return sections.join('\n\n');
  }

  /**
   * Apply metadata, labels, and project assignments to PR
   */
  async applyPRMetadata(prNumber, changes) {
    try {
      console.log(`🏷️ Applying PR metadata for PR #${prNumber}`);

      // Determine and apply labels
      const labels = this.determinePRLabels(changes);
      if (labels.length > 0) {
        execSync(`gh pr edit ${prNumber} --add-label "${labels.join(',')}"`, { stdio: 'pipe' });
      }

      // Set milestone if applicable
      const milestone = this.determineMilestone(changes);
      if (milestone) {
        execSync(`gh pr edit ${prNumber} --milestone "${milestone}"`, { stdio: 'pipe' });
      }

      // Add to project board if configured
      const project = this.determineProject(changes);
      if (project) {
        // Note: GitHub CLI project commands may vary
        console.log(`📋 Adding to project: ${project}`);
      }

      return {
        labels,
        milestone,
        project
      };

    } catch (error) {
      console.warn(`⚠️ Could not apply all metadata: ${error.message}`);
      return {};
    }
  }

  /**
   * Trigger CI/CD checks and validations
   */
  async triggerChecks(prNumber) {
    try {
      console.log(`🔍 Triggering checks for PR #${prNumber}`);

      // Get PR information
      const prInfo = JSON.parse(execSync(`gh pr view ${prNumber} --json headRefName,headRefOid`, { encoding: 'utf8' }));

      // Trigger workflow dispatch for additional checks
      try {
        execSync(`gh workflow run ci.yml --ref ${prInfo.headRefName}`, { stdio: 'pipe' });
      } catch (error) {
        console.warn('⚠️ Could not trigger additional workflows');
      }

      return {
        triggered: true,
        checks: this.config.requiredChecks,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.warn(`⚠️ Could not trigger checks: ${error.message}`);
      return { triggered: false };
    }
  }

  /**
   * Monitor PR status and check completion
   */
  async monitorPRStatus(prNumber, timeout = 300000) { // 5 minutes default
    try {
      console.log(`⏳ Monitoring PR #${prNumber} status...`);

      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const prStatus = JSON.parse(
          execSync(`gh pr view ${prNumber} --json statusCheckRollup,mergeable,reviewDecision`, { encoding: 'utf8' })
        );

        const status = {
          checks: this.parseCheckStatus(prStatus.statusCheckRollup),
          mergeable: prStatus.mergeable,
          reviewDecision: prStatus.reviewDecision,
          timestamp: new Date().toISOString()
        };

        // Check if all required checks are passing
        if (this.areChecksComplete(status.checks)) {
          console.log(`✅ All checks completed for PR #${prNumber}`);
          return status;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      }

      throw new Error('Timeout waiting for checks to complete');

    } catch (error) {
      console.warn(`⚠️ Could not monitor PR status: ${error.message}`);
      return {
        checks: [],
        mergeable: 'UNKNOWN',
        reviewDecision: 'REVIEW_REQUIRED'
      };
    }
  }

  /**
   * Generate semantic branch name
   */
  generateBranchName(type, description) {
    const sanitized = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return `${this.config.branchPrefix}${type}/${sanitized}`;
  }

  /**
   * Generate conventional commit message
   */
  generateCommitMessage(changes) {
    const { type, scope, description, body, breaking } = changes;

    let message = type;

    if (scope) {
      message += `(${scope})`;
    }

    if (breaking) {
      message += '!';
    }

    message += `: ${description}`;

    if (body) {
      message += `\n\n${body}`;
    }

    if (breaking) {
      message += `\n\nBREAKING CHANGE: ${breaking}`;
    }

    return message;
  }

  /**
   * Generate PR title from changes
   */
  generatePRTitle(changes) {
    const typePrefix = changes.type ? `${changes.type}: ` : '';
    const scopePrefix = changes.scope ? `(${changes.scope}) ` : '';

    return `${typePrefix}${scopePrefix}${changes.description}`;
  }

  /**
   * Validate conventional commit format
   */
  isValidConventionalCommit(message) {
    const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?!?: .{1,50}/;
    return conventionalCommitRegex.test(message);
  }

  /**
   * Add co-author information to commit message
   */
  addCoAuthor(message) {
    return `${message}\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
  }

  /**
   * Extract PR number from GitHub URL
   */
  extractPRNumber(url) {
    const match = url.match(/\/pull\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Format changes for PR description
   */
  formatChanges(changes) {
    const items = [];

    if (changes.added && changes.added.length > 0) {
      items.push(`### Added\n${changes.added.map(item => `- ${item}`).join('\n')}`);
    }

    if (changes.modified && changes.modified.length > 0) {
      items.push(`### Modified\n${changes.modified.map(item => `- ${item}`).join('\n')}`);
    }

    if (changes.removed && changes.removed.length > 0) {
      items.push(`### Removed\n${changes.removed.map(item => `- ${item}`).join('\n')}`);
    }

    return items.join('\n\n');
  }

  /**
   * Generate test plan based on changes
   */
  generateTestPlan(changes) {
    const testItems = [];

    if (changes.type === 'feat') {
      testItems.push(
        '- [ ] Unit tests pass',
        '- [ ] Integration tests pass',
        '- [ ] Manual testing completed',
        '- [ ] Accessibility testing completed'
      );
    } else if (changes.type === 'fix') {
      testItems.push(
        '- [ ] Bug reproduction test added',
        '- [ ] Fix verified in test environment',
        '- [ ] Regression tests pass'
      );
    } else {
      testItems.push(
        '- [ ] All existing tests pass',
        '- [ ] Changes manually verified'
      );
    }

    return testItems.join('\n');
  }

  /**
   * Generate PR checklist
   */
  generatePRChecklist(changes) {
    const checklist = [
      '- [ ] Code follows project style guidelines',
      '- [ ] Self-review completed',
      '- [ ] Tests added/updated as needed',
      '- [ ] Documentation updated as needed',
      '- [ ] No merge conflicts',
      '- [ ] CI/CD checks passing'
    ];

    if (changes.type === 'feat') {
      checklist.push('- [ ] Feature flag added if applicable');
    }

    if (this.hasBreakingChanges(changes)) {
      checklist.push('- [ ] Breaking changes documented');
      checklist.push('- [ ] Migration guide provided');
    }

    return checklist.join('\n');
  }

  /**
   * Determine appropriate labels for PR
   */
  determinePRLabels(changes) {
    const labels = [];

    // Type-based labels
    if (changes.type === 'feat') {
      labels.push(...this.prLabels.FEATURE);
    } else if (changes.type === 'fix') {
      labels.push(...this.prLabels.BUGFIX);
    } else if (changes.type === 'docs') {
      labels.push(...this.prLabels.DOCUMENTATION);
    } else if (changes.type === 'refactor') {
      labels.push(...this.prLabels.REFACTOR);
    } else if (changes.type === 'perf') {
      labels.push(...this.prLabels.PERFORMANCE);
    }

    // Content-based labels
    if (this.hasBreakingChanges(changes)) {
      labels.push(...this.prLabels.BREAKING);
    }

    if (this.hasSecurityChanges(changes)) {
      labels.push(...this.prLabels.SECURITY);
    }

    return [...new Set(labels)]; // Remove duplicates
  }

  /**
   * Utility methods
   */
  hasBreakingChanges(changes) {
    return changes.breaking || changes.description.includes('BREAKING');
  }

  hasUIChanges(changes) {
    return changes.files && changes.files.some(file =>
      file.includes('component') || file.includes('.css') || file.includes('style')
    );
  }

  hasSecurityChanges(changes) {
    return changes.description.toLowerCase().includes('security') ||
           changes.description.toLowerCase().includes('vulnerability');
  }

  parseCheckStatus(statusCheckRollup) {
    if (!statusCheckRollup) return [];

    return statusCheckRollup.map(check => ({
      name: check.name || check.context,
      status: check.state || check.conclusion,
      url: check.targetUrl || check.detailsUrl
    }));
  }

  areChecksComplete(checks) {
    if (checks.length === 0) return false;

    return checks.every(check =>
      check.status === 'SUCCESS' || check.status === 'COMPLETED'
    );
  }

  determineMilestone(changes) {
    // Implement milestone logic based on project needs
    return null;
  }

  determineProject(changes) {
    // Implement project board logic based on project needs
    return null;
  }

  formatBreakingChanges(changes) {
    return changes.breaking || 'Breaking changes details to be added';
  }

  async getWorkflowMetrics(workflow) {
    const endTime = new Date();
    const startTime = new Date(workflow.branch?.created || endTime);

    return {
      duration: endTime - startTime,
      commits: workflow.commits.length,
      filesChanged: workflow.commits.reduce((total, commit) => total + commit.files.length, 0),
      branch: workflow.branch?.name,
      prNumber: workflow.pr?.number,
      prUrl: workflow.pr?.url,
      timestamp: endTime.toISOString()
    };
  }
}

module.exports = PRAgent;