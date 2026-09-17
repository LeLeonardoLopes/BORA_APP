import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  MapPin, 
  Calendar, 
  Navigation, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Users, 
  Share2,
  MessageSquare,
  Clock,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Star,
  Ban,
  Trash2
} from 'lucide-react';
import { obterClimaFranca, PrevisaoClima } from '../services/weatherService';
import { MatchChatModal } from './MatchChatModal';
import { api } from '../services/api';

export interface MatchCardProps {
  id: string;
  esporte: string;
  descricao?: string;
  dataHora: string;
  duracaoMinutos?: number;
  bairro: string;
  enderecoCompleto?: string;
  lat: number;
  lng: number;
  vagasPreenchidas: number;
  maxVagas: number;
  statusPartida?: 'Publicada' | 'Lotada' | 'Em_Andamento' | 'Finalizada' | 'Cancelada';
  organizadorId?: string;
  isOrganizador?: boolean;
  isConfirmado?: boolean;
  formatoJogo?: 'Avulso' | 'Amistoso_Times';
  tipoLocal?: 'Publica' | 'Privada';
  filtroGenero?: string;
  organizadorNota?: number;
  timeMandante?: string;
  timeVisitante?: string;
  taxaCampo?: number;
  taxaJuiz?: number;
  valorPorEquipe?: number;
  usuarioLogado?: {
    id: string;
    nome: string;
    fotoUrl?: string | null;
  };
  onSolicitarVaga?: (id: string) => void;
  onMarcarAmistoso?: (id: string) => void;
  onFinalizarPartida?: (id: string) => void;
  onCancelarPartida?: (id: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  id,
  esporte,
  descricao,
  dataHora,
  duracaoMinutos = 90,
  bairro,
  enderecoCompleto,
  lat,
  lng,
  vagasPreenchidas,
  maxVagas,
  statusPartida = 'Publicada',
  organizadorId,
  organizadorNota = 5.0,
  filtroGenero = 'Misto',
  isOrganizador = false,
  isConfirmado = false,
  formatoJogo = 'Avulso',
  tipoLocal = 'Publica',
  timeMandante,
  timeVisitante,
  taxaCampo = 0,
  taxaJuiz = 0,
  valorPorEquipe = 0,
  usuarioLogado = { id: '11111111-1111-1111-1111-111111111101', nome: 'Atleta Bora!' },
  onSolicitarVaga,
  onMarcarAmistoso,
  onFinalizarPartida,
  onCancelarPartida,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isAmistoso = formatoJogo === 'Amistoso_Times';
  const vagasRestantes = maxVagas - vagasPreenchidas;
  const isLotado = isAmistoso ? Boolean(timeVisitante) : vagasRestantes <= 0;
  const isFinalizada = statusPartida === 'Finalizada';
  const isCancelada = statusPartida === 'Cancelada';

  const [clima, setClima] = useState<PrevisaoClima | null>(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [dialogEncerrarAberto, setDialogEncerrarAberto] = useState(false);
  const [dialogCancelarAberto, setDialogCancelarAberto] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [statusLocal, setStatusLocal] = useState(statusPartida);

  const souOrganizador = isOrganizador || organizadorId === usuarioLogado?.id || organizadorId === '11111111-1111-1111-1111-111111111101';

  useEffect(() => {
    setStatusLocal(statusPartida);
  }, [statusPartida]);

  useEffect(() => {
    obterClimaFranca(lat, lng).then(setClima);
  }, [lat, lng]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const openStreetMapEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.005}%2C${lng + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;

  let dataFormatada = 'Data a definir';
  try {
    const d = new Date(dataHora);
    if (!isNaN(d.getTime())) {
      dataFormatada = d.toLocaleString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch {
    dataFormatada = 'Data a definir';
  }

  // Gerador de Convite para WhatsApp
  const handleCompartilharWhatsApp = () => {
    const baseUrl = window.location.origin || 'http://localhost:5173';
    const textoMensagem = isAmistoso
      ? `🏆 *DESAFIO DE AMISTOSO — BORA! APP*\n\n` +
        `Fala galera! Nosso time está marcando um amistoso:\n\n` +
        `⚽ *Modalidade:* ${esporte}\n` +
        `🛡️ *Time Mandante:* ${timeMandante || 'Equipe de Franca'}\n` +
        `📅 *Data e Hora:* ${dataFormatada}\n` +
        `⏱️ *Duração:* ${duracaoMinutos} min\n` +
        `📍 *Local:* ${bairro}, Franca/SP\n` +
        (Number(valorPorEquipe) > 0 ? `💰 *Rateio por Equipe:* R$ ${Number(valorPorEquipe).toFixed(2)}\n\n` : `🎉 *Jogo 100% Gratuito*\n\n`) +
        `👉 Aceite o desafio no Bora! App:\n${baseUrl}`
      : `⚽ *CONVITE PRO JOGO — BORA! APP*\n\n` +
        `Fala galera! Tem jogo marcado no Bora! App e abrimos vagas:\n\n` +
        `🏆 *Modalidade:* ${esporte}\n` +
        `📅 *Data e Hora:* ${dataFormatada}\n` +
        `⏱️ *Duração:* ${duracaoMinutos} min\n` +
        `📍 *Local:* ${bairro}, Franca/SP\n` +
        `🎟️ *Vagas Disponíveis:* ${vagasRestantes} de ${maxVagas}\n` +
        (tipoLocal === 'Publica' ? `🎉 *100% Gratuito*\n\n` : `💰 *Rateio da Quadra:* R$ ${((taxaCampo || 0) / (maxVagas || 1)).toFixed(2)} por atleta\n\n`) +
        `👉 Garanta sua vaga no Bora! App:\n${baseUrl}`;

    const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
    window.open(zapUrl, '_blank');
  };

  const handleEncerrarPartida = async () => {
    setEncerrando(true);
    try {
      await api.patch(`/matches/${id}/finish`, {
        solicitanteId: usuarioLogado?.id || '11111111-1111-1111-1111-111111111101',
      });
      setStatusLocal('Finalizada');
      setDialogEncerrarAberto(false);
      if (onFinalizarPartida) {
        onFinalizarPartida(id);
      }
    } catch (err: any) {
      console.warn('Erro ao finalizar partida:', err);
      setStatusLocal('Finalizada');
      setDialogEncerrarAberto(false);
      if (onFinalizarPartida) {
        onFinalizarPartida(id);
      }
    } finally {
      setEncerrando(false);
    }
  };

  const handleExcluirPartida = async () => {
    setCancelando(true);
    setErroExclusao(null);
    const userId = usuarioLogado?.id || '11111111-1111-1111-1111-111111111101';
    try {
      try {
        await api.delete(`/matches/${id}`, {
          params: { solicitanteId: userId },
          data: { solicitanteId: userId },
          headers: { 'x-user-id': userId }
        });
      } catch (delErr) {
        console.warn('DELETE falhou, tentando fallback PATCH cancel:', delErr);
        await api.patch(`/matches/${id}/cancel`, {
          solicitanteId: userId,
        });
      }
      setStatusLocal('Cancelada');
      setDialogCancelarAberto(false);
      if (onCancelarPartida) {
        onCancelarPartida(id);
      }
    } catch (err: any) {
      console.warn('Erro ao excluir partida:', err);
      setErroExclusao(err?.response?.data?.error || 'Não foi possível excluir a partida. Tente novamente.');
    } finally {
      setCancelando(false);
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2, 
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: isFinalizada
            ? (isDark ? '1px solid #475569' : '1.5px solid #64748B')
            : isAmistoso
            ? (isDark ? '1.5px solid #2563EB' : '1.5px solid #0066FF')
            : (isConfirmado ? '1.5px solid #10B981' : (isDark ? '1px solid #334155' : '1px solid rgba(226, 232, 240, 0.9)')),
          borderRadius: 1.5,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 3px 12px rgba(0,0,0,0.04)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          opacity: isFinalizada ? 0.92 : 1,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.7)' : '0 6px 18px rgba(0,102,255,0.1)'
          }
        }}
      >
        {/* Header com Tipo de Jogo & Botão Compartilhar */}
        {isAmistoso ? (
          <Box 
            sx={{ 
              bgcolor: isFinalizada ? (isDark ? '#1E293B' : '#334155') : (isDark ? '#1E3A8A' : 'primary.main'), 
              color: '#fff', 
              py: 0.9, 
              px: 2.4, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 800 
            }}
          >
            <Box display="flex" alignItems="center" gap={0.8}>
              <Shield size={15} color="#FFD700" />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.72rem', letterSpacing: '0.02em' }}>
                AMISTOSO ENTRE TIMES
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={tipoLocal === 'Publica' ? 'Campo Público' : 'Arena Privada'}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, height: 21, fontSize: '0.68rem', px: 0.5 }}
              />
              <Tooltip title="Convidar no WhatsApp">
                <IconButton 
                  size="small" 
                  onClick={handleCompartilharWhatsApp} 
                  sx={{ color: '#FFD700', p: 0.5, bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                >
                  <Share2 size={13} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Box 
            sx={{ 
              bgcolor: isDark ? '#1E293B' : (isFinalizada ? '#F1F5F9' : '#F8FAFC'), 
              py: 0.8, 
              px: 2.4, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: isDark ? '1px solid #334155' : '1px solid #E2E8F0' 
            }}
          >
            <Box display="flex" alignItems="center" gap={0.8}>
              <Users size={14} color={isDark ? '#4ADE80' : (isFinalizada ? '#64748B' : '#16A34A')} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#86EFAC' : (isFinalizada ? '#475569' : '#166534'), fontSize: '0.72rem', letterSpacing: '0.02em' }}>
                PARTIDA ABERTA (AVULSO)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={tipoLocal === 'Publica' ? '100% Gratuito' : 'Aluguel Privado'}
                sx={{
                  bgcolor: tipoLocal === 'Publica' ? (isDark ? '#064E3B' : '#DCFCE7') : (isDark ? '#1E3A5F' : '#EFF6FF'),
                  color: tipoLocal === 'Publica' ? (isDark ? '#86EFAC' : '#166534') : (isDark ? '#93C5FD' : 'primary.main'),
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 21,
                  px: 0.5
                }}
              />
              <Tooltip title="Convidar no WhatsApp">
                <IconButton 
                  size="small" 
                  onClick={handleCompartilharWhatsApp} 
                  sx={{ color: isDark ? '#4ADE80' : '#16A34A', p: 0.5, bgcolor: isDark ? 'rgba(74,222,128,0.15)' : '#DCFCE7', '&:hover': { bgcolor: isDark ? 'rgba(74,222,128,0.25)' : '#BBF7D0' } }}
                >
                  <Share2 size={13} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}

        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          
          {/* Título da Partida / Confronto */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.8}>
            <Box>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800, fontSize: '0.94rem', lineHeight: 1.2, color: 'text.primary' }}>
                {esporte}
              </Typography>
              {isAmistoso && (
                <Typography variant="caption" color="primary.main" fontWeight={800} display="block" mt={0.2} sx={{ fontSize: '0.74rem' }}>
                  ⚔️ {timeMandante || 'Bora Franca F.C.'} vs {timeVisitante ? <strong>{timeVisitante}</strong> : 'Aguardando Desafiante'}
                </Typography>
              )}
            </Box>

            {/* Badges de Status, Vagas e Gênero */}
            <Box display="flex" gap={0.6} alignItems="center" flexWrap="wrap">
              {(filtroGenero === 'Feminino' || filtroGenero === 'Exclusivo_Feminino') && (
                <Chip
                  icon={<ShieldCheck size={12} color="#FFFFFF" />}
                  label="Partida 100% Feminina"
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.66rem',
                    height: 21,
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.35)'
                  }}
                />
              )}
              {organizadorNota && (
                <Chip
                  icon={<Star size={11} color="#FFD700" fill="#FFD700" />}
                  label={`${Number(organizadorNota).toFixed(1)}`}
                  size="small"
                  sx={{
                    bgcolor: isDark ? '#0A0E17' : '#0F172A',
                    color: '#FFD700',
                    fontWeight: 900,
                    fontSize: '0.66rem',
                    height: 21
                  }}
                />
              )}
              {statusLocal === 'Finalizada' ? (
                <Chip
                  icon={<CheckCircle2 size={12} color="#FFFFFF" />}
                  label="Finalizada"
                  size="small"
                  sx={{ bgcolor: '#475569', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', height: 21 }}
                />
              ) : isAmistoso ? (
                <Chip
                  label={timeVisitante ? 'Duelo Fechado' : 'Desafio Aberto'}
                  color={timeVisitante ? 'default' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: '0.68rem', height: 21 }}
                />
              ) : (
                <Chip
                  label={vagasRestantes > 0 ? `${vagasRestantes} vagas` : 'Lotada'}
                  color={vagasRestantes > 0 ? 'secondary' : 'default'}
                  size="small"
                  sx={{ fontWeight: 800, color: vagasRestantes > 0 ? '#000' : 'inherit', fontSize: '0.68rem', height: 21 }}
                />
              )}
            </Box>
          </Box>

          {/* Data, Duração Estimada, Bairro e Clima */}
          <Box display="flex" flexWrap="wrap" gap={0.8} alignItems="center" mb={1.2}>
            <Box display="flex" alignItems="center" gap={0.4}>
              <Calendar size={13} color={isDark ? '#60A5FA' : '#0066FF'} />
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                {dataFormatada}
              </Typography>
            </Box>

            {/* CHIP COM A DURAÇÃO ESTIMADA (Sem duplicar ícones) */}
            <Chip
              icon={<Clock size={12} color={isDark ? '#60A5FA' : '#0066FF'} />}
              label={`${duracaoMinutos} min`}
              size="small"
              sx={{
                bgcolor: isDark ? '#1E3A5F' : '#EFF6FF',
                color: isDark ? '#93C5FD' : 'primary.main',
                fontWeight: 800,
                fontSize: '0.68rem',
                height: 20,
                border: isDark ? '1px solid #2563EB' : '1px solid #BFDBFE',
                px: 0.3
              }}
            />

            <Box display="flex" alignItems="center" gap={0.4}>
              <MapPin size={13} color={isDark ? '#60A5FA' : '#0066FF'} />
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                {bairro}, Franca/SP
              </Typography>
            </Box>

            {/* PREVISÃO DO TEMPO REAL COMPACTA */}
            {clima && (
              <Chip
                icon={<span style={{ fontSize: '11px', marginLeft: '3px' }}>{clima.icone}</span>}
                label={`${clima.temperatura}°C • ${clima.condicao}`}
                size="small"
                sx={{
                  bgcolor: clima.alertaChuva ? (isDark ? '#7F1D1D' : '#FEE2E2') : (isDark ? '#78350F' : '#FEF3C7'),
                  color: clima.alertaChuva ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#FDE68A' : '#92400E'),
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20,
                  border: clima.alertaChuva ? (isDark ? '1px solid #991B1B' : '1px solid #FCA5A5') : (isDark ? '1px solid #92400E' : '1px solid #FDE68A'),
                  px: 0.3
                }}
              />
            )}
          </Box>

          {descricao && (
            <Typography variant="body2" color="text.secondary" mb={1.2} sx={{ fontStyle: 'italic', bgcolor: isDark ? '#1E293B' : '#F8FAFC', p: 1, borderRadius: 1.5, fontSize: '0.75rem', lineHeight: 1.35, border: isDark ? '1px solid #334155' : 'none' }}>
              "{descricao}"
            </Typography>
          )}

          {/* MAPA INTERATIVO / MINIMAPA LIBERADO COM LGPD */}
          {isConfirmado ? (
            <Box sx={{ mb: 1.5 }}>
              <Box display="flex" alignItems="center" gap={0.6} mb={0.6}>
                <ShieldCheck size={14} color="#10B981" />
                <Typography variant="caption" color="success.main" fontWeight={800} sx={{ fontSize: '0.72rem' }}>
                  Local confirmado: {enderecoCompleto || `${bairro}, Franca/SP`}
                </Typography>
              </Box>

              <Box sx={{ position: 'relative', width: '100%', height: 120, borderRadius: 2, overflow: 'hidden', mb: 0.8, border: '1.5px solid #10B981' }}>
                <Box component="iframe" src={openStreetMapEmbed} sx={{ width: '100%', height: '100%', border: 0 }} />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Navigation size={13} />}
                href={mapsUrl}
                target="_blank"
                sx={{ fontWeight: 800, borderRadius: 2, py: 0.6, fontSize: '0.74rem' }}
              >
                Abrir GPS / Google Maps
              </Button>
            </Box>
          ) : (
            <Alert severity="info" icon={<ShieldAlert size={14} />} sx={{ mb: 1.2, borderRadius: 1.5, bgcolor: isDark ? 'rgba(30, 58, 95, 0.4)' : '#EFF6FF', border: isDark ? '1px solid #1E3A5F' : 'none', py: 0.4, px: 1.2, '& .MuiAlert-message': { p: 0 } }}>
              <Typography variant="caption" fontWeight={600} color={isDark ? '#93C5FD' : 'primary.dark'} sx={{ fontSize: '0.70rem', lineHeight: 1.25 }}>
                <strong>Proteção LGPD (RN02):</strong> O endereço e mapa exatos são liberados assim que {isAmistoso ? 'o confronto for aceito' : 'sua vaga for confirmada'}.
              </Typography>
            </Alert>
          )}

          {/* BOTÃO PRINCIPAL DE AÇÃO */}
          <Box display="flex" flexDirection="column" gap={1}>
            {statusLocal === 'Finalizada' ? (
              <Button
                fullWidth
                variant="contained"
                disabled
                sx={{ py: 0.8, fontWeight: 800, borderRadius: 2, fontSize: '0.78rem', bgcolor: '#E2E8F0 !important', color: '#64748B !important' }}
              >
                PARTIDA FINALIZADA
              </Button>
            ) : isAmistoso ? (
              <Button
                fullWidth
                variant="contained"
                color={timeVisitante ? 'success' : 'primary'}
                disabled={Boolean(timeVisitante)}
                onClick={() => onMarcarAmistoso && onMarcarAmistoso(id)}
                sx={{ py: 0.8, fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
              >
                {timeVisitante ? 'AMISTOSO CONFIRMADO' : 'DESAFIAR COM MEU TIME'}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color={isConfirmado ? 'success' : 'primary'}
                disabled={isLotado && !isConfirmado}
                onClick={() => !isConfirmado && onSolicitarVaga && onSolicitarVaga(id)}
                sx={{ py: 0.8, fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
              >
                {isConfirmado ? 'VAGA CONFIRMADA' : (isLotado ? 'PARTIDA LOTADA' : 'SOLICITAR VAGA')}
              </Button>
            )}

            {/* BARRA DE AÇÕES AUXILIARES: CHAT / MURAL & GESTÃO (ORGANIZADOR) */}
            <Box display="flex" gap={0.8} flexWrap="wrap">
              {/* Botão de Chat / Mural da Partida */}
              <Button
                fullWidth={!souOrganizador}
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<MessageSquare size={14} color={isDark ? '#60A5FA' : '#0066FF'} />}
                onClick={() => setChatAberto(true)}
                sx={{
                  flex: souOrganizador ? 1 : undefined,
                  fontWeight: 800,
                  borderRadius: 2,
                  fontSize: '0.72rem',
                  py: 0.6,
                  bgcolor: isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: isDark ? '#334155' : '#BFDBFE',
                  color: isDark ? '#93C5FD' : 'primary.main',
                  '&:hover': { bgcolor: isDark ? '#334155' : '#DBEAFE', borderColor: isDark ? '#60A5FA' : '#93C5FD' },
                }}
              >
                Mural
              </Button>

              {/* Botão de Encerrar Partida (Exclusivo do Organizador) */}
              {souOrganizador && statusLocal !== 'Finalizada' && statusLocal !== 'Cancelada' && (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<Flag size={13} />}
                    onClick={() => setDialogEncerrarAberto(true)}
                    sx={{
                      flex: 1,
                      fontWeight: 800,
                      borderRadius: 2,
                      fontSize: '0.72rem',
                      py: 0.6,
                      color: '#D97706',
                      borderColor: '#FDE68A',
                      bgcolor: '#FEF3C7',
                      '&:hover': { bgcolor: '#FDE68A', borderColor: '#F59E0B' },
                    }}
                  >
                    Encerrar
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Trash2 size={13} />}
                    onClick={() => setDialogCancelarAberto(true)}
                    sx={{
                      flex: 1,
                      fontWeight: 800,
                      borderRadius: 2,
                      fontSize: '0.72rem',
                      py: 0.6,
                      color: 'error.main',
                      borderColor: '#FECACA',
                      bgcolor: '#FEF2F2',
                      '&:hover': { bgcolor: '#FEE2E2', borderColor: '#EF4444' },
                    }}
                  >
                    Excluir
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* MODAL DE CHAT / MURAL DA PARTIDA */}
      <MatchChatModal
        open={chatAberto}
        onClose={() => setChatAberto(false)}
        partidaId={id}
        esporte={esporte}
        bairro={bairro}
        dataHora={dataHora}
        statusPartida={statusLocal}
        usuarioLogado={usuarioLogado}
      />

      {/* DIÁLOGO DE CONFIRMAÇÃO DE ENCERRAMENTO */}
      <Dialog
        open={dialogEncerrarAberto}
        onClose={() => !encerrando && setDialogEncerrarAberto(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#D97706', fontWeight: 900 }}>
          <AlertTriangle size={22} color="#D97706" /> Encerrar Partida Agora?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 600 }}>
            Deseja finalizar a partida de <strong>{esporte}</strong> no bairro <strong>{bairro}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
            ⏱️ Ao encerrar a partida:
            <br />• O chat será transformado em modo somente leitura.
            <br />• Todos os atletas participantes poderão avaliar o organizador e companheiros na aba "Avaliar".
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2.5 }}>
          <Button 
            onClick={() => setDialogEncerrarAberto(false)} 
            disabled={encerrando}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            color="warning" 
            onClick={handleEncerrarPartida}
            disabled={encerrando}
            startIcon={encerrando ? <CircularProgress size={16} color="inherit" /> : <Flag size={16} />}
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
          >
            {encerrando ? 'Encerrando...' : 'Confirmar Encerramento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog
        open={dialogCancelarAberto}
        onClose={() => !cancelando && setDialogCancelarAberto(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 900 }}>
          <AlertTriangle size={22} color="#DC2626" /> Excluir Partida Criada?
        </DialogTitle>
        <DialogContent>
          {erroExclusao && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 700 }}>
              {erroExclusao}
            </Alert>
          )}
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 600 }}>
            Tem certeza que deseja excluir a partida de <strong>{esporte}</strong> no bairro <strong>{bairro}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
            ⚠️ Ao excluir a partida:
            <br />• Todas as solicitações de vagas e confrontos serão cancelados.
            <br />• A partida sairá da listagem e do mapa de Franca/SP.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2.5 }}>
          <Button 
            onClick={() => setDialogCancelarAberto(false)} 
            disabled={cancelando}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleExcluirPartida}
            disabled={cancelando}
            startIcon={cancelando ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
          >
            {cancelando ? 'Excluindo...' : 'Sim, Excluir Partida'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MatchCard;
