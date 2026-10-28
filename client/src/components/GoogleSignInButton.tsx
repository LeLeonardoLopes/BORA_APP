import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { api } from '../services/api';

// Login oficial com Google (Google Identity Services).
// Só aparece quando VITE_GOOGLE_CLIENT_ID estiver configurado no client/.env.
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const GOOGLE_LOGIN_HABILITADO = GOOGLE_CLIENT_ID.length > 0;

declare global {
  interface Window {
    google?: any;
  }
}

let carregamentoGsi: Promise<void> | null = null;

function carregarGsi(): Promise<void> {
  if (carregamentoGsi) return carregamentoGsi;
  carregamentoGsi = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      carregamentoGsi = null;
      reject(new Error('Não foi possível carregar o login do Google.'));
    };
    document.head.appendChild(script);
  });
  return carregamentoGsi;
}

export interface GoogleSignInButtonProps {
  onSuccess: (token: string, usuario: any) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!GOOGLE_LOGIN_HABILITADO) return;
    let ativo = true;

    carregarGsi()
      .then(() => {
        if (!ativo || !containerRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resposta: { credential?: string }) => {
            if (!resposta.credential) {
              setErro('O Google não retornou uma credencial. Tente novamente.');
              return;
            }
            try {
              const res = await api.post('/auth/google', { idToken: resposta.credential });
              localStorage.setItem('@bora:token', res.data.token);
              localStorage.setItem('@bora:user', JSON.stringify(res.data.usuario));
              onSuccessRef.current(res.data.token, res.data.usuario);
            } catch (err: any) {
              setErro(err.response?.data?.error || 'Não foi possível entrar com o Google.');
            }
          },
          ux_mode: 'popup',
          auto_select: false,
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
          locale: 'pt-BR',
        });
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message);
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (!GOOGLE_LOGIN_HABILITADO) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
      {erro && (
        <Alert severity="error" sx={{ width: '100%', fontWeight: 600 }}>
          {erro}
        </Alert>
      )}
    </Box>
  );
};

export default GoogleSignInButton;
