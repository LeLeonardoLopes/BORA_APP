import { createTheme } from '@mui/material/styles';

export const getBoraTheme = (mode: 'light' | 'dark' = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3B82F6' : '#0066FF',
        light: isDark ? '#60A5FA' : '#3385FF',
        dark: isDark ? '#1D4ED8' : '#0047B3',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#FFD700',
        light: '#FFE44D',
        dark: '#E6C200',
        contrastText: '#0F172A',
      },
      background: {
        default: isDark ? '#0B0F19' : '#F1F5F9', // Slate 950 ou Slate 100
        paper: isDark ? '#131B2E' : '#FFFFFF',   // Slate 900 ou Branco Puro
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A', // Branco Neve ou Slate 900
        secondary: isDark ? '#94A3B8' : '#64748B', // Slate 400 ou Slate 500
      },
      success: {
        main: '#10B981',
        light: isDark ? '#064E3B' : '#D1FAE5',
      },
      error: {
        main: '#EF4444',
        light: isDark ? '#7F1D1D' : '#FEE2E2',
      },
      warning: {
        main: '#F59E0B',
        light: isDark ? '#78350F' : '#FEF3C7',
      },
    },
    typography: {
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h4: { fontFamily: '"Poppins", sans-serif', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em' },
      h5: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' },
      h6: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.005em' },
      subtitle1: { fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.35 },
      subtitle2: { fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.35 },
      body1: { fontFamily: '"Poppins", sans-serif', fontSize: '0.88rem', lineHeight: 1.45 },
      body2: { fontFamily: '"Poppins", sans-serif', fontSize: '0.80rem', lineHeight: 1.4 },
      caption: { fontFamily: '"Poppins", sans-serif', fontSize: '0.72rem', lineHeight: 1.3 },
      button: { fontFamily: '"Poppins", sans-serif', textTransform: 'none', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
            fontSize: '14px',
            color: isDark ? '#F8FAFC' : '#0F172A',
            backgroundColor: isDark ? '#0B0F19' : '#F1F5F9',
            transition: 'background-color 0.25s ease, color 0.25s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            borderRadius: 12,
            padding: '8px 18px',
            fontSize: '0.82rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          containedPrimary: {
            background: isDark 
              ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
              : 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
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
            borderRadius: 16,
            backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
            border: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: isDark 
              ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' 
              : '0 3px 14px -2px rgba(15, 23, 42, 0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 25px -4px rgba(0, 102, 255, 0.2)' 
                : '0 8px 20px -4px rgba(15, 23, 42, 0.08)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 700,
            borderRadius: 8,
            fontSize: '0.74rem',
          },
          sizeSmall: {
            fontSize: '0.70rem',
            height: '22px',
          },
          sizeMedium: {
            fontSize: '0.76rem',
            height: '28px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: isDark ? '#94A3B8' : '#64748B',
            maxWidth: 'calc(100% - 24px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&.Mui-focused': {
              color: isDark ? '#60A5FA' : '#0066FF',
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            borderRadius: 12,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontSize: '0.84rem',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '& input': {
              padding: '10px 14px',
              fontSize: '0.84rem',
              fontFamily: '"Poppins", sans-serif',
              color: isDark ? '#F8FAFC' : '#0F172A',
            },
            '& input::placeholder': {
              fontSize: '0.80rem',
              color: isDark ? '#64748B' : '#94A3B8',
              opacity: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
            '& fieldset': {
              borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(203, 213, 225, 0.8)',
            },
            '&:hover fieldset': {
              borderColor: isDark ? '#60A5FA' : '#0066FF',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDark ? '#60A5FA' : '#0066FF',
              borderWidth: 2,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0F172A' : '#0066FF',
            borderBottom: isDark ? '1px solid rgba(51, 65, 85, 0.5)' : 'none',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            borderTop: isDark ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
    },
  });
};

export const boraTheme = getBoraTheme('light');
