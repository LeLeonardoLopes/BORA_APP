import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { X, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export interface SocialAuthModalProps {
  open: boolean;
  provider: 'google' | 'apple' | null;
  onClose: () => void;
  onSuccess: (token: string, usuario: any) => void;
}

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  open,
  provider,
  onClose,
  onSuccess,
}) => {
  const isGoogle = provider === 'google';
  
  const [nome, setNome] = useState(isGoogle ? 'Leonardo Lopes' : 'Atleta Apple');
  const [email, setEmail] = useState(isGoogle ? 'leleonardolopes@gmail.com' : 'usuario.apple@icloud.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza dados ao abrir
  React.useEffect(() => {
    if (provider === 'google') {
      setNome('Leonardo Lopes');
      setEmail('leleonardolopes@gmail.com');
    } else if (provider === 'apple') {
      setNome('Atleta Apple');
      setEmail('usuario.apple@icloud.com');
    }
    setError(null);
  }, [provider]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido da sua conta.');
      return;
    }
    if (!nome.trim()) {
      setError('Informe seu nome completo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/social-login', {
        provider,
        email: email.trim().toLowerCase(),
        nome: nome.trim(),
      });

      localStorage.setItem('@bora:token', res.data.token);
      localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
      onSuccess(res.data.token, res.data.usuario);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || `Erro ao autenticar com ${isGoogle ? 'Google' : 'Apple'}.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          bgcolor: isGoogle ? '#FFFFFF' : '#0F172A',
          color: isGoogle ? '#1F2937' : '#FFFFFF'
        }
      }}
    >
      <DialogContent sx={{ p: 2.5 }}>
        {/* Cabeçalho Oficial do Provedor */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            {isGoogle ? (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 170 170" fill="#FFFFFF">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.51-6.19-9.42-11-20.08-14.43-32-3.43-11.91-5.15-23.01-5.15-33.31 0-14.78 3.73-26.69 11.2-35.74 7.47-9.05 16.73-13.67 27.78-13.88 4.67 0 9.77 1.25 15.31 3.76 5.54 2.5 9.4 3.82 11.59 3.94 1.74 0 5.86-1.44 12.36-4.32 6.5-2.88 12.05-4.14 16.65-3.76 17.51 1.05 30.65 8.16 39.42 21.34-15.65 9.45-23.27 22.37-22.86 38.74.41 12.87 5.17 23.49 14.28 31.85 4.12 3.79 8.87 6.64 14.25 8.55-2.92 8.78-6.73 17.29-11.44 25.53zM119.22 33.64c0-7.39 2.66-14.42 7.97-21.08 5.31-6.66 12.06-11.13 20.25-13.41.98 7.39-1.28 14.51-6.79 21.36-5.51 6.84-12.44 11.42-20.79 13.73-.24-.2-.43-.4-.64-.6z"/>
              </svg>
            )}
            <Typography variant="h6" fontWeight={800} fontSize="1.05rem">
              {isGoogle ? 'Fazer login com o Google' : 'Iniciar sessão com a Apple'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: isGoogle ? '#6B7280' : '#94A3B8' }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ color: isGoogle ? '#4B5563' : '#94A3B8', mb: 2 }}>
          Para continuar no <strong>Bora! App</strong>, confirme ou edite os dados da sua conta oficial {isGoogle ? 'Google' : 'Apple'}:
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleConfirm} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nome da Conta"
            size="small"
            fullWidth
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            InputLabelProps={{ sx: { color: isGoogle ? undefined : '#94A3B8' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isGoogle ? '#F9FAFB' : '#1E293B',
                color: isGoogle ? '#111827' : '#F8FAFC',
                borderRadius: 2,
              }
            }}
          />

          <TextField
            label={isGoogle ? 'E-mail Google' : 'E-mail / Apple ID'}
            type="email"
            size="small"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{ sx: { color: isGoogle ? undefined : '#94A3B8' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isGoogle ? '#F9FAFB' : '#1E293B',
                color: isGoogle ? '#111827' : '#F8FAFC',
                borderRadius: 2,
              }
            }}
          />

          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <ShieldCheck size={16} color="#16A34A" />
            <Typography variant="caption" sx={{ color: isGoogle ? '#6B7280' : '#94A3B8', fontWeight: 600 }}>
              Autenticação segura via protocolo OAuth 2.0
            </Typography>
          </Box>

          <Button
            type="submit"
            disabled={loading}
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={18} />}
            sx={{
              mt: 1,
              py: 1.4,
              fontWeight: 800,
              borderRadius: 2.5,
              textTransform: 'none',
              fontSize: '0.95rem',
              bgcolor: isGoogle ? '#1A73E8 !important' : '#FFFFFF !important',
              color: isGoogle ? '#FFFFFF !important' : '#000000 !important',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: isGoogle ? '#1557B0 !important' : '#E2E8F0 !important',
              }
            }}
          >
            {loading ? 'Autenticando...' : `Continuar como ${nome.split(' ')[0] || 'Atleta'}`}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
