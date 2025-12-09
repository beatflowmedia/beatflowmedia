import { createTheme } from '@mui/material/styles';

/**
 * Unified Material-UI Theme for BeatFlow
 * Matches the design system defined in index.css
 */

export const beatflowTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1db954', // var(--bf-green)
      light: '#1ed760', // var(--bf-green-hover)
      dark: '#1aa34a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4d75f0', // var(--bf-blue)
      light: '#6b8ef5',
      dark: '#3d5ec7',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e22134', // var(--bf-red)
      light: '#e85563',
      dark: '#b51a29',
    },
    background: {
      default: '#0a0e14', // var(--bf-bg-app)
      paper: '#1f2937',   // var(--bf-bg-card)
    },
    text: {
      primary: '#f9fafb',   // var(--bf-text-primary)
      secondary: '#d1d5db', // var(--bf-text-secondary)
      disabled: '#9ca3af',  // var(--bf-text-muted)
    },
    divider: '#374151', // var(--bf-bg-hover)
    action: {
      active: '#f9fafb',
      hover: 'rgba(249, 250, 251, 0.08)',
      selected: 'rgba(29, 185, 84, 0.16)',
      disabled: 'rgba(249, 250, 251, 0.3)',
      disabledBackground: 'rgba(249, 250, 251, 0.12)',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          padding: '8px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(29, 185, 84, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(249, 250, 251, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
  },
});

export default beatflowTheme;
