import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Rating, 
  TextField, 
  Button, 
  Avatar, 
  Container, 
  Snackbar, 
  Alert,
  Chip,
  Divider,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { Star, ShieldCheck, MessageSquare, Award, UserCheck, Send } from 'lucide-react';
import { api } from '../services/api';

export interface RatingScreenProps {
  usuarioLogado?: any;
  onConcluir?: () => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({
  usuarioLogado,
  onConcluir,
}) => {
  const [atletas, setAtletas] = useState<any[]>([]);
  const [avaliacoesFeed, setAvaliacoesFeed] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Form State
  const [atletaSelecionadoId, setAtletaSelecionadoId] = useState<string>('');
  const [nota, setNota] = useState<number | null>(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Carrega atletas e histórico de avaliações do banco de dados
  const carregarDadosDoBanco = async () => {
    setCarregando(true);
    try {
      const [resUsers, resRatings] = await Promise.all([
        api.get('/users'),
        api.get('/ratings')
      ]);

      if (resUsers.data && Array.isArray(resUsers.data.data)) {
        // Exclui o próprio usuário logado da lista para avaliar outros atletas
        const outrosAtletas = resUsers.data.data.filter((u: any) => u.id !== usuarioLogado?.id);
        setAtletas(outrosAtletas);
        if (outrosAtletas.length > 0 && !atletaSelecionadoId) {
          setAtletaSelecionadoId(outrosAtletas[0].id);
        }
      }

      if (resRatings.data && Array.isArray(resRatings.data.data)) {
        setAvaliacoesFeed(resRatings.data.data);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar dados de avaliações:', err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();
  }, []);

  const atletaSelecionado = atletas.find((a) => a.id === atletaSelecionadoId) || atletas[0];

  const handleEnviarAvaliacao = async () => {
    if (!atletaSelecionadoId || !nota) {
      setToastMensagem('Selecione um atleta e atribua uma nota de 1 a 5 estrelas.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/ratings', {
        avaliadorId: usuarioLogado?.id || '11111111-1111-1111-1111-111111111101',
        avaliadoId: atletaSelecionadoId,
        nota: Number(nota),
        comentario: comentario.trim() || 'Partida excelente e jogo limpo.'
      });

      setToastMensagem(`Avaliação registrada com sucesso para ${atletaSelecionado?.nome || 'o atleta'}!`);
      setComentario('');
      setNota(5);
      
      // Recarrega o feed atualizado direto do PostgreSQL
      await carregarDadosDoBanco();

      if (onConcluir) {
        setTimeout(onConcluir, 1800);
      }
    } catch (err: any) {
      setToastMensagem(err.response?.data?.error || 'Erro ao enviar avaliação.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 1, pb: 6 }}>
      
      {/* 1. FORMULÁRIO DE NOVA AVALIAÇÃO */}
      <Card sx={{ borderRadius: 4, p: 2.5, mb: 3, bgcolor: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: '0 !important' }}>
          
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Award size={22} color="#0066FF" />
            <Typography variant="h6" fontWeight={900} color="primary.main">
              Avaliar Atleta ou Adversário
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Avalie a conduta esportiva, pontualidade e fair play dos atletas após as partidas em Franca/SP.
          </Typography>

          {carregando && atletas.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              
              {/* Seleção do Atleta */}
              <TextField
                select
                label="Selecionar Atleta a Avaliar"
                fullWidth
                size="small"
                value={atletaSelecionadoId}
                onChange={(e) => setAtletaSelecionadoId(e.target.value)}
              >
                {atletas.map((atleta) => (
                  <MenuItem key={atleta.id} value={atleta.id}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar src={atleta.fotoUrl} sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                        {atleta.nome.charAt(0)}
                      </Avatar>
                      <span>{atleta.nome}</span>
                      <Chip 
                        size="small" 
                        label={`⭐ ${Number(atleta.notaMedia || 5).toFixed(2)}`} 
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }} 
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {/* Perfil Rápido do Atleta Selecionado */}
              {atletaSelecionado && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#F8FAFC', 
                    borderRadius: 3, 
                    border: '1.5px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar 
                      src={atletaSelecionado.fotoUrl} 
                      sx={{ width: 46, height: 46, border: '2px solid #FFD700', fontWeight: 900, bgcolor: '#0066FF' }}
                    >
                      {atletaSelecionado.nome.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                        {atletaSelecionado.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {atletaSelecionado.modalidadesFavoritas || 'Futebol Society, Beach Tennis'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" fontWeight={800} color="text.secondary" display="block">
                      Média Atual
                    </Typography>
                    <Chip 
                      icon={<Star size={14} fill="#000" color="#000" />} 
                      label={Number(atletaSelecionado.notaMedia || 5).toFixed(2)} 
                      sx={{ fontWeight: 900, bgcolor: 'secondary.main', color: '#000' }} 
                    />
                  </Box>
                </Box>
              )}

              {/* Seletor de Estrelas (Rating) */}
              <Box textAlign="center" my={1}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={0.5}>
                  Nota de Fair Play e Pontualidade:
                </Typography>
                <Rating
                  value={nota}
                  precision={1}
                  size="large"
                  onChange={(_, val) => setNota(val)}
                  sx={{ fontSize: '2.5rem', color: '#FFD700' }}
                />
              </Box>

              {/* Comentário */}
              <TextField
                label="Comentário (opcional)"
                multiline
                rows={2}
                fullWidth
                placeholder="Ex: Jogo limpo, pontual e respeitou as regras."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />

              {/* Botão de Enviar */}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={enviando}
                onClick={handleEnviarAvaliacao}
                startIcon={enviando ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                sx={{ py: 1.4, fontWeight: 900, borderRadius: 3 }}
              >
                {enviando ? 'ENVIANDO AVALIAÇÃO...' : 'CONFIRMAR AVALIAÇÃO DO ATLETA'}
              </Button>
            </Box>
          )}

        </CardContent>
      </Card>

      {/* 2. FEED COM AS 10 AVALIAÇÕES REAIS DO BANCO DE DADOS */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} px={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <MessageSquare size={18} color="#0066FF" />
            <Typography variant="subtitle1" fontWeight={900} color="text.primary">
              Avaliações Recentes da Comunidade ({avaliacoesFeed.length})
            </Typography>
          </Box>
        </Box>

        {carregando && avaliacoesFeed.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : avaliacoesFeed.length === 0 ? (
          <Card sx={{ borderRadius: 3, p: 3, textAlign: 'center', bgcolor: '#F8FAFC' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma avaliação registrada ainda. Seja o primeiro a avaliar um atleta!
            </Typography>
          </Card>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {avaliacoesFeed.map((rev) => (
              <Card key={rev.id} sx={{ borderRadius: 3, p: 2, bgcolor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <CardContent sx={{ p: '0 !important' }}>
                  
                  {/* Cabeçalho da Avaliação */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Avatar 
                        src={rev.avaliadorFoto} 
                        sx={{ width: 34, height: 34, bgcolor: '#0066FF', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        {rev.avaliadorNome ? rev.avaliadorNome.charAt(0) : 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight={800} color="primary.main" display="block">
                          {rev.avaliadorNome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          avaliou <strong>{rev.avaliadoNome}</strong>
                        </Typography>
                      </Box>
                    </Box>

                    <Rating value={Number(rev.nota)} readOnly size="small" sx={{ color: '#FFD700' }} />
                  </Box>

                  {/* Comentário */}
                  <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', pl: 1, borderLeft: '3px solid #0066FF', my: 1 }}>
                    "{rev.comentario}"
                  </Typography>

                  {/* Rodapé com Esporte e Bairro */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.5} borderTop="1px solid #F1F5F9">
                    <Chip 
                      size="small" 
                      label={rev.partidaEsporte || 'Partida em Franca'} 
                      sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: '#EFF6FF', color: 'primary.main', height: 20 }} 
                    />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {new Date(rev.dataAvaliacao).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>

                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Snackbar 
        open={Boolean(toastMensagem)} 
        autoHideDuration={3500} 
        onClose={() => setToastMensagem(null)}
      >
        <Alert severity="success" sx={{ width: '100%', fontWeight: 700 }}>
          {toastMensagem}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RatingScreen;
