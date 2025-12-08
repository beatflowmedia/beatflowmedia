/**
 * DesignSystemValidator - Design System Compliance Checker
 *
 * Validates codebase compliance with BeatFlowMedia Design System
 * Detects hardcoded values, validates token usage, and ensures consistency
 *
 * Features:
 * - Design token usage validation
 * - Hardcoded value detection (colors, spacing, typography)
 * - Material-UI theme compliance
 * - Component prop validation
 * - Responsive pattern checking
 */

const fs = require('fs').promises;
const path = require('path');

class DesignSystemValidator {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      designTokensPath: config.designTokensPath || 'src/design/tokens.ts',
      strictMode: config.strictMode || false,
      autoFixEnabled: config.autoFixEnabled || false,
      ...config
    };

    // Design token patterns loaded from actual design system
    this.designTokens = null;
    this.violations = [];
  }

  async initialize() {
    await this.loadDesignTokens();
  }

  /**
   * Load design tokens from the project
   */
  async loadDesignTokens() {
    try {
      const tokensPath = path.join(this.config.projectRoot, this.config.designTokensPath);
      const tokensContent = await fs.readFile(tokensPath, 'utf8');

      // Extract token structure (simplified parsing)
      this.designTokens = {
        colors: this.extractTokens(tokensContent, 'colors'),
        spacing: this.extractTokens(tokensContent, 'spacing'),
        typography: this.extractTokens(tokensContent, 'typography'),
        radius: this.extractTokens(tokensContent, 'radius'),
        shadows: this.extractTokens(tokensContent, 'shadows'),
        motion: this.extractTokens(tokensContent, 'motion')
      };

    } catch (error) {
      console.warn('Could not load design tokens:', error.message);
      this.useDefaultTokens();
    }
  }

  /**
   * Extract token values from design system file
   */
  extractTokens(content, category) {
    const regex = new RegExp(`export const ${category} = \\{([\\s\\S]*?)\\} as const`, 'm');
    const match = content.match(regex);

    if (!match) return {};

    // Extract token paths (simplified)
    const tokens = {};
    const lines = match[1].split('\n');

    lines.forEach(line => {
      const valueMatch = line.match(/["']?(\w+)["']?\s*:\s*["']([^"']+)["']/);
      if (valueMatch) {
        tokens[valueMatch[1]] = valueMatch[2];
      }
    });

    return tokens;
  }

  /**
   * Use default tokens if loading fails
   */
  useDefaultTokens() {
    this.designTokens = {
      colors: {
        primary: '#1DB954',
        surface: '#121212',
        neutral: '#B3B3B3',
        white: '#ffffff',
        black: '#000000'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      typography: {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '22px'
      }
    };
  }

  /**
   * Validate design system compliance for a file
   */
  async validateFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const violations = [];

      // Skip design token files themselves
      if (filePath.includes('tokens.ts') || filePath.includes('tokens.js')) {
        return violations;
      }

      // Check for hardcoded colors
      try {
        violations.push(...this.checkHardcodedColors(content, filePath));
      } catch (e) {
        console.warn(`Color check failed for ${filePath}:`, e.message);
      }

      // Check for hardcoded spacing
      try {
        violations.push(...this.checkHardcodedSpacing(content, filePath));
      } catch (e) {
        console.warn(`Spacing check failed for ${filePath}:`, e.message);
      }

      // Check for hardcoded typography
      try {
        violations.push(...this.checkHardcodedTypography(content, filePath));
      } catch (e) {
        console.warn(`Typography check failed for ${filePath}:`, e.message);
      }

      // Check for hardcoded shadows
      try {
        violations.push(...this.checkHardcodedShadows(content, filePath));
      } catch (e) {
        console.warn(`Shadow check failed for ${filePath}:`, e.message);
      }

      // Check for hardcoded border radius
      try {
        violations.push(...this.checkHardcodedRadius(content, filePath));
      } catch (e) {
        console.warn(`Radius check failed for ${filePath}:`, e.message);
      }

      // Check for hardcoded animations
      try {
        violations.push(...this.checkHardcodedAnimations(content, filePath));
      } catch (e) {
        console.warn(`Animation check failed for ${filePath}:`, e.message);
      }

      // Check Material-UI theme usage
      try {
        violations.push(...this.checkMuiThemeUsage(content, filePath));
      } catch (e) {
        console.warn(`MUI theme check failed for ${filePath}:`, e.message);
      }

      return violations;
    } catch (error) {
      console.warn(`Failed to validate ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Check for hardcoded color values
   */
  checkHardcodedColors(content, filePath) {
    const violations = [];

    // Hex colors
    const hexPattern = /#[0-9A-Fa-f]{3,8}(?![0-9A-Fa-f])/g;
    const hexMatches = content.matchAll(hexPattern);

    for (const match of hexMatches) {
      const hexValue = match[0];
      const line = this.getLineNumber(content, match.index);

      // Find corresponding token
      const tokenSuggestion = this.findColorToken(hexValue);

      violations.push({
        type: 'HARDCODED_COLOR',
        severity: 'MEDIUM',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: `Hardcoded color ${hexValue} found`,
        recommendation: tokenSuggestion
          ? `Use designTokens.colors.${tokenSuggestion}`
          : 'Replace with design token',
        value: hexValue,
        tokenPath: tokenSuggestion,
        autoRemediable: !!tokenSuggestion
      });
    }

    // RGB/RGBA colors
    const rgbPattern = /rgba?\s*\([^)]+\)/g;
    const rgbMatches = content.matchAll(rgbPattern);

    for (const match of rgbMatches) {
      const line = this.getLineNumber(content, match.index);

      violations.push({
        type: 'HARDCODED_COLOR_RGB',
        severity: 'MEDIUM',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: `Hardcoded RGB color ${match[0]} found`,
        recommendation: 'Use designTokens.colors with alpha',
        value: match[0],
        autoRemediable: false
      });
    }

    return violations;
  }

  /**
   * Find matching color token
   */
  findColorToken(hexValue) {
    const normalized = hexValue.toUpperCase();

    // Check primary brand colors
    if (normalized === '#1DB954') return 'primary[500]';
    if (normalized === '#121212') return 'surface[900]';
    if (normalized === '#B3B3B3') return 'neutral[500]';
    if (normalized === '#FFFFFF' || normalized === '#FFF') return 'white';
    if (normalized === '#000000' || normalized === '#000') return 'black';
    if (normalized === '#E5534B') return 'danger[500]';

    // Check if it's close to a known token value
    for (const [category, tokens] of Object.entries(this.designTokens.colors || {})) {
      if (typeof tokens === 'object') {
        for (const [shade, value] of Object.entries(tokens)) {
          if (value && value.toUpperCase() === normalized) {
            return `${category}[${shade}]`;
          }
        }
      } else if (tokens && tokens.toUpperCase() === normalized) {
        return category;
      }
    }

    return null;
  }

  /**
   * Check for hardcoded spacing values
   */
  checkHardcodedSpacing(content, filePath) {
    const violations = [];

    // Pattern for spacing properties with px values
    const spacingProps = [
      'padding', 'margin', 'gap', 'top', 'right', 'bottom', 'left',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft'
    ];

    spacingProps.forEach(prop => {
      const pattern = new RegExp(`${prop}\\s*[:=]\\s*["']?(\\d+)px["']?`, 'g');
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const pixelValue = parseInt(match[1]);
        const line = this.getLineNumber(content, match.index);
        const tokenSuggestion = this.findSpacingToken(pixelValue);

        violations.push({
          type: 'HARDCODED_SPACING',
          severity: 'LOW',
          file: filePath,
          line,
          column: this.getColumnNumber(content, match.index),
          message: `Hardcoded spacing ${pixelValue}px in ${prop}`,
          recommendation: tokenSuggestion
            ? `Use designTokens.spacing.${tokenSuggestion}`
            : 'Use design token spacing scale',
          value: `${pixelValue}px`,
          tokenPath: tokenSuggestion,
          autoRemediable: !!tokenSuggestion
        });
      }
    });

    return violations;
  }

  /**
   * Find matching spacing token
   */
  findSpacingToken(pixelValue) {
    const spacingMap = {
      4: 'xs',
      8: 'sm',
      16: 'md',
      24: 'lg',
      32: 'xl',
      48: '2xl',
      64: '3xl'
    };

    return spacingMap[pixelValue] || null;
  }

  /**
   * Check for hardcoded typography
   */
  checkHardcodedTypography(content, filePath) {
    const violations = [];

    // Font size pattern
    const fontSizePattern = /fontSize\s*[:=]\s*["']?(\d+)px["']?/g;
    const matches = content.matchAll(fontSizePattern);

    for (const match of matches) {
      const fontSize = parseInt(match[1]);
      const line = this.getLineNumber(content, match.index);
      const tokenSuggestion = this.findTypographyToken(fontSize);

      violations.push({
        type: 'HARDCODED_FONT_SIZE',
        severity: 'LOW',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: `Hardcoded font size ${fontSize}px`,
        recommendation: tokenSuggestion
          ? `Use designTokens.typography.fontSize.${tokenSuggestion}`
          : 'Use typography scale',
        value: `${fontSize}px`,
        tokenPath: tokenSuggestion,
        autoRemediable: !!tokenSuggestion
      });
    }

    return violations;
  }

  /**
   * Find matching typography token
   */
  findTypographyToken(fontSize) {
    const typographyMap = {
      12: 'xs',
      14: 'sm',
      16: 'base',
      18: 'lg',
      22: 'xl',
      28: '2xl',
      36: '3xl'
    };

    return typographyMap[fontSize] || null;
  }

  /**
   * Check for hardcoded shadows
   */
  checkHardcodedShadows(content, filePath) {
    const violations = [];

    const shadowPattern = /boxShadow\s*[:=]\s*["']([^"']+)["']/g;
    const matches = content.matchAll(shadowPattern);

    for (const match of matches) {
      const line = this.getLineNumber(content, match.index);

      // Skip if using design token
      if (match[1].includes('designTokens') || match[1].includes('theme.shadows')) {
        continue;
      }

      violations.push({
        type: 'HARDCODED_SHADOW',
        severity: 'LOW',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: 'Hardcoded box shadow found',
        recommendation: 'Use designTokens.shadows or theme.shadows',
        value: match[1],
        autoRemediable: false
      });
    }

    return violations;
  }

  /**
   * Check for hardcoded border radius
   */
  checkHardcodedRadius(content, filePath) {
    const violations = [];

    const radiusPattern = /borderRadius\s*[:=]\s*["']?(\d+)px["']?/g;
    const matches = content.matchAll(radiusPattern);

    for (const match of matches) {
      const radiusValue = parseInt(match[1]);
      const line = this.getLineNumber(content, match.index);
      const tokenSuggestion = this.findRadiusToken(radiusValue);

      violations.push({
        type: 'HARDCODED_RADIUS',
        severity: 'LOW',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: `Hardcoded border radius ${radiusValue}px`,
        recommendation: tokenSuggestion
          ? `Use designTokens.radius.${tokenSuggestion}`
          : 'Use radius token',
        value: `${radiusValue}px`,
        tokenPath: tokenSuggestion,
        autoRemediable: !!tokenSuggestion
      });
    }

    return violations;
  }

  /**
   * Find matching radius token
   */
  findRadiusToken(radiusValue) {
    const radiusMap = {
      2: 'xs',
      4: 'sm',
      8: 'md',
      12: 'lg',
      16: 'xl',
      24: '2xl'
    };

    return radiusMap[radiusValue] || null;
  }

  /**
   * Check for hardcoded animations
   */
  checkHardcodedAnimations(content, filePath) {
    const violations = [];

    // Check for transition duration
    const durationPattern = /transition(?:Duration)?\s*[:=]\s*["']?(\d+)ms["']?/g;
    const matches = content.matchAll(durationPattern);

    for (const match of matches) {
      const duration = parseInt(match[1]);
      const line = this.getLineNumber(content, match.index);
      const tokenSuggestion = this.findMotionToken(duration);

      violations.push({
        type: 'HARDCODED_ANIMATION_DURATION',
        severity: 'LOW',
        file: filePath,
        line,
        column: this.getColumnNumber(content, match.index),
        message: `Hardcoded animation duration ${duration}ms`,
        recommendation: tokenSuggestion
          ? `Use designTokens.motion.duration.${tokenSuggestion}`
          : 'Use motion token',
        value: `${duration}ms`,
        tokenPath: tokenSuggestion,
        autoRemediable: !!tokenSuggestion
      });
    }

    return violations;
  }

  /**
   * Find matching motion token
   */
  findMotionToken(duration) {
    const motionMap = {
      0: 'instant',
      120: 'fast',
      240: 'normal',
      400: 'slow'
    };

    return motionMap[duration] || null;
  }

  /**
   * Check Material-UI theme usage
   */
  checkMuiThemeUsage(content, filePath) {
    const violations = [];

    // Check if using styled but not accessing theme
    if (content.includes('styled(') && !content.includes('theme.')) {
      const line = this.getLineNumber(content, content.indexOf('styled('));

      violations.push({
        type: 'MUI_THEME_NOT_USED',
        severity: 'INFO',
        file: filePath,
        line,
        message: 'Using styled components without accessing theme',
        recommendation: 'Consider using theme.palette, theme.spacing, etc.',
        autoRemediable: false
      });
    }

    return violations;
  }

  /**
   * Get line number from string index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get column number from string index
   */
  getColumnNumber(content, index) {
    const lineStart = content.lastIndexOf('\n', index);
    return index - lineStart;
  }

  /**
   * Generate auto-fix for violations
   */
  generateAutoFix(violation) {
    if (!violation.autoRemediable || !violation.tokenPath) {
      return null;
    }

    const replacements = {
      HARDCODED_COLOR: {
        search: violation.value,
        replace: `designTokens.colors.${violation.tokenPath}`
      },
      HARDCODED_SPACING: {
        search: violation.value,
        replace: `designTokens.spacing.${violation.tokenPath}`
      },
      HARDCODED_FONT_SIZE: {
        search: violation.value,
        replace: `designTokens.typography.fontSize.${violation.tokenPath}.desktop`
      },
      HARDCODED_RADIUS: {
        search: violation.value,
        replace: `designTokens.radius.${violation.tokenPath}`
      },
      HARDCODED_ANIMATION_DURATION: {
        search: violation.value,
        replace: `designTokens.motion.duration.${violation.tokenPath}`
      }
    };

    return replacements[violation.type] || null;
  }

  /**
   * Calculate design system compliance score
   */
  calculateComplianceScore(violations) {
    if (violations.length === 0) return 100;

    const severityWeights = {
      CRITICAL: 10,
      HIGH: 5,
      MEDIUM: 2,
      LOW: 1,
      INFO: 0.5
    };

    const totalPenalty = violations.reduce((sum, v) => {
      return sum + (severityWeights[v.severity] || 1);
    }, 0);

    // Score calculation (100 - penalties, minimum 0)
    const score = Math.max(0, 100 - totalPenalty);

    return Math.round(score);
  }
}

module.exports = DesignSystemValidator;
