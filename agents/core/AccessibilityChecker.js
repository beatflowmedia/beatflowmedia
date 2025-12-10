/**
 * AccessibilityChecker - WCAG 2.1 AA/AAA Compliance Validator
 *
 * Comprehensive accessibility auditing for music streaming platform
 * Validates WCAG 2.1 compliance, keyboard navigation, screen reader support
 *
 * Features:
 * - Color contrast validation (4.5:1 text, 3:1 UI components)
 * - ARIA attribute validation
 * - Keyboard navigation checking
 * - Screen reader compatibility
 * - Touch target size validation (44px minimum)
 * - Focus management verification
 * - Semantic HTML structure
 * - Music-specific accessibility patterns
 */

const fs = require('fs').promises;

class AccessibilityChecker {
  constructor(config = {}) {
    this.config = {
      wcagLevel: config.wcagLevel || 'AA', // AA or AAA
      includeWarnings: config.includeWarnings !== false,
      checkKeyboard: config.checkKeyboard !== false,
      checkScreenReader: config.checkScreenReader !== false,
      checkColorContrast: config.checkColorContrast !== false,
      checkTouchTargets: config.checkTouchTargets !== false,
      ...config
    };

    this.issues = [];
  }

  /**
   * Validate accessibility for a file
   */
  async validateFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const issues = [];

    // Skip non-component files
    if (!this.isComponentFile(filePath)) {
      return issues;
    }

    // ARIA attributes validation
    issues.push(...this.checkARIAAttributes(content, filePath));

    // Keyboard navigation
    if (this.config.checkKeyboard) {
      issues.push(...this.checkKeyboardNavigation(content, filePath));
    }

    // Color contrast
    if (this.config.checkColorContrast) {
      issues.push(...this.checkColorContrast(content, filePath));
    }

    // Touch targets
    if (this.config.checkTouchTargets) {
      issues.push(...this.checkTouchTargets(content, filePath));
    }

    // Screen reader support
    if (this.config.checkScreenReader) {
      issues.push(...this.checkScreenReaderSupport(content, filePath));
    }

    // Semantic HTML
    issues.push(...this.checkSemanticHTML(content, filePath));

    // Focus management
    issues.push(...this.checkFocusManagement(content, filePath));

    // Form accessibility
    issues.push(...this.checkFormAccessibility(content, filePath));

    // Image alt text
    issues.push(...this.checkImageAltText(content, filePath));

    // Music-specific patterns
    issues.push(...this.checkMusicA11yPatterns(content, filePath));

    return issues;
  }

  /**
   * Check if file is a component
   */
  isComponentFile(filePath) {
    return /\.(jsx?|tsx?)$/.test(filePath) &&
           (filePath.includes('components') || filePath.includes('pages'));
  }

  /**
   * Check ARIA attributes
   */
  checkARIAAttributes(content, filePath) {
    const issues = [];

    // Missing aria-label on interactive elements
    const interactiveElements = ['button', 'IconButton', 'Link'];

    interactiveElements.forEach(element => {
      const pattern = new RegExp(`<${element}[^>]*>`, 'g');
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const tag = match[0];

        // Check if it has icon but no aria-label
        if (tag.includes('Icon') && !tag.includes('aria-label') && !tag.includes('aria-labelledby')) {
          const line = this.getLineNumber(content, match.index);

          issues.push({
            type: 'MISSING_ARIA_LABEL',
            severity: 'HIGH',
            wcagCriterion: '4.1.2',
            wcagLevel: 'A',
            file: filePath,
            line,
            element,
            message: `${element} with icon missing aria-label`,
            recommendation: 'Add aria-label="descriptive label" for screen readers',
            example: `<${element} aria-label="Play music">`,
            autoRemediable: false
          });
        }
      }
    });

    // Invalid ARIA roles
    const ariaRolePattern = /aria-role=["']([^"']+)["']/g;
    const roleMatches = content.matchAll(ariaRolePattern);

    for (const match of roleMatches) {
      const line = this.getLineNumber(content, match.index);

      issues.push({
        type: 'INVALID_ARIA_ATTRIBUTE',
        severity: 'MEDIUM',
        wcagCriterion: '4.1.2',
        wcagLevel: 'A',
        file: filePath,
        line,
        message: 'Use "role" instead of "aria-role"',
        recommendation: 'Replace aria-role with role',
        autoRemediable: true,
        fix: 'role'
      });
    }

    // aria-hidden on focusable elements
    if (content.includes('aria-hidden="true"') && content.includes('tabIndex')) {
      const line = this.getLineNumber(content, content.indexOf('aria-hidden="true"'));

      issues.push({
        type: 'ARIA_HIDDEN_FOCUSABLE',
        severity: 'CRITICAL',
        wcagCriterion: '4.1.2',
        wcagLevel: 'A',
        file: filePath,
        line,
        message: 'Element with aria-hidden="true" should not be focusable',
        recommendation: 'Remove tabIndex or aria-hidden',
        autoRemediable: false
      });
    }

    return issues;
  }

  /**
   * Check keyboard navigation
   */
  checkKeyboardNavigation(content, filePath) {
    const issues = [];

    // onClick without onKeyDown
    const onClickPattern = /onClick\s*=\s*\{[^}]+\}/g;
    const onClickMatches = content.matchAll(onClickPattern);

    for (const match of onClickMatches) {
      const surroundingCode = content.substring(
        Math.max(0, match.index - 200),
        Math.min(content.length, match.index + 200)
      );

      if (!surroundingCode.includes('onKeyDown') && !surroundingCode.includes('onKeyPress')) {
        const line = this.getLineNumber(content, match.index);

        // Check if it's on a non-interactive element
        if (!surroundingCode.includes('<button') &&
            !surroundingCode.includes('<Button') &&
            !surroundingCode.includes('<a ') &&
            !surroundingCode.includes('<Link')) {

          issues.push({
            type: 'MISSING_KEYBOARD_HANDLER',
            severity: 'HIGH',
            wcagCriterion: '2.1.1',
            wcagLevel: 'A',
            file: filePath,
            line,
            message: 'onClick handler without keyboard support',
            recommendation: 'Add onKeyDown handler or use a <button> element',
            example: 'onKeyDown={(e) => e.key === "Enter" && handleClick()}',
            autoRemediable: false
          });
        }
      }
    }

    // Check for custom tab index
    const customTabIndexPattern = /tabIndex\s*=\s*\{?(-?\d+)\}?/g;
    const tabIndexMatches = content.matchAll(customTabIndexPattern);

    for (const match of tabIndexMatches) {
      const tabIndex = parseInt(match[1]);
      const line = this.getLineNumber(content, match.index);

      if (tabIndex > 0) {
        issues.push({
          type: 'POSITIVE_TAB_INDEX',
          severity: 'MEDIUM',
          wcagCriterion: '2.4.3',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: `Positive tabIndex (${tabIndex}) disrupts natural tab order`,
          recommendation: 'Use tabIndex={0} or remove to use natural DOM order',
          autoRemediable: true,
          fix: 'tabIndex={0}'
        });
      }
    }

    return issues;
  }

  /**
   * Check color contrast
   */
  checkColorContrast(content, filePath) {
    const issues = [];

    // Extract color pairs from styled components
    const colorPairs = this.extractColorPairs(content);

    colorPairs.forEach(({ foreground, background, line, context }) => {
      const contrast = this.calculateContrast(foreground, background);

      const minContrast = this.config.wcagLevel === 'AAA'
        ? (context === 'text' ? 7 : 4.5)
        : (context === 'text' ? 4.5 : 3);

      if (contrast < minContrast) {
        issues.push({
          type: 'INSUFFICIENT_COLOR_CONTRAST',
          severity: 'CRITICAL',
          wcagCriterion: context === 'text' ? '1.4.3' : '1.4.11',
          wcagLevel: this.config.wcagLevel,
          file: filePath,
          line,
          message: `Color contrast ratio ${contrast.toFixed(2)}:1 is below ${minContrast}:1 requirement`,
          foreground,
          background,
          contrast: contrast.toFixed(2),
          required: minContrast,
          recommendation: 'Adjust colors to meet WCAG contrast requirements',
          autoRemediable: false
        });
      }
    });

    return issues;
  }

  /**
   * Extract foreground/background color pairs
   */
  extractColorPairs(content) {
    const pairs = [];

    // Simple extraction (would need more sophisticated parsing in production)
    const colorPattern = /color:\s*["']?#([0-9A-Fa-f]{3,8})["']?.*?background(?:Color)?:\s*["']?#([0-9A-Fa-f]{3,8})["']?/gs;
    const matches = content.matchAll(colorPattern);

    for (const match of matches) {
      pairs.push({
        foreground: `#${match[1]}`,
        background: `#${match[2]}`,
        line: this.getLineNumber(content, match.index),
        context: 'text'
      });
    }

    return pairs;
  }

  /**
   * Calculate color contrast ratio
   */
  calculateContrast(foreground, background) {
    const fg = this.hexToRgb(foreground);
    const bg = this.hexToRgb(background);

    const fgLuminance = this.relativeLuminance(fg);
    const bgLuminance = this.relativeLuminance(bg);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Convert hex to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Calculate relative luminance
   */
  relativeLuminance(rgb) {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Check touch targets
   */
  checkTouchTargets(content, filePath) {
    const issues = [];

    // Check for small button sizes
    const sizePattern = /(?:width|height|minWidth|minHeight):\s*["']?(\d+)(?:px)?["']?/g;
    const matches = content.matchAll(sizePattern);

    for (const match of matches) {
      const size = parseInt(match[1]);
      const line = this.getLineNumber(content, match.index);

      // Check surrounding context for button/interactive element
      const context = content.substring(
        Math.max(0, match.index - 100),
        Math.min(content.length, match.index + 100)
      );

      if (context.includes('button') || context.includes('Button') ||
          context.includes('onClick')) {
        if (size < 44) {
          issues.push({
            type: 'SMALL_TOUCH_TARGET',
            severity: 'HIGH',
            wcagCriterion: '2.5.5',
            wcagLevel: 'AAA',
            file: filePath,
            line,
            message: `Touch target ${size}px is below 44px minimum`,
            recommendation: 'Increase touch target to at least 44x44px',
            currentSize: size,
            requiredSize: 44,
            autoRemediable: false
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check screen reader support
   */
  checkScreenReaderSupport(content, filePath) {
    const issues = [];

    // Check for screen reader only text
    if (content.includes('visually-hidden') || content.includes('sr-only')) {
      // Good practice, no issues
      return issues;
    }

    // Check for complex interactive elements without descriptions
    if ((content.includes('Slider') || content.includes('slider')) &&
        !content.includes('aria-valuetext')) {
      const line = this.getLineNumber(content, content.indexOf('Slider') || content.indexOf('slider'));

      issues.push({
        type: 'MISSING_ARIA_VALUETEXT',
        severity: 'MEDIUM',
        wcagCriterion: '4.1.2',
        wcagLevel: 'A',
        file: filePath,
        line,
        message: 'Slider missing aria-valuetext for screen readers',
        recommendation: 'Add aria-valuetext to describe current value',
        example: 'aria-valuetext={`Volume: ${volume}%`}',
        autoRemediable: false
      });
    }

    return issues;
  }

  /**
   * Check semantic HTML
   */
  checkSemanticHTML(content, filePath) {
    const issues = [];

    // Check for div used as button
    const divButtonPattern = /<div[^>]*onClick/g;
    const matches = content.matchAll(divButtonPattern);

    for (const match of matches) {
      const line = this.getLineNumber(content, match.index);

      issues.push({
        type: 'DIV_AS_BUTTON',
        severity: 'HIGH',
        wcagCriterion: '4.1.2',
        wcagLevel: 'A',
        file: filePath,
        line,
        message: '<div> used as button',
        recommendation: 'Use <button> or add role="button" with keyboard support',
        autoRemediable: false
      });
    }

    // Check heading hierarchy
    const headings = this.extractHeadings(content);
    const hierarchyIssues = this.validateHeadingHierarchy(headings, filePath);
    issues.push(...hierarchyIssues);

    return issues;
  }

  /**
   * Extract headings from content
   */
  extractHeadings(content) {
    const headings = [];
    const headingPattern = /<([Hh][1-6]|Typography\s+variant=["'](h[1-6])["'])/g;
    const matches = content.matchAll(headingPattern);

    for (const match of matches) {
      const level = match[1].toLowerCase().replace('h', '');
      headings.push({
        level: parseInt(level),
        index: match.index
      });
    }

    return headings.sort((a, b) => a.index - b.index);
  }

  /**
   * Validate heading hierarchy
   */
  validateHeadingHierarchy(headings, filePath) {
    const issues = [];

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];

      // Check if heading level jumps more than 1
      if (curr.level - prev.level > 1) {
        const line = this.getLineNumber(content, curr.index);

        issues.push({
          type: 'HEADING_HIERARCHY_SKIP',
          severity: 'MEDIUM',
          wcagCriterion: '1.3.1',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: `Heading hierarchy skip from H${prev.level} to H${curr.level}`,
          recommendation: `Use H${prev.level + 1} instead of H${curr.level}`,
          autoRemediable: false
        });
      }
    }

    return issues;
  }

  /**
   * Check focus management
   */
  checkFocusManagement(content, filePath) {
    const issues = [];

    // Check for auto-focus
    if (content.includes('autoFocus')) {
      const line = this.getLineNumber(content, content.indexOf('autoFocus'));

      issues.push({
        type: 'AUTO_FOCUS_USAGE',
        severity: 'LOW',
        wcagCriterion: '2.4.3',
        wcagLevel: 'A',
        file: filePath,
        line,
        message: 'autoFocus may disorient users',
        recommendation: 'Consider programmatic focus management instead',
        autoRemediable: false
      });
    }

    return issues;
  }

  /**
   * Check form accessibility
   */
  checkFormAccessibility(content, filePath) {
    const issues = [];

    // Check for inputs without labels
    const inputPattern = /<input[^>]*>/gi;
    const inputs = content.matchAll(inputPattern);

    for (const match of inputs) {
      const input = match[0];
      const line = this.getLineNumber(content, match.index);

      if (!input.includes('aria-label') &&
          !input.includes('aria-labelledby') &&
          !this.hasAssociatedLabel(content, match.index)) {

        issues.push({
          type: 'INPUT_WITHOUT_LABEL',
          severity: 'CRITICAL',
          wcagCriterion: '3.3.2',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: 'Input field missing label',
          recommendation: 'Add <label> or aria-label',
          example: '<label htmlFor="email">Email</label>',
          autoRemediable: false
        });
      }
    }

    return issues;
  }

  /**
   * Check if input has associated label
   */
  hasAssociatedLabel(content, inputIndex) {
    const context = content.substring(
      Math.max(0, inputIndex - 200),
      Math.min(content.length, inputIndex + 200)
    );

    return context.includes('<label') || context.includes('htmlFor');
  }

  /**
   * Check image alt text
   */
  checkImageAltText(content, filePath) {
    const issues = [];

    // Check for images without alt text
    const imgPattern = /<img[^>]*>/gi;
    const images = content.matchAll(imgPattern);

    for (const match of images) {
      const img = match[0];
      const line = this.getLineNumber(content, match.index);

      if (!img.includes('alt=')) {
        issues.push({
          type: 'IMAGE_WITHOUT_ALT',
          severity: 'CRITICAL',
          wcagCriterion: '1.1.1',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: 'Image missing alt attribute',
          recommendation: 'Add descriptive alt text',
          example: 'alt="Album cover for Folklore by Taylor Swift"',
          autoRemediable: false
        });
      } else if (img.includes('alt=""') && !img.includes('role="presentation"')) {
        issues.push({
          type: 'EMPTY_ALT_TEXT',
          severity: 'MEDIUM',
          wcagCriterion: '1.1.1',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: 'Empty alt text without role="presentation"',
          recommendation: 'Add descriptive alt text or role="presentation" for decorative images',
          autoRemediable: false
        });
      }
    }

    return issues;
  }

  /**
   * Check music-specific accessibility patterns
   */
  checkMusicA11yPatterns(content, filePath) {
    const issues = [];

    // Check playback controls
    if (content.includes('play') || content.includes('Play')) {
      if (!content.includes('aria-label') && !content.includes('title')) {
        const line = this.getLineNumber(content, content.indexOf('play') || content.indexOf('Play'));

        issues.push({
          type: 'MUSIC_CONTROL_NO_LABEL',
          severity: 'HIGH',
          wcagCriterion: '4.1.2',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: 'Music playback control missing accessible label',
          recommendation: 'Add aria-label="Play" or "Pause"',
          musicSpecific: true,
          autoRemediable: false
        });
      }
    }

    // Check volume controls
    if (content.includes('volume') || content.includes('Volume')) {
      if (!content.includes('aria-valuemin')) {
        const line = this.getLineNumber(content, content.indexOf('volume') || content.indexOf('Volume'));

        issues.push({
          type: 'VOLUME_CONTROL_NO_ARIA',
          severity: 'MEDIUM',
          wcagCriterion: '4.1.2',
          wcagLevel: 'A',
          file: filePath,
          line,
          message: 'Volume control missing ARIA attributes',
          recommendation: 'Add aria-valuemin, aria-valuemax, aria-valuenow',
          example: 'aria-valuemin={0} aria-valuemax={100} aria-valuenow={volume}',
          musicSpecific: true,
          autoRemediable: false
        });
      }
    }

    return issues;
  }

  /**
   * Get line number from index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Calculate accessibility score
   */
  calculateAccessibilityScore(issues) {
    if (issues.length === 0) return 100;

    const severityPenalties = {
      CRITICAL: 10,
      HIGH: 5,
      MEDIUM: 2,
      LOW: 1
    };

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + (severityPenalties[issue.severity] || 1);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  }
}

module.exports = AccessibilityChecker;
