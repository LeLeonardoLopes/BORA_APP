import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { SocialAuthModal } from './SocialAuthModal';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';
export const GOOGLE_LOGIN_HABILITADO = GOOGLE_CLIENT_ID.length > 0;

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let gisCarregamentoPromise: Promise<void> | null = null;

const gis = (): any => (window as any).google;

function carregarScriptGoogle(): Promise<void> {
  if (typeof window !== 'undefined' && gis()?.accounts?.id) {
    return Promise.resolve();
  }
  if (gisCarregamentoPromise) {
    return gisCarregamentoPromise;
  }

  gisCarregamentoPromise = new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar Google Identity Services.')));
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisCarregamentoPromise = null;
      reject(new Error('Falha ao carregar Google Identity Services.'));
    };
    document.head.appendChild(script);
  });

  return gisCarregamentoPromise;
}

export interface GoogleSignInButtonProps {
  onSuccess: (token: string, usuario: any) => void;
  onError?: (mensagem: string) => void;
  disabled?: boolean;
  emailPreenchido?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError = () => {},
  disabled,
  emailPreenchido = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const [autenticando, setAutenticando] = useState(false);
  const [modalSocialOpen, setModalSocialOpen] = useState(false);
  const [modoRecuperacaoSocial, setModoRecuperacaoSocial] = useState(false);

  useEffect(() => {
    if (!GOOGLE_LOGIN_HABILITADO) return;

    let cancelado = false;

    carregarScriptGoogle()
      .then(() => {
        if (cancelado || !containerRef.current || !gis()?.accounts?.id) return;

        gis().accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (!response?.credential) {
              onErrorRef.current('O Google não retornou a credencial de login.');
              return;
            }
            setAutenticando(true);
            try {
              const res = await api.post('/auth/google', { idToken: response.credential });
              localStorage.setItem('@bora:token', res.data.token);
              localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
              onSuccessRef.current(res.data.token, res.data.usuario);
            } catch (err: any) {
              const msg = err.response?.data?.error || 'Não foi possível entrar com o Google.';
              onErrorRef.current(msg);
            } finally {
              if (!cancelado) setAutenticando(false);
            }
          },
        });

        containerRef.current.innerHTML = '';
        const largura = Math.min(Math.max(containerRef.current.clientWidth || 320, 220), 400);
        gis().accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: largura,
        });
      })
      .catch(() => {
        // Caso o script GIS falhe ou esteja offline, os botões de OAuth Demo continuam disponíveis abaixo
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Se VITE_GOOGLE_CLIENT_ID estiver configurado no .env, renderiza também o botão GIS nativo */}
      {GOOGLE_LOGIN_HABILITADO && (
        <Box
          sx={{
            position: 'relative',
            minHeight: 42,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: disabled || autenticando ? 0.5 : 1,
            pointerEvents: disabled || autenticando ? 'none' : 'auto',
          }}
        >
          <Box ref={containerRef} sx={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
          {autenticando && (
            <CircularProgress size={20} sx={{ position: 'absolute', color: '#38BDF8' }} />
          )}
        </Box>
      )}

      {/* Botão Principal "Continuar com o Google" (Sempre visível, funciona com ou sem chave de API para testes de TCC) */}
      <Button
        fullWidth
        disabled={disabled || autenticando}
        onClick={() => {
          setModoRecuperacaoSocial(false);
          setModalSocialOpen(true);
        }}
        startIcon={
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        }
        sx={{
          py: 1.25,
          fontWeight: 800,
          borderRadius: 2.5,
          textTransform: 'none',
          bgcolor: '#FFFFFF !important',
          color: '#1E293B !important',
          border: '1px solid #E2E8F0 !important',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          '&:hover': {
            bgcolor: '#F8FAFC !important',
            transform: 'translateY(-1px)',
          },
        }}
      >
        Continuar com o Google
      </Button>

      {/* Botão de Recuperar Acesso pelo Google */}
      <Button
        fullWidth
        disabled={disabled || autenticando}
        onClick={() => {
          setModoRecuperacaoSocial(true);
          setModalSocialOpen(true);
        }}
        startIcon={<KeyRound size={16} color="#FFD700" />}
        sx={{
          py: 1.1,
          fontWeight: 800,
          borderRadius: 2.5,
          textTransform: 'none',
          fontSize: '0.85rem',
          bgcolor: 'rgba(255, 255, 255, 0.14) !important',
          color: '#FFFFFF !important',
          border: '1.5px solid rgba(255, 215, 0, 0.65) !important',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.24) !important',
          },
        }}
      >
        Recuperar Acesso pelo Google
      </Button>

      <SocialAuthModal
        open={modalSocialOpen}
        provider="google"
        modoRecuperacao={modoRecuperacaoSocial}
        emailInicial={emailPreenchido}
        onClose={() => setModalSocialOpen(false)}
        onSuccess={onSuccess}
      />
    </Box>
  );
};
