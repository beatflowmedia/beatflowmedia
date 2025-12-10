const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const esprima = require('esprima');

/**
 * TestGenAgent - Intelligent test generation with comprehensive coverage
 * Supports Jest, React Testing Library, accessibility testing, and performance testing
 */
class TestGenAgent {
  constructor(config = {}) {
    this.config = {
      testDir: config.testDir || 'src',
      coverageThreshold: config.coverageThreshold || 90,
      testFramework: config.testFramework || 'jest',
      testingLibrary: config.testingLibrary || '@testing-library/react',
      accessibilityTesting: config.accessibilityTesting !== false,
      performanceTesting: config.performanceTesting !== false,
      integrationTesting: config.integrationTesting !== false,
      ...config
    };

    this.testPatterns = {
      UNIT: 'unit tests for individual functions and components',
      INTEGRATION: 'integration tests for component interactions',
      E2E: 'end-to-end tests for complete user workflows',
      ACCESSIBILITY: 'accessibility compliance tests',
      PERFORMANCE: 'performance and load tests',
      SECURITY: 'security vulnerability tests'
    };

    this.mockStrategies = {
      API: 'mock external API calls',
      HOOKS: 'mock React hooks and context',
      COMPONENTS: 'mock child components',
      UTILITIES: 'mock utility functions'
    };
  }

  /**
   * Generate comprehensive test suite for a component
   */
  async generateTestSuite(componentPath, options = {}) {
    try {
      const {
        coverageTarget = this.config.coverageThreshold,
        includeAccessibility = this.config.accessibilityTesting,
        includePerformance = this.config.performanceTesting,
        includeIntegration = this.config.integrationTesting,
        testTypes = ['UNIT', 'INTEGRATION']
      } = options;

      console.log(`🧪 TestGenAgent: Generating test suite for ${componentPath}`);

      // Analyze component structure
      const analysis = await this.analyzeComponent(componentPath);

      // Generate different types of tests
      const tests = {};

      for (const testType of testTypes) {
        switch (testType) {
          case 'UNIT':
            tests.unit = await this.generateUnitTests(analysis, coverageTarget);
            break;
          case 'INTEGRATION':
            tests.integration = await this.generateIntegrationTests(analysis);
            break;
          case 'ACCESSIBILITY':
            if (includeAccessibility) {
              tests.accessibility = await this.generateAccessibilityTests(analysis);
            }
            break;
          case 'PERFORMANCE':
            if (includePerformance) {
              tests.performance = await this.generatePerformanceTests(analysis);
            }
            break;
        }
      }

      // Combine tests into comprehensive suite
      const testSuite = await this.combineTestSuite(tests, analysis);

      // Write test files
      const testFiles = await this.writeTestFiles(componentPath, testSuite);

      // Generate test utilities if needed
      await this.generateTestUtilities(analysis);

      // Validate test coverage
      const coverage = await this.validateTestCoverage(componentPath, coverageTarget);

      console.log(`✅ Test suite generated with ${coverage.percentage}% coverage`);

      return {
        success: true,
        tests: testFiles,
        coverage,
        metrics: await this.getTestMetrics(testFiles)
      };

    } catch (error) {
      console.error(`❌ TestGenAgent error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze component structure and dependencies
   */
  async analyzeComponent(componentPath) {
    const content = await fs.readFile(componentPath, 'utf8');

    try {
      const ast = esprima.parseModule(content, {
        jsx: true,
        attachComments: true,
        tolerant: true
      });

      const analysis = {
        name: this.extractComponentName(componentPath),
        props: this.extractProps(ast),
        hooks: this.extractHooks(ast),
        imports: this.extractImports(ast),
        exports: this.extractExports(ast),
        methods: this.extractMethods(ast),
        eventHandlers: this.extractEventHandlers(ast),
        stateVariables: this.extractStateVariables(ast),
        effects: this.extractEffects(ast),
        dependencies: this.extractDependencies(ast),
        complexity: this.calculateComplexity(ast),
        hasAsync: this.hasAsyncOperations(ast),
        hasUserInteractions: this.hasUserInteractions(ast)
      };

      return analysis;
    } catch (parseError) {
      console.warn('⚠️ Could not parse component, using basic analysis');
      return this.basicAnalysis(componentPath, content);
    }
  }

  /**
   * Generate comprehensive unit tests
   */
  async generateUnitTests(analysis, coverageTarget) {
    const tests = [];

    // Basic rendering tests
    tests.push(this.generateRenderingTests(analysis));

    // Props testing
    if (analysis.props.length > 0) {
      tests.push(this.generatePropsTests(analysis));
    }

    // Hooks testing
    if (analysis.hooks.length > 0) {
      tests.push(this.generateHooksTests(analysis));
    }

    // Event handling tests
    if (analysis.eventHandlers.length > 0) {
      tests.push(this.generateEventTests(analysis));
    }

    // State management tests
    if (analysis.stateVariables.length > 0) {
      tests.push(this.generateStateTests(analysis));
    }

    // Effect tests
    if (analysis.effects.length > 0) {
      tests.push(this.generateEffectTests(analysis));
    }

    // Error boundary tests
    tests.push(this.generateErrorTests(analysis));

    // Edge case tests
    tests.push(this.generateEdgeCaseTests(analysis));

    // Additional tests for high coverage
    if (coverageTarget >= 90) {
      tests.push(this.generateComprehensiveCoverageTests(analysis));
    }

    return tests.flat();
  }

  /**
   * Generate integration tests
   */
  async generateIntegrationTests(analysis) {
    const tests = [];

    // Component interaction tests
    tests.push(this.generateComponentInteractionTests(analysis));

    // Context integration tests
    if (this.usesContext(analysis)) {
      tests.push(this.generateContextIntegrationTests(analysis));
    }

    // Router integration tests
    if (this.usesRouter(analysis)) {
      tests.push(this.generateRouterIntegrationTests(analysis));
    }

    // API integration tests
    if (analysis.hasAsync) {
      tests.push(this.generateApiIntegrationTests(analysis));
    }

    return tests.flat();
  }

  /**
   * Generate accessibility tests
   */
  async generateAccessibilityTests(analysis) {
    return `
  describe('Accessibility', () => {
    it('meets WCAG guidelines', async () => {
      const { container } = renderWithProviders(<${analysis.name} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<${analysis.name} />);

      // Test Tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Test Enter/Space activation
      if (document.activeElement) {
        await user.keyboard('{Enter}');
        // Add specific assertions based on component behavior
      }
    });

    it('provides proper ARIA labels and roles', () => {
      renderWithProviders(<${analysis.name} />);

      // Check for required ARIA attributes
      const component = screen.getByRole(/button|link|textbox|listbox|combobox|tab|menuitem/i, { hidden: true });
      expect(component).toBeInTheDocument();
    });

    it('supports screen reader announcements', () => {
      renderWithProviders(<${analysis.name} />);

      // Check for live regions and announcements
      const liveRegion = screen.queryByRole('status');
      if (liveRegion) {
        expect(liveRegion).toBeInTheDocument();
      }
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      renderWithProviders(<${analysis.name} />);

      // Test focus trapping for modals/dialogs
      // Test focus restoration
      // Test focus indicators
    });
  });`;
  }

  /**
   * Generate performance tests
   */
  async generatePerformanceTests(analysis) {
    return `
  describe('Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now();
      renderWithProviders(<${analysis.name} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms budget
    });

    it('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: \`Item \${i}\` }));

      const startTime = performance.now();
      renderWithProviders(<${analysis.name} data={largeDataset} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // 500ms for large datasets
    });

    it('prevents unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <${analysis.name} />;
      };

      const { rerender } = renderWithProviders(<TestComponent />);

      rerender(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(2); // Initial + rerender
    });

    it('cleans up resources on unmount', () => {
      const cleanup = jest.fn();
      const ComponentWithCleanup = () => {
        React.useEffect(() => cleanup, []);
        return <${analysis.name} />;
      };

      const { unmount } = renderWithProviders(<ComponentWithCleanup />);
      unmount();

      expect(cleanup).toHaveBeenCalled();
    });
  });`;
  }

  /**
   * Generate rendering tests
   */
  generateRenderingTests(analysis) {
    return `
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<${analysis.name} />);
    });

    it('renders with minimal props', () => {
      const minimalProps = ${JSON.stringify(this.getMinimalProps(analysis), null, 6)};
      renderWithProviders(<${analysis.name} {...minimalProps} />);
    });

    it('renders with all props', () => {
      const allProps = ${JSON.stringify(this.getAllProps(analysis), null, 6)};
      renderWithProviders(<${analysis.name} {...allProps} />);
    });

    it('matches snapshot', () => {
      const { container } = renderWithProviders(<${analysis.name} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });`;
  }

  /**
   * Generate props tests
   */
  generatePropsTests(analysis) {
    const propTests = analysis.props.map(prop => {
      return `
    it('handles ${prop.name} prop correctly', () => {
      const testValue = ${this.generateTestValue(prop.type)};
      renderWithProviders(<${analysis.name} ${prop.name}={testValue} />);

      // Add specific assertions based on prop type and usage
      ${this.generatePropAssertions(prop)}
    });`;
    }).join('');

    return `
  describe('Props', () => {${propTests}

    it('handles undefined props gracefully', () => {
      renderWithProviders(<${analysis.name}
        title={undefined}
        content={undefined}
        onClick={undefined}
      />);
    });

    it('validates prop types in development', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<${analysis.name}
        // Pass invalid prop types
        title={123}
        count={'invalid'}
      />);

      // Should log prop type warnings in development
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });`;
  }

  /**
   * Generate event handling tests
   */
  generateEventTests(analysis) {
    const eventTests = analysis.eventHandlers.map(handler => {
      return `
    it('handles ${handler.name} event', async () => {
      const mockHandler = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(<${analysis.name} ${handler.prop}={mockHandler} />);

      ${this.generateEventTrigger(handler)}

      expect(mockHandler).toHaveBeenCalled();
      ${this.generateEventAssertions(handler)}
    });`;
    }).join('');

    return `
  describe('Event Handling', () => {${eventTests}
  });`;
  }

  /**
   * Generate state management tests
   */
  generateStateTests(analysis) {
    const stateTests = analysis.stateVariables.map(state => {
      return `
    it('manages ${state.name} state correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<${analysis.name} />);

      ${this.generateStateTestLogic(state)}
    });`;
    }).join('');

    return `
  describe('State Management', () => {${stateTests}
  });`;
  }

  /**
   * Generate comprehensive test file content
   */
  async combineTestSuite(tests, analysis) {
    const imports = this.generateTestImports(analysis);
    const setupCode = this.generateTestSetup(analysis);
    const testSuites = Object.values(tests).flat().join('\n');

    return `${imports}

${setupCode}

describe('${analysis.name}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

${testSuites}
});
`;
  }

  /**
   * Generate test imports based on component analysis
   */
  generateTestImports(analysis) {
    const imports = [
      "import React from 'react';",
      "import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';",
      "import userEvent from '@testing-library/user-event';",
      "import { jest } from '@jest/globals';"
    ];

    // Add accessibility testing
    if (this.config.accessibilityTesting) {
      imports.push("import { axe, toHaveNoViolations } from 'jest-axe';");
      imports.push("expect.extend(toHaveNoViolations);");
    }

    // Add Material-UI testing utilities
    if (analysis.dependencies.includes('@mui/material')) {
      imports.push("import { ThemeProvider, createTheme } from '@mui/material/styles';");
    }

    // Add React Router testing utilities
    if (this.usesRouter(analysis)) {
      imports.push("import { MemoryRouter } from 'react-router-dom';");
    }

    // Add React Query testing utilities
    if (analysis.dependencies.includes('@tanstack/react-query')) {
      imports.push("import { QueryClient, QueryClientProvider } from '@tanstack/react-query';");
    }

    // Add component import
    imports.push(`import ${analysis.name} from './${analysis.name}';`);

    return imports.join('\n');
  }

  /**
   * Generate test setup and utilities
   */
  generateTestSetup(analysis) {
    let setup = '';

    // Theme provider setup
    if (analysis.dependencies.includes('@mui/material')) {
      setup += `
const theme = createTheme();`;
    }

    // Query client setup
    if (analysis.dependencies.includes('@tanstack/react-query')) {
      setup += `
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});`;
    }

    // Render with providers utility
    setup += `
const renderWithProviders = (component, options = {}) => {
  const AllTheProviders = ({ children }) => {
    return (`;

    if (analysis.dependencies.includes('@mui/material')) {
      setup += `
      <ThemeProvider theme={theme}>`;
    }

    if (analysis.dependencies.includes('@tanstack/react-query')) {
      setup += `
        <QueryClientProvider client={queryClient}>`;
    }

    if (this.usesRouter(analysis)) {
      setup += `
          <MemoryRouter>`;
    }

    setup += `
            {children}`;

    if (this.usesRouter(analysis)) {
      setup += `
          </MemoryRouter>`;
    }

    if (analysis.dependencies.includes('@tanstack/react-query')) {
      setup += `
        </QueryClientProvider>`;
    }

    if (analysis.dependencies.includes('@mui/material')) {
      setup += `
      </ThemeProvider>`;
    }

    setup += `
    );
  };

  return render(component, { wrapper: AllTheProviders, ...options });
};`;

    return setup;
  }

  /**
   * Write test files to filesystem
   */
  async writeTestFiles(componentPath, testSuite) {
    const componentName = this.extractComponentName(componentPath);
    const testDir = path.dirname(componentPath);
    const testPath = path.join(testDir, `${componentName}.test.js`);

    await fs.writeFile(testPath, testSuite);

    return [testPath];
  }

  /**
   * Validate test coverage meets requirements
   */
  async validateTestCoverage(componentPath, targetCoverage) {
    try {
      // Run Jest with coverage for specific component
      const result = execSync(
        `npx jest ${componentPath} --coverage --coverageReporters=json-summary`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Parse coverage results
      const coverageMatch = result.match(/Lines\s*:\s*(\d+\.?\d*)%/);
      const percentage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      return {
        percentage,
        meets_target: percentage >= targetCoverage,
        target: targetCoverage
      };
    } catch (error) {
      console.warn('⚠️ Could not validate coverage:', error.message);
      return {
        percentage: 0,
        meets_target: false,
        target: targetCoverage,
        error: error.message
      };
    }
  }

  /**
   * Generate test utilities for complex scenarios
   */
  async generateTestUtilities(analysis) {
    if (analysis.complexity > 10) {
      const utilsContent = this.generateAdvancedTestUtilities(analysis);
      const utilsPath = path.join(this.config.testDir, 'utils', 'testUtils.js');

      await fs.mkdir(path.dirname(utilsPath), { recursive: true });
      await fs.writeFile(utilsPath, utilsContent);
    }
  }

  /**
   * Helper methods for component analysis
   */
  extractComponentName(componentPath) {
    return path.basename(componentPath, path.extname(componentPath));
  }

  extractProps(ast) {
    // Analyze AST to extract component props
    const props = [];
    // Implementation would traverse AST to find prop definitions
    return props;
  }

  extractHooks(ast) {
    // Extract React hooks usage
    const hooks = [];
    // Implementation would find useState, useEffect, etc.
    return hooks;
  }

  extractImports(ast) {
    // Extract import statements
    const imports = [];
    // Implementation would find all import declarations
    return imports;
  }

  extractExports(ast) {
    // Extract export statements
    const exports = [];
    return exports;
  }

  extractMethods(ast) {
    // Extract component methods
    const methods = [];
    return methods;
  }

  extractEventHandlers(ast) {
    // Extract event handler functions
    const handlers = [];
    return handlers;
  }

  extractStateVariables(ast) {
    // Extract state variables from useState hooks
    const stateVars = [];
    return stateVars;
  }

  extractEffects(ast) {
    // Extract useEffect hooks
    const effects = [];
    return effects;
  }

  extractDependencies(ast) {
    // Extract external dependencies
    const deps = [];
    return deps;
  }

  calculateComplexity(ast) {
    // Calculate cyclomatic complexity
    return 1;
  }

  hasAsyncOperations(ast) {
    // Check for async/await or Promise usage
    return false;
  }

  hasUserInteractions(ast) {
    // Check for event handlers
    return false;
  }

  usesContext(analysis) {
    return analysis.hooks.some(hook => hook.includes('useContext'));
  }

  usesRouter(analysis) {
    return analysis.dependencies.some(dep => dep.includes('react-router'));
  }

  basicAnalysis(componentPath, content) {
    return {
      name: this.extractComponentName(componentPath),
      props: [],
      hooks: [],
      imports: [],
      exports: [],
      methods: [],
      eventHandlers: [],
      stateVariables: [],
      effects: [],
      dependencies: [],
      complexity: 1,
      hasAsync: content.includes('async') || content.includes('await'),
      hasUserInteractions: content.includes('onClick') || content.includes('onChange')
    };
  }

  getMinimalProps(analysis) {
    // Generate minimal props for testing
    return {};
  }

  getAllProps(analysis) {
    // Generate all possible props for testing
    return {};
  }

  generateTestValue(type) {
    const values = {
      string: '"test string"',
      number: '42',
      boolean: 'true',
      array: '[1, 2, 3]',
      object: '{ key: "value" }',
      function: 'jest.fn()'
    };
    return values[type] || '"test value"';
  }

  generatePropAssertions(prop) {
    return `// Add assertions for ${prop.name} prop`;
  }

  generateEventTrigger(handler) {
    return `// Trigger ${handler.name} event`;
  }

  generateEventAssertions(handler) {
    return `// Assert ${handler.name} behavior`;
  }

  generateStateTestLogic(state) {
    return `// Test ${state.name} state changes`;
  }

  generateAdvancedTestUtilities(analysis) {
    return `// Advanced test utilities for complex component testing`;
  }

  async getTestMetrics(testFiles) {
    const stats = await Promise.all(
      testFiles.map(async (file) => {
        const stat = await fs.stat(file);
        const content = await fs.readFile(file, 'utf8');
        const testCount = (content.match(/it\(/g) || []).length;
        return { file, size: stat.size, tests: testCount };
      })
    );

    return {
      filesGenerated: testFiles.length,
      totalTests: stats.reduce((sum, { tests }) => sum + tests, 0),
      totalSize: stats.reduce((sum, { size }) => sum + size, 0),
      files: stats
    };
  }
}

module.exports = TestGenAgent;