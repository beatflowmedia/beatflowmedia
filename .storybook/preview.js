/** @type { import('@storybook/react-webpack5').Preview } */
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { DesignSystemProvider } from '../src/design/ThemeProvider';
import { designTokens } from '../src/design/tokens';

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'BeatFlowMedia Design System',
        brandUrl: 'https://beatflowmediagroup.com',
        fontBase: designTokens.typography.fontFamily.sans.join(', '),
        fontCode: designTokens.typography.fontFamily.mono.join(', '),
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'light',
          value: designTokens.colors.white,
        },
        {
          name: 'dark',
          value: designTokens.colors.surface[900],
        },
        {
          name: 'surface-light',
          value: designTokens.colors.surface[50],
        },
        {
          name: 'surface-dark',
          value: designTokens.colors.surface[800],
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '720px',
          },
        },
        desktopLarge: {
          name: 'Large Desktop',
          styles: {
            width: '1536px',
            height: '864px',
          },
        },
      },
    },
  },

  decorators: [
    (Story, context) => {
      // Get theme mode from global theme or default to dark
      const mode = context.globals.theme || 'dark';

      return (
        <DesignSystemProvider defaultMode={mode}>
          <CssBaseline />
          <div style={{
            padding: '1rem',
            minHeight: '100vh',
            fontFamily: designTokens.typography.fontFamily.sans.join(', ')
          }}>
            <Story />
          </div>
        </DesignSystemProvider>
      );
    },
  ],

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;