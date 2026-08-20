import { createTheme } from '@mui/material/styles';

export const boraTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066FF',
      light: '#3385FF',
      dark: '#0047B3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD700',
      light: '#FFE44D',
      dark: '#E6C200',
      contrastText: '#0F172A',
    },
    background: {
      default: '#F1F5F9', // Slate 100 sutil
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
    },
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 900, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 800 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    body1: { fontSize: '0.95rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.45 },
    button: { textTransform: 'none', fontWeight: 800, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '12px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.18)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
        },
        containedSecondary: {
          background: '#FFD700',
          color: '#0F172A',
          '&:hover': {
            background: '#FFE033',
            boxShadow: '0 4px 16px rgba(255, 215, 0, 0.35)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover fieldset': {
              borderColor: '#0066FF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0066FF',
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
});
