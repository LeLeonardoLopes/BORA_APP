import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { BoraLogoSVG } from '../components/BoraLogoSVG';
import { api } from '../services/api';

export interface AuthScreenProps {
  onLoginSuccess: (token: string, usuario: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !senha) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);

    try {
      if (modo === 'cadastro') {
        if (!nome) {
          setError('Por favor, preencha seu nome completo.');
          setLoading(false);
          return;
        }

        const res = await api.post('/auth/register', {
          nome,
          email,
          senha,
          genero: 'Misto',
          dataNascimento: '2000-01-01',
          raioBuscaKm: 5,
        });

        localStorage.setItem('@bora:token', res.data.token);
        localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
        onLoginSuccess(res.data.token, res.data.usuario);
      } else {
        const res = await api.post('/auth/login', {
          email,
          senha,
        });

        localStorage.setItem('@bora:token', res.data.token);
        localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
        onLoginSuccess(res.data.token, res.data.usuario);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao autenticar. Verifique seu e-mail e senha ou se o backend está ligado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: '#0066FF',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 3,
        py: 4
      }}
    >
      <Container maxWidth="xs" sx={{ p: 0 }}>
        {/* LOGO NATIVO 100% VETORIAL */}
        <Box textAlign="center" mb={3}>
          <BoraLogoSVG />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 900, 
              color: '#FFD700',
              letterSpacing: -0.5,
              mt: 2,
              textTransform: 'uppercase'
            }}
          >
            {modo === 'login' ? 'LOGIN' : 'CRIAR UMA CONTA'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>{error}</Alert>}

        {/* FORMULÁRIO COM TODOS OS BOTÕES BRANCOS OPACOS */}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          {modo === 'cadastro' && (
            <TextField 
              placeholder="Nome Completo" 
              fullWidth 
              required 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-input': { fontWeight: 700, color: '#0F172A', textAlign: 'center', py: 1.8 },
              }}
            />
          )}

          <TextField 
            placeholder="EMAIL" 
            type="email" 
            fullWidth 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiInputBase-input': { fontWeight: 800, color: '#0F172A', textAlign: 'center', py: 1.8 },
            }}
          />

          <TextField 
            placeholder="SENHA" 
            type="password" 
            fullWidth 
            required 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiInputBase-input': { fontWeight: 800, color: '#0F172A', textAlign: 'center', py: 1.8 },
            }}
          />

          {/* 1. BOTÃO ENTRAR / CADASTRAR BRANCO */}
          <Button 
            type="submit" 
            disabled={loading}
            sx={{ 
              backgroundColor: '#FFFFFF !important', 
              color: '#000000 !important', 
              py: 1.8, 
              fontWeight: 900, 
              fontSize: '1rem',
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(0,0,0,0.12) !important',
              '&:hover': { 
                backgroundColor: '#F8FAFC !important',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (modo === 'login' ? 'ENTRAR' : 'CADASTRAR')}
          </Button>

          {/* 2. BOTÃO GOOGLE BRANCO */}
          <Button 
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            }
            sx={{ 
              backgroundColor: '#FFFFFF !important', 
              color: '#000000 !important', 
              py: 1.6, 
              fontWeight: 800, 
              fontSize: '0.95rem',
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12) !important',
              '&:hover': { 
                backgroundColor: '#F8FAFC !important',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Continuar com o Google
          </Button>

          {/* 3. BOTÃO APPLE BRANCO */}
          <Button 
            startIcon={
              <svg width="20" height="20" viewBox="0 0 170 170" fill="#000">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.51-6.19-9.42-11-20.08-14.43-32-3.43-11.91-5.15-23.01-5.15-33.31 0-14.78 3.73-26.69 11.2-35.74 7.47-9.05 16.73-13.67 27.78-13.88 4.67 0 9.77 1.25 15.31 3.76 5.54 2.5 9.4 3.82 11.59 3.94 1.74 0 5.86-1.44 12.36-4.32 6.5-2.88 12.05-4.14 16.65-3.76 17.51 1.05 30.65 8.16 39.42 21.34-15.65 9.45-23.27 22.37-22.86 38.74.41 12.87 5.17 23.49 14.28 31.85 4.12 3.79 8.87 6.64 14.25 8.55-2.92 8.78-6.73 17.29-11.44 25.53zM119.22 33.64c0-7.39 2.66-14.42 7.97-21.08 5.31-6.66 12.06-11.13 20.25-13.41.98 7.39-1.28 14.51-6.79 21.36-5.51 6.84-12.44 11.42-20.79 13.73-.24-.2-.43-.4-.64-.6z"/>
              </svg>
            }
            sx={{ 
              backgroundColor: '#FFFFFF !important', 
              color: '#000000 !important', 
              py: 1.6, 
              fontWeight: 800, 
              fontSize: '0.95rem',
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12) !important',
              '&:hover': { 
                backgroundColor: '#F8FAFC !important',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Continuar com a Apple
          </Button>

          <Box textAlign="center" mt={3}>
            <Typography 
              variant="body2" 
              sx={{ color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                setModo(modo === 'login' ? 'cadastro' : 'login');
                setError(null);
              }}
            >
              {modo === 'login' ? 'Não tem uma conta? Cadastre-se já!' : 'Já tem uma conta? Faça login aqui!'}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
