import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Autocomplete,
  Collapse,
  Switch
} from '@mui/material';
import { 
  Shield, 
  User, 
  Search, 
  Crosshair, 
  Sparkles, 
  Building2, 
  Trees, 
  ChevronDown, 
  ChevronUp, 
  History,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { geocodificarEndereco, obterLocalizacaoAtualGPS, consultarViaCep, Coordenadas } from '../services/geocodingService';
import { CATALOGO_ARENAS_FRANCA, ArenaFranca } from '../data/francaArenas';
import { InteractiveMapPicker } from './InteractiveMapPicker';

export const SUGESTOES_DURACAO_POR_ESPORTE: Record<string, number> = {
  'Futebol Society': 90,
  'Futebol de Campo (11x11)': 90,
  'Futebol de 7 (Terrão)': 90,
  'Futsal': 60,
  'Basquete': 60,
  'Basquete 3x3': 45,
  'Vôlei de Quadra': 60,
  'Vôlei de Praia / Futevôlei': 60,
  'Beach Tennis': 60,
  'Handebol': 60,
};

export interface LocalSalvoApp {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  tipoLocal: 'Publica' | 'Privada';
  lat: number;
  lng: number;
  esporte?: string;
  dataCriacao: string;
}

export interface CreateMatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (novaPartida: any) => void;
  meuTime?: any;
  usuarioLogado?: any;
  partidasExistentes?: any[];
}

export const MODALIDADES_COLETIVAS = [
  'Futebol de Campo (11x11)',
  'Futebol de 7 (Terrão)',
  'Futebol Society',
  'Futsal',
  'Basquete',
  'Basquete 3x3',
  'Vôlei de Quadra',
  'Vôlei de Praia / Futevôlei',
  'Beach Tennis',
  'Handebol'
];

const LOCAL_STORAGE_KEY_LOCAIS = '@bora:locais_historico';

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  open,
  onClose,
  onSuccess,
  meuTime,
  usuarioLogado,
  partidasExistentes = [],
}) => {
  const [formatoJogo, setFormatoJogo] = useState<'Avulso' | 'Amistoso_Times'>('Avulso');
  const [tipoLocal, setTipoLocal] = useState<'Publica' | 'Privada'>('Publica');
  const [esporte, setEsporte] = useState(MODALIDADES_COLETIVAS[0]);
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(SUGESTOES_DURACAO_POR_ESPORTE[MODALIDADES_COLETIVAS[0]] || 90);
  const [descricao, setDescricao] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [maxVagas, setMaxVagas] = useState(14);
  const [exclusivoFeminino, setExclusivoFeminino] = useState(false);
  
  // 1º SEQUÊNCIA PRINCIPAL: Bairro, Endereço e Alfinete no Mapa
  const [bairro, setBairro] = useState('São José');
  const [enderecoCompleto, setEnderecoCompleto] = useState('Av. Dr. Ismael Alonso y Alonso, 2000');
  const [coordenadas, setCoordenadas] = useState<Coordenadas>({
    lat: -20.534215,
    lng: -47.401258,
    origem: 'base_franca',
  });
  const [buscandoGeo, setBuscandoGeo] = useState(false);

  // BOTÃO "MAIS OPÇÕES" (ACORDEÃO RECOLHÍVEL)
  const [mostrarMaisOpcoes, setMostrarMaisOpcoes] = useState(false);

  // SEÇÃO MAIS OPÇÕES: Histórico Dinâmico e Catálogo Pré-cadastrado
  const [locaisHistorico, setLocaisHistorico] = useState<LocalSalvoApp[]>([]);
  const [arenaSelecionada, setArenaSelecionada] = useState<ArenaFranca | null>(null);
  const [cep, setCep] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  // Taxas e Rateios
  const [taxaCampo, setTaxaCampo] = useState<number | string>('');
  const [taxaJuiz, setTaxaJuiz] = useState<number | string>('');

  const valorCampoEfetivo = tipoLocal === 'Publica' ? 0 : (Number(taxaCampo) || 0);
  const valorJuizEfetivo = formatoJogo === 'Amistoso_Times' ? (Number(taxaJuiz) || 0) : 0;
  
  const valorTotalAmistoso = valorCampoEfetivo + valorJuizEfetivo;
  const valorPorEquipe = valorTotalAmistoso / 2;
  const valorPorAtletaAvulso = maxVagas > 0 ? (valorCampoEfetivo / Number(maxVagas)) : 0;

  // Carrega histórico de locais salvos do app
  useEffect(() => {
    try {
      const salvos = localStorage.getItem(LOCAL_STORAGE_KEY_LOCAIS);
      if (salvos) {
        setLocaisHistorico(JSON.parse(salvos));
      }
    } catch (e) {
      console.error('Erro ao ler locais históricos:', e);
    }
  }, [open]);

  // Atualização manual de endereço ou bairro com geocodificação
  const handleAtualizarEnderecoOuBairro = async (novoEnd: string, novoBairro: string) => {
    setEnderecoCompleto(novoEnd);
    setBairro(novoBairro);
    setBuscandoGeo(true);
    try {
      const geo = await geocodificarEndereco(novoEnd, novoBairro);
      setCoordenadas(geo);
    } finally {
      setBuscandoGeo(false);
    }
  };

  // Ajuste interativo no mapa arrastando ou clicando no pino
  const handleCoordenadasMudaramNoMapa = (novaLat: number, novaLng: number) => {
    setCoordenadas({
      lat: novaLat,
      lng: novaLng,
      origem: 'ajuste_manual_mapa'
    });
  };

  // Seleção de Arena Pré-cadastrada no Catálogo
  const handleSelecionarArenaCatalogo = (arena: ArenaFranca | null) => {
    setArenaSelecionada(arena);
    if (!arena) return;

    setTipoLocal(arena.tipo);
    setBairro(arena.bairro);
    setEnderecoCompleto(arena.endereco);
    if (arena.cep) setCep(arena.cep);
    if (arena.esportesSugeridos.length > 0 && !arena.esportesSugeridos.includes(esporte)) {
      setEsporte(arena.esportesSugeridos[0]);
    }

    setCoordenadas({
      lat: arena.lat,
      lng: arena.lng,
      origem: 'catalogo_arena'
    });
  };

  // Seleção de Local a partir do Histórico de Partidas Criadas
  const handleSelecionarLocalHistorico = (local: LocalSalvoApp) => {
    setBairro(local.bairro);
    setEnderecoCompleto(local.endereco);
    setTipoLocal(local.tipoLocal);
    if (local.esporte) setEsporte(local.esporte);
    setCoordenadas({
      lat: local.lat,
      lng: local.lng,
      origem: 'catalogo_arena'
    });
  };

  // Busca por CEP (ViaCEP)
  const handleBuscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErroCep('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setBuscandoCep(true);
    setErroCep(null);
    setBuscandoGeo(true);

    try {
      const dados = await consultarViaCep(cepLimpo);
      if (dados) {
        const novoBairro = dados.bairro || bairro;
        const novoEnd = dados.logradouro ? `${dados.logradouro}, ` : enderecoCompleto;
        setBairro(novoBairro);
        setEnderecoCompleto(novoEnd);

        const geo = await geocodificarEndereco(dados.logradouro || novoEnd, novoBairro, dados.localidade || 'Franca, SP');
        setCoordenadas({ ...geo, origem: 'viacep' });
      }
    } catch (err: any) {
      setErroCep(err.message || 'Erro ao consultar CEP.');
    } finally {
      setBuscandoCep(false);
      setBuscandoGeo(false);
    }
  };

  // GPS Atual do dispositivo
  const handleUsarGPSAtual = async () => {
    setBuscandoGeo(true);
    try {
      const gps = await obterLocalizacaoAtualGPS();
      setCoordenadas(gps);
      setEnderecoCompleto(`Local capturado via GPS (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})`);
    } catch (err: any) {
      alert(err.message || 'Não foi possível capturar o GPS.');
    } finally {
      setBuscandoGeo(false);
    }
  };

  // Atalho rápido de bairros conhecidos
  const handleSelecionarBairroRapido = async (nomeBairro: string) => {
    setBairro(nomeBairro);
    const endSugerido = `Campo / Quadra do ${nomeBairro}`;
    setEnderecoCompleto(endSugerido);
    setBuscandoGeo(true);
    try {
      const geo = await geocodificarEndereco(endSugerido, nomeBairro);
      setCoordenadas(geo);
    } finally {
      setBuscandoGeo(false);
    }
  };

  // Salva a localização dinamicamente no aprendizado do app ao publicar a partida
  const salvarLocalizacaoNoHistorico = (novoLocal: {
    bairro: string;
    endereco: string;
    tipoLocal: 'Publica' | 'Privada';
    lat: number;
    lng: number;
    esporte: string;
  }) => {
    try {
      const salvosAtuais: LocalSalvoApp[] = locaisHistorico.slice();
      const jaExiste = salvosAtuais.some(
        (l) => l.endereco.toLowerCase().trim() === novoLocal.endereco.toLowerCase().trim()
      );

      if (!jaExiste && novoLocal.endereco.trim()) {
        const item: LocalSalvoApp = {
          id: String(Date.now()),
          nome: novoLocal.endereco.split(',')[0] || novoLocal.bairro,
          bairro: novoLocal.bairro,
          endereco: novoLocal.endereco,
          tipoLocal: novoLocal.tipoLocal,
          lat: novoLocal.lat,
          lng: novoLocal.lng,
          esporte: novoLocal.esporte,
          dataCriacao: new Date().toISOString()
        };
        const listaAtualizada = [item, ...salvosAtuais].slice(0, 20); // guarda os 20 últimos locais
        localStorage.setItem(LOCAL_STORAGE_KEY_LOCAIS, JSON.stringify(listaAtualizada));
      }
    } catch (e) {
      console.error('Erro ao salvar local no histórico:', e);
    }
  };

  const isMulher = String(usuarioLogado?.genero || '').toLowerCase() === 'feminino';

  // Verificação em tempo real de Conflito de Horário (RN01 - Anti-conflito de Agenda)
  const conflitoAgenda = useMemo(() => {
    if (!dataHora) return null;
    const inicioNova = new Date(dataHora).getTime();
    if (isNaN(inicioNova)) return null;
    const duracaoMs = (Number(duracaoMinutos) || 90) * 60 * 1000;
    const fimNova = inicioNova + duracaoMs;

    for (const p of partidasExistentes) {
      if (!p) continue;
      if (p.statusPartida === 'Cancelada' || p.statusPartida === 'Finalizada') continue;
      
      const isMinhaPartida = (usuarioLogado?.id && (p.organizadorId === usuarioLogado.id || p.organizador_id === usuarioLogado.id)) || p.isOrganizador || p.isConfirmado;
      if (!isMinhaPartida) continue;

      const inicioExistente = new Date(p.dataHora).getTime();
      if (isNaN(inicioExistente)) continue;
      const fimExistente = inicioExistente + (Number(p.duracaoMinutos) || 90) * 60 * 1000;

      // Sobreposição de horários: inicioNova < fimExistente && fimNova > inicioExistente
      if (inicioNova < fimExistente && fimNova > inicioExistente) {
        return p;
      }
    }
    return null;
  }, [dataHora, duracaoMinutos, partidasExistentes, usuarioLogado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (conflitoAgenda) {
      return;
    }

    // Registra e aprende a localização no sistema
    salvarLocalizacaoNoHistorico({
      bairro: bairro || 'Franca',
      endereco: enderecoCompleto || `${bairro}, Franca/SP`,
      tipoLocal,
      lat: coordenadas.lat,
      lng: coordenadas.lng,
      esporte
    });

    const ehExclusivoFeminino = isMulher && exclusivoFeminino;

    onSuccess({
      id: String(Date.now()),
      esporte,
      descricao,
      dataHora: dataHora || new Date(Date.now() + 86400000).toISOString(),
      duracaoMinutos: Number(duracaoMinutos) || 90,
      bairro: bairro || 'Franca',
      enderecoCompleto: enderecoCompleto || `${bairro}, Franca/SP`,
      lat: coordenadas.lat,
      lng: coordenadas.lng,
      vagasPreenchidas: 1,
      maxVagas: formatoJogo === 'Amistoso_Times' ? 2 : Number(maxVagas),
      formatoJogo,
      tipoLocal,
      timeMandante: formatoJogo === 'Amistoso_Times' ? (meuTime?.nome || 'Bora Franca F.C.') : null,
      timeVisitante: null,
      taxaCampo: valorCampoEfetivo,
      taxaJuiz: valorJuizEfetivo,
      valorPorEquipe: formatoJogo === 'Amistoso_Times' ? valorPorEquipe : 0,
      valorPorAtleta: formatoJogo === 'Avulso' ? valorPorAtletaAvulso : 0,
      filtroGenero: ehExclusivoFeminino ? 'Feminino' : 'Misto',
      espacoSeguroFeminino: ehExclusivoFeminino,
      espaco_seguro_feminino: ehExclusivoFeminino,
    });
    onClose();
  };

  const obterLabelOrigem = () => {
    switch (coordenadas.origem) {
      case 'catalogo_arena':
        return '🏟️ Local Pré-cadastrado / Histórico';
      case 'ajuste_manual_mapa':
        return '🖐️ Alfinete Posicionado Manualmente';
      case 'viacep':
        return '📬 Endereço por CEP (ViaCEP)';
      case 'gps_dispositivo':
        return '📱 GPS do Dispositivo';
      case 'satelite_nominatim':
        return '🛰️ Satélite OpenStreetMap';
      default:
        return '📍 Ponto Base Franca/SP';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', pb: 1 }}>
        Criar Nova Partida Esportiva
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, pt: 1 }}>

          {/* REGRA RN06: ESPAÇO SEGURO FEMININO (EXCLUSIVO PARA ORGANIZADORAS MULHERES) */}
          {isMulher && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: exclusivoFeminino ? 'rgba(236, 72, 153, 0.10)' : 'action.hover',
                border: `1.5px solid ${exclusivoFeminino ? '#EC4899' : 'divider'}`,
                transition: 'all 0.25s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ pr: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: exclusivoFeminino ? '#EC4899' : 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🛡️ Espaço Seguro Feminino (RN06)
                  </Typography>
                  {exclusivoFeminino && (
                    <Chip 
                      label="Partida 100% Feminina" 
                      size="small" 
                      sx={{ bgcolor: '#EC4899', color: '#fff', fontWeight: 800, fontSize: '0.72rem', height: 22 }} 
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
                  Blindagem exclusiva: apenas mulheres poderão visualizar e solicitar vagas nesta partida.
                </Typography>
              </Box>
              <Switch
                checked={exclusivoFeminino}
                onChange={(e) => setExclusivoFeminino(e.target.checked)}
                color="secondary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#EC4899',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#EC4899',
                  },
                }}
              />
            </Box>
          )}
          
          {/* SELEÇÃO DO FORMATO DE JOGO */}
          <FormControl>
            <FormLabel sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Formato da Partida:
            </FormLabel>
            <RadioGroup
              row
              value={formatoJogo}
              onChange={(e) => setFormatoJogo(e.target.value as any)}
            >
              <FormControlLabel 
                value="Avulso" 
                control={<Radio />} 
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <User size={16} /> <strong>Partida Aberta (Atletas Avulsos)</strong>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="Amistoso_Times" 
                control={<Radio />} 
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Shield size={16} color="#0066FF" /> <strong>Amistoso (Time vs Time)</strong>
                  </Box>
                } 
              />
            </RadioGroup>
          </FormControl>

          {formatoJogo === 'Amistoso_Times' && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Amistoso entre Equipes:</strong> Apenas outro Dono/Capitão de Time poderá desafiar sua equipe nesta partida.
            </Alert>
          )}

          {/* TIPO DE LOCAL: PÚBLICO OU PRIVADO */}
          <FormControl>
            <FormLabel sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Tipo de Local / Quadra:
            </FormLabel>
            <RadioGroup
              row
              value={tipoLocal}
              onChange={(e) => setTipoLocal(e.target.value as any)}
            >
              <FormControlLabel 
                value="Publica" 
                control={<Radio />} 
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Trees size={16} color="#16A34A" /> <span>Quadra / Campo Público (100% Gratuito)</span>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="Privada" 
                control={<Radio />} 
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Building2 size={16} color="#0066FF" /> <span>Arena / Quadra Privada (Com Aluguel)</span>
                  </Box>
                } 
              />
            </RadioGroup>
          </FormControl>

          {/* REGRAS DE VALORES E ARBITRAGEM (RN04) */}
          {tipoLocal === 'Publica' && formatoJogo === 'Avulso' && (
            <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>
              🎉 <strong>Partida Aberta 100% Gratuita:</strong> Espaços públicos não possuem taxa de locação e partidas avulsas não utilizam taxa de juiz.
            </Alert>
          )}

          {tipoLocal === 'Publica' && formatoJogo === 'Amistoso_Times' && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1.5px solid #0066FF' }}>
              <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
                🏟️ <strong>Campo Público Gratuito:</strong> Taxa de campo R$ 0,00. Caso contratarem arbitragem para o amistoso, informe o valor do juiz para rateio 50%/50%.
              </Alert>
              <TextField
                label="Taxa do Juiz / Arbitragem (R$) — Opcional"
                type="number"
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '5' }}
                value={taxaJuiz}
                onChange={(e) => setTaxaJuiz(e.target.value)}
                placeholder="0.00"
                helperText="A regra de arbitragem aplica-se exclusivamente a amistosos."
              />
              {valorJuizEfetivo > 0 && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                      🤝 Rateio do Juiz por Equipe (50% cada):
                    </Typography>
                    <Typography variant="subtitle1" color="primary.main" fontWeight={900}>
                      R$ {valorPorEquipe.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {tipoLocal === 'Privada' && formatoJogo === 'Amistoso_Times' && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1.5px solid #0066FF' }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5}>
                💰 Custos do Amistoso Privado (Divididos 50%/50% por equipe)
              </Typography>
              <Box display="flex" gap={2} mb={1.5} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  label="Taxa do Campo / Aluguel (R$)"
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: '5' }}
                  value={taxaCampo}
                  onChange={(e) => setTaxaCampo(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <TextField
                  label="Taxa do Juiz / Arbitragem (R$)"
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: '5' }}
                  value={taxaJuiz}
                  onChange={(e) => setTaxaJuiz(e.target.value)}
                  placeholder="0.00"
                />
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Campo: R$ {(Number(taxaCampo) || 0).toFixed(2)} + Juiz: R$ {(Number(taxaJuiz) || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>
                    Total: R$ {valorTotalAmistoso.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                    🤝 Valor por Equipe (50% cada):
                  </Typography>
                  <Typography variant="subtitle1" color="primary.main" fontWeight={900}>
                    R$ {valorPorEquipe.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {tipoLocal === 'Privada' && formatoJogo === 'Avulso' && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1.5px solid #0066FF' }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5}>
                💰 Aluguel de Quadra Privada (Rateio Individual por Vaga)
              </Typography>
              <TextField
                label="Valor Total do Aluguel (R$)"
                type="number"
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '5' }}
                value={taxaCampo}
                onChange={(e) => setTaxaCampo(e.target.value)}
                placeholder="0.00"
                required
                helperText="Taxa de juiz não é cobrada em partidas individuais avulsas."
              />
              {valorCampoEfetivo > 0 && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="primary.main" fontWeight={900}>
                      👤 Custo por Atleta ({maxVagas} vagas):
                    </Typography>
                    <Typography variant="subtitle1" color="primary.main" fontWeight={900}>
                      R$ {valorPorAtletaAvulso.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* MODALIDADE ESPORTIVA */}
          <TextField
            select
            label="Modalidade Esportiva"
            fullWidth
            required
            value={esporte}
            onChange={(e) => {
              const novoEsporte = e.target.value;
              setEsporte(novoEsporte);
              if (SUGESTOES_DURACAO_POR_ESPORTE[novoEsporte]) {
                setDuracaoMinutos(SUGESTOES_DURACAO_POR_ESPORTE[novoEsporte]);
              }
            }}
          >
            {MODALIDADES_COLETIVAS.map((opcao) => (
              <MenuItem key={opcao} value={opcao}>
                {opcao}
              </MenuItem>
            ))}
          </TextField>

          {/* DURAÇÃO ESTIMADA DA PARTIDA COM SUGESTÕES INTELIGENTES */}
          <Box sx={{ p: 1.8, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center" gap={0.8}>
                <Clock size={16} color="#0066FF" />
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  Duração Estimada: {duracaoMinutos} minutos
                </Typography>
              </Box>
              <Chip
                label={`Sugerido: ${SUGESTOES_DURACAO_POR_ESPORTE[esporte] || 90} min`}
                size="small"
                sx={{ bgcolor: '#EFF6FF', color: 'primary.main', fontWeight: 800, fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              {[
                { label: '45 min (Basquete 3x3)', valor: 45 },
                { label: '60 min (Futsal / Vôlei / Basquete)', valor: 60 },
                { label: '90 min (Society / Campo)', valor: 90 },
                { label: '120 min (Torneio / 2 Horas)', valor: 120 },
              ].map((opcao) => {
                const ativo = duracaoMinutos === opcao.valor;
                return (
                  <Chip
                    key={opcao.valor}
                    label={opcao.label}
                    size="small"
                    onClick={() => setDuracaoMinutos(opcao.valor)}
                    sx={{
                      fontWeight: ativo ? 900 : 600,
                      bgcolor: ativo ? 'primary.main' : '#FFFFFF',
                      color: ativo ? '#FFFFFF' : 'text.primary',
                      border: ativo ? '1.5px solid #0066FF' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                    }}
                  />
                );
              })}
            </Box>

            <TextField
              label="Tempo Customizado (Minutos)"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min: 15, max: 300, step: 5 }}
              value={duracaoMinutos}
              onChange={(e) => setDuracaoMinutos(Math.max(15, Number(e.target.value)))}
              helperText="Define o encerramento automático da partida e o ciclo de avaliações dos atletas."
            />
          </Box>

          {/* DATA E HORA */}
          <TextField
            label="Data e Horário do Jogo"
            type="datetime-local"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            error={Boolean(conflitoAgenda)}
          />

          {/* ALERTA DE CONFLITO DE AGENDA (RN01) */}
          {conflitoAgenda && (
            <Alert 
              severity="error" 
              icon={<AlertTriangle size={20} color="#DC2626" />} 
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: '#FEF2F2', 
                border: '1.5px solid #F87171',
                color: '#991B1B',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.82rem', lineHeight: 1.3, mb: 0.5 }}>
                ⚠️ VOCÊ JÁ TEM UMA PARTIDA CRIADA NESSE HORÁRIO OU VOCÊ JÁ ESTÁ PARTICIPANDO DE UMA PARTIDA NESTE HORÁRIO
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#B91C1C', fontWeight: 600, lineHeight: 1.3 }}>
                Conflito detectado com: <strong>{conflitoAgenda.esporte}</strong> ({new Date(conflitoAgenda.dataHora).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}) — <em>Regra RN01 (Anti-conflito de Agenda)</em>. Escolha outro dia ou horário para prosseguir.
              </Typography>
            </Alert>
          )}

          {formatoJogo === 'Avulso' && (
            <TextField
              label="Total de Vagas Individuais"
              type="number"
              fullWidth
              required
              inputProps={{ min: 2, max: 50 }}
              value={maxVagas}
              onChange={(e) => setMaxVagas(Number(e.target.value))}
            />
          )}

          <Divider sx={{ my: 0.5 }} />

          {/* ========================================================================= */}
          {/* 📍 SEQUÊNCIA PRINCIPAL: 1. ENDEREÇO & BAIRRO -> 2. MAPA COM ALFINETE      */}
          {/* ========================================================================= */}
          <Box>
            <Typography variant="subtitle2" fontWeight={900} color="primary.main" mb={1.5}>
              📍 Localização da Partida
            </Typography>

            {/* 1. Campos de Bairro e Endereço */}
            <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
              <TextField
                label="Bairro (Franca/SP)"
                fullWidth
                required
                value={bairro}
                onChange={(e) => handleAtualizarEnderecoOuBairro(enderecoCompleto, e.target.value)}
              />

              <TextField
                label="Endereço Completo (Rua, Número)"
                fullWidth
                required
                placeholder="Ex: Av. Alonso y Alonso, 2000"
                value={enderecoCompleto}
                onChange={(e) => handleAtualizarEnderecoOuBairro(e.target.value, bairro)}
                helperText="Digite o local ou posicione o alfinete diretamente no mapa abaixo."
              />
            </Box>

            {/* 2. Mapa Interativo com Alfinete Arrastável */}
            <InteractiveMapPicker
              lat={coordenadas.lat}
              lng={coordenadas.lng}
              label={enderecoCompleto || bairro}
              origemTexto={obterLabelOrigem()}
              buscando={buscandoGeo}
              onChangeCoordinates={handleCoordenadasMudaramNoMapa}
            />
          </Box>

          {/* ========================================================================= */}
          {/* 🔽 BOTÃO "MAIS OPÇÕES" COM SETA PARA BAIXO                                */}
          {/* ========================================================================= */}
          <Box sx={{ mt: 0.5 }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => setMostrarMaisOpcoes(!mostrarMaisOpcoes)}
              endIcon={mostrarMaisOpcoes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                py: 1.2,
                borderRadius: 2.5,
                bgcolor: mostrarMaisOpcoes ? '#EFF6FF' : '#F8FAFC',
                borderWidth: '1.5px',
                borderColor: '#BFDBFE',
                justifyContent: 'space-between',
                px: 2
              }}
            >
              <span>{mostrarMaisOpcoes ? 'Ocultar opções avançadas de localização' : 'Mais opções de localização'}</span>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', opacity: 0.85 }}>
                {mostrarMaisOpcoes ? 'Menos' : 'Catálogo, Histórico, CEP e GPS'}
              </Typography>
            </Button>

            {/* CONTEÚDO EXPANSÍVEL DE MAIS OPÇÕES */}
            <Collapse in={mostrarMaisOpcoes} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1.5px dashed #0066FF', display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                {/* 1. SUGESTÕES DE PARTIDAS JÁ CRIADAS / HISTÓRICO DINÂMICO */}
                {locaisHistorico.length > 0 && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.8} mb={1}>
                      <History size={16} color="#0066FF" />
                      <Typography variant="caption" color="text.primary" fontWeight={900}>
                        Locais recentes utilizados no app ({locaisHistorico.length}):
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none' }}>
                      {locaisHistorico.map((loc) => (
                        <Chip
                          key={loc.id}
                          icon={<CheckCircle2 size={13} color="#0066FF" />}
                          label={`${loc.nome} (${loc.bairro})`}
                          size="small"
                          onClick={() => handleSelecionarLocalHistorico(loc)}
                          sx={{
                            fontWeight: 700,
                            bgcolor: '#FFFFFF',
                            border: '1px solid #BFDBFE',
                            color: 'primary.main',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#EFF6FF' }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 2. SELECIONAR DO PRÉ-CADASTRADO (CATÁLOGO DE FRANCA) */}
                <Box>
                  <Box display="flex" alignItems="center" gap={0.8} mb={0.8}>
                    <Sparkles size={16} color="#0066FF" />
                    <Typography variant="caption" color="text.primary" fontWeight={900}>
                      Selecionar Campo ou Arena Pré-cadastrada em Franca:
                    </Typography>
                  </Box>
                  <Autocomplete
                    options={CATALOGO_ARENAS_FRANCA}
                    getOptionLabel={(option) => `${option.nome} — [${option.tipo === 'Publica' ? 'Público' : 'Privado'}] (${option.bairro})`}
                    value={arenaSelecionada}
                    onChange={(_, newValue) => handleSelecionarArenaCatalogo(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Catálogo de Campos e Arenas de Franca"
                        size="small"
                        placeholder="Ex: CEPEL, Continental, Pedrocão, Arena Franca..."
                      />
                    )}
                  />
                </Box>

                {/* 3. ATALHOS RÁPIDOS DE BAIRROS */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.8}>
                    Atalhos Rápidos de Bairros:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none' }}>
                    {['São José', 'Parque Progresso', 'Vila Nova', 'Centro', 'Estação', 'Leporace', 'Aeroporto', 'Paulistano'].map((nomeB) => (
                      <Chip
                        key={nomeB}
                        label={nomeB}
                        size="small"
                        onClick={() => handleSelecionarBairroRapido(nomeB)}
                        sx={{
                          fontWeight: bairro.toLowerCase() === nomeB.toLowerCase() ? 800 : 600,
                          bgcolor: bairro.toLowerCase() === nomeB.toLowerCase() ? 'primary.main' : '#FFFFFF',
                          color: bairro.toLowerCase() === nomeB.toLowerCase() ? '#fff' : 'text.primary',
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* 4. BUSCA POR CEP & GPS DO DISPOSITIVO */}
                <Box display="flex" gap={1.5} flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" gap={1}>
                      <TextField
                        label="Buscar por CEP"
                        size="small"
                        placeholder="Ex: 14401-426"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        error={Boolean(erroCep)}
                        helperText={erroCep}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleBuscarCep}
                        disabled={buscandoCep}
                        startIcon={buscandoCep ? <CircularProgress size={16} /> : <Search size={16} />}
                        sx={{ fontWeight: 800, textTransform: 'none', px: 2 }}
                      >
                        CEP
                      </Button>
                    </Box>
                  </Box>

                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={<Crosshair size={15} />}
                    onClick={handleUsarGPSAtual}
                    sx={{ textTransform: 'none', fontWeight: 800, py: 1, px: 2, height: 40, whiteSpace: 'nowrap' }}
                  >
                    Usar Meu GPS
                  </Button>
                </Box>

              </Box>
            </Collapse>
          </Box>

          {/* DESCRIÇÃO / OBSERVAÇÕES */}
          <TextField
            label="Descrição / Regras do Jogo ou Amistoso"
            multiline
            rows={2}
            fullWidth
            placeholder="Ex: Amistoso 1º e 2º quadro, levar uniforme 1 e 2."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={Boolean(conflitoAgenda)}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {formatoJogo === 'Amistoso_Times' ? 'PUBLICAR AMISTOSO' : 'PUBLICAR PARTIDA'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
