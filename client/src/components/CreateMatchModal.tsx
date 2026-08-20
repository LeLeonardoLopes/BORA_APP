import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import { Shield, User, MapPin, Navigation, Crosshair, Loader2, CheckCircle2 } from 'lucide-react';
import { geocodificarEndereco, obterLocalizacaoAtualGPS, Coordenadas } from '../services/geocodingService';

export interface CreateMatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (novaPartida: any) => void;
  meuTime?: any;
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

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  open,
  onClose,
  onSuccess,
  meuTime,
}) => {
  const [formatoJogo, setFormatoJogo] = useState<'Avulso' | 'Amistoso_Times'>('Avulso');
  const [tipoLocal, setTipoLocal] = useState<'Publica' | 'Privada'>('Publica');
  const [esporte, setEsporte] = useState(MODALIDADES_COLETIVAS[0]);
  const [descricao, setDescricao] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [maxVagas, setMaxVagas] = useState(14);
  const [bairro, setBairro] = useState('São José');
  const [enderecoCompleto, setEnderecoCompleto] = useState('Av. Dr. Ismael Alonso y Alonso, 2000');
  const [coordenadas, setCoordenadas] = useState<Coordenadas>({
    lat: -20.534215,
    lng: -47.401258,
    origem: 'base_franca',
  });
  const [buscandoGeo, setBuscandoGeo] = useState(false);

  // Taxas e Rateios
  const [taxaCampo, setTaxaCampo] = useState<number | string>('');
  const [taxaJuiz, setTaxaJuiz] = useState<number | string>('');

  const valorCampoEfetivo = tipoLocal === 'Publica' ? 0 : (Number(taxaCampo) || 0);
  const valorJuizEfetivo = formatoJogo === 'Amistoso_Times' ? (Number(taxaJuiz) || 0) : 0;
  
  const valorTotalAmistoso = valorCampoEfetivo + valorJuizEfetivo;
  const valorPorEquipe = valorTotalAmistoso / 2;
  const valorPorAtletaAvulso = maxVagas > 0 ? (valorCampoEfetivo / Number(maxVagas)) : 0;

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

  const handleUsarGPSAtual = async () => {
    setBuscandoGeo(true);
    try {
      const gps = await obterLocalizacaoAtualGPS();
      setCoordenadas(gps);
      if (!enderecoCompleto) {
        setEnderecoCompleto(`Local capturado via GPS (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})`);
      }
    } catch (err: any) {
      alert(err.message || 'Não foi possível capturar o GPS.');
    } finally {
      setBuscandoGeo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      id: String(Date.now()),
      esporte,
      descricao,
      dataHora: dataHora || new Date(Date.now() + 86400000).toISOString(),
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
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', pb: 1 }}>
        Criar Nova Partida Esportiva
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* SELEÇÃO DO FORMATO DE JOGO: AVULSO OU AMISTOSO */}
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

          {/* SELEÇÃO DO TIPO DE LOCAL: PÚBLICO OU PRIVADO */}
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
                label="Quadra / Campo Público (100% Gratuito)" 
              />
              <FormControlLabel 
                value="Privada" 
                control={<Radio />} 
                label="Arena / Quadra Privada (Com Aluguel)" 
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
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1.5px solid #0066FF' }}>
              <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
                🏟️ <strong>Campo Público Gratuito:</strong> A taxa de campo é R$ 0,00. Caso contratarem arbitragem para o amistoso, informe abaixo o valor do juiz para rateio entre os dois times.
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
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1.5px solid #0066FF' }}>
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

              {/* Quadro de Rateio Automático Amistoso */}
              <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Custo Total da Partida:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="text.primary">
                    R$ {valorTotalAmistoso.toFixed(2)}
                  </Typography>
                </Box>
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
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1.5px solid #0066FF' }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5}>
                🏟️ Aluguel da Arena / Quadra Privada (Rateio por Vaga)
              </Typography>
              <TextField
                label="Valor Total do Aluguel do Campo/Quadra (R$)"
                type="number"
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '5' }}
                value={taxaCampo}
                onChange={(e) => setTaxaCampo(e.target.value)}
                placeholder="Ex: 140.00"
                helperText="O valor total será rateado igualmente entre os atletas confirmados."
                required
              />
              {valorCampoEfetivo > 0 && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="primary.main" fontWeight={800}>
                      👥 Custo Estimado por Atleta ({maxVagas} vagas):
                    </Typography>
                    <Typography variant="subtitle1" color="primary.main" fontWeight={900}>
                      R$ {valorPorAtletaAvulso.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          <Divider />

          {/* MODALIDADE ESPORTIVA */}
          <TextField
            select
            label="Modalidade Esportiva"
            fullWidth
            value={esporte}
            onChange={(e) => setEsporte(e.target.value)}
          >
            {MODALIDADES_COLETIVAS.map((esp) => (
              <MenuItem key={esp} value={esp}>
                {esp}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Data e Hora da Partida"
            type="datetime-local"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
          />

          {formatoJogo === 'Avulso' && (
            <TextField
              label="Número Máximo de Vagas Individuais"
              type="number"
              fullWidth
              required
              inputProps={{ min: 2, max: 50 }}
              value={maxVagas}
              onChange={(e) => setMaxVagas(Number(e.target.value))}
            />
          )}

          {/* ATALHOS RÁPIDOS DE BAIRROS DE FRANCA */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.8}>
              📍 Sugestões de Bairros e Arenas em Franca:
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
                    bgcolor: bairro.toLowerCase() === nomeB.toLowerCase() ? 'primary.main' : '#EFF6FF',
                    color: bairro.toLowerCase() === nomeB.toLowerCase() ? '#fff' : 'primary.main',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Geolocalização e Coordenadas do Campo:
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Crosshair size={14} />}
              onClick={handleUsarGPSAtual}
              sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', py: 0.2 }}
            >
              Usar Meu GPS Atual
            </Button>
          </Box>

          <TextField
            label="Bairro em Franca/SP"
            fullWidth
            required
            value={bairro}
            onChange={(e) => handleAtualizarEnderecoOuBairro(enderecoCompleto, e.target.value)}
          />

          <TextField
            label="Endereço Completo do Campo/Quadra (Protegido por LGPD RN02)"
            fullWidth
            required
            placeholder="Ex: Av. Dr. Ismael Alonso y Alonso, 2000"
            value={enderecoCompleto}
            onChange={(e) => handleAtualizarEnderecoOuBairro(e.target.value, bairro)}
            helperText="O minimapa converte o endereço automaticamente em coordenadas GPS."
          />

          {/* MINIMAPA INTERATIVO DINÂMICO CONECTADO AO ENDEREÇO & SATÉLITE */}
          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1.5px solid #0066FF', bgcolor: '#F8FAFC' }}>
            <Box sx={{ px: 2, py: 1, bgcolor: '#EFF6FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #BFDBFE' }}>
              <Box display="flex" alignItems="center" gap={0.8}>
                <MapPin size={16} color="#0066FF" />
                <Typography variant="caption" fontWeight={900} color="primary.main">
                  COORDENADAS: ({coordenadas.lat.toFixed(5)}, {coordenadas.lng.toFixed(5)})
                </Typography>
              </Box>
              <Chip
                size="small"
                label={
                  buscandoGeo
                    ? 'Buscando Satélite...'
                    : coordenadas.origem === 'gps_dispositivo'
                    ? '📱 GPS Dispositivo'
                    : coordenadas.origem === 'satelite_nominatim'
                    ? '🛰️ Satélite OpenStreetMap'
                    : '📍 Base Franca/SP'
                }
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  bgcolor: buscandoGeo ? '#FEF3C7' : '#DCFCE7',
                  color: buscandoGeo ? '#92400E' : '#166534',
                }}
              />
            </Box>

            <Box sx={{ position: 'relative', width: '100%', height: 160, bgcolor: '#E2E8F0' }}>
              <Box
                component="iframe"
                key={`${coordenadas.lat}-${coordenadas.lng}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordenadas.lng - 0.004}%2C${coordenadas.lat - 0.004}%2C${coordenadas.lng + 0.004}%2C${coordenadas.lat + 0.004}&layer=mapnik&marker=${coordenadas.lat}%2C${coordenadas.lng}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block'
                }}
              />
            </Box>

            <Box sx={{ p: 1, px: 1.5, bgcolor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {enderecoCompleto ? `📌 Alfinete cravado no local: ${enderecoCompleto}` : `📌 Alfinete fixado em ${bairro}, Franca/SP`}
              </Typography>
            </Box>
          </Box>

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
          <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800, px: 3 }}>
            {formatoJogo === 'Amistoso_Times' ? 'PUBLICAR AMISTOSO' : 'PUBLICAR PARTIDA'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
