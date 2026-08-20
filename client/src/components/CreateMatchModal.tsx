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
  Alert
} from '@mui/material';
import { Shield, User, MapPin } from 'lucide-react';

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
  const [enderecoCompleto, setEnderecoCompleto] = useState('');

  // Taxas do Amistoso (Campo + Juiz) divididas por equipe
  const [taxaCampo, setTaxaCampo] = useState<number | string>(0);
  const [taxaJuiz, setTaxaJuiz] = useState<number | string>(0);

  const valorCampoNum = Number(taxaCampo) || 0;
  const valorJuizNum = Number(taxaJuiz) || 0;
  const valorTotalAmistoso = valorCampoNum + valorJuizNum;
  const valorPorEquipe = valorTotalAmistoso / 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      id: String(Date.now()),
      esporte,
      descricao,
      dataHora: dataHora || new Date(Date.now() + 86400000).toISOString(),
      bairro,
      enderecoCompleto: enderecoCompleto || 'Campo de Franca/SP',
      vagasPreenchidas: formatoJogo === 'Amistoso_Times' ? 1 : 1,
      maxVagas: formatoJogo === 'Amistoso_Times' ? 2 : Number(maxVagas),
      formatoJogo,
      tipoLocal,
      timeMandante: formatoJogo === 'Amistoso_Times' ? (meuTime?.nome || 'Bora Franca F.C.') : null,
      timeVisitante: null,
      taxaCampo: formatoJogo === 'Amistoso_Times' ? valorCampoNum : 0,
      taxaJuiz: formatoJogo === 'Amistoso_Times' ? valorJuizNum : 0,
      valorPorEquipe: formatoJogo === 'Amistoso_Times' ? valorPorEquipe : 0,
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
                label="Quadra / Campo Público (Praça, CEPEL, Terrão Aberto)" 
              />
              <FormControlLabel 
                value="Privada" 
                control={<Radio />} 
                label="Arena / Quadra Privada (Aluguel, Clube)" 
              />
            </RadioGroup>
          </FormControl>

          {/* CUSTOS DO AMISTOSO: TAXA DO CAMPO E TAXA DO JUIZ (DIVIDIDO 50%/50%) */}
          {formatoJogo === 'Amistoso_Times' && (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1.5px solid #0066FF' }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5}>
                💰 Taxa do Campo & Juiz (Dividido igualmente por equipe)
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

              {/* Quadro de Rateio Automático */}
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

          <TextField
            label="Bairro em Franca/SP"
            fullWidth
            required
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />

          <TextField
            label="Endereço Completo do Campo/Quadra (Protegido por LGPD RN02)"
            fullWidth
            required
            placeholder="Ex: Av. Dr. Ismael Alonso y Alonso, 2000"
            value={enderecoCompleto}
            onChange={(e) => setEnderecoCompleto(e.target.value)}
          />

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
