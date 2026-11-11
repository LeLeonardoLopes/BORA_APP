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
  Autocomplete,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBoraTheme } from './theme/boraTheme';
import { MatchCard } from './components/MatchCard';
import { CreateMatchModal } from './components/CreateMatchModal';
import { FullMapExplorer } from './components/FullMapExplorer';
import { AuthScreen } from './screens/AuthScreen';
import { RatingScreen } from './screens/RatingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MyMatchesScreen } from './screens/MyMatchesScreen';
import { api } from './services/api';
import { geocodificarEndereco, obterLocalizacaoAtualGPS, buscarSugestoesEndereco, calcularDistanciaKm, SugestaoEndereco } from './services/geocodingService';
import {
  lerPartidasLocais,
  salvarPartidaLocal,
  excluirPartidaLocal,
  partidaFoiExcluida,
  lerSolicitacoesLocais,
  salvarSolicitacaoLocal,
  atualizarStatusSolicitacaoLocal
} from './services/partidasLocais';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';

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

interface NotificacaoRealtime {
  tipo: 'success' | 'info' | 'warning' | 'error';
  texto: string;
  acaoTexto?: string;
  onAcao?: () => void;
}

export const App: React.FC = () => {
  const queryClient = useQueryClient();

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
    const token = localStorage.getItem('@bora:token');
    const salvo = localStorage.getItem('@bora:user');
    if (token && salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.error('Erro ao ler usuario do localStorage:', e);
        localStorage.removeItem('@bora:token');
        localStorage.removeItem('@bora:user');
      }
    }
    return null;
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('@bora:token');
    localStorage.removeItem('@bora:user');
    queryClient.clear();
    setUsuarioLogado(null);
  }, [queryClient]);

  const [abaAtual, setAbaAtual] = useState<string>('explorar');
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [raioKm, setRaioKm] = useState<number>(15); // Raio padrão da cidade inteira de Franca/SP (15 a 25 km)
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const [notificacaoRealtime, setNotificacaoRealtime] = useState<NotificacaoRealtime | null>(null);
  const [totalSolicitacoesPendentes, setTotalSolicitacoesPendentes] = useState<number>(0);

  // ESTADOS DE FILTRO
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [enderecoBusca, setEnderecoBusca] = useState<string>('');
  const [coordBusca, setCoordBusca] = useState<{ lat: number; lng: number; origem?: string; displayName?: string }>({
    lat: -20.5388,
    lng: -47.4005,
    origem: 'fallback_centro',
  });
  const [buscandoEndereco, setBuscandoEndereco] = useState<boolean>(false);

  const buscarPorEndereco = useCallback(async () => {
    if (!enderecoBusca.trim()) return;
    setBuscandoEndereco(true);
    try {
      const coords = await geocodificarEndereco(enderecoBusca.trim());
      setCoordBusca(coords);
      if (coords.origem === 'fallback_centro') {
        setToastMensagem('Não consegui localizar esse endereço. Tente incluir o bairro ou use o GPS.');
      }
    } catch (e) {
      setToastMensagem('Erro ao buscar o endereço. Verifique sua conexão e tente novamente.');
    } finally {
      setBuscandoEndereco(false);
    }
  }, [enderecoBusca]);

  const [sugestoesEndereco, setSugestoesEndereco] = useState<SugestaoEndereco[]>([]);

  // Sugestões de endereço enquanto digita + geocodificação automática fiel à geolocalização de Franca/SP
  useEffect(() => {
    const texto = enderecoBusca.trim();
    if (texto.length === 0) {
      setSugestoesEndereco([]);
      setCoordBusca((prev) =>
        prev.origem === 'gps_dispositivo'
          ? prev
          : { lat: -20.5388, lng: -47.4005, origem: 'fallback_centro' }
      );
      return;
    }
    if (texto.length < 3) {
      setSugestoesEndereco([]);
      return;
    }
    const timer = setTimeout(async () => {
      const lista = await buscarSugestoesEndereco(texto);
      setSugestoesEndereco(lista);
      const coords = await geocodificarEndereco(texto);
      if (coords.origem !== 'fallback_centro') {
        setCoordBusca(coords);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [enderecoBusca]);

  const usarMinhaLocalizacaoAtual = useCallback(async () => {
    setBuscandoEndereco(true);
    try {
      const coords = await obterLocalizacaoAtualGPS();
      setCoordBusca(coords);
      setEnderecoBusca('');
    } catch (e: any) {
      const negado = e?.code === 1;
      setToastMensagem(
        negado
          ? 'Permissão de localização negada. Libere o acesso à localização no navegador e tente de novo.'
          : 'Não foi possível obter sua localização agora. Digite seu endereço.'
      );
    } finally {
      setBuscandoEndereco(false);
    }
  }, []);

  const [filtroFormato, setFiltroFormato] = useState<'Todos' | 'Avulso' | 'Amistoso_Times' | 'Feminino'>('Todos');
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

  // TanStack Query: Carregar partidas reais do Backend (PostgreSQL)
  const {
    data: partidas = [],
    isLoading: carregandoPartidas,
    refetch: carregarPartidasDoBanco,
  } = useQuery<any[]>({
    queryKey: ['matches', raioKm, coordBusca.lat, coordBusca.lng],
    queryFn: async () => {
      const mapearPartida = (p: any) => {
        const isAmistoso = p.formatoJogo === 'Amistoso_Times' || p.esporte?.includes('Amistoso') || p.maxVagas <= 2 || p.descricao?.toLowerCase().includes('amistoso');
        const isPrivada = p.tipoLocal === 'Privada' || p.descricao?.toLowerCase().includes('arena') || p.descricao?.toLowerCase().includes('privada') || p.descricao?.toLowerCase().includes('sintética') || p.descricao?.toLowerCase().includes('sunset');
        return {
          id: p.id,
          esporte: p.esporte,
          descricao: p.descricao,
          dataHora: p.dataHora,
          duracaoMinutos: p.duracaoMinutos || 90,
          statusPartida: p.statusPartida || 'Publicada',
          organizadorId: p.organizadorId || p.organizador_id,
          isOrganizador: Boolean(p.isOrganizador || (usuarioLogado?.id && (p.organizadorId || p.organizador_id) === usuarioLogado.id)),
          bairro: p.bairro,
          enderecoCompleto: p.enderecoCompleto || `${p.bairro}, Franca/SP`,
          lat: Number(p.lat),
          lng: Number(p.lng),
          vagasPreenchidas: p.vagasPreenchidas || 0,
          maxVagas: p.maxVagas || 14,
          filtroGenero: p.filtroGenero || 'Misto',
          espacoSeguroFeminino: Boolean(p.espacoSeguroFeminino || p.espaco_seguro_feminino || p.filtroGenero === 'Feminino' || p.filtro_genero === 'Feminino'),
          filtroNivel: p.filtroNivel || 'Todos',
          formatoJogo: (isAmistoso ? 'Amistoso_Times' : 'Avulso') as 'Avulso' | 'Amistoso_Times',
          tipoLocal: p.tipoLocal || (isPrivada ? 'Privada' : 'Publica'),
          timeMandante: isAmistoso ? (p.timeMandante || 'Equipe de Franca') : undefined,
          timeVisitante: null,
          taxaCampo: p.taxaCampo || 0,
          taxaJuiz: p.taxaJuiz || 0,
          valorPorEquipe: (p.taxaCampo || 0) / 2,
          isConfirmado: Boolean(p.isOrganizador || p.isConfirmado || (usuarioLogado?.id && (p.organizadorId || p.organizador_id) === usuarioLogado.id)),
        };
      };
      const lerLocais = (): any[] => lerPartidasLocais();
      const naoExcluida = (p: any) => !partidaFoiExcluida(p.id);
      let doBanco: any[] = [];
      try {
        const generoParam = usuarioLogado?.genero ? `&genero=${encodeURIComponent(usuarioLogado.genero)}` : '';
        const response = await api.get(`/matches?lat=${coordBusca.lat}&lng=${coordBusca.lng}&radius=${raioKm}${generoParam}`);
        if (response.data && Array.isArray(response.data.data)) {
          doBanco = response.data.data.map(mapearPartida);
        }
      } catch {
        // Servidor offline: segue apenas com as partidas criadas neste navegador
      }
      // Partidas criadas com o servidor offline continuam aparecendo (e as excluídas nunca voltam)
      const locais = lerLocais()
        .filter((l) => !doBanco.some((b: any) => b.id === l.id))
        .map(mapearPartida);
      return [...locais, ...doBanco].filter(naoExcluida);
    },
    initialData: () => [],
    enabled: Boolean(usuarioLogado),
    staleTime: 1000 * 20,
  });

  // Query para sincronizar solicitações pendentes reais do organizador e solicitações enviadas pelo atleta
  const { data: solicitacoesData = [] } = useQuery<any[]>({
    queryKey: ['requests', usuarioLogado?.id],
    queryFn: async () => {
      let doServidor: any[] = [];
      try {
        const param = usuarioLogado?.id ? `?usuarioId=${encodeURIComponent(usuarioLogado.id)}` : '';
        const res = await api.get(`/requests${param}`);
        if (res.data && Array.isArray(res.data.data)) {
          doServidor = res.data.data;
        }
      } catch {
        // silencia se offline
      }
      const locais = lerSolicitacoesLocais().filter(
        (l) => !doServidor.some((s) => s.id === l.id || (s.partidaId === l.partidaId && s.usuarioId === l.usuarioId))
      );
      return [...doServidor, ...locais];
    },
    enabled: Boolean(usuarioLogado?.id),
    staleTime: 1000 * 10,
  });

  useEffect(() => {
    if (Array.isArray(solicitacoesData) && usuarioLogado?.id) {
      const pendentes = solicitacoesData.filter(
        (s: any) => (s.organizadorId === usuarioLogado.id || s.organizador_id === usuarioLogado.id) && s.statusSolicitacao === 'Pendente'
      ).length;
      setTotalSolicitacoesPendentes(pendentes);
    }
  }, [solicitacoesData, usuarioLogado]);

  // Conexão WebSocket Real-Time Global (Fase 3 Notificações)
  useEffect(() => {
    if (!usuarioLogado?.id) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWS = () => {
      try {
        const wsUrl = `ws://localhost:3333/ws?usuarioId=${usuarioLogado.id}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { event: evt, payload } = data;

            if (evt === 'request_decision') {
              const status = payload?.status;
              if (status === 'Aprovada') {
                setNotificacaoRealtime({
                  tipo: 'success',
                  texto: '🎉 Sua solicitação para a partida foi APROVADA! Local e mapa liberados.',
                });
              } else if (status === 'Rejeitada') {
                setNotificacaoRealtime({
                  tipo: 'warning',
                  texto: 'ℹ️ Sua solicitação de vaga foi recusada pelo organizador.',
                });
              }
              queryClient.invalidateQueries({ queryKey: ['matches'] });
            } else if (evt === 'request_received' || evt === 'solicitacao') {
              setTotalSolicitacoesPendentes((prev) => prev + 1);
              setNotificacaoRealtime({
                tipo: 'info',
                texto: '🔔 Nova solicitação recebida para sua partida!',
                acaoTexto: 'Ver Gestão',
                onAcao: () => setAbaAtual('minhas_partidas'),
              });
              queryClient.invalidateQueries({ queryKey: ['matches'] });
            } else if (evt === 'match_finished') {
              setNotificacaoRealtime({
                tipo: 'info',
                texto: '🏁 Partida finalizada! Avalie o organizador e seus colegas para manter seu Fair Play.',
                acaoTexto: 'Avaliar Agora',
                onAcao: () => setAbaAtual('avaliar'),
              });
              queryClient.invalidateQueries({ queryKey: ['matches'] });
            } else if (evt === 'match_slot_filled') {
              queryClient.invalidateQueries({ queryKey: ['matches'] });
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWS, 4000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        console.warn('Erro ao conectar WebSocket global:', e);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [usuarioLogado?.id, queryClient]);

  // FILTRAGEM DINÂMICA EM MEMÓRIA + CÁLCULO DE DISTÂNCIA REAL EM FRANCA/SP
  const partidasFiltradas = useMemo(() => {
    if (!Array.isArray(partidas)) return [];

    const comDistancia = partidas.map((m) => {
      const solMinha = Array.isArray(solicitacoesData) && usuarioLogado?.id
        ? solicitacoesData.find(
            (s: any) =>
              s.partidaId === m.id &&
              (s.usuarioId === usuarioLogado.id || s.usuario_id === usuarioLogado.id) &&
              s.statusSolicitacao !== 'Cancelada'
          )
        : null;
      const aprovadaPeloOrg = solMinha?.statusSolicitacao === 'Aprovada';
      return {
        ...m,
        isConfirmado: Boolean(m.isConfirmado || m.isOrganizador || aprovadaPeloOrg),
        enderecoCompleto: aprovadaPeloOrg && solMinha?.partidaEndereco ? solMinha.partidaEndereco : m.enderecoCompleto,
        minhaSolicitacao: solMinha ? { id: solMinha.id, status: solMinha.statusSolicitacao } : null,
        distanciaKm: calcularDistanciaKm(coordBusca.lat, coordBusca.lng, Number(m.lat), Number(m.lng)),
      };
    });

    const filtradas = comDistancia.filter((match) => {
      if (!match) return false;

      // 0. BLINDAGEM ESPAÇO SEGURO FEMININO:
      const isPartidaFeminina = match.espacoSeguroFeminino === true || 
                                match.espaco_seguro_feminino === true || 
                                match.filtroGenero === 'Feminino' || 
                                match.filtro_genero === 'Feminino' ||
                                match.filtroGenero === 'Exclusivo_Feminino';

      const isUsuarioMasculino = String(usuarioLogado?.genero || '').toLowerCase() === 'masculino';

      if (isPartidaFeminina && isUsuarioMasculino) {
        return false;
      }

      // 0.5. Filtro de Raio Geográfico real a partir da localização pesquisada/GPS em Franca/SP
      if (typeof match.distanciaKm === 'number' && match.distanciaKm > raioKm) {
        return false;
      }

      // 1. Filtro por Formato (Avulso vs Amistoso vs Partida 100% Feminina)
      if (filtroFormato === 'Feminino') {
        if (!isPartidaFeminina) {
          return false;
        }
      } else if (filtroFormato !== 'Todos' && match.formatoJogo !== filtroFormato) {
        return false;
      }

      // 2. Filtro por Esporte / Modalidade
      if (filtroEsporte !== 'Todos') {
        const matchEsporte = String(match.esporte || '').toLowerCase();
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
        const textoMatch = `${match.bairro || ''} ${match.enderecoCompleto || ''} ${match.esporte || ''} ${match.descricao || ''}`.toLowerCase();
        if (!textoMatch.includes(busca)) {
          return false;
        }
      }

      return true;
    });

    // Ordena pelas partidas mais próximas quando o usuário buscou um endereço ou ativou o GPS
    if (coordBusca.origem && coordBusca.origem !== 'fallback_centro') {
      return [...filtradas].sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));
    }

    return filtradas;
  }, [partidas, solicitacoesData, filtroFormato, filtroEsporte, filtroTipoLocal, termoBusca, coordBusca, raioKm, usuarioLogado?.genero, usuarioLogado?.id]);

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
        <AuthScreen
          onLoginSuccess={(token, user) => {
            localStorage.setItem('@bora:token', token);
            localStorage.setItem('@bora:user', JSON.stringify(user));
            setUsuarioLogado(user);
          }}
        />
      </ThemeProvider>
    );
  }

  const handleCriarPartida = async (novaPartida: any) => {
    const partidaFormatada = {
      ...novaPartida,
      organizadorId: usuarioLogado?.id || '11111111-1111-1111-1111-111111111101',
      isOrganizador: true,
      isConfirmado: true,
    };

    try {
      await api.post('/matches', partidaFormatada);
      setToastMensagem(
        novaPartida.formatoJogo === 'Amistoso_Times' 
          ? 'Amistoso publicado! Aguardando equipes adversárias de Franca desafiarem seu time.' 
          : 'Partida aberta publicada com sucesso!'
      );
    } catch (err: any) {
      const statusErro = err.response?.status;
      // Servidor offline, sessão offline (token local) ou erro interno: guarda a partida neste navegador
      // para que ela apareça em Explorar e em Gestão. Apenas erros de validação (400/422) são mostrados.
      if (!err.response || (statusErro !== 400 && statusErro !== 422)) {
        try {
          salvarPartidaLocal(partidaFormatada);
        } catch {
          // ignore
        }
        setToastMensagem(
          novaPartida.formatoJogo === 'Amistoso_Times' 
            ? 'Amistoso publicado! Aguardando equipes adversárias de Franca desafiarem seu time.' 
            : 'Partida aberta publicada com sucesso!'
        );
      } else {
        const msgErro = err.response?.data?.error || err.message || 'Erro ao criar partida.';
        setToastMensagem(msgErro);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['matches'] });
  };

  const handleSolicitarVaga = async (id: string, posicaoPreferida?: string) => {
    const partidaDesejada = partidas.find((p) => p.id === id);
    if (partidaDesejada && partidaDesejada.dataHora) {
      const inicioNova = new Date(partidaDesejada.dataHora).getTime();
      const duracaoMs = (Number(partidaDesejada.duracaoMinutos) || 90) * 60 * 1000;
      const fimNova = inicioNova + duracaoMs;

      // Verifica se o usuário já tem outra partida ativa no mesmo intervalo de horário
      const conflito = partidas.find((p) => {
        if (p.id === id) return false;
        if (p.statusPartida === 'Cancelada' || p.statusPartida === 'Finalizada') return false;
        const isMinha = (usuarioLogado?.id && (p.organizadorId === usuarioLogado.id || p.organizador_id === usuarioLogado.id)) || p.isOrganizador || p.isConfirmado;
        if (!isMinha) return false;

        const inicioExistente = new Date(p.dataHora).getTime();
        if (isNaN(inicioExistente)) return false;
        const fimExistente = inicioExistente + (Number(p.duracaoMinutos) || 90) * 60 * 1000;

        return inicioNova < fimExistente && fimNova > inicioExistente;
      });

      if (conflito) {
        setToastMensagem('VOCÊ JÁ TEM UMA PARTIDA CRIADA NESSE HORÁRIO OU VOCÊ JÁ ESTÁ PARTICIPANDO DE UMA PARTIDA NESTE HORÁRIO.');
        return;
      }
    }

    const sufixoPosicao = posicaoPreferida ? ` (Posição preferida: ${posicaoPreferida})` : '';
    const usuarioIdEfetivo = usuarioLogado?.id || '11111111-1111-1111-1111-111111111101';

    try {
      const res = await api.post(`/matches/${id}/requests`, {
        usuarioId: usuarioIdEfetivo,
        posicaoPreferida: posicaoPreferida || null,
      });
      const criada = res.data?.data;
      salvarSolicitacaoLocal({
        id: criada?.id || `sol_${Date.now()}`,
        partidaId: id,
        usuarioId: usuarioIdEfetivo,
        organizadorId: partidaDesejada?.organizadorId,
        statusSolicitacao: criada?.statusSolicitacao || 'Pendente',
        posicaoPreferida: posicaoPreferida || null,
        atletaNome: usuarioLogado?.nome || 'Atleta Bora!',
        atletaFoto: usuarioLogado?.fotoUrl || null,
        atletaGenero: usuarioLogado?.genero || 'Misto',
        atletaNota: usuarioLogado?.notaMedia || 5.0,
        partidaEsporte: partidaDesejada?.esporte || 'Partida Esportiva',
        partidaBairro: partidaDesejada?.bairro || 'Franca',
        partidaDataHora: partidaDesejada?.dataHora || new Date().toISOString(),
        partidaDescricao: partidaDesejada?.descricao || '',
      });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setToastMensagem(`Solicitação enviada com sucesso${sufixoPosicao}! Acompanhe o status na aba Gestão.`);
    } catch (e: any) {
      if (!e.response) {
        salvarSolicitacaoLocal({
          id: `sol_${Date.now()}`,
          partidaId: id,
          usuarioId: usuarioIdEfetivo,
          organizadorId: partidaDesejada?.organizadorId,
          statusSolicitacao: 'Pendente',
          posicaoPreferida: posicaoPreferida || null,
          atletaNome: usuarioLogado?.nome || 'Atleta Bora!',
          atletaFoto: usuarioLogado?.fotoUrl || null,
          atletaGenero: usuarioLogado?.genero || 'Misto',
          atletaNota: usuarioLogado?.notaMedia || 5.0,
          partidaEsporte: partidaDesejada?.esporte || 'Partida Esportiva',
          partidaBairro: partidaDesejada?.bairro || 'Franca',
          partidaDataHora: partidaDesejada?.dataHora || new Date().toISOString(),
          partidaDescricao: partidaDesejada?.descricao || '',
        });
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        setToastMensagem(`Solicitação enviada com sucesso${sufixoPosicao}! Acompanhe o status na aba Gestão.`);
      } else {
        const msgErro = e.response?.data?.error || 'Erro ao solicitar vaga.';
        setToastMensagem(msgErro);
      }
    }
  };

  const handleCancelarParticipacao = async (solicitacaoId: string, _partidaId: string) => {
    try {
      await api.patch(`/requests/${solicitacaoId}/cancel`, {
        usuarioId: usuarioLogado?.id,
      });
    } catch {
      // fallback local
    }
    atualizarStatusSolicitacaoLocal(solicitacaoId, usuarioLogado?.id, 'Cancelada');
    queryClient.invalidateQueries({ queryKey: ['requests'] });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    setToastMensagem('✅ Sua solicitação/participação na partida foi cancelada.');
  };

  const handleMarcarAmistoso = (id: string) => {
    if (!usuarioLogado?.meuTime) {
      setToastMensagem('Você precisa cadastrar seu time na aba Meu Perfil antes de marcar um amistoso!');
      return;
    }
    queryClient.setQueryData<any[]>(['matches', raioKm], (prev = []) =>
      prev.map((p) =>
        p.id === id ? { ...p, timeVisitante: usuarioLogado?.meuTime?.nome, vagasPreenchidas: 2 } : p
      )
    );
    setToastMensagem('Desafio de Amistoso enviado com o time ' + (usuarioLogado?.meuTime?.nome || '') + '!');
  };

  const handleFinalizarPartida = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    setToastMensagem('🏁 Partida finalizada com sucesso! O mural está em modo somente leitura.');
  };

  const handleCancelarPartida = (id: string) => {
    excluirPartidaLocal(id);
    queryClient.setQueryData<any[]>(['matches', raioKm, coordBusca.lat, coordBusca.lng], (prev = []) =>
      prev.filter((p) => p.id !== id)
    );
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    setToastMensagem('🗑️ Partida excluída com sucesso!');
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
                OLÁ, {(usuarioLogado?.nome || usuarioLogado?.email?.split('@')[0] || 'ATLETA').toUpperCase()}
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
                label={Number(usuarioLogado?.notaMedia || 5).toFixed(2)}
                sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 800, height: 26 }}
              />
              
              <Avatar 
                src={usuarioLogado?.fotoUrl || undefined}
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
              
              <IconButton sx={{ color: '#fff' }} onClick={handleLogout} title="Sair do Bora! App">
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
                    bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: 3,
                    p: 0.4,
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #94A3B8',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 3px 10px rgba(15,23,42,0.08)',
                    '& .MuiToggleButton-root': {
                      px: 2.2,
                      py: 0.7,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '0.84rem',
                      border: 'none',
                      borderRadius: '10px !important',
                      color: isDark ? '#CBD5E1' : '#0F172A',
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#EFF6FF',
                      },
                    },
                    '& .MuiToggleButton-root.Mui-selected': {
                      bgcolor: '#0066FF !important',
                      color: '#FFFFFF !important',
                      boxShadow: '0 2px 8px rgba(0, 102, 255, 0.35)',
                      '&:hover': {
                        bgcolor: '#0052CC !important',
                      },
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

              </Box>

              {/* CAMPO DE ENDEREÇO: sugestões enquanto digita e busca por perto */}
              <Autocomplete
                freeSolo
                disableClearable
                filterOptions={(opcoes) => opcoes}
                options={sugestoesEndereco}
                getOptionLabel={(opcao) => (typeof opcao === 'string' ? opcao : opcao.label)}
                inputValue={enderecoBusca}
                onInputChange={(_, valor, motivo) => {
                  if (motivo === 'input' || motivo === 'clear') setEnderecoBusca(valor);
                }}
                onChange={(_, escolha) => {
                  if (typeof escolha === 'string') {
                    buscarPorEndereco();
                    return;
                  }
                  setEnderecoBusca(escolha.label);
                  setCoordBusca({ lat: escolha.lat, lng: escolha.lng, origem: 'satelite_nominatim', displayName: escolha.label });
                }}
                noOptionsText="Digite pelo menos 3 letras para ver sugestões"
                renderOption={(props, opcao) => (
                  <li {...props} key={`${opcao.label}-${opcao.lat}-${opcao.lng}`}>
                    📍 {opcao.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    placeholder="Meu endereço em Franca/SP (ex: Av. Paulo VI, CEPEL, rua ou bairro)..."
                    helperText={
                      coordBusca.origem === 'gps_dispositivo'
                        ? `📍 Localização ativa via GPS: ${coordBusca.displayName || 'Franca/SP'} — ordenando jogos mais próximos`
                        : enderecoBusca.trim() && coordBusca.origem && coordBusca.origem !== 'fallback_centro'
                          ? `📍 Referência em Franca/SP: ${coordBusca.displayName || `${enderecoBusca.trim()}, Franca/SP`} — ordenando por proximidade`
                          : 'Digite um endereço ou bairro de Franca/SP (ou use o GPS) para ordenar os jogos mais próximos de você.'
                    }
                    FormHelperTextProps={{
                      sx: {
                        fontWeight: 700,
                        color: isDark ? '#93C5FD' : '#1E3A8A',
                        mt: 0.6,
                        mb: 1.2,
                        mx: 0.5,
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon fontSize="small" sx={{ color: isDark ? '#60A5FA' : '#0066FF' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {enderecoBusca && (
                            <Tooltip title="Limpar endereço">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEnderecoBusca('');
                                  setCoordBusca({ lat: -20.5388, lng: -47.4005, origem: 'fallback_centro' });
                                }}
                              >
                                <X size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Usar minha localização atual (GPS)">
                            <span>
                              <IconButton size="small" onClick={usarMinhaLocalizacaoAtual} disabled={buscandoEndereco} sx={{ color: isDark ? '#CBD5E1' : '#1E293B' }}>
                                <MyLocationIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton size="small" onClick={buscarPorEndereco} disabled={buscandoEndereco || !enderecoBusca.trim()} sx={{ color: isDark ? '#60A5FA' : '#0066FF' }}>
                            <Search size={18} />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        fontWeight: 700,
                        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 10px rgba(15,23,42,0.06)',
                      }
                    }}
                  />
                )}
              />

              {/* BARRA DE PESQUISA RÁPIDA POR BAIRRO / LOCAL (filtra dentro do resultado já carregado) */}
              <TextField
                fullWidth
                size="small"
                placeholder="Filtrar por bairro, arena ou esporte..."
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
                          Raio de Cobertura
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                          {raioKm >= 20 ? 'Toda a Cidade (25 km)' : `${raioKm} km`}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => carregarPartidasDoBanco()}
                          disabled={carregandoPartidas}
                          sx={{ color: 'primary.main', p: 0.5 }}
                        >
                          <RefreshCw size={15} className={carregandoPartidas ? 'animate-spin' : ''} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box px={1.5} pt={0.5} pb={1}>
                      <Slider
                        value={raioKm}
                        min={2}
                        max={25}
                        step={1}
                        marks={[
                          { value: 2, label: '2km' },
                          { value: 10, label: '10km' },
                          { value: 15, label: '15km' },
                          { value: 25, label: 'Toda Cidade' },
                        ]}
                        valueLabelDisplay="auto"
                        onChange={(_, val) => setRaioKm(val as number)}
                        sx={{
                          color: 'primary.main',
                          py: 1,
                          width: '100%',
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.70rem',
                            fontWeight: 700,
                          },
                          '& .MuiSlider-markLabel[data-index="3"]': {
                            transform: 'translateX(-90%)',
                          },
                          '& .MuiSlider-markLabel[data-index="0"]': {
                            transform: 'translateX(5%)',
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* 1. FILTRO POR FORMATO (TODOS / AMISTOSO / AVULSO) COM CONTROLES */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Formato da Partida:
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollFormatosRef, 'esquerda')} sx={{ p: 0.4, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronLeft size={15} />
                        </IconButton>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollFormatosRef, 'direita')} sx={{ p: 0.4, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronRight size={15} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box 
                      ref={scrollFormatosRef}
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        overflowX: 'auto', 
                        pb: 0.5,
                        px: 0.2,
                        scrollBehavior: 'smooth',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                      }}
                    >
                      <Chip
                        label="Todos os Formatos"
                        size="medium"
                        onClick={() => setFiltroFormato('Todos')}
                        sx={{
                          fontWeight: filtroFormato === 'Todos' ? 900 : 800,
                          bgcolor: filtroFormato === 'Todos' ? 'primary.main' : (isDark ? '#1E293B' : '#E2E8F0'),
                          color: filtroFormato === 'Todos' ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#0F172A'),
                          border: filtroFormato === 'Todos' ? '1.5px solid #0052CC' : (isDark ? '1.5px solid #334155' : '1.5px solid #94A3B8'),
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.8
                        }}
                      />
                      <Chip
                        icon={<Shield size={15} color={filtroFormato === 'Amistoso_Times' ? '#FFFFFF' : '#0052CC'} />}
                        label="🤝 Amistosos (Times)"
                        size="medium"
                        onClick={() => setFiltroFormato('Amistoso_Times')}
                        sx={{
                          fontWeight: filtroFormato === 'Amistoso_Times' ? 900 : 800,
                          bgcolor: filtroFormato === 'Amistoso_Times' ? 'primary.main' : (isDark ? '#1E3A5F' : '#DBEAFE'),
                          color: filtroFormato === 'Amistoso_Times' ? '#FFFFFF' : (isDark ? '#93C5FD' : '#1E3A8A'),
                          border: isDark ? '1.5px solid #2563EB' : '1.5px solid #60A5FA',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.8
                        }}
                      />
                      <Chip
                        icon={<Users size={15} color={filtroFormato === 'Avulso' ? '#FFFFFF' : '#15803D'} />}
                        label="⚽ Partidas Abertas (Avulso)"
                        size="medium"
                        onClick={() => setFiltroFormato('Avulso')}
                        sx={{
                          fontWeight: filtroFormato === 'Avulso' ? 900 : 800,
                          bgcolor: filtroFormato === 'Avulso' ? '#16A34A' : (isDark ? '#064E3B' : '#DCFCE7'),
                          color: filtroFormato === 'Avulso' ? '#FFFFFF' : (isDark ? '#86EFAC' : '#14532D'),
                          border: isDark ? '1.5px solid #059669' : '1.5px solid #4ADE80',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          px: 0.8
                        }}
                      />
                      {String(usuarioLogado?.genero || '').toLowerCase() === 'feminino' && (
                        <Chip
                          label="🌸 Partida 100% Feminina"
                          size="medium"
                          onClick={() => setFiltroFormato(filtroFormato === 'Feminino' ? 'Todos' : 'Feminino')}
                          sx={{
                            fontWeight: filtroFormato === 'Feminino' ? 900 : 800,
                            bgcolor: filtroFormato === 'Feminino' ? '#EC4899' : (isDark ? 'rgba(236, 72, 153, 0.18)' : '#FDF2F8'),
                            color: filtroFormato === 'Feminino' ? '#FFFFFF' : (isDark ? '#F9A8D4' : '#DB2777'),
                            border: '1.5px solid #EC4899',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            px: 0.8,
                            boxShadow: filtroFormato === 'Feminino' ? '0 2px 10px rgba(236, 72, 153, 0.4)' : 'none',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* 2. FILTRO POR MODALIDADE ESPORTIVA COM BARRA VISÍVEL E SETAS */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Modalidade Esportiva:
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollModalidadesRef, 'esquerda')} sx={{ p: 0.4, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronLeft size={15} />
                        </IconButton>
                        <IconButton size="small" onClick={() => rolarHorizontal(scrollModalidadesRef, 'direita')} sx={{ p: 0.4, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                          <ChevronRight size={15} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box 
                      ref={scrollModalidadesRef}
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        overflowX: 'auto', 
                        pb: 0.5,
                        px: 0.2,
                        scrollBehavior: 'smooth',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
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
                        icon={<Trees size={14} color={filtroTipoLocal === 'Publica' ? '#FFFFFF' : '#15803D'} />}
                        label="Públicas (Gratuitas)"
                        size="small"
                        onClick={() => setFiltroTipoLocal(filtroTipoLocal === 'Publica' ? 'Todos' : 'Publica')}
                        sx={{
                          fontWeight: filtroTipoLocal === 'Publica' ? 900 : 700,
                          bgcolor: filtroTipoLocal === 'Publica' ? '#16A34A' : (isDark ? '#1E293B' : '#DCFCE7'),
                          color: filtroTipoLocal === 'Publica' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#14532D'),
                          border: isDark ? '1px solid #334155' : '1.5px solid #4ADE80',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      />
                      <Chip
                        icon={<Building2 size={14} color={filtroTipoLocal === 'Privada' ? '#FFFFFF' : '#0052CC'} />}
                        label="Privadas (Arenas)"
                        size="small"
                        onClick={() => setFiltroTipoLocal(filtroTipoLocal === 'Privada' ? 'Todos' : 'Privada')}
                        sx={{
                          fontWeight: filtroTipoLocal === 'Privada' ? 900 : 700,
                          bgcolor: filtroTipoLocal === 'Privada' ? '#0066FF' : (isDark ? '#1E293B' : '#DBEAFE'),
                          color: filtroTipoLocal === 'Privada' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#1E3A8A'),
                          border: isDark ? '1px solid #334155' : '1.5px solid #60A5FA',
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
                    centroLat={coordBusca.lat}
                    centroLng={coordBusca.lng}
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
                        usuarioLogado={usuarioLogado}
                        onSolicitarVaga={handleSolicitarVaga}
                        onCancelarParticipacao={handleCancelarParticipacao}
                        onMarcarAmistoso={handleMarcarAmistoso}
                        onFinalizarPartida={handleFinalizarPartida}
                        onCancelarPartida={handleCancelarPartida}
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
                meuTime={usuarioLogado?.meuTime}
                usuarioLogado={usuarioLogado}
                partidasExistentes={partidas}
              />
            </>
          )}

          {abaAtual === 'minhas_partidas' && (
            <MyMatchesScreen
              usuarioLogado={usuarioLogado}
              onPartidaCancelada={(partidaId) => {
                excluirPartidaLocal(partidaId);
                queryClient.invalidateQueries({ queryKey: ['matches'] });
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

        {/* Notificações em Tempo Real (WebSocket) */}
        <Snackbar 
          open={Boolean(notificacaoRealtime)} 
          autoHideDuration={6000} 
          onClose={() => setNotificacaoRealtime(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 7 }}
        >
          {notificacaoRealtime ? (
            <Alert 
              severity={notificacaoRealtime.tipo} 
              sx={{ 
                width: '100%', 
                fontWeight: 700, 
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                alignItems: 'center'
              }}
              action={
                notificacaoRealtime.acaoTexto ? (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => {
                      if (notificacaoRealtime.onAcao) notificacaoRealtime.onAcao();
                      setNotificacaoRealtime(null);
                    }}
                    sx={{ fontWeight: 900, textTransform: 'none' }}
                  >
                    {notificacaoRealtime.acaoTexto}
                  </Button>
                ) : undefined
              }
            >
              {notificacaoRealtime.texto}
            </Alert>
          ) : undefined}
        </Snackbar>

        {/* Toast padrão de ações locais */}
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
