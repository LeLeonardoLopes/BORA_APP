import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Alert,
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material';
import { Check, X as XIcon, ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react';
import { BoraLogoSVG } from '../components/BoraLogoSVG';
import { SocialAuthModal } from '../components/SocialAuthModal';
import { api } from '../services/api';
import { MenuItem, Select, FormControl } from '@mui/material';

export interface AuthScreenProps {
  onLoginSuccess: (token: string, usuario: any) => void;
}

// Formatador e validador de CPF no Frontend
export function formatarCPF(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11);
  if (limpo.length <= 3) return limpo;
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

export function validarCPFFrontend(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  let resto = 11 - (soma % 11);
  const dig1 = resto === 10 || resto === 11 ? 0 : resto;
  if (dig1 !== parseInt(limpo.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  resto = 11 - (soma % 11);
  const dig2 = resto === 10 || resto === 11 ? 0 : resto;
  return dig2 === parseInt(limpo.charAt(10), 10);
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [etapaCadastro, setEtapaCadastro] = useState<'formulario' | 'codigo'>('formulario');

  // Campos de Cadastro / Login
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [genero, setGenero] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [codigoDev, setCodigoDev] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'apple' | null>(null);

  // Validações de Senha
  const temMinimo6 = senha.length >= 6;
  const temNumero = /\d/.test(senha);
  const temEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha);
  const senhaValida = temMinimo6 && temNumero && temEspecial;

  // Validação de CPF
  const cpfValido = cpf.length === 0 || validarCPFFrontend(cpf);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCPF(e.target.value);
    setCpf(formatado);
  };

  // Passo 1 do Cadastro: Enviar Código de Verificação
  const handleAvancarParaCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo || !senha) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cpf.trim().length > 0 && !validarCPFFrontend(cpf)) {
      setError('CPF inválido. Verifique os números informados.');
      return;
    }

    if (!senhaValida) {
      setError('A senha não cumpre todos os requisitos de segurança.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/send-code', {
        email: emailLimpo,
        cpf: cpf.trim() || undefined,
      });

      setCodigoDev(res.data.codigoDev || null);
      setEtapaCadastro('codigo');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao enviar código de verificação. Verifique seu e-mail.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Passo 2 do Cadastro: Confirmar Código e Criar Conta
  const handleConfirmarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (codigoOtp.trim().length !== 6) {
      setError('Digite o código completo de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const emailLimpo = email.trim().toLowerCase();
      const res = await api.post('/auth/register', {
        nome: nome.trim(),
        cpf: cpf.trim() || undefined,
        email: emailLimpo,
        senha,
        genero,
        codigoVerificacao: codigoOtp.trim(),
        raioBuscaKm: 5,
      });

      localStorage.setItem('@bora:token', res.data.token);
      localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
      onLoginSuccess(res.data.token, res.data.usuario);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Código incorreto ou expirado. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login Tradicional
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !senha) {
      setError('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: emailLimpo,
        senha,
      });

      localStorage.setItem('@bora:token', res.data.token);
      localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
      onLoginSuccess(res.data.token, res.data.usuario);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao autenticar. Verifique seu e-mail e senha.';
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
        {/* LOGO */}
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
            {modo === 'login' ? 'LOGIN' : (etapaCadastro === 'formulario' ? 'CRIAR UMA CONTA' : 'CONFIRMAR E-MAIL')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>
            {error}
          </Alert>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 1. MODO: LOGIN TRADICIONAL                                    */}
        {/* ------------------------------------------------------------- */}
        {modo === 'login' && (
          <Box component="form" onSubmit={handleLogin} display="flex" flexDirection="column" gap={2}>
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR'}
            </Button>

            {/* BOTÕES SOCIAIS OFICIAIS */}
            <Button 
              onClick={() => setSocialModalProvider('google')}
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
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              Continuar com o Google
            </Button>

            <Button 
              onClick={() => setSocialModalProvider('apple')}
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
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              Continuar com a Apple
            </Button>

            <Box textAlign="center" mt={3}>
              <Typography 
                variant="body2" 
                sx={{ color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setModo('cadastro');
                  setEtapaCadastro('formulario');
                  setError(null);
                }}
              >
                Não tem uma conta? Cadastre-se já!
              </Typography>
            </Box>
          </Box>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. MODO: CADASTRO - PASSO 1 (FORMULÁRIO DE DADOS + CPF)        */}
        {/* ------------------------------------------------------------- */}
        {modo === 'cadastro' && etapaCadastro === 'formulario' && (
          <Box component="form" onSubmit={handleAvancarParaCodigo} display="flex" flexDirection="column" gap={2}>
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

            <TextField 
              placeholder="CPF (000.000.000-00)" 
              fullWidth 
              value={cpf}
              onChange={handleCpfChange}
              error={cpf.length > 0 && !cpfValido}
              helperText={cpf.length > 0 && !cpfValido ? 'CPF inválido' : undefined}
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-input': { fontWeight: 700, color: '#0F172A', textAlign: 'center', py: 1.8 },
                '& .MuiFormHelperText-root': { color: '#FFD700', fontWeight: 700, textAlign: 'center' }
              }}
            />

            <FormControl fullWidth sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}>
              <Select
                value={genero}
                onChange={(e) => setGenero(e.target.value as any)}
                displayEmpty
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  textAlign: 'center',
                  '& .MuiSelect-select': { py: 1.8, textAlign: 'center' },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                }}
              >
                <MenuItem value="Feminino" sx={{ fontWeight: 700 }}>👩 Gênero: Feminino (Proteção RN06)</MenuItem>
                <MenuItem value="Masculino" sx={{ fontWeight: 700 }}>👨 Gênero: Masculino</MenuItem>
                <MenuItem value="Outro" sx={{ fontWeight: 700 }}>🧑 Gênero: Outro</MenuItem>
              </Select>
            </FormControl>

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

            {/* CHECKLIST DE FORÇA DE SENHA */}
            {senha.length > 0 && (
              <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', p: 1.5, borderRadius: 2, backdropFilter: 'blur(4px)' }}>
                <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 800, display: 'block', mb: 0.5 }}>
                  Requisitos de Senha:
                </Typography>
                <Stack spacing={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {temMinimo6 ? <Check size={14} color="#4ADE80" strokeWidth={3} /> : <XIcon size={14} color="#FFAAAA" strokeWidth={3} />}
                    <Typography variant="caption" sx={{ color: temMinimo6 ? '#FFFFFF' : '#FFAAAA', fontWeight: 600 }}>
                      Mínimo de 6 caracteres
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {temNumero ? <Check size={14} color="#4ADE80" strokeWidth={3} /> : <XIcon size={14} color="#FFAAAA" strokeWidth={3} />}
                    <Typography variant="caption" sx={{ color: temNumero ? '#FFFFFF' : '#FFAAAA', fontWeight: 600 }}>
                      Pelo menos 1 número (0-9)
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {temEspecial ? <Check size={14} color="#4ADE80" strokeWidth={3} /> : <XIcon size={14} color="#FFAAAA" strokeWidth={3} />}
                    <Typography variant="caption" sx={{ color: temEspecial ? '#FFFFFF' : '#FFAAAA', fontWeight: 600 }}>
                      Pelo menos 1 caractere especial (@, #, $, !, etc.)
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Button 
              type="submit" 
              disabled={loading || !senhaValida || (cpf.length > 0 && !cpfValido)}
              sx={{ 
                backgroundColor: '#FFFFFF !important', 
                color: '#000000 !important', 
                py: 1.8, 
                fontWeight: 900, 
                fontSize: '1rem',
                borderRadius: 2.5,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12) !important',
                '&:disabled': {
                  opacity: 0.6,
                  backgroundColor: '#E2E8F0 !important',
                  color: '#64748B !important'
                },
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'AVANÇAR (ENVIAR CÓDIGO)'}
            </Button>

            {/* BOTÕES SOCIAIS */}
            <Button 
              onClick={() => setSocialModalProvider('google')}
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
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              Continuar com o Google
            </Button>

            <Button 
              onClick={() => setSocialModalProvider('apple')}
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
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              Continuar com a Apple
            </Button>

            <Box textAlign="center" mt={2}>
              <Typography 
                variant="body2" 
                sx={{ color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setModo('login');
                  setError(null);
                }}
              >
                Já tem uma conta? Faça login aqui!
              </Typography>
            </Box>
          </Box>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. MODO: CADASTRO - PASSO 2 (DIGITAÇÃO DO CÓDIGO OTP)          */}
        {/* ------------------------------------------------------------- */}
        {modo === 'cadastro' && etapaCadastro === 'codigo' && (
          <Box component="form" onSubmit={handleConfirmarCadastro} display="flex" flexDirection="column" gap={2.5}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                p: 2.5, 
                borderRadius: 3, 
                textAlign: 'center',
                backdropFilter: 'blur(6px)' 
              }}
            >
              <MailCheck size={36} color="#FFD700" style={{ margin: '0 auto 8px auto' }} />
              <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
                Verifique sua caixa de entrada
              </Typography>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block' }}>
                Enviamos um código de 6 dígitos para:
              </Typography>
              <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 800, mt: 0.5 }}>
                {email}
              </Typography>
            </Box>

            {/* AVISO DO CÓDIGO NO AMBIENTE DE TESTE / DEV */}
            {codigoDev && (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: '#EFF6FF', 
                  color: '#1E40AF',
                  fontWeight: 700,
                  fontSize: '0.88rem' 
                }}
              >
                💡 Código de Teste: <strong>{codigoDev}</strong>
              </Alert>
            )}

            <TextField 
              placeholder="0 0 0 0 0 0" 
              fullWidth 
              required 
              inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.4rem' } }}
              value={codigoOtp}
              onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiInputBase-input': { fontWeight: 900, color: '#0F172A', py: 1.8 },
              }}
            />

            <Button 
              type="submit" 
              disabled={loading || codigoOtp.length !== 6}
              sx={{ 
                backgroundColor: '#FFFFFF !important', 
                color: '#000000 !important', 
                py: 1.8, 
                fontWeight: 900, 
                fontSize: '1rem',
                borderRadius: 2.5,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12) !important',
                '&:disabled': { opacity: 0.6, backgroundColor: '#E2E8F0 !important' },
                '&:hover': { backgroundColor: '#F8FAFC !important' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'CONCLUIR CADASTRO'}
            </Button>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Button 
                startIcon={<ArrowLeft size={16} />}
                onClick={() => setEtapaCadastro('formulario')}
                sx={{ color: '#FFFFFF', fontWeight: 700, textTransform: 'none' }}
              >
                Alterar dados
              </Button>

              <Button 
                onClick={handleAvancarParaCodigo}
                disabled={loading}
                sx={{ color: '#FFD700', fontWeight: 800, textTransform: 'none' }}
              >
                Reenviar código
              </Button>
            </Box>
          </Box>
        )}

        {/* MODAL OFICIAL SOCIAL OAUTH (GOOGLE / APPLE) */}
        <SocialAuthModal
          open={socialModalProvider !== null}
          provider={socialModalProvider}
          onClose={() => setSocialModalProvider(null)}
          onSuccess={onLoginSuccess}
        />
      </Container>
    </Box>
  );
};
