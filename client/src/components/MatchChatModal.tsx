import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Chip,
  Alert,
  Skeleton,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  X, 
  Send, 
  MessageSquare, 
  Lock, 
  Calendar, 
  MapPin, 
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface ChatMessage {
  id: string;
  partidaId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto?: string | null;
  texto: string;
  criadoEm: string;
}

export interface MatchChatModalProps {
  open: boolean;
  onClose: () => void;
  partidaId: string;
  esporte: string;
  bairro: string;
  dataHora: string;
  statusPartida?: 'Publicada' | 'Lotada' | 'Em_Andamento' | 'Finalizada' | 'Cancelada';
  usuarioLogado: {
    id: string;
    nome: string;
    fotoUrl?: string | null;
  };
}

export const MatchChatModal: React.FC<MatchChatModalProps> = ({
  open,
  onClose,
  partidaId,
  esporte,
  bairro,
  dataHora,
  statusPartida = 'Publicada',
  usuarioLogado,
}) => {
  const queryClient = useQueryClient();
  const [textoMensagem, setTextoMensagem] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFinalizadaOuCancelada = statusPartida === 'Finalizada' || statusPartida === 'Cancelada';

  // 1. TanStack Query: Buscar histórico de mensagens
  const {
    data: mensagens = [],
    isLoading,
    isError,
    refetch
  } = useQuery<ChatMessage[]>({
    queryKey: ['match-chat', partidaId],
    queryFn: async () => {
      if (!partidaId) return [];
      const response = await api.get(`/matches/${partidaId}/messages`);
      return response.data?.data || [];
    },
    enabled: open && Boolean(partidaId),
    refetchInterval: false,
    staleTime: 1000 * 10,
  });

  // 2. Conexão WebSocket em Tempo Real
  useEffect(() => {
    if (!open || !partidaId) return;

    let ws: WebSocket | null = null;

    try {
      const wsUrl = `ws://localhost:3333/ws?usuarioId=${usuarioLogado.id}&partidaId=${partidaId}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'join_room',
              partidaId,
              usuarioId: usuarioLogado.id,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'chat_message' && payload.payload) {
            const novaMsg = payload.payload;
            if (novaMsg.partidaId === partidaId) {
              queryClient.setQueryData<ChatMessage[]>(['match-chat', partidaId], (antigas = []) => {
                if (antigas.some((m) => m.id === novaMsg.id)) {
                  return antigas;
                }
                return [...antigas, novaMsg];
              });
            }
          }
        } catch {
          // mensagem não json, ignorar
        }
      };

      ws.onerror = (err) => {
        console.warn('[MatchChat WebSocket] Erro na conexão:', err);
      };
    } catch (e) {
      console.warn('[MatchChat WebSocket] Falha ao instanciar:', e);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [open, partidaId, usuarioLogado.id, queryClient]);

  // 3. Auto-scroll ao receber novas mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(scrollToBottom, 120);
      return () => clearTimeout(timer);
    }
  }, [mensagens, open]);

  // 4. TanStack Mutation para enviar mensagem
  const mutationEnviar = useMutation({
    mutationFn: async (conteudo: string) => {
      const response = await api.post(`/matches/${partidaId}/messages`, {
        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioFoto: usuarioLogado.fotoUrl,
        texto: conteudo,
      });
      return response.data?.data;
    },
    onSuccess: (novaMsg) => {
      if (novaMsg) {
        queryClient.setQueryData<ChatMessage[]>(['match-chat', partidaId], (antigas = []) => {
          if (antigas.some((m) => m.id === novaMsg.id)) {
            return antigas;
          }
          return [...antigas, novaMsg];
        });
      }
      setTextoMensagem('');
      setTimeout(scrollToBottom, 100);
    },
    onError: (err: any) => {
      console.error('Erro ao enviar mensagem:', err);
    },
  });

  const handleEnviar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textoLimpo = textoMensagem.trim();
    if (!textoLimpo || isFinalizadaOuCancelada || mutationEnviar.isPending) return;

    mutationEnviar.mutate(textoLimpo);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatarHora = (isoDate: string) => {
    try {
      const data = new Date(isoDate);
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const dataFormatadaHeader = useMemo(() => {
    try {
      return new Date(dataHora).toLocaleString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataHora;
    }
  }, [dataHora]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          height: { xs: '90vh', sm: '720px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#0F172A',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        },
      }}
    >
      {/* Header Imersivo Bora! App */}
      <DialogTitle
        sx={{
          p: 2,
          bgcolor: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.2}>
            <Avatar
              sx={{
                bgcolor: '#0066FF',
                color: '#FFD700',
                width: 40,
                height: 40,
                boxShadow: '0 4px 12px rgba(0,102,255,0.4)',
              }}
            >
              <MessageSquare size={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15 }}>
                Mural da Partida
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                {esporte}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={statusPartida}
              size="small"
              sx={{
                fontWeight: 900,
                fontSize: '0.72rem',
                bgcolor:
                  statusPartida === 'Finalizada'
                    ? '#334155'
                    : statusPartida === 'Cancelada'
                    ? '#991B1B'
                    : '#0066FF',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
              <X size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* Informações rápidas da partida */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            px: 1.5,
            py: 0.8,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <Calendar size={13} color="#FFD700" />
            <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.75rem' }}>
              {dataFormatadaHeader}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <MapPin size={13} color="#60A5FA" />
            <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.75rem' }}>
              {bairro}, Franca/SP
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Banner de Partida Finalizada / Cancelada */}
      {isFinalizadaOuCancelada && (
        <Alert
          severity="warning"
          icon={<Lock size={16} />}
          sx={{
            borderRadius: 0,
            bgcolor: '#451A03',
            color: '#FDE68A',
            py: 0.5,
            px: 2,
            borderBottom: '1px solid #78350F',
            '& .MuiAlert-icon': { color: '#FDE68A' },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800 }}>
            🔒 Partida {statusPartida.toLowerCase()}. O chat está em modo <strong>somente leitura</strong>.
          </Typography>
        </Alert>
      )}

      {/* Conteúdo de Mensagens com Auto-Scroll */}
      <DialogContent
        sx={{
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#0B1120',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: '#0F172A' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: '4px' },
        }}
      >
        {isLoading ? (
          <Box display="flex" flexDirection="column" gap={2} p={1}>
            <Skeleton variant="rounded" width="60%" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
            <Skeleton variant="rounded" width="70%" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.06)', alignSelf: 'flex-end', borderRadius: 3 }} />
            <Skeleton variant="rounded" width="50%" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
          </Box>
        ) : isError ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={1}>
            <Typography variant="body2" sx={{ color: '#F87171', fontWeight: 700 }}>
              Não foi possível carregar as mensagens.
            </Typography>
            <Button size="small" variant="outlined" onClick={() => refetch()} sx={{ color: '#93C5FD', borderColor: '#3B82F6', textTransform: 'none' }}>
              Tentar Novamente
            </Button>
          </Box>
        ) : mensagens.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            textAlign="center"
            px={2}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(0,102,255,0.15)',
                color: '#60A5FA',
                mb: 1.5,
                border: '1px dashed #2563EB',
              }}
            >
              <Sparkles size={26} />
            </Avatar>
            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5 }}>
              Nenhuma mensagem no mural ainda!
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', maxWidth: 300 }}>
              Combine uniformes, confirmação de presença, caronas e detalhes do racha com os outros atletas.
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.8}>
            {mensagens.map((msg, index) => {
              const isMinha = msg.usuarioId === usuarioLogado.id;
              return (
                <Box
                  key={msg.id || index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMinha ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  {/* Nome do autor (se for de outro atleta) */}
                  {!isMinha && (
                    <Box display="flex" alignItems="center" gap={0.8} mb={0.4} pl={0.5}>
                      <Avatar
                        src={msg.usuarioFoto || undefined}
                        sx={{
                          width: 20,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: '#0066FF',
                          fontWeight: 900,
                        }}
                      >
                        {msg.usuarioNome ? msg.usuarioNome.charAt(0) : 'A'}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.72rem' }}>
                        {msg.usuarioNome}
                      </Typography>
                    </Box>
                  )}

                  {/* Balão de Mensagem */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.4,
                      px: 1.8,
                      maxWidth: '82%',
                      borderRadius: isMinha ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      bgcolor: isMinha ? '#0066FF' : '#1E293B',
                      color: '#FFFFFF',
                      border: isMinha ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isMinha
                        ? '0 4px 14px rgba(0,102,255,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.88rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.texto}
                    </Typography>

                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      alignItems="center"
                      gap={0.4}
                      mt={0.4}
                      sx={{ opacity: 0.75 }}
                    >
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: isMinha ? '#BFDBFE' : '#94A3B8' }}>
                        {formatarHora(msg.criadoEm)}
                      </Typography>
                      {isMinha && <CheckCheck size={12} color="#FFD700" />}
                    </Box>
                  </Paper>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>

      {/* Input de Envio de Mensagem */}
      <Box
        component="form"
        onSubmit={handleEnviar}
        sx={{
          p: 1.5,
          bgcolor: '#0F172A',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={
            isFinalizadaOuCancelada
              ? 'Chat encerrado para esta partida.'
              : 'Digite sua mensagem no mural...'
          }
          disabled={isFinalizadaOuCancelada}
          value={textoMensagem}
          onChange={(e) => setTextoMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1E293B',
              borderRadius: 3,
              color: '#FFFFFF',
              fontSize: '0.88rem',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.15)',
              },
              '&:hover fieldset': {
                borderColor: '#0066FF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0066FF',
              },
            },
          }}
        />

        <Tooltip title={isFinalizadaOuCancelada ? 'Partida finalizada' : 'Enviar Mensagem'}>
          <span>
            <IconButton
              type="submit"
              disabled={isFinalizadaOuCancelada || !textoMensagem.trim() || mutationEnviar.isPending}
              sx={{
                bgcolor: '#0066FF',
                color: '#FFFFFF',
                width: 42,
                height: 42,
                '&:hover': { bgcolor: '#0052CC' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)',
                },
                boxShadow: '0 4px 12px rgba(0,102,255,0.4)',
              }}
            >
              <Send size={18} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Dialog>
  );
};

export default MatchChatModal;
