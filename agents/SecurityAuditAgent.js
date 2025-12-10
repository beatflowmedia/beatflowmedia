#!/usr/bin/env node

/**
 * Security Audit Agent
 *
 * Performs comprehensive security analysis including:
 * - Authentication vulnerabilities
 * - Data exposure risks
 * - Firebase security rules audit
 * - XSS prevention analysis
 * - Sensitive data detection
 * - API security assessment
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditAgent {
  constructor() {
    this.securityResults = {
      authVulnerabilities: [],
      dataExposureRisks: [],
      xssVulnerabilities: [],
      sensitiveDataLeaks: [],
      apiSecurityIssues: [],
      firebaseSecurityIssues: [],
      dependencyVulnerabilities: [],
      securityScore: 0,
      recommendations: []
    };
  }

  // Main security audit entry point
  async auditSecurity() {
    console.log('🔒 Starting comprehensive security audit...\n');

    try {
      // Analyze source code
      const files = this.findSourceFiles('src');
      for (const file of files) {
        console.log(`Auditing: ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        await this.auditFile(file, content);
      }

      // Analyze configuration files
      await this.auditConfiguration();

      // Analyze Firebase security rules
      await this.auditFirebaseRules();

      // Check package dependencies
      await this.auditDependencies();

      this.calculateSecurityScore();
      this.generateSecurityRecommendations();
      this.generateSecurityReport();

    } catch (error) {
      console.error('❌ Security audit failed:', error.message);
    }
  }

  // Audit individual file for security issues
  async auditFile(filePath, content) {
    this.checkAuthenticationSecurity(filePath, content);
    this.checkDataExposure(filePath, content);
    this.checkXSSVulnerabilities(filePath, content);
    this.checkSensitiveDataLeaks(filePath, content);
    this.checkAPISecurityIssues(filePath, content);
  }

  // Authentication security analysis
  checkAuthenticationSecurity(filePath, content) {
    const vulnerabilities = [];

    // Weak authentication patterns
    if (content.includes('localStorage') && content.includes('token')) {
      vulnerabilities.push({
        type: 'INSECURE_TOKEN_STORAGE',
        file: filePath,
        severity: 'HIGH',
        message: 'JWT tokens stored in localStorage (vulnerable to XSS)',
        recommendation: 'Use httpOnly cookies or secure session storage'
      });
    }

    // Missing authentication checks
    if (content.includes('useEffect') && content.includes('user') && !content.includes('auth')) {
      vulnerabilities.push({
        type: 'MISSING_AUTH_CHECK',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Component accessing user data without auth verification',
        recommendation: 'Add proper authentication checks'
      });
    }

    // Hardcoded credentials
    const credentialPatterns = [
      /password\s*[:=]\s*['"][^'"]*['"]/gi,
      /api_?key\s*[:=]\s*['"][^'"]*['"]/gi,
      /secret\s*[:=]\s*['"][^'"]*['"]/gi,
      /token\s*[:=]\s*['"][^'"]*['"]/gi
    ];

    credentialPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        if (!match.includes('process.env') && !match.includes('${')) {
          vulnerabilities.push({
            type: 'HARDCODED_CREDENTIALS',
            file: filePath,
            severity: 'CRITICAL',
            match: match.substring(0, 50) + '...',
            message: 'Hardcoded credentials detected',
            recommendation: 'Move credentials to environment variables'
          });
        }
      });
    });

    // Weak session management
    if (content.includes('sessionStorage') && content.includes('user')) {
      vulnerabilities.push({
        type: 'WEAK_SESSION_MANAGEMENT',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Using sessionStorage for user data',
        recommendation: 'Implement proper session management with server-side validation'
      });
    }

    // Missing CSRF protection
    if (content.includes('fetch') || content.includes('axios')) {
      if (!content.includes('csrfToken') && !content.includes('X-CSRF-Token')) {
        vulnerabilities.push({
          type: 'MISSING_CSRF_PROTECTION',
          file: filePath,
          severity: 'MEDIUM',
          message: 'API calls without CSRF protection',
          recommendation: 'Implement CSRF token validation'
        });
      }
    }

    this.securityResults.authVulnerabilities.push(...vulnerabilities);
  }

  // Data exposure risk analysis
  checkDataExposure(filePath, content) {
    const risks = [];

    // Sensitive data in console logs
    const consolePatterns = [
      /console\.log\([^)]*(?:password|token|key|secret|auth)[^)]*\)/gi,
      /console\.(?:warn|error|info)\([^)]*(?:user|email|phone)[^)]*\)/gi
    ];

    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        risks.push({
          type: 'SENSITIVE_DATA_LOGGING',
          file: filePath,
          severity: 'HIGH',
          match: match.substring(0, 100),
          message: 'Sensitive data being logged to console',
          recommendation: 'Remove or sanitize sensitive data from logs'
        });
      });
    });

    // Direct database queries exposing sensitive fields
    if (content.includes('users') && content.includes('password')) {
      risks.push({
        type: 'PASSWORD_FIELD_EXPOSURE',
        file: filePath,
        severity: 'CRITICAL',
        message: 'Password field potentially exposed in queries',
        recommendation: 'Exclude password fields from user data queries'
      });
    }

    // Unrestricted data queries
    if (content.includes('getDocs') && !content.includes('where') && !content.includes('limit')) {
      risks.push({
        type: 'UNRESTRICTED_DATA_QUERY',
        file: filePath,
        severity: 'HIGH',
        message: 'Database query without proper filtering',
        recommendation: 'Add proper query restrictions and limits'
      });
    }

    // Error messages exposing internal data
    if (content.includes('catch') && content.includes('console.error')) {
      risks.push({
        type: 'VERBOSE_ERROR_MESSAGES',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Detailed error messages may expose internal information',
        recommendation: 'Sanitize error messages before logging'
      });
    }

    this.securityResults.dataExposureRisks.push(...risks);
  }

  // XSS vulnerability analysis
  checkXSSVulnerabilities(filePath, content) {
    const vulnerabilities = [];

    // Dangerous innerHTML usage
    if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
      vulnerabilities.push({
        type: 'DANGEROUS_HTML_INJECTION',
        file: filePath,
        severity: 'HIGH',
        message: 'Direct HTML injection detected',
        recommendation: 'Sanitize HTML content or use safe alternatives'
      });
    }

    // User input without validation
    const inputPatterns = [
      /value\s*=\s*\{[^}]*user[^}]*\}/gi,
      /defaultValue\s*=\s*\{[^}]*props\.[^}]*\}/gi
    ];

    inputPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        vulnerabilities.push({
          type: 'UNVALIDATED_USER_INPUT',
          file: filePath,
          severity: 'MEDIUM',
          count: matches.length,
          message: 'User input used without validation',
          recommendation: 'Implement input validation and sanitization'
        });
      }
    });

    // Dynamic script/style injection
    if (content.includes('createElement') && content.includes('script')) {
      vulnerabilities.push({
        type: 'DYNAMIC_SCRIPT_INJECTION',
        file: filePath,
        severity: 'CRITICAL',
        message: 'Dynamic script creation detected',
        recommendation: 'Avoid dynamic script creation or implement strict CSP'
      });
    }

    // URL injection vulnerabilities
    if (content.includes('window.location') && content.includes('params')) {
      vulnerabilities.push({
        type: 'URL_INJECTION_RISK',
        file: filePath,
        severity: 'MEDIUM',
        message: 'URL manipulation using user parameters',
        recommendation: 'Validate and sanitize URL parameters'
      });
    }

    this.securityResults.xssVulnerabilities.push(...vulnerabilities);
  }

  // Sensitive data leak detection
  checkSensitiveDataLeaks(filePath, content) {
    const leaks = [];

    // API keys and secrets in code
    const sensitivePatterns = [
      { pattern: /AIza[0-9A-Za-z_-]{35}/g, type: 'Google API Key' },
      { pattern: /sk_live_[0-9a-zA-Z]{24}/g, type: 'Stripe Live Key' },
      { pattern: /sk_test_[0-9a-zA-Z]{24}/g, type: 'Stripe Test Key' },
      { pattern: /AKIA[0-9A-Z]{16}/g, type: 'AWS Access Key' },
      { pattern: /firebase\w*:\s*['"][^'"]*['"]/gi, type: 'Firebase Config' }
    ];

    sensitivePatterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        leaks.push({
          type: 'EXPOSED_API_KEY',
          file: filePath,
          severity: 'CRITICAL',
          keyType: type,
          preview: match.substring(0, 20) + '...',
          message: `${type} exposed in source code`,
          recommendation: 'Move to environment variables immediately'
        });
      });
    });

    // Personal data handling
    const personalDataFields = ['email', 'phone', 'address', 'ssn', 'birthdate'];
    personalDataFields.forEach(field => {
      if (content.includes(field) && content.includes('localStorage')) {
        leaks.push({
          type: 'PERSONAL_DATA_IN_STORAGE',
          file: filePath,
          severity: 'HIGH',
          field,
          message: `Personal data (${field}) stored in localStorage`,
          recommendation: 'Use secure server-side storage for personal data'
        });
      }
    });

    // Database connection strings
    if (content.includes('mongodb://') || content.includes('postgresql://')) {
      leaks.push({
        type: 'DATABASE_CONNECTION_EXPOSED',
        file: filePath,
        severity: 'CRITICAL',
        message: 'Database connection string in source code',
        recommendation: 'Move database credentials to secure environment variables'
      });
    }

    this.securityResults.sensitiveDataLeaks.push(...leaks);
  }

  // API security assessment
  checkAPISecurityIssues(filePath, content) {
    const issues = [];

    // Missing authorization headers
    const fetchCalls = content.match(/fetch\s*\([^)]*\)/g) || [];
    fetchCalls.forEach(call => {
      if (!call.includes('Authorization') && !call.includes('Bearer')) {
        issues.push({
          type: 'MISSING_AUTHORIZATION',
          file: filePath,
          severity: 'HIGH',
          message: 'API call without authorization header',
          recommendation: 'Add proper authorization headers to API calls'
        });
      }
    });

    // Insecure HTTP usage
    if (content.includes('http://') && !content.includes('localhost')) {
      issues.push({
        type: 'INSECURE_HTTP_USAGE',
        file: filePath,
        severity: 'MEDIUM',
        message: 'HTTP URLs detected (should use HTTPS)',
        recommendation: 'Use HTTPS for all external communications'
      });
    }

    // Missing input validation for API endpoints
    if (content.includes('req.body') && !content.includes('validate')) {
      issues.push({
        type: 'MISSING_INPUT_VALIDATION',
        file: filePath,
        severity: 'HIGH',
        message: 'API endpoint without input validation',
        recommendation: 'Implement comprehensive input validation'
      });
    }

    // Rate limiting missing
    if (content.includes('app.post') || content.includes('app.get')) {
      if (!content.includes('rateLimit') && !content.includes('throttle')) {
        issues.push({
          type: 'MISSING_RATE_LIMITING',
          file: filePath,
          severity: 'MEDIUM',
          message: 'API endpoints without rate limiting',
          recommendation: 'Implement rate limiting to prevent abuse'
        });
      }
    }

    this.securityResults.apiSecurityIssues.push(...issues);
  }

  // Firebase security rules audit
  async auditFirebaseRules() {
    const rulesFiles = ['firestore.rules', 'storage.rules'];

    for (const rulesFile of rulesFiles) {
      if (fs.existsSync(rulesFile)) {
        console.log(`Auditing Firebase rules: ${rulesFile}`);
        const content = fs.readFileSync(rulesFile, 'utf8');
        this.analyzeFirebaseRules(rulesFile, content);
      }
    }
  }

  analyzeFirebaseRules(filePath, content) {
    const issues = [];

    // Overly permissive rules
    if (content.includes('allow read, write: if true')) {
      issues.push({
        type: 'OVERLY_PERMISSIVE_RULES',
        file: filePath,
        severity: 'CRITICAL',
        message: 'Rules allow unrestricted read/write access',
        recommendation: 'Implement proper authentication and authorization checks'
      });
    }

    // Missing authentication checks
    if (content.includes('allow') && !content.includes('request.auth')) {
      issues.push({
        type: 'MISSING_AUTH_IN_RULES',
        file: filePath,
        severity: 'HIGH',
        message: 'Firebase rules without authentication checks',
        recommendation: 'Add request.auth != null conditions'
      });
    }

    // Data validation missing
    if (content.includes('allow write') && !content.includes('is string')) {
      issues.push({
        type: 'MISSING_DATA_VALIDATION',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Write operations without data validation',
        recommendation: 'Add data type and content validation rules'
      });
    }

    // Resource-based security missing
    if (content.includes('allow') && !content.includes('resource.data')) {
      issues.push({
        type: 'MISSING_RESOURCE_CHECKS',
        file: filePath,
        severity: 'MEDIUM',
        message: 'Rules without resource-based security checks',
        recommendation: 'Add checks for resource ownership and permissions'
      });
    }

    this.securityResults.firebaseSecurityIssues.push(...issues);
  }

  // Configuration security audit
  async auditConfiguration() {
    const configFiles = [
      'package.json',
      '.env',
      '.env.example',
      'firebase.json',
      'public/index.html'
    ];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        console.log(`Auditing configuration: ${configFile}`);
        const content = fs.readFileSync(configFile, 'utf8');
        this.analyzeConfiguration(configFile, content);
      }
    }
  }

  analyzeConfiguration(filePath, content) {
    const issues = [];

    // Check package.json for security issues
    if (filePath === 'package.json') {
      const packageJson = JSON.parse(content);

      // Check for vulnerable dependencies
      const vulnerableDeps = [
        'lodash@4.17.20',
        'moment@2.29.1',
        'axios@0.21.1'
      ];

      Object.entries(packageJson.dependencies || {}).forEach(([dep, version]) => {
        vulnerableDeps.forEach(vuln => {
          if (vuln.startsWith(dep)) {
            issues.push({
              type: 'VULNERABLE_DEPENDENCY',
              file: filePath,
              severity: 'HIGH',
              dependency: `${dep}@${version}`,
              message: `Potentially vulnerable dependency: ${dep}`,
              recommendation: 'Update to latest secure version'
            });
          }
        });
      });
    }

    // Check HTML for security headers
    if (filePath.includes('index.html')) {
      if (!content.includes('Content-Security-Policy')) {
        issues.push({
          type: 'MISSING_CSP_HEADER',
          file: filePath,
          severity: 'HIGH',
          message: 'Missing Content Security Policy',
          recommendation: 'Add CSP meta tag or server headers'
        });
      }

      if (!content.includes('X-Content-Type-Options')) {
        issues.push({
          type: 'MISSING_SECURITY_HEADERS',
          file: filePath,
          severity: 'MEDIUM',
          message: 'Missing security headers',
          recommendation: 'Add X-Content-Type-Options, X-Frame-Options headers'
        });
      }
    }

    this.securityResults.firebaseSecurityIssues.push(...issues);
  }

  // Dependency vulnerability check
  async auditDependencies() {
    if (fs.existsSync('package.json')) {
      console.log('Auditing dependencies for known vulnerabilities...');

      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        // Known vulnerable packages (simplified check)
        const knownVulnerabilities = [
          { name: 'lodash', versions: ['<4.17.21'], severity: 'HIGH' },
          { name: 'moment', versions: ['<2.29.2'], severity: 'MEDIUM' },
          { name: 'axios', versions: ['<0.21.2'], severity: 'HIGH' },
          { name: 'react-dom', versions: ['<17.0.2'], severity: 'MEDIUM' }
        ];

        Object.entries(dependencies).forEach(([dep, version]) => {
          const vuln = knownVulnerabilities.find(v => v.name === dep);
          if (vuln) {
            this.securityResults.dependencyVulnerabilities.push({
              type: 'KNOWN_VULNERABILITY',
              dependency: `${dep}@${version}`,
              severity: vuln.severity,
              message: `Known vulnerability in ${dep}`,
              recommendation: 'Update to latest secure version'
            });
          }
        });

      } catch (error) {
        console.warn('Could not parse package.json for dependency audit');
      }
    }
  }

  // Calculate overall security score
  calculateSecurityScore() {
    let score = 100;

    const deductions = {
      'CRITICAL': 20,
      'HIGH': 10,
      'MEDIUM': 5,
      'LOW': 2
    };

    const allIssues = [
      ...this.securityResults.authVulnerabilities,
      ...this.securityResults.dataExposureRisks,
      ...this.securityResults.xssVulnerabilities,
      ...this.securityResults.sensitiveDataLeaks,
      ...this.securityResults.apiSecurityIssues,
      ...this.securityResults.firebaseSecurityIssues,
      ...this.securityResults.dependencyVulnerabilities
    ];

    allIssues.forEach(issue => {
      score -= deductions[issue.severity] || 1;
    });

    this.securityResults.securityScore = Math.max(score, 0);
  }

  // Generate security recommendations
  generateSecurityRecommendations() {
    const recommendations = [];

    // Critical security issues
    const criticalIssues = Object.values(this.securityResults)
      .filter(Array.isArray)
      .flat()
      .filter(issue => issue.severity === 'CRITICAL');

    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Immediate Action Required',
        title: 'Fix Critical Security Vulnerabilities',
        description: `${criticalIssues.length} critical security issues require immediate attention`,
        actions: [
          'Remove hardcoded credentials and API keys',
          'Fix Firebase security rules',
          'Address exposed sensitive data',
          'Update vulnerable dependencies'
        ],
        timeline: 'Fix within 24 hours'
      });
    }

    // Authentication security
    const authIssues = this.securityResults.authVulnerabilities;
    if (authIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Authentication Security',
        title: 'Strengthen Authentication Security',
        description: `${authIssues.length} authentication security issues found`,
        actions: [
          'Implement secure token storage',
          'Add proper authentication checks',
          'Implement CSRF protection',
          'Use secure session management'
        ],
        timeline: 'Fix within 1 week'
      });
    }

    // Data protection
    const dataIssues = this.securityResults.dataExposureRisks;
    if (dataIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Data Protection',
        title: 'Protect Sensitive Data',
        description: `${dataIssues.length} data exposure risks identified`,
        actions: [
          'Remove sensitive data from logs',
          'Implement proper query restrictions',
          'Sanitize error messages',
          'Add data access controls'
        ],
        timeline: 'Fix within 1 week'
      });
    }

    // XSS prevention
    const xssIssues = this.securityResults.xssVulnerabilities;
    if (xssIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'XSS Prevention',
        title: 'Prevent Cross-Site Scripting',
        description: `${xssIssues.length} XSS vulnerabilities found`,
        actions: [
          'Sanitize all user inputs',
          'Implement Content Security Policy',
          'Avoid dangerous HTML injection',
          'Validate and encode output'
        ],
        timeline: 'Fix within 2 weeks'
      });
    }

    this.securityResults.recommendations = recommendations;
  }

  // Helper method to find source files
  findSourceFiles(dir) {
    const files = [];

    function traverse(currentDir) {
      if (!fs.existsSync(currentDir)) return;

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

  // Generate comprehensive security report
  generateSecurityReport() {
    const totalIssues = Object.values(this.securityResults)
      .filter(Array.isArray)
      .reduce((sum, arr) => sum + arr.length, 0);

    const criticalIssues = Object.values(this.securityResults)
      .filter(Array.isArray)
      .flat()
      .filter(issue => issue.severity === 'CRITICAL').length;

    const highIssues = Object.values(this.securityResults)
      .filter(Array.isArray)
      .flat()
      .filter(issue => issue.severity === 'HIGH').length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        securityScore: Math.round(this.securityResults.securityScore),
        totalIssues,
        criticalIssues,
        highIssues,
        recommendations: this.securityResults.recommendations.length
      },
      categories: {
        authentication: this.securityResults.authVulnerabilities.length,
        dataExposure: this.securityResults.dataExposureRisks.length,
        xss: this.securityResults.xssVulnerabilities.length,
        sensitiveData: this.securityResults.sensitiveDataLeaks.length,
        apiSecurity: this.securityResults.apiSecurityIssues.length,
        firebaseSecurity: this.securityResults.firebaseSecurityIssues.length,
        dependencies: this.securityResults.dependencyVulnerabilities.length
      },
      details: this.securityResults
    };

    // Console output
    console.log('\n🔒 SECURITY AUDIT REPORT');
    console.log('========================');
    console.log(`Security Score: ${report.summary.securityScore}/100`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`High Priority Issues: ${report.summary.highIssues}`);
    console.log(`Security Recommendations: ${report.summary.recommendations}\n`);

    // Issue breakdown
    console.log('🚨 SECURITY ISSUE BREAKDOWN:');
    console.log('----------------------------');
    Object.entries(report.categories).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`${category}: ${count} issues`);
      }
    });

    // Critical recommendations
    if (this.securityResults.recommendations.length > 0) {
      console.log('\n⚡ CRITICAL SECURITY ACTIONS:');
      console.log('-----------------------------');
      this.securityResults.recommendations
        .filter(rec => rec.priority === 'CRITICAL' || rec.priority === 'HIGH')
        .forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.title}`);
          console.log(`   ${rec.description}`);
          console.log(`   Timeline: ${rec.timeline}\n`);
        });
    }

    // Save detailed report
    fs.writeFileSync(
      'security-audit-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed security report saved to: security-audit-report.json');

    return report;
  }
}

// CLI execution
if (require.main === module) {
  const agent = new SecurityAuditAgent();
  agent.auditSecurity().catch(console.error);
}

module.exports = SecurityAuditAgent;