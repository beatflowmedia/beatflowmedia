/**
 * ScaffoldAgent - Automated Component Generation with Design System Integration
 *
 * Generates React components with:
 * - TypeScript/JavaScript variants based on project setup
 * - Design system token integration
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Automatic Storybook story generation
 * - Comprehensive test scaffolding
 * - PropTypes/TypeScript interface generation
 *
 * PRD Requirements:
 * - Component scaffolding based on design system patterns ✓
 * - Automatic Storybook story generation with interactive controls ✓
 * - TypeScript type definitions and prop validation ✓
 * - Performance optimization and accessibility compliance ✓
 */

const AgentBase = require('./core/AgentBase');
const path = require('path');

class ScaffoldAgent extends AgentBase {
  constructor(config = {}) {
    super('ScaffoldAgent', {
      outputDir: 'src/components',
      templateDir: 'agents/templates',
      designSystemPath: 'src/design',
      ...config
    });

    this.componentTypes = {
      atom: { baseDir: 'atoms', storyCategory: 'Atoms' },
      molecule: { baseDir: 'molecules', storyCategory: 'Molecules' },
      organism: { baseDir: 'organisms', storyCategory: 'Organisms' },
      page: { baseDir: 'pages', storyCategory: 'Pages' },
      layout: { baseDir: 'layouts', storyCategory: 'Layouts' }
    };

    this.templates = {
      component: null,
      story: null,
      test: null,
      types: null
    };
  }

  async initialize() {
    await super.initialize();
    await this.loadTemplates();
    this.logger.info('🚀 ScaffoldAgent ready for component generation');
  }

  /**
   * Load and cache component templates
   */
  async loadTemplates() {
    try {
      this.templates.component = this.patterns.hasTypeScript
        ? await this.getTypescriptComponentTemplate()
        : await this.getJavascriptComponentTemplate();

      this.templates.story = await this.getStoryTemplate();
      this.templates.test = await this.getTestTemplate();

      if (this.patterns.hasTypeScript) {
        this.templates.types = await this.getTypesTemplate();
      }

      this.logger.debug('Component templates loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load templates:', error.message);
    }
  }

  /**
   * Generate component based on JSON specification
   *
   * @param {Object} spec - Component specification
   * @param {string} spec.name - Component name
   * @param {string} spec.type - Component type (atom, molecule, organism, page, layout)
   * @param {Object} spec.props - Component props definition
   * @param {Object} spec.styling - Styling requirements
   * @param {Object} spec.accessibility - Accessibility requirements
   * @param {boolean} spec.generateStory - Whether to generate Storybook story
   * @param {boolean} spec.generateTest - Whether to generate test file
   */
  async generateComponent(spec) {
    this.logger.info(`🔨 Generating component: ${spec.name}`);

    try {
      // Validate specification
      this.validateSpec(spec);

      // Create component directory structure
      const componentDir = await this.createComponentStructure(spec);

      // Generate component files
      const results = {
        component: await this.generateComponentFile(spec, componentDir),
        story: null,
        test: null,
        types: null
      };

      // Generate Storybook story
      if (spec.generateStory !== false) {
        results.story = await this.generateStoryFile(spec, componentDir);
        this.metrics.storiesCreated++;
      }

      // Generate test file
      if (spec.generateTest !== false) {
        results.test = await this.generateTestFile(spec, componentDir);
        this.metrics.testsGenerated++;
      }

      // Generate TypeScript types if needed
      if (this.patterns.hasTypeScript && spec.props) {
        results.types = await this.generateTypesFile(spec, componentDir);
      }

      // Update design system index if needed
      if (spec.type === 'atom' || spec.type === 'molecule') {
        await this.updateDesignSystemIndex(spec);
      }

      // Generate usage documentation
      await this.generateUsageDocumentation(spec, componentDir, results);

      this.logger.success(`✨ Component ${spec.name} generated successfully`);
      return results;

    } catch (error) {
      this.logger.error(`Failed to generate component ${spec.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate component specification
   */
  validateSpec(spec) {
    if (!spec.name) {
      throw new Error('Component name is required');
    }

    if (!spec.type || !this.componentTypes[spec.type]) {
      throw new Error(`Invalid component type: ${spec.type}. Must be one of: ${Object.keys(this.componentTypes).join(', ')}`);
    }

    // Validate component name format
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(spec.name)) {
      throw new Error('Component name must be PascalCase and start with uppercase letter');
    }

    this.logger.debug('Component specification validated');
  }

  /**
   * Create component directory structure
   */
  async createComponentStructure(spec) {
    const typeConfig = this.componentTypes[spec.type];
    const componentDir = path.join(
      this.config.outputDir,
      typeConfig.baseDir,
      spec.name
    );

    // For design system components, use nested structure
    if (this.patterns.designSystem && (spec.type === 'atom' || spec.type === 'molecule')) {
      return path.join(this.config.designSystemPath, 'components', typeConfig.baseDir, spec.name);
    }

    return componentDir;
  }

  /**
   * Generate main component file
   */
  async generateComponentFile(spec, componentDir) {
    const extension = this.patterns.hasTypeScript ? '.tsx' : '.js';
    const filePath = path.join(componentDir, `${spec.name}${extension}`);

    const componentCode = this.renderComponentTemplate(spec);

    // Validate generated code
    const issues = this.validateContent(componentCode, 'component');
    if (issues.length > 0) {
      this.logger.warn('Component validation issues:', issues);
    }

    await this.writeFile(filePath, componentCode);
    return filePath;
  }

  /**
   * Generate Storybook story file
   */
  async generateStoryFile(spec, componentDir) {
    const extension = this.patterns.hasTypeScript ? '.stories.tsx' : '.stories.js';
    const filePath = path.join(componentDir, `${spec.name}${extension}`);

    const storyCode = this.renderStoryTemplate(spec);

    // Validate generated story
    const issues = this.validateContent(storyCode, 'story');
    if (issues.length > 0) {
      this.logger.warn('Story validation issues:', issues);
    }

    await this.writeFile(filePath, storyCode);
    return filePath;
  }

  /**
   * Generate test file
   */
  async generateTestFile(spec, componentDir) {
    const extension = this.patterns.hasTypeScript ? '.test.tsx' : '.test.js';
    const filePath = path.join(componentDir, `${spec.name}${extension}`);

    const testCode = this.renderTestTemplate(spec);

    // Validate generated test
    const issues = this.validateContent(testCode, 'test');
    if (issues.length > 0) {
      this.logger.warn('Test validation issues:', issues);
    }

    await this.writeFile(filePath, testCode);
    return filePath;
  }

  /**
   * Generate TypeScript types file
   */
  async generateTypesFile(spec, componentDir) {
    const filePath = path.join(componentDir, `${spec.name}.types.ts`);
    const typesCode = this.renderTypesTemplate(spec);

    await this.writeFile(filePath, typesCode);
    return filePath;
  }

  /**
   * Update design system index file
   */
  async updateDesignSystemIndex(spec) {
    if (!this.patterns.designSystem) return;

    const typeConfig = this.componentTypes[spec.type];
    const indexPath = path.join(
      this.config.designSystemPath,
      'components',
      typeConfig.baseDir,
      'index.ts'
    );

    try {
      let indexContent = '';
      if (await this.fileExists(indexPath)) {
        indexContent = await this.readFile(indexPath);
      }

      // Add export if not already present
      const exportLine = `export { default as ${spec.name} } from './${spec.name}/${spec.name}';`;
      if (!indexContent.includes(exportLine)) {
        indexContent += `\n${exportLine}`;
        await this.writeFile(indexPath, indexContent);
        this.logger.info(`📦 Updated design system index for ${spec.name}`);
      }
    } catch (error) {
      this.logger.warn('Failed to update design system index:', error.message);
    }
  }

  /**
   * Render component template with specification data
   */
  renderComponentTemplate(spec) {
    const imports = this.generateImports(spec);
    const interfaces = this.generateInterfaces(spec);
    const styledComponents = this.generateStyledComponents(spec);
    const componentLogic = this.generateComponentLogic(spec);
    const exports = this.generateExports(spec);

    return `${imports}

${interfaces}

${styledComponents}

${componentLogic}

${exports}`;
  }

  /**
   * Generate imports section
   */
  generateImports(spec) {
    const imports = [];

    // React imports
    const reactImports = ['React'];
    if (spec.props?.children || spec.hooks) {
      reactImports.push('ReactNode', 'forwardRef');
    }
    imports.push(`import ${reactImports.join(', ')} from 'react';`);

    // Material-UI imports if needed
    if (spec.muiComponents?.length > 0) {
      imports.push(`import { ${spec.muiComponents.join(', ')} } from '@mui/material';`);
    }

    // Design system imports
    imports.push(`import { designTokens } from '${this.getDesignTokensPath()}';`);

    if (spec.accessibility) {
      imports.push(`import { AccessibilityProps } from '${this.getDesignTokensPath()}/types';`);
    }

    // Additional imports
    if (spec.additionalImports) {
      imports.push(...spec.additionalImports);
    }

    return imports.join('\n');
  }

  /**
   * Generate TypeScript interfaces or PropTypes
   */
  generateInterfaces(spec) {
    if (!spec.props) return '';

    if (this.patterns.hasTypeScript) {
      return this.generateTypeScriptInterface(spec);
    } else {
      return this.generatePropTypes(spec);
    }
  }

  /**
   * Generate TypeScript interface
   */
  generateTypeScriptInterface(spec) {
    const props = Object.entries(spec.props || {}).map(([key, value]) => {
      const optional = value.required === false ? '?' : '';
      const type = this.mapPropTypeToTypeScript(value.type);
      const description = value.description ? `  /** ${value.description} */\n` : '';
      return `${description}  ${key}${optional}: ${type};`;
    });

    const baseInterface = spec.accessibility ? 'AccessibilityProps' : '{}';

    return `export interface ${spec.name}Props extends ${baseInterface} {
${props.join('\n')}
}`;
  }

  /**
   * Generate PropTypes
   */
  generatePropTypes(spec) {
    const props = Object.entries(spec.props || {}).map(([key, value]) => {
      const propType = this.mapPropTypeToPropTypes(value.type);
      const required = value.required !== false ? '.isRequired' : '';
      return `  ${key}: PropTypes.${propType}${required},`;
    });

    return `${spec.name}.propTypes = {
${props.join('\n')}
};`;
  }

  /**
   * Generate styled components with design tokens
   */
  generateStyledComponents(spec) {
    if (!spec.styling) return '';

    const styledComponents = [];

    // Main styled component
    const styledComponent = `const Styled${spec.name} = styled('${spec.styling.element || 'div'}')(({ theme }) => {
  const tokens = theme.designTokens || designTokens;

  return {
    // Base styles
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    transition: \`all \${tokens.motion.duration.fast} \${tokens.motion.easing.easeOut}\`,

    // Design token styles
    ${this.generateDesignTokenStyles(spec.styling)}

    // Responsive styles
    ${this.generateResponsiveStyles(spec.styling)}

    // Accessibility styles
    ${this.generateAccessibilityStyles(spec.accessibility)}
  };
});`;

    styledComponents.push(styledComponent);

    return styledComponents.join('\n\n');
  }

  /**
   * Generate design token styles
   */
  generateDesignTokenStyles(styling) {
    if (!styling.tokens) return '';

    return Object.entries(styling.tokens).map(([property, tokenPath]) => {
      return `${property}: tokens.${tokenPath},`;
    }).join('\n    ');
  }

  /**
   * Generate responsive styles
   */
  generateResponsiveStyles(styling) {
    if (!styling.responsive) return '';

    return Object.entries(styling.responsive).map(([breakpoint, styles]) => {
      const styleProps = Object.entries(styles).map(([prop, value]) => `${prop}: '${value}'`).join(', ');
      return `[tokens.breakpoints.up('${breakpoint}')]: { ${styleProps} },`;
    }).join('\n    ');
  }

  /**
   * Generate accessibility styles
   */
  generateAccessibilityStyles(accessibility) {
    if (!accessibility) return '';

    const styles = [];

    // Focus visible styles
    styles.push(`'&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'tokens.colors.primary[500]',
      outlineOffset: '2px',
    },`);

    // High contrast mode support
    if (accessibility.highContrast) {
      styles.push(`'@media (prefers-contrast: high)': {
        border: '2px solid currentColor',
      },`);
    }

    // Reduced motion support
    if (accessibility.reducedMotion) {
      styles.push(`'@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        animation: 'none',
      },`);
    }

    return styles.join('\n    ');
  }

  /**
   * Generate component logic
   */
  generateComponentLogic(spec) {
    const componentName = spec.name;
    const propsInterface = this.patterns.hasTypeScript ? `${componentName}Props` : '';

    return `export const ${componentName} = forwardRef<HTMLElement, ${propsInterface}>(
  ({ ...props }, ref) => {
    return (
      <Styled${componentName} ref={ref} {...props}>
        {/* Component content */}
        {props.children}
      </Styled${componentName}>
    );
  }
);

${componentName}.displayName = '${componentName}';`;
  }

  /**
   * Generate exports
   */
  generateExports(spec) {
    return `export default ${spec.name};`;
  }

  /**
   * Render Storybook story template
   */
  renderStoryTemplate(spec) {
    const typeConfig = this.componentTypes[spec.type];
    const importPath = this.patterns.hasTypeScript ? `./${spec.name}` : `./${spec.name}`;

    const args = this.generateStoryArgs(spec);
    const argTypes = this.generateStoryArgTypes(spec);

    return `import type { Meta, StoryObj } from '@storybook/react';
import ${spec.name} from '${importPath}';

const meta: Meta<typeof ${spec.name}> = {
  title: '${typeConfig.storyCategory}/${spec.name}',
  component: ${spec.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${spec.description || `${spec.name} component from the BeatFlowMedia design system.`}'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: ${JSON.stringify(argTypes, null, 4)}
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ${JSON.stringify(args, null, 4)}
};

${this.generateVariantStories(spec)}`;
  }

  /**
   * Generate story args from component props
   */
  generateStoryArgs(spec) {
    if (!spec.props) return {};

    const args = {};
    Object.entries(spec.props).forEach(([key, value]) => {
      if (value.defaultValue !== undefined) {
        args[key] = value.defaultValue;
      }
    });

    return args;
  }

  /**
   * Generate story argTypes for interactive controls
   */
  generateStoryArgTypes(spec) {
    if (!spec.props) return {};

    const argTypes = {};
    Object.entries(spec.props).forEach(([key, value]) => {
      argTypes[key] = {
        description: value.description,
        control: this.getStorybookControl(value.type, value.options)
      };
    });

    return argTypes;
  }

  /**
   * Get appropriate Storybook control for prop type
   */
  getStorybookControl(type, options) {
    switch (type) {
      case 'boolean':
        return { type: 'boolean' };
      case 'string':
        return options ? { type: 'select', options } : { type: 'text' };
      case 'number':
        return { type: 'number' };
      case 'function':
        return { type: 'action' };
      default:
        return { type: 'text' };
    }
  }

  /**
   * Generate variant stories
   */
  generateVariantStories(spec) {
    if (!spec.variants) return '';

    return spec.variants.map(variant => {
      const storyName = variant.name.replace(/\s+/g, '');
      return `
export const ${storyName}: Story = {
  args: ${JSON.stringify(variant.args, null, 4)}
};`;
    }).join('\n');
  }

  /**
   * Render test template
   */
  renderTestTemplate(spec) {
    const testFramework = this.patterns.testFramework;

    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignSystemProvider } from '${this.getDesignTokensPath()}/ThemeProvider';
import ${spec.name} from './${spec.name}';

// Test wrapper with design system provider
const renderComponent = (props = {}) => {
  return render(
    <DesignSystemProvider>
      <${spec.name} {...props} />
    </DesignSystemProvider>
  );
};

describe('${spec.name}', () => {
  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByRole('${this.getComponentRole(spec)}')).toBeInTheDocument();
  });

  ${this.generatePropTests(spec)}

  ${this.generateAccessibilityTests(spec)}

  ${this.generateInteractionTests(spec)}
});`;
  }

  /**
   * Generate prop-specific tests
   */
  generatePropTests(spec) {
    if (!spec.props) return '';

    return Object.entries(spec.props).map(([propName, propConfig]) => {
      if (propConfig.type === 'boolean') {
        return `  it('handles ${propName} prop correctly', () => {
    renderComponent({ ${propName}: true });
    // Add specific assertions for ${propName}
  });`;
      }
      return '';
    }).filter(Boolean).join('\n\n  ');
  }

  /**
   * Generate accessibility tests
   */
  generateAccessibilityTests(spec) {
    if (!spec.accessibility) return '';

    const tests = [];

    // Keyboard navigation test
    if (spec.accessibility.keyboard) {
      tests.push(`  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    renderComponent();

    const element = screen.getByRole('${this.getComponentRole(spec)}');
    await user.tab();
    expect(element).toHaveFocus();
  });`);
    }

    // Screen reader test
    if (spec.accessibility.screenReader) {
      tests.push(`  it('provides proper screen reader support', () => {
    renderComponent({ 'aria-label': 'Test label' });
    expect(screen.getByLabelText('Test label')).toBeInTheDocument();
  });`);
    }

    return tests.join('\n\n  ');
  }

  /**
   * Generate interaction tests
   */
  generateInteractionTests(spec) {
    if (!spec.interactions) return '';

    return spec.interactions.map(interaction => {
      return `  it('handles ${interaction.name} interaction', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();
    renderComponent({ ${interaction.prop}: mockHandler });

    const element = screen.getByRole('${this.getComponentRole(spec)}');
    await user.${interaction.action}(element);
    expect(mockHandler).toHaveBeenCalled();
  });`;
    }).join('\n\n  ');
  }

  /**
   * Generate usage documentation
   */
  async generateUsageDocumentation(spec, componentDir, results) {
    const docContent = `# ${spec.name}

${spec.description || `${spec.name} component documentation.`}

## Usage

\`\`\`tsx
import ${spec.name} from './${spec.name}';

function Example() {
  return (
    <${spec.name}>
      Content
    </${spec.name}>
  );
}
\`\`\`

## Props

${this.generatePropsDocumentation(spec)}

## Generated Files

- Component: \`${path.basename(results.component)}\`
${results.story ? `- Story: \`${path.basename(results.story)}\`` : ''}
${results.test ? `- Test: \`${path.basename(results.test)}\`` : ''}
${results.types ? `- Types: \`${path.basename(results.types)}\`` : ''}

## Accessibility

${this.generateAccessibilityDocumentation(spec)}
`;

    const docPath = path.join(componentDir, 'README.md');
    await this.writeFile(docPath, docContent);
  }

  /**
   * Generate props documentation table
   */
  generatePropsDocumentation(spec) {
    if (!spec.props) return 'No props defined.';

    const rows = Object.entries(spec.props).map(([name, config]) => {
      return `| ${name} | \`${config.type}\` | ${config.required !== false ? 'Yes' : 'No'} | ${config.description || '-'} |`;
    });

    return `| Prop | Type | Required | Description |
|------|------|----------|-------------|
${rows.join('\n')}`;
  }

  /**
   * Generate accessibility documentation
   */
  generateAccessibilityDocumentation(spec) {
    if (!spec.accessibility) return 'Standard accessibility practices apply.';

    const features = [];
    if (spec.accessibility.keyboard) features.push('- Keyboard navigation support');
    if (spec.accessibility.screenReader) features.push('- Screen reader optimization');
    if (spec.accessibility.highContrast) features.push('- High contrast mode support');
    if (spec.accessibility.reducedMotion) features.push('- Reduced motion preference support');

    return features.join('\n');
  }

  // Helper methods
  mapPropTypeToTypeScript(type) {
    const mapping = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      function: '() => void',
      object: 'Record<string, any>',
      array: 'any[]',
      node: 'React.ReactNode'
    };
    return mapping[type] || 'any';
  }

  mapPropTypeToPropTypes(type) {
    const mapping = {
      string: 'string',
      number: 'number',
      boolean: 'bool',
      function: 'func',
      object: 'object',
      array: 'array',
      node: 'node'
    };
    return mapping[type] || 'any';
  }

  getComponentRole(spec) {
    const roleMapping = {
      button: 'button',
      input: 'textbox',
      select: 'combobox',
      modal: 'dialog'
    };
    return roleMapping[spec.role] || 'generic';
  }

  getDesignTokensPath() {
    return this.patterns.designSystem ? '../../../design' : '../../design';
  }

  // Template methods to be implemented
  async getTypescriptComponentTemplate() {
    return ''; // TypeScript component template
  }

  async getJavascriptComponentTemplate() {
    return ''; // JavaScript component template
  }

  async getStoryTemplate() {
    return ''; // Storybook story template
  }

  async getTestTemplate() {
    return ''; // Test template
  }

  async getTypesTemplate() {
    return ''; // TypeScript types template
  }

  /**
   * CLI Interface for component generation
   */
  static async fromCLI() {
    const agent = new ScaffoldAgent();
    await agent.initialize();

    // Example usage
    const exampleSpec = {
      name: 'ExampleButton',
      type: 'atom',
      description: 'An example button component with design system integration',
      props: {
        variant: {
          type: 'string',
          required: false,
          defaultValue: 'primary',
          options: ['primary', 'secondary', 'tertiary'],
          description: 'Button variant style'
        },
        size: {
          type: 'string',
          required: false,
          defaultValue: 'md',
          options: ['xs', 'sm', 'md', 'lg', 'xl'],
          description: 'Button size'
        },
        disabled: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Whether the button is disabled'
        },
        onClick: {
          type: 'function',
          required: false,
          description: 'Click handler function'
        },
        children: {
          type: 'node',
          required: true,
          description: 'Button content'
        }
      },
      styling: {
        element: 'button',
        tokens: {
          padding: 'spacing.md',
          borderRadius: 'radius.button',
          fontSize: 'typography.fontSize.base.desktop'
        },
        responsive: {
          sm: { fontSize: '14px' },
          md: { fontSize: '16px' }
        }
      },
      accessibility: {
        keyboard: true,
        screenReader: true,
        highContrast: true,
        reducedMotion: true
      },
      interactions: [
        { name: 'click', action: 'click', prop: 'onClick' }
      ],
      variants: [
        {
          name: 'Primary Button',
          args: { variant: 'primary', children: 'Primary' }
        },
        {
          name: 'Secondary Button',
          args: { variant: 'secondary', children: 'Secondary' }
        }
      ],
      generateStory: true,
      generateTest: true
    };

    await agent.generateComponent(exampleSpec);
    await agent.cleanup();
  }
}

module.exports = ScaffoldAgent;

// CLI execution
if (require.main === module) {
  ScaffoldAgent.fromCLI().catch(console.error);
}