import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Container,
  Tab,
  Tabs,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Shield, 
  Inbox, 
  CheckCircle2, 
  Ban, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

export interface MyMatchesScreenProps {
  usuarioLogado: any;
  onVerMapa?: (partidaId: string) => void;
  onPartidaCancelada?: (partidaId: string) => void;
}

export const MyMatchesScreen: React.FC<MyMatchesScreenProps> = ({
  usuarioLogado,
  onVerMapa,
  onPartidaCancelada,
}) => {
  const [abaInterna, setAbaInterna] = useState<number>(0);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativas' | 'encerradas' | 'canceladas'>('todas');
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [solicitacoesEnviadas, setSolicitacoesEnviadas] = useState<any[]>([]);
  const [minhasPartidas, setMinhasPartidas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Modal de Confirmação de Cancelamento
  const [partidaParaCancelar, setPartidaParaCancelar] = useState<any | null>(null);
  const [cancelandoPartida, setCancelandoPartida] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    const userId = usuarioLogado?.id || '11111111-1111-1111-1111-111111111101';
    try {
      const [resMatches, resRequests] = await Promise.all([
        api.get(`/matches/my?solicitanteId=${userId}`, { headers: { 'x-user-id': userId } }).catch(async () => {
          return api.get('/matches?lat=-20.5388&lng=-47.4005&radius=25');
        }),
        api.get('/requests')
      ]);

      if (resMatches.data && Array.isArray(resMatches.data.data)) {
        const criadasPorMim = resMatches.data.data.filter(
          (p: any) => (usuarioLogado?.id && (p.organizadorId === usuarioLogado.id || p.organizador_id === usuarioLogado.id)) || p.isOrganizador || p.organizadorId === '11111111-1111-1111-1111-111111111101'
        );
        setMinhasPartidas(criadasPorMim);
      }

      if (resRequests.data && Array.isArray(resRequests.data.data)) {
        const todas = resRequests.data.data;
        // Recebidas: solicitações de outros atletas nas partidas que eu organizo
        setSolicitacoes(
          todas.filter((s: any) => usuarioLogado?.id && (s.organizadorId === usuarioLogado.id || s.organizador_id === usuarioLogado.id))
        );
        // Enviadas: solicitações que EU fiz em partidas de outros organizadores
        setSolicitacoesEnviadas(
          todas.filter((s: any) => usuarioLogado?.id && (s.usuarioId === usuarioLogado.id || s.usuario_id === usuarioLogado.id))
        );
      }
    } catch (err: any) {
      console.warn('Erro ao carregar dados de solicitações:', err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [usuarioLogado]);

  // Responder à solicitação (Aprovar ou Rejeitar)
  const handleDecidirSolicitacao = async (solicitacaoId: string, acao: 'aprovar' | 'rejeitar', nomeAtleta: string) => {
    setProcessandoId(solicitacaoId);
    try {
      await api.patch(`/requests/${solicitacaoId}`, { acao });
      
      setSolicitacoes((prev) =>
        prev.map((s) =>
          s.id === solicitacaoId
            ? { ...s, statusSolicitacao: acao === 'aprovar' ? 'Aprovada' : 'Rejeitada' }
            : s
        )
      );

      const msg = acao === 'aprovar'
        ? `✅ Vaga aprovada para ${nomeAtleta}! O endereço exato foi liberado para o atleta.`
        : `❌ Solicitação de ${nomeAtleta} rejeitada.`;

      setToastMensagem(msg);
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao processar solicitação.');
    } finally {
      setProcessandoId(null);
    }
  };

  // Excluir partida esportiva com confirmação
  const handleConfirmarExclusao = async () => {
    if (!partidaParaCancelar) return;
    setCancelandoPartida(true);
    const userId = usuarioLogado?.id || '11111111-1111-1111-1111-111111111101';

    try {
      try {
        await api.delete(`/matches/${partidaParaCancelar.id}`, {
          params: { solicitanteId: userId },
          data: { solicitanteId: userId },
          headers: { 'x-user-id': userId }
        });
      } catch (delErr) {
        console.warn('DELETE falhou, tentando fallback PATCH cancel:', delErr);
        await api.patch(`/matches/${partidaParaCancelar.id}/cancel`, {
          solicitanteId: userId,
        });
      }
      
      // Atualiza a partida como Cancelada na lista para histórico
      setMinhasPartidas((prev) =>
        prev.map((p) =>
          p.id === partidaParaCancelar.id
            ? { ...p, statusPartida: 'Cancelada' }
            : p
        )
      );
      
      // Cancela as solicitações pendentes dessa partida na interface
      setSolicitacoes((prev) =>
        prev.map((s) =>
          s.partidaId === partidaParaCancelar.id
            ? { ...s, statusSolicitacao: 'Rejeitada' }
            : s
        )
      );

      if (onPartidaCancelada) {
        onPartidaCancelada(partidaParaCancelar.id);
      }

      setToastMensagem(`🗑️ Partida de ${partidaParaCancelar.esporte} excluída com sucesso.`);
      setPartidaParaCancelar(null);
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao excluir partida.');
    } finally {
      setCancelandoPartida(false);
    }
  };

  const solicitacoesPendentes = solicitacoes.filter((s) => s.statusSolicitacao === 'Pendente');

  const totalAtivas = minhasPartidas.filter((p) => p.statusPartida === 'Publicada' || p.statusPartida === 'Lotada').length;
  const totalEncerradas = minhasPartidas.filter((p) => p.statusPartida === 'Finalizada').length;
  const totalCanceladas = minhasPartidas.filter((p) => p.statusPartida === 'Cancelada').length;

  const partidasFiltradas = minhasPartidas.filter((p) => {
    if (filtroStatus === 'ativas') return p.statusPartida === 'Publicada' || p.statusPartida === 'Lotada';
    if (filtroStatus === 'encerradas') return p.statusPartida === 'Finalizada';
    if (filtroStatus === 'canceladas') return p.statusPartida === 'Cancelada';
    return true;
  });

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
          Gerencie suas partidas, aprove solicitações de atletas, visualize jogos encerrados ou excluídos em Franca/SP.
        </Typography>
      </Box>

      {/* ABAS: SOLICITAÇÕES vs MINHAS PARTIDAS vs MINHAS SOLICITAÇÕES */}
      <Tabs
        value={abaInterna}
        onChange={(_, val) => setAbaInterna(val)}
        variant="fullWidth"
        sx={{
          mb: 2,
          bgcolor: '#FFFFFF',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          p: 0.5,
          '& .MuiTab-root': {
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.82rem',
            borderRadius: 1.5,
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
            <Box display="flex" alignItems="center" gap={0.8}>
              <span>Recebidas</span>
              {solicitacoesPendentes.length > 0 && (
                <Chip 
                  label={solicitacoesPendentes.length} 
                  size="small" 
                  sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#FFD700', color: '#000', fontWeight: 900 }} 
                />
              )}
            </Box>
          } 
        />
        <Tab label={`Minhas Partidas (${minhasPartidas.length})`} />
        <Tab label={`Minhas Vagas (${solicitacoesEnviadas.length})`} />
      </Tabs>

      {/* ABA 0: SOLICITAÇÕES RECEBIDAS */}
      {abaInterna === 0 && (
        <Box>
          {carregando && solicitacoes.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : solicitacoes.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#F8FAFC' }}>
              <Inbox size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Nenhuma solicitação no momento.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assim que outros atletas ou times solicitarem vagas em seus jogos, elas aparecerão aqui para aprovação.
              </Typography>
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
                      bgcolor: '#FFFFFF',
                      border: pendente ? '1.5px solid #0066FF' : '1px solid #E2E8F0',
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
                            <Box display="flex" alignItems="center" gap={0.8}>
                              <Chip 
                                icon={<Star size={12} fill="#000" color="#000" />}
                                label={Number(sol.atletaNota || 5).toFixed(2)} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                {sol.atletaGenero || 'Atleta'}
                              </Typography>
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
                      <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2.5, mb: 2, border: '1px solid #F1F5F9' }}>
                        <Typography variant="caption" fontWeight={800} color="primary.main" display="block">
                          ⚽ Jogo: {sol.partidaEsporte}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {sol.partidaBairro || 'Franca'}, Franca/SP • {sol.partidaDataHora ? new Date(sol.partidaDataHora).toLocaleDateString('pt-BR') : 'Data a definir'}
                        </Typography>
                        {sol.partidaDescricao && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic', mt: 0.3 }}>
                            "{sol.partidaDescricao}"
                          </Typography>
                        )}
                      </Box>

                      {/* Ações de Aprovação */}
                      {pendente ? (
                        <Box display="flex" gap={1}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={processando}
                            startIcon={processando ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
                            onClick={() => handleDecidirSolicitacao(sol.id, 'aprovar', sol.atletaNome)}
                            sx={{ fontWeight: 900, borderRadius: 2, py: 1 }}
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
                        <Box display="flex" alignItems="center" gap={0.8} color={aprovada ? 'success.main' : 'error.main'}>
                          {aprovada ? <CheckCircle2 size={16} /> : <X size={16} />}
                          <Typography variant="caption" fontWeight={800}>
                            {aprovada ? 'Vaga confirmada! Endereço e mapa liberados para o atleta.' : 'Solicitação recusada pelo organizador.'}
                          </Typography>
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

      {/* ABA 1: MINHAS PARTIDAS COM HISTÓRICO (ATIVAS, ENCERRADAS, EXCLUÍDAS) */}
      {abaInterna === 1 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {/* FILTROS DE STATUS DA GESTÃO */}
          <Box display="flex" gap={0.8} overflow="auto" pb={0.5}>
            <Chip
              label={`Todas (${minhasPartidas.length})`}
              onClick={() => setFiltroStatus('todas')}
              color={filtroStatus === 'todas' ? 'primary' : 'default'}
              variant={filtroStatus === 'todas' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
            />
            <Chip
              label={`Ativas (${totalAtivas})`}
              onClick={() => setFiltroStatus('ativas')}
              color={filtroStatus === 'ativas' ? 'success' : 'default'}
              variant={filtroStatus === 'ativas' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
            />
            <Chip
              label={`Encerradas (${totalEncerradas})`}
              onClick={() => setFiltroStatus('encerradas')}
              color={filtroStatus === 'encerradas' ? 'warning' : 'default'}
              variant={filtroStatus === 'encerradas' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
            />
            <Chip
              label={`Excluídas (${totalCanceladas})`}
              onClick={() => setFiltroStatus('canceladas')}
              color={filtroStatus === 'canceladas' ? 'error' : 'default'}
              variant={filtroStatus === 'canceladas' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
            />
          </Box>

          {partidasFiltradas.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Nenhuma partida encontrada nesta categoria.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Clique no botão amarelo (+) na tela inicial para criar um novo racha ou amistoso em Franca!
              </Typography>
            </Card>
          ) : (
            partidasFiltradas.map((partida) => {
              const isCancelada = partida.statusPartida === 'Cancelada';
              const isFinalizada = partida.statusPartida === 'Finalizada';
              const isAtiva = partida.statusPartida === 'Publicada' || partida.statusPartida === 'Lotada';

              return (
                <Card 
                  key={partida.id} 
                  sx={{ 
                    borderRadius: 2, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                    border: '1px solid', 
                    borderColor: isCancelada ? '#FCA5A5' : (isFinalizada ? '#CBD5E1' : 'divider'),
                    opacity: isCancelada ? 0.78 : (isFinalizada ? 0.88 : 1)
                  }}
                >
                  <CardContent sx={{ p: '0 !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                          {partida.esporte}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {partida.bairro}, Franca/SP • {new Date(partida.dataHora).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={0.5} alignItems="center">
                        {isCancelada ? (
                          <Chip label="Excluída" size="small" color="error" sx={{ fontWeight: 900 }} />
                        ) : isFinalizada ? (
                          <Chip label="Encerrada" size="small" color="warning" sx={{ fontWeight: 900 }} />
                        ) : (
                          <Chip
                            label={`${partida.vagasPreenchidas}/${partida.maxVagas} Vagas`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 800 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {partida.descricao && (
                      <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontStyle: 'italic', bgcolor: 'background.default', p: 1, borderRadius: 1.5 }}>
                        "{partida.descricao}"
                      </Typography>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.2} borderTop="1px solid" borderColor="divider">
                      <Chip 
                        icon={<ShieldCheck size={14} color="#16A34A" />}
                        label="Organizador" 
                        size="small" 
                        sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} 
                      />

                      {/* BOTÃO DE EXCLUIR PARTIDA (APENAS PARA PARTIDAS ATIVAS) */}
                      {isAtiva && (
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
                            fontSize: '0.78rem',
                            py: 0.4
                          }}
                        >
                          Excluir Partida
                        </Button>
                      )}

                      {isCancelada && (
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800 }}>
                          Partida cancelada pelo organizador
                        </Typography>
                      )}

                      {isFinalizada && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                          Partida concluída
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}

      {/* ABA 2: SOLICITAÇÕES QUE EU ENVIEI PARA PARTIDAS DE OUTROS ORGANIZADORES */}
      {abaInterna === 2 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {solicitacoesEnviadas.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#F8FAFC' }}>
              <Inbox size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                Você ainda não solicitou nenhuma vaga.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quando você pedir para entrar em uma partida de outro organizador, o status do seu pedido aparece aqui.
              </Typography>
            </Card>
          ) : (
            solicitacoesEnviadas.map((sol) => {
              const partidaEncerrada = sol.partidaExcluida || sol.partidaStatus === 'Cancelada' || sol.partidaStatus === 'Finalizada';
              const pendente = sol.statusSolicitacao === 'Pendente';
              const aprovada = sol.statusSolicitacao === 'Aprovada';

              let statusLabel = sol.statusSolicitacao;
              let statusCor = { bg: '#EFF6FF', fg: 'primary.main', border: '1px solid #BFDBFE' };
              if (partidaEncerrada) {
                statusLabel = sol.partidaExcluida ? 'Partida excluída pelo organizador' : 'Partida encerrada';
                statusCor = { bg: '#F1F5F9', fg: '#475569', border: '1px solid #E2E8F0' };
              } else if (aprovada) {
                statusLabel = 'Vaga aprovada';
                statusCor = { bg: '#DCFCE7', fg: '#166534', border: 'none' as any };
              } else if (sol.statusSolicitacao === 'Rejeitada') {
                statusLabel = 'Recusada pelo organizador';
                statusCor = { bg: '#FEE2E2', fg: '#991B1B', border: 'none' as any };
              } else if (pendente) {
                statusLabel = 'Aguardando resposta do organizador';
              }

              return (
                <Card
                  key={sol.id}
                  sx={{
                    borderRadius: 2, p: 2, bgcolor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider',
                    opacity: partidaEncerrada ? 0.75 : 1,
                  }}
                >
                  <CardContent sx={{ p: '0 !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                          ⚽ {sol.partidaEsporte}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {sol.partidaBairro || 'Franca'}, Franca/SP • {sol.partidaDataHora ? new Date(sol.partidaDataHora).toLocaleDateString('pt-BR') : 'Data a definir'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.8} mt={1}>
                      {partidaEncerrada ? <Ban size={16} color="#475569" /> : aprovada ? <CheckCircle2 size={16} color="#16A34A" /> : null}
                      <Chip
                        label={statusLabel}
                        size="small"
                        sx={{ fontWeight: 900, fontSize: '0.72rem', bgcolor: statusCor.bg, color: statusCor.fg, border: statusCor.border }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PARTIDA */}
      <Dialog
        open={Boolean(partidaParaCancelar)}
        onClose={() => !cancelandoPartida && setPartidaParaCancelar(null)}
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 900 }}>
          <AlertTriangle size={22} color="#DC2626" /> Excluir Partida Criada?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
            Tem certeza que deseja excluir a partida de <strong>{partidaParaCancelar?.esporte}</strong> no bairro <strong>{partidaParaCancelar?.bairro}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 1 }}>
            ⚠️ Ao excluir a partida:
            <br />• Todas as vagas e solicitações de atletas serão canceladas.
            <br />• A partida sairá do mapa e da busca de Franca/SP.
            <br />• O registro continuará no seu histórico de Gestão como partida cancelada.
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
            {cancelandoPartida ? 'Excluindo...' : 'Sim, Excluir Partida'}
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

