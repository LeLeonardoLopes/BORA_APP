import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { Box, Button, Typography, Container, Paper } from '@mui/material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 [ErrorBoundary Capturou Erro]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem('@bora:token');
    localStorage.removeItem('@bora:user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            minHeight: '100vh', 
            bgcolor: '#0F172A', 
            color: '#FFFFFF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3 
          }}
        >
          <Container maxWidth="sm">
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#1E293B', color: '#FFFFFF', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={900} color="#EF4444" mb={1}>
                ⚠️ Ops! Ocorreu uma instabilidade na interface
              </Typography>
              <Typography variant="body2" color="#94A3B8" mb={2}>
                O sistema capturou o seguinte detalhe técnico:
              </Typography>
              
              <Box 
                sx={{ 
                  bgcolor: '#0A0E17', 
                  p: 2, 
                  borderRadius: 2, 
                  textAlign: 'left', 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem',
                  color: '#F87171',
                  overflowX: 'auto',
                  mb: 3
                }}
              >
                {this.state.error?.toString() || 'Erro desconhecido'}
              </Box>

              <Box display="flex" gap={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  sx={{ fontWeight: 800, borderRadius: 2.5 }}
                >
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={this.handleReset}
                  sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 800, borderRadius: 2.5 }}
                >
                  Limpar Sessão e Recarregar
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);

