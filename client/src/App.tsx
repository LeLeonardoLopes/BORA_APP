import React, { useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  Slider, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Card, 
  CardContent, 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  Chip, 
  Fab, 
  Snackbar, 
  Alert,
  Avatar,
  TextField,
  Button
} from '@mui/material';
import { Compass, LogOut, Star, Plus, User } from 'lucide-react';
import { boraTheme } from './theme/boraTheme';
import { MatchCard } from './components/MatchCard';
import { CreateMatchModal } from './components/CreateMatchModal';
import { AuthScreen } from './screens/AuthScreen';
import { RatingScreen } from './screens/RatingScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export const App: React.FC = () => {
  const [usuarioLogado, setUsuarioLogado] = useState<any | null>(() => {
    const salvo = localStorage.getItem('@bora:user');
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.error('Erro ao ler usuario do localStorage:', e);
      }
    }
    return {
      id: 'user-mock-1',
      nome: 'Leonardo Santos',
      email: 'leonardo@boraapp.com.br',
      telefone: '(16) 99876-5432',
      genero: 'Masculino',
      raioBuscaKm: 5,
      notaMedia: 4.95,
      totalAvaliacoes: 18,
      fotoUrl: null,
      meuTime: {
        nome: 'Bora Franca F.C.',
        escudoUrl: null,
        modalidade: 'Futebol de Campo (11x11)',
        bairro: 'São José'
      }
    };
  });

  const [abaAtual, setAbaAtual] = useState<string>('explorar');
  const [raioKm, setRaioKm] = useState<number>(5);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  const [partidas, setPartidas] = useState<any[]>([
    {
      id: '1',
      esporte: 'Futebol de Campo (11x11)',
      descricao: 'Amistoso de domingo de manhã no Campo do Continental em Franca. Levar 1º e 2º uniforme.',
      dataHora: new Date(Date.now() + 86400000).toISOString(),
      bairro: 'São José',
      enderecoCompleto: 'Av. Dr. Ismael Alonso y Alonso, 2000 - Franca/SP',
      lat: -20.5342150,
      lng: -47.4012580,
      vagasPreenchidas: 1,
      maxVagas: 2,
      formatoJogo: 'Amistoso_Times',
      tipoLocal: 'Publica',
      timeMandante: 'Bora Franca F.C.',
      timeVisitante: null,
      taxaCampo: 0,
      taxaJuiz: 80,
      valorPorEquipe: 40,
      isConfirmado: true
    },
    {
      id: '2',
      esporte: 'Futebol de 7 (Terrão)',
      descricao: 'Racha no terrão do Parque Progresso. Quadra pública e aberta.',
      dataHora: new Date(Date.now() + 172800000).toISOString(),
      bairro: 'Parque Progresso',
      enderecoCompleto: 'Av. Paulo VI, 2727 - Franca/SP',
      lat: -20.5411200,
      lng: -47.3956400,
      vagasPreenchidas: 8,
      maxVagas: 14,
      formatoJogo: 'Avulso',
      tipoLocal: 'Publica',
      taxaCampo: 0,
      taxaJuiz: 0,
      isConfirmado: false
    },
    {
      id: '3',
      esporte: 'Futebol Society',
      descricao: 'Amistoso de Society em Arena Privada (Grama sintética com churrasqueira).',
      dataHora: new Date(Date.now() + 259200000).toISOString(),
      bairro: 'Vila Nova',
      enderecoCompleto: 'Rua Francisco Marques, 850 - Franca/SP',
      lat: -20.5289400,
      lng: -47.4128900,
      vagasPreenchidas: 2,
      maxVagas: 2,
      formatoJogo: 'Amistoso_Times',
      tipoLocal: 'Privada',
      timeMandante: 'Vila Nova E.C.',
      timeVisitante: 'União da Estação',
      taxaCampo: 180,
      taxaJuiz: 60,
      valorPorEquipe: 120,
      isConfirmado: false
    }
  ]);

  if (!usuarioLogado) {
    return (
      <ThemeProvider theme={boraTheme}>
        <CssBaseline />
        <AuthScreen onLoginSuccess={(_, user) => setUsuarioLogado(user)} />
      </ThemeProvider>
    );
  }

  const handleCriarPartida = (novaPartida: any) => {
    setPartidas((prev) => [
      {
        ...novaPartida,
        isConfirmado: true,
      },
      ...prev,
    ]);
    setToastMensagem(
      novaPartida.formatoJogo === 'Amistoso_Times' 
        ? 'Amistoso publicado! Aguardando equipes adversárias de Franca desafiarem seu time.' 
        : 'Partida aberta publicada com sucesso!'
    );
  };

  const handleSolicitarVaga = (id: string) => {
    setToastMensagem('Solicitação individual enviada! Aguardando o organizador aprovar sua vaga para liberar o mapa.');
  };

  const handleMarcarAmistoso = (id: string) => {
    if (!usuarioLogado.meuTime) {
      setToastMensagem('Você precisa cadastrar seu time na aba Meu Perfil antes de marcar um amistoso!');
      return;
    }
    setPartidas((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, timeVisitante: usuarioLogado.meuTime.nome, vagasPreenchidas: 2 } : p
      )
    );
    setToastMensagem('Desafio de Amistoso enviado com o time ' + usuarioLogado.meuTime.nome + '!');
  };

  return (
    <ThemeProvider theme={boraTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        {/* TopBar Oficial com Visual do Figma */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                OLÁ, {usuarioLogado.nome.toUpperCase()}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, color: '#fff', lineHeight: 1.1 }}>
                BORA! <Box component="span" sx={{ color: 'secondary.main' }}>APP</Box>
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                icon={<Star size={14} fill="#000" color="#000" />} 
                label={usuarioLogado.notaMedia.toFixed(2)}
                sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 800 }}
              />
              <Avatar 
                src={usuarioLogado.fotoUrl || undefined}
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: '#D9D9D9', 
                  color: '#0066FF', 
                  fontWeight: 900,
                  border: '2px solid #FFD700', 
                  cursor: 'pointer' 
                }}
                onClick={() => setAbaAtual('perfil')}
              >
                <User size={20} />
              </Avatar>
              <IconButton sx={{ color: '#fff' }} onClick={() => setUsuarioLogado(null)}>
                <LogOut size={18} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ mt: 3 }}>
          {abaAtual === 'explorar' && (
            <>
              {/* Seletor de Raio Interativo */}
              <Card sx={{ borderRadius: 4, mb: 3, p: 2, bgcolor: '#FFFFFF' }}>
                <CardContent sx={{ p: '8px !important' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Compass size={20} color="#0066FF" />
                      <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                        Raio de Busca (GPS Franca/SP)
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                      {raioKm} km
                    </Typography>
                  </Box>
                  <Slider
                    value={raioKm}
                    min={1}
                    max={5}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(_, val) => setRaioKm(val as number)}
                    sx={{ color: 'primary.main' }}
                  />
                </CardContent>
              </Card>

              {/* Lista de Partidas */}
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5, px: 0.5, color: 'text.primary' }}>
                Partidas & Amistosos Disponíveis ({partidas.length})
              </Typography>

              {partidas.map((match) => (
                <MatchCard
                  key={match.id}
                  {...match}
                  onSolicitarVaga={handleSolicitarVaga}
                  onMarcarAmistoso={handleMarcarAmistoso}
                />
              ))}

              <Fab
                color="secondary"
                aria-label="add"
                onClick={() => setModalCriarAberto(true)}
                sx={{
                  position: 'fixed',
                  bottom: 72,
                  right: 24,
                  fontWeight: 900,
                  bgcolor: '#FFD700',
                  color: '#000',
                  boxShadow: '0 6px 24px rgba(255,215,0,0.5)',
                  '&:hover': { bgcolor: '#FFE44D' }
                }}
              >
                <Plus size={24} />
              </Fab>

              <CreateMatchModal
                open={modalCriarAberto}
                onClose={() => setModalCriarAberto(false)}
                onSuccess={handleCriarPartida}
                meuTime={usuarioLogado.meuTime}
              />
            </>
          )}

          {abaAtual === 'perfil' && (
            <ProfileScreen
              usuario={usuarioLogado}
              onSalvarPerfil={(dados) => {
                setUsuarioLogado(dados);
                setToastMensagem('Perfil atualizado com sucesso!');
              }}
            />
          )}

          {abaAtual === 'avaliar' && (
            <RatingScreen 
              atletaNome="Renata Claudino"
              partidaEsporte="Beach Tennis"
              onConcluir={() => {
                setToastMensagem('Avaliação computada com sucesso!');
                setAbaAtual('explorar');
              }}
            />
          )}
        </Container>

        {/* Bottom Navigation Mobile */}
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={4}>
          <BottomNavigation
            value={abaAtual}
            onChange={(_, newValue) => setAbaAtual(newValue)}
            showLabels
          >
            <BottomNavigationAction label="Explorar" value="explorar" icon={<Compass size={20} />} />
            <BottomNavigationAction label="Avaliar" value="avaliar" icon={<Star size={20} />} />
            <BottomNavigationAction label="Meu Perfil" value="perfil" icon={<User size={20} />} />
          </BottomNavigation>
        </Paper>

        <Snackbar 
          open={Boolean(toastMensagem)} 
          autoHideDuration={3500} 
          onClose={() => setToastMensagem(null)}
        >
          <Alert severity="success" sx={{ width: '100%', fontWeight: 700 }}>
            {toastMensagem}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;
