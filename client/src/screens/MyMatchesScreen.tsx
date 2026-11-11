import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme
} from '@mui/material';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Trophy, 
  Star, 
  Inbox, 
  CheckCircle2, 
  Ban, 
  Trash2,
  AlertTriangle,
  MessageSquare,
  Share2,
  Navigation,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import {
  lerPartidasLocais,
  excluirPartidaLocal,
  partidaFoiExcluida,
  lerSolicitacoesLocais,
  atualizarStatusSolicitacaoLocal
} from '../services/partidasLocais';
import { MatchChatModal } from '../components/MatchChatModal';
import { compartilharPartida } from '../services/compartilharPartida';

export interface MyMatchesScreenProps {
  usuarioLogado: any;
  onVerMapa?: (partidaId: string) => void;
  onPartidaCancelada?: (partidaId: string) => void;
}

export const MyMatchesScreen: React.FC<MyMatchesScreenProps> = ({
  usuarioLogado,
  onPartidaCancelada,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [abaInterna, setAbaInterna] = useState<number>(0);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [minhasParticipacoes, setMinhasParticipacoes] = useState<any[]>([]);
  const [minhasPartidas, setMinhasPartidas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Modal de Confirmação de Cancelamento / Exclusão (Organizador)
  const [partidaParaCancelar, setPartidaParaCancelar] = useState<any | null>(null);
  const [cancelandoPartida, setCancelandoPartida] = useState(false);

  // Modal de Confirmação de Cancelamento de Participação (Atleta)
  const [participacaoParaCancelar, setParticipacaoParaCancelar] = useState<any | null>(null);
  const [cancelandoParticipacao, setCancelandoParticipacao] = useState(false);

  // Modal de Chat da Partida (Organizador ou Participante)
  const [chatPartidaAtiva, setChatPartidaAtiva] = useState<{
    id: string;
    esporte: string;
    bairro: string;
    dataHora: string;
    statusPartida?: any;
  } | null>(null);

  const carregarDados = async () => {
    setCarregando(true);
    const ehMinha = (p: any) =>
      Boolean(usuarioLogado?.id && (p.organizadorId === usuarioLogado.id || p.organizador_id === usuarioLogado.id));

    let todasPartidasServidor: any[] = [];
    let doServidor: any[] = [];
    try {
      const resMatches = await api.get('/matches?lat=-20.5388&lng=-47.4005&radius=25');
      if (resMatches.data && Array.isArray(resMatches.data.data)) {
        todasPartidasServidor = resMatches.data.data;
        doServidor = todasPartidasServidor.filter((p: any) => ehMinha(p) || p.isOrganizador);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar partidas do servidor (usando partidas locais):', err.message);
    }

    let todasSolicitacoes: any[] = [];
    try {
      const paramUser = usuarioLogado?.id ? `?usuarioId=${encodeURIComponent(usuarioLogado.id)}` : '';
      const resRequests = await api.get(`/requests${paramUser}`);
      if (resRequests.data && Array.isArray(resRequests.data.data)) {
        todasSolicitacoes = resRequests.data.data;
      }
    } catch (err: any) {
      console.warn('Erro ao carregar solicitações:', err.message);
    }

    // Mescla solicitações locais caso alguma tenha sido feita offline
    const solLocais = lerSolicitacoesLocais();
    for (const sl of solLocais) {
      const jaExiste = todasSolicitacoes.some(
        (s) => s.id === sl.id || (s.partidaId === sl.partidaId && s.usuarioId === sl.usuarioId)
      );
      if (!jaExiste) {
        todasSolicitacoes.push(sl);
      }
    }

    // 1. Solicitações RECEBIDAS nas partidas que eu organizo
    const recebidas = todasSolicitacoes.filter(
      (s: any) =>
        usuarioLogado?.id &&
        (s.organizadorId === usuarioLogado.id || s.organizador_id === usuarioLogado.id) &&
        !partidaFoiExcluida(s.partidaId)
    );
    setSolicitacoes(recebidas);

    // 2. Solicitações ENVIADAS por mim (Partidas que solicitei vaga / participo como jogador(a), ex: Josefina)
    const enviadasPorMim = todasSolicitacoes
      .filter(
        (s: any) =>
          usuarioLogado?.id &&
          (s.usuarioId === usuarioLogado.id || s.usuario_id === usuarioLogado.id) &&
          s.statusSolicitacao !== 'Cancelada' &&
          s.partidaStatus !== 'Cancelada' &&
          !partidaFoiExcluida(s.partidaId)
      )
      .map((s: any) => {
        const partidaRef =
          todasPartidasServidor.find((p) => p.id === s.partidaId) ||
          lerPartidasLocais().find((p) => p.id === s.partidaId);
        return {
          ...s,
          partidaEsporte: s.partidaEsporte || partidaRef?.esporte || 'Partida Esportiva',
          partidaBairro: s.partidaBairro || partidaRef?.bairro || 'Franca',
          partidaDataHora: s.partidaDataHora || partidaRef?.dataHora || new Date().toISOString(),
          partidaDescricao: s.partidaDescricao ?? partidaRef?.descricao ?? '',
          partidaStatus: s.partidaStatus || partidaRef?.statusPartida || 'Publicada',
          partidaEndereco:
            s.statusSolicitacao === 'Aprovada'
              ? s.partidaEndereco || partidaRef?.enderecoCompleto || `${s.partidaBairro || 'Franca'}, Franca/SP`
              : null,
          partidaLat: s.partidaLat ?? partidaRef?.lat ?? -20.5388,
          partidaLng: s.partidaLng ?? partidaRef?.lng ?? -47.4005,
        };
      });
    setMinhasParticipacoes(enviadasPorMim);

    // 3. Partidas CRIADAS por mim (Organizador, ex: Enrico)
    const locais = lerPartidasLocais().filter(
      (p: any) => ehMinha(p) && !doServidor.some((s: any) => s.id === p.id)
    );
    const criadasAtivas = [...locais, ...doServidor].filter(
      (p: any) => !partidaFoiExcluida(p.id) && p.statusPartida !== 'Cancelada'
    );
    setMinhasPartidas(criadasAtivas);

    // Se a pessoa não organiza nenhuma partida mas tem participações solicitadas (ex: Josefina),
    // abre automaticamente na aba "Jogos que Participo" para visualização imediata
    if (recebidas.length === 0 && criadasAtivas.length === 0 && enviadasPorMim.length > 0 && abaInterna === 0) {
      setAbaInterna(1);
    }

    setCarregando(false);
  };

  useEffect(() => {
    carregarDados();
  }, [usuarioLogado]);

  // Responder à solicitação (Aprovar ou Rejeitar)
  const handleDecidirSolicitacao = async (solicitacaoId: string, acao: 'aprovar' | 'rejeitar', nomeAtleta: string) => {
    setProcessandoId(solicitacaoId);
    try {
      await api.patch(`/requests/${solicitacaoId}`, {
        acao,
        organizadorId: usuarioLogado?.id,
      });

      const novoStatus = acao === 'aprovar' ? 'Aprovada' : 'Rejeitada';
      atualizarStatusSolicitacaoLocal(solicitacaoId, undefined, novoStatus);

      setSolicitacoes((prev) =>
        prev.map((s) =>
          s.id === solicitacaoId
            ? { ...s, statusSolicitacao: novoStatus }
            : s
        )
      );

      const msg = acao === 'aprovar'
        ? `✅ Vaga aprovada para ${nomeAtleta}! O endereço exato e o chat foram liberados para o(a) atleta.`
        : `❌ Solicitação de ${nomeAtleta} recusada.`;

      setToastMensagem(msg);
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao processar solicitação.');
    } finally {
      setProcessandoId(null);
    }
  };

  // Cancelar participação / solicitação como jogador(a)
  const handleConfirmarCancelamentoParticipacao = async () => {
    if (!participacaoParaCancelar) return;
    setCancelandoParticipacao(true);

    try {
      try {
        await api.patch(`/requests/${participacaoParaCancelar.id}/cancel`, {
          usuarioId: usuarioLogado?.id,
        });
      } catch {
        // fallback local se offline
      }
      atualizarStatusSolicitacaoLocal(participacaoParaCancelar.id, usuarioLogado?.id, 'Cancelada');

      setMinhasParticipacoes((prev) => prev.filter((item) => item.id !== participacaoParaCancelar.id));
      if (onPartidaCancelada) {
        onPartidaCancelada(participacaoParaCancelar.partidaId);
      }

      setToastMensagem(`✅ Sua solicitação/participação em ${participacaoParaCancelar.partidaEsporte} foi cancelada.`);
      setParticipacaoParaCancelar(null);
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao cancelar participação.');
    } finally {
      setCancelandoParticipacao(false);
    }
  };

  // Cancelar / Excluir partida esportiva (Organizador)
  const handleConfirmarExclusao = async () => {
    if (!partidaParaCancelar) return;
    setCancelandoPartida(true);

    try {
      try {
        try {
          await api.delete(`/matches/${partidaParaCancelar.id}`, { data: { solicitanteId: usuarioLogado?.id } });
        } catch {
          await api.patch(`/matches/${partidaParaCancelar.id}/cancel`, { solicitanteId: usuarioLogado?.id });
        }
      } catch {
        // Servidor offline ou partida só local: a exclusão local abaixo garante que ela não volte
      }
      excluirPartidaLocal(partidaParaCancelar.id);
      
      setMinhasPartidas((prev) => prev.filter((p) => p.id !== partidaParaCancelar.id));
      setSolicitacoes((prev) => prev.filter((s) => s.partidaId !== partidaParaCancelar.id));

      if (onPartidaCancelada) {
        onPartidaCancelada(partidaParaCancelar.id);
      }

      setToastMensagem(`🗑️ Partida de ${partidaParaCancelar.esporte} cancelada/excluída com sucesso.`);
      setPartidaParaCancelar(null);
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao cancelar partida.');
    } finally {
      setCancelandoPartida(false);
    }
  };

  const handleCompartilharJogo = async (dados: {
    esporte: string;
    dataHora: string;
    duracaoMinutos?: number;
    bairro: string;
    vagasPreenchidas?: number;
    maxVagas?: number;
  }) => {
    const res = await compartilharPartida({
      esporte: dados.esporte,
      dataHora: dados.dataHora,
      duracaoMinutos: dados.duracaoMinutos || 90,
      bairro: dados.bairro,
      vagasRestantes: Math.max(0, (dados.maxVagas || 14) - (dados.vagasPreenchidas || 0)),
      maxVagas: dados.maxVagas || 14,
    });
    if (res === 'copiado') {
      setToastMensagem('🔗 Convite da partida copiado! Envie para seus amigos.');
    }
  };

  const solicitacoesPendentes = solicitacoes.filter((s) => s.statusSolicitacao === 'Pendente');

  return (
    <Container maxWidth="sm" sx={{ mt: 1, pb: 8 }}>
      
      {/* HEADER DO PAINEL DE GESTÃO */}
      <Box sx={{ mb: 2.5, px: 0.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Trophy size={22} color="#0066FF" />
          <Typography variant="h6" fontWeight={900} color="primary.main">
            Painel do Organizador & Vagas
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Acompanhe as partidas que você solicitou vaga, gerencie seus jogos criados, converse no chat e aprove atletas em Franca/SP.
        </Typography>
      </Box>

      {/* ABAS: 0 = SOLICITAÇÕES RECEBIDAS | 1 = JOGOS QUE PARTICIPO | 2 = MINHAS PARTIDAS CRIADAS */}
      <Tabs
        value={abaInterna}
        onChange={(_, val) => setAbaInterna(val)}
        variant="fullWidth"
        sx={{
          mb: 2.5,
          bgcolor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 2,
          border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          p: 0.5,
          '& .MuiTab-root': {
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.78rem',
            borderRadius: 1.5,
            minHeight: 40,
            px: 1,
          },
          '& .Mui-selected': {
            bgcolor: 'primary.main',
            color: '#FFFFFF !important',
          },
          '& .MuiTabs-indicator': { display: 'none' }
        }}
      >
        <Tab 
          label={
            <Box display="flex" alignItems="center" gap={0.6}>
              <span>Recebidas</span>
              {solicitacoesPendentes.length > 0 && (
                <Chip 
                  label={solicitacoesPendentes.length} 
                  size="small" 
                  sx={{ height: 18, bgcolor: '#FFD700', color: '#000', fontWeight: 900, fontSize: '0.68rem' }} 
                />
              )}
            </Box>
          } 
        />
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.6}>
              <span>Solicitei / Participo</span>
              {minhasParticipacoes.length > 0 && (
                <Chip
                  label={minhasParticipacoes.length}
                  size="small"
                  sx={{ height: 18, bgcolor: '#10B981', color: '#FFF', fontWeight: 900, fontSize: '0.68rem' }}
                />
              )}
            </Box>
          }
        />
        <Tab label={`Criadas (${minhasPartidas.length})`} />
      </Tabs>

      {/* ABA 0: SOLICITAÇÕES RECEBIDAS PELO ORGANIZADOR */}
      {abaInterna === 0 && (
        <Box>
          {carregando && solicitacoes.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : solicitacoes.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Inbox size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Nenhuma solicitação recebida nas suas partidas.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Assim que outros atletas solicitarem vagas nos jogos que você criou, elas aparecerão aqui para aprovação.
              </Typography>
              {minhasParticipacoes.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setAbaInterna(1)}
                  sx={{ mt: 2, fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                >
                  Ver Jogos que Solicitei ({minhasParticipacoes.length})
                </Button>
              )}
            </Card>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {solicitacoes.map((sol) => {
                const pendente = sol.statusSolicitacao === 'Pendente';
                const aprovada = sol.statusSolicitacao === 'Aprovada';
                const processando = processandoId === sol.id;

                return (
                  <Card 
                    key={sol.id} 
                    sx={{ 
                      borderRadius: 2, 
                      p: 2, 
                      bgcolor: 'background.paper',
                      border: pendente ? '1.5px solid #0066FF' : '1px solid',
                      borderColor: pendente ? '#0066FF' : 'divider',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  >
                    <CardContent sx={{ p: '0 !important' }}>
                      
                      {/* Atleta Solicitante */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar 
                            src={sol.atletaFoto} 
                            sx={{ width: 44, height: 44, bgcolor: '#0066FF', border: '2px solid #FFD700', fontWeight: 900 }}
                          >
                            {sol.atletaNome ? sol.atletaNome.charAt(0) : 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={900} color="text.primary">
                              {sol.atletaNome}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                              <Chip 
                                icon={<Star size={12} fill="#000" color="#000" />}
                                label={Number(sol.atletaNota || 5).toFixed(2)} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                {sol.atletaGenero || 'Atleta'}
                              </Typography>
                              {sol.posicaoPreferida && (
                                <Chip
                                  label={`⚽ Posição: ${sol.posicaoPreferida}`}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#EFF6FF', color: '#0066FF' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>

                        <Chip 
                          label={sol.statusSolicitacao}
                          size="small"
                          sx={{
                            fontWeight: 900,
                            fontSize: '0.72rem',
                            bgcolor: pendente ? '#EFF6FF' : (aprovada ? '#DCFCE7' : '#FEE2E2'),
                            color: pendente ? 'primary.main' : (aprovada ? '#166534' : '#991B1B'),
                            border: pendente ? '1px solid #BFDBFE' : 'none'
                          }}
                        />
                      </Box>

                      {/* Partida Requisitada */}
                      <Box sx={{ p: 1.5, bgcolor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: 2.5, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" fontWeight={800} color="primary.main" display="block">
                          ⚽ Jogo: {sol.partidaEsporte}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {sol.partidaBairro || 'Franca'}, Franca/SP • {sol.partidaDataHora ? new Date(sol.partidaDataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Data a definir'}
                        </Typography>
                        {sol.partidaDescricao && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic', mt: 0.3 }}>
                            "{sol.partidaDescricao}"
                          </Typography>
                        )}
                      </Box>

                      {/* Ações de Aprovação + Chat */}
                      {pendente ? (
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            variant="contained"
                            color="primary"
                            disabled={processando}
                            startIcon={processando ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
                            onClick={() => handleDecidirSolicitacao(sol.id, 'aprovar', sol.atletaNome)}
                            sx={{ flex: 1, fontWeight: 900, borderRadius: 2, py: 0.9 }}
                          >
                            APROVAR VAGA
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={processando}
                            startIcon={<X size={16} />}
                            onClick={() => handleDecidirSolicitacao(sol.id, 'rejeitar', sol.atletaNome)}
                            sx={{ fontWeight: 800, borderRadius: 2, px: 2 }}
                          >
                            Recusar
                          </Button>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Box display="flex" alignItems="center" gap={0.8} color={aprovada ? 'success.main' : 'error.main'}>
                            {aprovada ? <CheckCircle2 size={16} /> : <X size={16} />}
                            <Typography variant="caption" fontWeight={800}>
                              {aprovada ? 'Vaga confirmada! Endereço e chat liberados.' : 'Solicitação recusada.'}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MessageSquare size={14} />}
                            onClick={() =>
                              setChatPartidaAtiva({
                                id: sol.partidaId,
                                esporte: sol.partidaEsporte || 'Partida',
                                bairro: sol.partidaBairro || 'Franca',
                                dataHora: sol.partidaDataHora || new Date().toISOString(),
                                statusPartida: sol.partidaStatus || 'Publicada',
                              })
                            }
                            sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                          >
                            Abrir Chat
                          </Button>
                        </Box>
                      )}

                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ABA 1: PARTIDAS QUE SOLICITEI / PARTICIPO (JOGADOR(A), EX: JOSEFINA) */}
      {abaInterna === 1 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {minhasParticipacoes.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Inbox size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Você ainda não solicitou vaga em nenhuma partida.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Vá até a aba "Explorar" e clique em "SOLICITAR VAGA" na partida desejada para acompanhá-la por aqui!
              </Typography>
            </Card>
          ) : (
            minhasParticipacoes.map((item) => {
              const pendente = item.statusSolicitacao === 'Pendente';
              const aprovada = item.statusSolicitacao === 'Aprovada';
              const rejeitada = item.statusSolicitacao === 'Rejeitada';
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.partidaLat || -20.5388},${item.partidaLng || -47.4005}`;

              return (
                <Card
                  key={item.id}
                  sx={{
                    borderRadius: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    border: aprovada ? '1.5px solid #10B981' : pendente ? '1.5px solid #0066FF' : '1px solid',
                    borderColor: aprovada ? '#10B981' : pendente ? '#0066FF' : 'divider',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  }}
                >
                  <CardContent sx={{ p: '0 !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                          {item.partidaEsporte}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          📍 {item.partidaBairro}, Franca/SP •{' '}
                          {item.partidaDataHora
                            ? new Date(item.partidaDataHora).toLocaleString('pt-BR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Data a definir'}
                        </Typography>
                        {item.organizadorNome && (
                          <Typography variant="caption" color="primary.main" fontWeight={800}>
                            👤 Organizador(a): {item.organizadorNome}
                          </Typography>
                        )}
                      </Box>

                      <Chip
                        icon={
                          aprovada ? (
                            <CheckCircle2 size={13} color="#166534" />
                          ) : pendente ? (
                            <Clock size={13} color="#0066FF" />
                          ) : (
                            <X size={13} color="#991B1B" />
                          )
                        }
                        label={
                          aprovada
                            ? 'Vaga Confirmada'
                            : pendente
                            ? 'Aguardando Aprovação'
                            : 'Solicitação Recusada'
                        }
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.70rem',
                          bgcolor: aprovada ? '#DCFCE7' : pendente ? '#EFF6FF' : '#FEE2E2',
                          color: aprovada ? '#166534' : pendente ? '#0066FF' : '#991B1B',
                        }}
                      />
                    </Box>

                    {item.posicaoPreferida && (
                      <Chip
                        label={`⚽ Sua posição informada: ${item.posicaoPreferida}`}
                        size="small"
                        sx={{ mb: 1, fontWeight: 700, fontSize: '0.70rem', bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}
                      />
                    )}

                    {aprovada ? (
                      <Alert severity="success" icon={<ShieldCheck size={16} />} sx={{ mb: 1.5, py: 0.4, borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight={800} display="block">
                          Endereço liberado: {item.partidaEndereco || `${item.partidaBairro}, Franca/SP`}
                        </Typography>
                      </Alert>
                    ) : pendente ? (
                      <Alert severity="info" sx={{ mb: 1.5, py: 0.4, borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight={700}>
                          Sua solicitação foi enviada ao organizador! Assim que ele aprovar, o endereço exato será liberado aqui.
                        </Typography>
                      </Alert>
                    ) : null}

                    {/* Barra de Ações do Atleta: Chat, Compartilhar, GPS e Cancelar Participação */}
                    <Box display="flex" gap={0.8} flexWrap="wrap" pt={1} borderTop="1px solid" borderColor="divider">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<MessageSquare size={14} />}
                        onClick={() =>
                          setChatPartidaAtiva({
                            id: item.partidaId,
                            esporte: item.partidaEsporte,
                            bairro: item.partidaBairro,
                            dataHora: item.partidaDataHora,
                            statusPartida: item.partidaStatus || 'Publicada',
                          })
                        }
                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                      >
                        Chat da Partida
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<Share2 size={14} />}
                        onClick={() =>
                          handleCompartilharJogo({
                            esporte: item.partidaEsporte,
                            dataHora: item.partidaDataHora,
                            duracaoMinutos: item.partidaDuracaoMinutos || 90,
                            bairro: item.partidaBairro,
                            vagasPreenchidas: item.partidaVagasPreenchidas || 1,
                            maxVagas: item.partidaMaxVagas || 14,
                          })
                        }
                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                      >
                        Compartilhar
                      </Button>

                      {aprovada && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<Navigation size={13} />}
                          href={mapsUrl}
                          target="_blank"
                          sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.75rem' }}
                        >
                          Abrir GPS
                        </Button>
                      )}

                      {!rejeitada && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Ban size={14} />}
                          onClick={() => setParticipacaoParaCancelar(item)}
                          sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', ml: 'auto' }}
                        >
                          {aprovada ? 'Cancelar Minha Vaga' : 'Cancelar Solicitação'}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}

      {/* ABA 2: MINHAS PARTIDAS ORGANIZADAS COM CHAT, COMPARTILHAR E CANCELAR/EXCLUIR */}
      {abaInterna === 2 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {minhasPartidas.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Você não possui partidas criadas como organizador no momento.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Clique no botão amarelo (+) na tela inicial para criar um novo racha ou amistoso em Franca!
              </Typography>
            </Card>
          ) : (
            minhasPartidas.map((partida) => (
              <Card key={partida.id} sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: '0 !important' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                        {partida.esporte}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📍 {partida.bairro}, Franca/SP • {new Date(partida.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${partida.vagasPreenchidas}/${partida.maxVagas} Vagas`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>

                  {partida.descricao && (
                    <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontStyle: 'italic', bgcolor: 'background.default', p: 1, borderRadius: 1.5 }}>
                      "{partida.descricao}"
                    </Typography>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} pt={1.2} borderTop="1px solid" borderColor="divider">
                    <Chip 
                      icon={<ShieldCheck size={14} color="#16A34A" />}
                      label="Organizador" 
                      size="small" 
                      sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} 
                    />

                    <Box display="flex" gap={0.8} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<MessageSquare size={14} />}
                        onClick={() =>
                          setChatPartidaAtiva({
                            id: partida.id,
                            esporte: partida.esporte,
                            bairro: partida.bairro,
                            dataHora: partida.dataHora,
                            statusPartida: partida.statusPartida || 'Publicada',
                          })
                        }
                        sx={{
                          fontWeight: 800,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.76rem',
                          py: 0.4,
                        }}
                      >
                        Chat da Partida
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<Share2 size={14} />}
                        onClick={() => handleCompartilharJogo(partida)}
                        sx={{
                          fontWeight: 800,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.76rem',
                          py: 0.4,
                        }}
                      >
                        Compartilhar
                      </Button>

                      {/* BOTÃO DE CANCELAR / EXCLUIR PARTIDA */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Trash2 size={14} />}
                        onClick={() => setPartidaParaCancelar(partida)}
                        sx={{
                          fontWeight: 800,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.76rem',
                          py: 0.4
                        }}
                      >
                        Cancelar Partida
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* MODAL DE CHAT DA PARTIDA */}
      {chatPartidaAtiva && (
        <MatchChatModal
          open={Boolean(chatPartidaAtiva)}
          onClose={() => setChatPartidaAtiva(null)}
          partidaId={chatPartidaAtiva.id}
          esporte={chatPartidaAtiva.esporte}
          bairro={chatPartidaAtiva.bairro}
          dataHora={chatPartidaAtiva.dataHora}
          statusPartida={chatPartidaAtiva.statusPartida}
          usuarioLogado={{
            id: usuarioLogado?.id || '11111111-1111-1111-1111-111111111101',
            nome: usuarioLogado?.nome || 'Atleta Bora!',
            fotoUrl: usuarioLogado?.fotoUrl || null,
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO DE PARTICIPAÇÃO (ATLETA) */}
      <Dialog
        open={Boolean(participacaoParaCancelar)}
        onClose={() => !cancelandoParticipacao && setParticipacaoParaCancelar(null)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 900 }}>
          <AlertTriangle size={22} color="#DC2626" /> Cancelar Participação?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            Deseja cancelar sua solicitação/vaga na partida de <strong>{participacaoParaCancelar?.partidaEsporte}</strong> no bairro <strong>{participacaoParaCancelar?.partidaBairro}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
            ℹ️ Caso sua vaga já tenha sido aprovada, ela será liberada imediatamente para outro atleta.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2.5 }}>
          <Button
            onClick={() => setParticipacaoParaCancelar(null)}
            disabled={cancelandoParticipacao}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmarCancelamentoParticipacao}
            disabled={cancelandoParticipacao}
            startIcon={cancelandoParticipacao ? <CircularProgress size={16} color="inherit" /> : <Ban size={16} />}
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
          >
            {cancelandoParticipacao ? 'Cancelando...' : 'Sim, Cancelar Vaga'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO / EXCLUSÃO DE PARTIDA (ORGANIZADOR) */}
      <Dialog
        open={Boolean(partidaParaCancelar)}
        onClose={() => !cancelandoPartida && setPartidaParaCancelar(null)}
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 900 }}>
          <AlertTriangle size={22} color="#DC2626" /> Cancelar / Excluir Partida?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            Tem certeza que deseja cancelar a partida de <strong>{partidaParaCancelar?.esporte}</strong> no bairro <strong>{partidaParaCancelar?.bairro}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
            ⚠️ Ao cancelar a partida:
            <br />• Todas as vagas e solicitações de atletas serão encerradas.
            <br />• A partida sairá do mapa e da busca de Franca/SP.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2.5 }}>
          <Button 
            onClick={() => setPartidaParaCancelar(null)} 
            disabled={cancelandoPartida}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmarExclusao}
            disabled={cancelandoPartida}
            startIcon={cancelandoPartida ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
          >
            {cancelandoPartida ? 'Cancelando...' : 'Sim, Cancelar Partida'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMensagem)}
        autoHideDuration={4000}
        onClose={() => setToastMensagem(null)}
      >
        <Alert severity="success" sx={{ width: '100%', fontWeight: 700 }}>
          {toastMensagem}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyMatchesScreen;
