import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  InputAdornment, 
  Skeleton, 
  Button, 
  ToggleButtonGroup, 
  ToggleButton, 
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Compass, 
  LogOut, 
  Star, 
  Plus, 
  User, 
  RefreshCw, 
  Search, 
  X, 
  Filter, 
  Shield, 
  Users, 
  Trees, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Map, 
  List as ListIcon, 
  Trophy,
  Sun,
  Moon
} from 'lucide-react';
import { getBoraTheme } from './theme/boraTheme';
import { MatchCard } from './components/MatchCard';
import { CreateMatchModal } from './components/CreateMatchModal';
import { FullMapExplorer } from './components/FullMapExplorer';
import { AuthScreen } from './screens/AuthScreen';
import { RatingScreen } from './screens/RatingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MyMatchesScreen } from './screens/MyMatchesScreen';
import { api } from './services/api';

export const MODALIDADES_FILTRO = [
  'Todos',
  'Futebol Society',
  'Futebol de Campo (11x11)',
  'Futebol de 7 (Terrão)',
  'Futsal',
  'Basquete',
  'Basquete 3x3',
  'Vôlei de Quadra',
  'Vôlei de Praia / Futevôlei',
  'Beach Tennis',
  'Handebol'
];

export const App: React.FC = () => {
  // Estado do Tema (Claro / Escuro com persistência)
  const [tema, setTema] = useState<'light' | 'dark'>(() => {
    const salvo = localStorage.getItem('@bora:theme');
    if (salvo === 'light' || salvo === 'dark') return salvo;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const alternarTema = () => {
    const novoTema = tema === 'light' ? 'dark' : 'light';
    setTema(novoTema);
    localStorage.setItem('@bora:theme', novoTema);
  };

  const currentTheme = useMemo(() => getBoraTheme(tema), [tema]);

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
      id: '11111111-1111-1111-1111-111111111101',
      nome: 'Leonardo Lopes',
      email: 'leonardo.lopes@boraapp.com.br',
      telefone: '(16) 99876-5432',
      genero: 'Masculino',
      bairroResidencia: 'São José',
      raioBuscaKm: 15,
      notaMedia: 4.95,
      totalAvaliacoes: 28,
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      meuTime: {
        nome: 'Bora Franca F.C.',
        escudoUrl: null,
        modalidade: 'Futebol Society',
        bairro: 'São José'
      }
    };
  });

  const [abaAtual, setAbaAtual] = useState<string>('explorar');
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [raioKm, setRaioKm] = useState<number>(15); // Raio padrão da cidade inteira de Franca/SP (15 a 25 km)
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const [carregandoPartidas, setCarregandoPartidas] = useState(false);
  const [partidas, setPartidas] = useState<any[]>([]);
  const [totalSolicitacoesPendentes, setTotalSolicitacoesPendentes] = useState<number>(3);

  // ESTADOS DE FILTRO
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroFormato, setFiltroFormato] = useState<'Todos' | 'Avulso' | 'Amistoso_Times'>('Todos');
  const [filtroEsporte, setFiltroEsporte] = useState<string>('Todos');
  const [filtroTipoLocal, setFiltroTipoLocal] = useState<'Todos' | 'Publica' | 'Privada'>('Todos');

  // Refs para controle de rolagem horizontal com botões laterais
  const scrollModalidadesRef = useRef<HTMLDivElement>(null);
  const scrollFormatosRef = useRef<HTMLDivElement>(null);

  const rolarHorizontal = (ref: React.RefObject<HTMLDivElement>, direcao: 'esquerda' | 'direita') => {
    if (ref.current) {
      const deslocamento = direcao === 'esquerda' ? -220 : 220;
      ref.current.scrollBy({ left: deslocamento, behavior: 'smooth' });
    }
  };

  // Carregar partidas reais do Backend (PostgreSQL)
  const carregarPartidasDoBanco = useCallback(async (raio: number) => {
    setCarregandoPartidas(true);
    try {
      const response = await api.get(`/matches?lat=-20.5388&lng=-47.4005&radius=${raio}`);
      if (response.data && Array.isArray(response.data.data)) {
        const formatadas = response.data.data.map((p: any) => {
          const isAmistoso = p.esporte?.includes('Amistoso') || p.maxVagas <= 2 || p.descricao?.toLowerCase().includes('amistoso');
          const isPrivada = p.descricao?.toLowerCase().includes('arena') || p.descricao?.toLowerCase().includes('privada') || p.descricao?.toLowerCase().includes('sintética') || p.descricao?.toLowerCase().includes('sunset');
          return {
            id: p.id,
            esporte: p.esporte,
            descricao: p.descricao,
            dataHora: p.dataHora,
            bairro: p.bairro,
            enderecoCompleto: p.enderecoCompleto || `${p.bairro}, Franca/SP`,
            lat: Number(p.lat),
            lng: Number(p.lng),
            vagasPreenchidas: p.vagasPreenchidas || 0,
            maxVagas: p.maxVagas || 14,
            formatoJogo: isAmistoso ? 'Amistoso_Times' : 'Avulso',
            tipoLocal: isPrivada ? 'Privada' : 'Publica',
            timeMandante: isAmistoso ? (p.timeMandante || 'Equipe de Franca') : undefined,
            timeVisitante: null,
            taxaCampo: p.taxaCampo || 0,
            taxaJuiz: p.taxaJuiz || 0,
            valorPorEquipe: (p.taxaCampo || 0) / 2,
            isConfirmado: p.isOrganizador || false,
          };
        });
        setPartidas(formatadas);
      }
    } catch (err: any) {
      console.warn('Erro ao buscar partidas da API:', err.message);
    } finally {
      setCarregandoPartidas(false);
    }
  }, []);

  // Efeito para carregar na montagem e sempre que o raio for alterado
  useEffect(() => {
    if (usuarioLogado) {
      carregarPartidasDoBanco(raioKm);
    }
  }, [carregarPartidasDoBanco, raioKm, usuarioLogado]);

  // FILTRAGEM DINÂMICA EM MEMÓRIA
  const partidasFiltradas = useMemo(() => {
    return partidas.filter((match) => {
      // 1. Filtro por Formato (Avulso vs Amistoso)
      if (filtroFormato !== 'Todos' && match.formatoJogo !== filtroFormato) {
        return false;
      }

      // 2. Filtro por Esporte / Modalidade
      if (filtroEsporte !== 'Todos') {
        const matchEsporte = match.esporte.toLowerCase();
        const filtro = filtroEsporte.toLowerCase();
        if (!matchEsporte.includes(filtro.replace(' (11x11)', '').replace(' (terrão)', ''))) {
          return false;
        }
      }

      // 3. Filtro por Tipo de Local (Pública vs Privada)
      if (filtroTipoLocal !== 'Todos' && match.tipoLocal !== filtroTipoLocal) {
        return false;
      }

      // 4. Busca Textual por Bairro, Endereço ou Descrição
      if (termoBusca.trim()) {
        const busca = termoBusca.toLowerCase().trim();
        const textoMatch = `${match.bairro} ${match.enderecoCompleto} ${match.esporte} ${match.descricao || ''}`.toLowerCase();
        if (!textoMatch.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  }, [partidas, filtroFormato, filtroEsporte, filtroTipoLocal, termoBusca]);

  const temFiltroAtivo = filtroFormato !== 'Todos' || filtroEsporte !== 'Todos' || filtroTipoLocal !== 'Todos' || Boolean(termoBusca);

  const limparFiltros = () => {
    setFiltroFormato('Todos');
    setFiltroEsporte('Todos');
    setFiltroTipoLocal('Todos');
    setTermoBusca('');
  };

  if (!usuarioLogado) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <AuthScreen onLoginSuccess={(_, user) => setUsuarioLogado(user)} />
      </ThemeProvider>
    );
  }

  const handleCriarPartida = async (novaPartida: any) => {
    const partidaFormatada = {
      ...novaPartida,
      organizadorId: usuarioLogado.id,
      isOrganizador: true,
      isConfirmado: true,
    };

    try {
      await api.post('/matches', partidaFormatada);
    } catch (err) {
      console.warn('Erro ao sincronizar nova partida na API:', err);
    }

    setPartidas((prev) => [partidaFormatada, ...prev]);

    setToastMensagem(
      novaPartida.formatoJogo === 'Amistoso_Times' 
        ? 'Amistoso publicado! Aguardando equipes adversárias de Franca desafiarem seu time.' 
        : 'Partida aberta publicada com sucesso!'
    );
  };

  const handleSolicitarVaga = async (id: string) => {
    try {
      await api.post(`/matches/${id}/requests`, { usuarioId: usuarioLogado.id });
    } catch (e) {
      console.warn('Fallback de solicitação:', e);
    }
    setToastMensagem('Solicitação enviada com sucesso! O organizador receberá a notificação para aprovação.');
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

  const isDark = tema === 'dark';

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10, transition: 'background-color 0.25s ease' }}>
        
        {/* TopBar Oficial com Visual do Figma & Alternador de Tema */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: isDark ? '#0F172A' : 'primary.main' }}>
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
              {/* BOTÃO DE ALTERNÂNCIA DE TEMA (CLARO / ESCURO) */}
              <Tooltip title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}>
                <IconButton 
                  size="small"
                  onClick={alternarTema} 
                  sx={{ 
                    color: '#fff', 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    p: 0.8
                  }}
                >
                  {isDark ? <Sun size={17} color="#FFD700" /> : <Moon size={17} color="#FFFFFF" />}
                </IconButton>
              </Tooltip>

              <Chip 
                icon={<Star size={13} fill="#000" color="#000" />} 
                label={Number(usuarioLogado.notaMedia || 5).toFixed(2)}
                sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 800, height: 26 }}
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

        <Container maxWidth="sm" sx={{ mt: 2 }}>
          
          {abaAtual === 'explorar' && (
            <>
              {/* ALTERNADOR DE VISUALIZAÇÃO: LISTA 📋 vs MAPA GERAL 🗺️ */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <ToggleButtonGroup
                  value={modoVisualizacao}
                  exclusive
                  onChange={(_, val) => val && setModoVisualizacao(val)}
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    '& .MuiToggleButton-root': {
                      px: 2,
                      py: 0.7,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '0.82rem',
                    },
                    '& .Mui-selected': {
                      bgcolor: 'primary.main !important',
                      color: '#FFFFFF !important',
                    }
                  }}
                >
                  <ToggleButton value="lista">
                    <ListIcon size={16} style={{ marginRight: 6 }} /> Lista de Jogos
                  </ToggleButton>
                  <ToggleButton value="mapa">
                    <Map size={16} style={{ marginRight: 6 }} /> Mapa de Franca/SP
                  </ToggleButton>
                </ToggleButtonGroup>

                <Chip
                  label={raioKm >= 20 ? 'Toda Franca/SP' : `${raioKm} km de raio`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              {/* BARRA DE PESQUISA RÁPIDA POR BAIRRO / LOCAL */}
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar bairro, arena ou esporte..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color={isDark ? '#60A5FA' : '#0066FF'} />
                    </InputAdornment>
                  ),
                  endAdornment: termoBusca ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setTermoBusca('')}>
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: {
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    mb: 2
                  }
                }}
              />

              {/* CARD DE FILTROS & RAIO (ATÉ 25 KM - TODA CIDADE DE FRANCA) */}
              <Card sx={{ borderRadius: 3.5, mb: 2.5, p: 2, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: '0px !important', display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                  
                  {/* Seletor de Raio Interativo da Cidade Inteira de Franca */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Compass size={18} color={isDark ? '#60A5FA' : '#0066FF'} />
                        <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                          Raio de Cobertura (Franca/SP)
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                          {raioKm >= 20 ? 'Toda a Cidade (25 km)' : `${raioKm} km`}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => carregarPartidasDoBanco(raioKm)}
                          disabled={carregandoPartidas}
                          sx={{ color: 'primary.main', p: 0.5 }}
                        >
                          <RefreshCw size={15} className={carregandoPartidas ? 'animate-spin' : ''} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Slider
                      value={raioKm}
                      min={2}
                      max={25}
                      step={1}
                      marks={[
                        { value: 2, label: '2km' },
                        { value: 10, label: '10km' },
                        { value: 15, label: 'Franca' },
                        { value: 25, label: 'Toda Cidade' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, val) => setRaioKm(val as number)}
                      sx={{ color: 'primary.main', py: 1 }}
                    />
                  </Box>

                  {/* 1. FILTRO POR FORMATO (TODOS / AMISTOSO / AVULSO) COM CONTROLES */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Formato da Partida:
                      </Typography>
                      <Box display="flex" gap={0.3}>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollFormatosRef, 'esquerda')} sx={{ p: 0.3, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronLeft size={14} />
                        </IconButton>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollFormatosRef, 'direita')} sx={{ p: 0.3, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronRight size={14} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box 
                      ref={scrollFormatosRef}
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        overflowX: 'auto', 
                        pb: 1,
                        scrollBehavior: 'smooth',
                        '&::-webkit-scrollbar': { height: '5px' },
                        '&::-webkit-scrollbar-track': { bgcolor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#475569' : '#CBD5E1', borderRadius: '4px', '&:hover': { bgcolor: '#0066FF' } },
                      }}
                    >
                      <Chip
                        label="Todos os Formatos"
                        size="medium"
                        onClick={() => setFiltroFormato('Todos')}
                        sx={{
                          fontWeight: filtroFormato === 'Todos' ? 900 : 700,
                          bgcolor: filtroFormato === 'Todos' ? 'primary.main' : (isDark ? '#1E293B' : '#F1F5F9'),
                          color: filtroFormato === 'Todos' ? '#FFFFFF' : 'text.primary',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.5
                        }}
                      />
                      <Chip
                        icon={<Shield size={15} color={filtroFormato === 'Amistoso_Times' ? '#FFFFFF' : '#0066FF'} />}
                        label="🤝 Amistosos (Times)"
                        size="medium"
                        onClick={() => setFiltroFormato('Amistoso_Times')}
                        sx={{
                          fontWeight: filtroFormato === 'Amistoso_Times' ? 900 : 700,
                          bgcolor: filtroFormato === 'Amistoso_Times' ? 'primary.main' : (isDark ? '#1E3A5F' : '#EFF6FF'),
                          color: filtroFormato === 'Amistoso_Times' ? '#FFFFFF' : (isDark ? '#93C5FD' : 'primary.main'),
                          border: isDark ? '1.5px solid #2563EB' : '1.5px solid #BFDBFE',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.5
                        }}
                      />
                      <Chip
                        icon={<Users size={15} color={filtroFormato === 'Avulso' ? '#FFFFFF' : '#16A34A'} />}
                        label="⚽ Partidas Abertas (Avulso)"
                        size="medium"
                        onClick={() => setFiltroFormato('Avulso')}
                        sx={{
                          fontWeight: filtroFormato === 'Avulso' ? 900 : 700,
                          bgcolor: filtroFormato === 'Avulso' ? '#16A34A' : (isDark ? '#064E3B' : '#F0FDF4'),
                          color: filtroFormato === 'Avulso' ? '#FFFFFF' : (isDark ? '#86EFAC' : '#166534'),
                          border: isDark ? '1.5px solid #059669' : '1.5px solid #BBF7D0',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.5
                        }}
                      />
                    </Box>
                  </Box>

                  {/* 2. FILTRO POR MODALIDADE ESPORTIVA COM BARRA VISÍVEL E SETAS */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Modalidade Esportiva:
                      </Typography>
                      <Box display="flex" gap={0.3}>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollModalidadesRef, 'esquerda')} sx={{ p: 0.3, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronLeft size={14} />
                        </IconButton>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollModalidadesRef, 'direita')} sx={{ p: 0.3, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronRight size={14} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box 
                      ref={scrollModalidadesRef}
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        overflowX: 'auto', 
                        pb: 1,
                        scrollBehavior: 'smooth',
                        '&::-webkit-scrollbar': { height: '6px' },
                        '&::-webkit-scrollbar-track': { bgcolor: isDark ? '#1E293B' : '#F1F5F9', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#475569' : '#94A3B8', borderRadius: '4px', '&:hover': { bgcolor: '#0066FF' } },
                      }}
                    >
                      {MODALIDADES_FILTRO.map((modalidade) => {
                        const ativo = filtroEsporte === modalidade;
                        return (
                          <Chip
                            key={modalidade}
                            label={modalidade}
                            size="medium"
                            onClick={() => setFiltroEsporte(modalidade)}
                            sx={{
                              fontWeight: ativo ? 900 : 700,
                              bgcolor: ativo ? 'secondary.main' : (isDark ? '#1E293B' : '#FFFFFF'),
                              color: ativo ? '#000000' : 'text.primary',
                              border: ativo ? '2px solid #EAB308' : (isDark ? '1.5px solid #334155' : '1.5px solid #CBD5E1'),
                              boxShadow: ativo ? '0 2px 8px rgba(255,215,0,0.35)' : 'none',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              px: 0.8
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* 3. FILTRO POR TIPO DE LOCAL (PÚBLICA / PRIVADA) & LIMPAR FILTROS */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop={isDark ? '1px solid #1E293B' : '1px solid #F1F5F9'}>
                    <Box display="flex" gap={0.8}>
                      <Chip
                        icon={<Trees size={14} color={filtroTipoLocal === 'Publica' ? '#FFFFFF' : '#16A34A'} />}
                        label="Públicas (Gratuitas)"
                        size="small"
                        onClick={() => setFiltroTipoLocal(filtroTipoLocal === 'Publica' ? 'Todos' : 'Publica')}
                        sx={{
                          fontWeight: filtroTipoLocal === 'Publica' ? 800 : 600,
                          bgcolor: filtroTipoLocal === 'Publica' ? '#16A34A' : (isDark ? '#1E293B' : '#F8FAFC'),
                          color: filtroTipoLocal === 'Publica' ? '#FFFFFF' : 'text.secondary',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      />
                      <Chip
                        icon={<Building2 size={14} color={filtroTipoLocal === 'Privada' ? '#FFFFFF' : '#0066FF'} />}
                        label="Privadas (Arenas)"
                        size="small"
                        onClick={() => setFiltroTipoLocal(filtroTipoLocal === 'Privada' ? 'Todos' : 'Privada')}
                        sx={{
                          fontWeight: filtroTipoLocal === 'Privada' ? 800 : 600,
                          bgcolor: filtroTipoLocal === 'Privada' ? '#0066FF' : (isDark ? '#1E293B' : '#F8FAFC'),
                          color: filtroTipoLocal === 'Privada' ? '#FFFFFF' : 'text.secondary',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      />
                    </Box>

                    {temFiltroAtivo && (
                      <Button
                        size="small"
                        onClick={limparFiltros}
                        startIcon={<X size={13} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          color: 'error.main',
                          py: 0.2
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </Box>

                </CardContent>
              </Card>

              {/* MODO MAPA DE FRANCA/SP vs MODO LISTA */}
              {modoVisualizacao === 'mapa' ? (
                <Box mb={4}>
                  <Typography variant="subtitle1" fontWeight={900} color="text.primary" mb={1} px={0.5}>
                    🗺️ Mapa Geral de Partidas em Franca ({partidasFiltradas.length} locais)
                  </Typography>
                  <FullMapExplorer 
                    partidas={partidasFiltradas}
                    raioKm={raioKm}
                    onSolicitarVaga={handleSolicitarVaga}
                    onMarcarAmistoso={handleMarcarAmistoso}
                  />
                </Box>
              ) : (
                <>
                  {/* CABEÇALHO DA LISTA COM CONTAGEM FILTRADA */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} px={0.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      Partidas Encontradas ({partidasFiltradas.length})
                    </Typography>
                    {temFiltroAtivo && (
                      <Chip
                        icon={<Filter size={12} />}
                        label="Filtro Ativo"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                      />
                    )}
                  </Box>

                  {/* LISTA DE PARTIDAS */}
                  {carregandoPartidas && partidas.length === 0 ? (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                      <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                      <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                    </Box>
                  ) : partidasFiltradas.length === 0 ? (
                    <Card sx={{ borderRadius: 3, p: 3.5, textAlign: 'center', bgcolor: 'background.paper', border: '1px dashed #CBD5E1' }}>
                      <Typography variant="subtitle2" fontWeight={800} color="text.primary" mb={0.5}>
                        Nenhuma partida corresponde aos filtros selecionados.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Tente aumentar o raio de busca ou limpar os filtros para encontrar outros rachas e amistosos em Franca.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={limparFiltros}
                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                      >
                        Ver Todas as Partidas ({partidas.length})
                      </Button>
                    </Card>
                  ) : (
                    partidasFiltradas.map((match) => (
                      <MatchCard
                        key={match.id}
                        {...match}
                        onSolicitarVaga={handleSolicitarVaga}
                        onMarcarAmistoso={handleMarcarAmistoso}
                      />
                    ))
                  )}
                </>
              )}

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

          {abaAtual === 'minhas_partidas' && (
            <MyMatchesScreen
              usuarioLogado={usuarioLogado}
              onPartidaCancelada={(partidaId) => {
                setPartidas((prev) => prev.filter((p) => p.id !== partidaId));
              }}
            />
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
              usuarioLogado={usuarioLogado}
              onConcluir={() => {
                setAbaAtual('explorar');
              }}
            />
          )}
        </Container>

        {/* Bottom Navigation Mobile com 4 Abas Oficiais */}
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={4}>
          <BottomNavigation
            value={abaAtual}
            onChange={(_, newValue) => setAbaAtual(newValue)}
            showLabels
            sx={{ bgcolor: isDark ? '#0F172A' : '#FFFFFF' }}
          >
            <BottomNavigationAction label="Explorar" value="explorar" icon={<Compass size={20} />} />
            <BottomNavigationAction 
              label="Gestão" 
              value="minhas_partidas" 
              icon={
                <Badge badgeContent={totalSolicitacoesPendentes} color="error">
                  <Trophy size={20} />
                </Badge>
              } 
            />
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
