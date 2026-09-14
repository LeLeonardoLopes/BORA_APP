import { createTheme, alpha } from '@mui/material/styles';

export const getBoraTheme = (mode: 'light' | 'dark' = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
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
        default: isDark ? '#0A0E17' : '#F8FAFC',
        paper: isDark ? '#111827' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A',
        secondary: isDark ? '#94A3B8' : '#64748B',
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
      info: {
        main: '#0284C7',
        light: isDark ? '#075985' : '#E0F2FE',
      },
    },
    typography: {
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontFamily: '"Poppins", sans-serif', fontWeight: 900, fontSize: '2.2rem', letterSpacing: '-0.03em' },
      h2: { fontFamily: '"Poppins", sans-serif', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.025em' },
      h3: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' },
      h4: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.015em' },
      h5: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' },
      h6: { fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: '1.0rem', letterSpacing: '-0.005em' },
      subtitle1: { fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.4 },
      subtitle2: { fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.4 },
      body1: { fontFamily: '"Poppins", sans-serif', fontSize: '0.88rem', lineHeight: 1.5 },
      body2: { fontFamily: '"Poppins", sans-serif', fontSize: '0.80rem', lineHeight: 1.45 },
      caption: { fontFamily: '"Poppins", sans-serif', fontSize: '0.72rem', lineHeight: 1.3 },
      button: { fontFamily: '"Poppins", sans-serif', textTransform: 'none', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
            fontSize: '14px',
            color: isDark ? '#F8FAFC' : '#0F172A',
            backgroundColor: isDark ? '#0A0E17' : '#F8FAFC',
            transition: 'background-color 0.25s ease, color 0.25s ease',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)'
              : '0 4px 20px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: isDark
                ? '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2)'
                : '0 8px 30px rgba(0, 102, 255, 0.12), 0 0 0 1px rgba(0, 102, 255, 0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: '0.84rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.25)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #0066FF 0%, #0047B3 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1A75FF 0%, #003D99 100%)',
              boxShadow: '0 6px 20px rgba(0, 102, 255, 0.45)',
            },
          },
          containedSecondary: {
            background: '#FFD700',
            color: '#0F172A',
            fontWeight: 900,
            boxShadow: '0 4px 14px rgba(255, 215, 0, 0.35)',
            '&:hover': {
              background: '#FFE033',
              boxShadow: '0 6px 20px rgba(255, 215, 0, 0.45)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 700,
            borderRadius: 6,
            fontSize: '0.72rem',
          },
          sizeSmall: {
            fontSize: '0.68rem',
            height: '21px',
          },
          sizeMedium: {
            fontSize: '0.74rem',
            height: '26px',
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
            borderRadius: 8,
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
            '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
              WebkitBoxShadow: isDark
                ? '0 0 0 1000px #1E293B inset !important'
                : '0 0 0 1000px #FFFFFF inset !important',
              boxShadow: isDark
                ? '0 0 0 1000px #1E293B inset !important'
                : '0 0 0 1000px #FFFFFF inset !important',
              WebkitTextFillColor: isDark ? '#F8FAFC !important' : '#0F172A !important',
              caretColor: isDark ? '#F8FAFC !important' : '#0F172A !important',
              borderRadius: 'inherit',
              transition: 'background-color 50000s ease-in-out 0s',
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
