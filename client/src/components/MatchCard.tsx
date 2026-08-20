import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Alert
} from '@mui/material';
import { MapPin, Calendar, Navigation, ShieldCheck, ShieldAlert, Shield, Users } from 'lucide-react';

export interface MatchCardProps {
  id: string;
  esporte: string;
  descricao?: string;
  dataHora: string;
  bairro: string;
  enderecoCompleto?: string;
  lat: number;
  lng: number;
  vagasPreenchidas: number;
  maxVagas: number;
  isConfirmado?: boolean;
  formatoJogo?: 'Avulso' | 'Amistoso_Times';
  tipoLocal?: 'Publica' | 'Privada';
  timeMandante?: string;
  timeVisitante?: string;
  onSolicitarVaga?: (id: string) => void;
  onMarcarAmistoso?: (id: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  id,
  esporte,
  descricao,
  dataHora,
  bairro,
  enderecoCompleto,
  lat,
  lng,
  vagasPreenchidas,
  maxVagas,
  isConfirmado = false,
  formatoJogo = 'Avulso',
  tipoLocal = 'Publica',
  timeMandante,
  timeVisitante,
  onSolicitarVaga,
  onMarcarAmistoso,
}) => {
  const isAmistoso = formatoJogo === 'Amistoso_Times';
  const vagasRestantes = maxVagas - vagasPreenchidas;
  const isLotado = isAmistoso ? Boolean(timeVisitante) : vagasRestantes <= 0;

  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + String(lat) + ',' + String(lng);
  const openStreetMapEmbed = 'https://www.openstreetmap.org/export/embed.html?bbox=' + 
    String(lng - 0.005) + '%2C' + String(lat - 0.005) + '%2C' + 
    String(lng + 0.005) + '%2C' + String(lat + 0.005) + 
    '&layer=mapnik&marker=' + String(lat) + '%2C' + String(lng);

  return (
    <Card 
      sx={{ 
        mb: 2.5, 
        overflow: 'hidden',
        border: isAmistoso ? '1.5px solid #0066FF' : (isConfirmado ? '1.5px solid #10B981' : '1px solid rgba(226, 232, 240, 0.9)'),
      }}
    >
      {/* Header com tipo de confronto */}
      {isAmistoso ? (
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: '#fff', 
            py: 0.8, 
            px: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center', 
            fontSize: '0.82rem', 
            fontWeight: 900 
          }}
        >
          <Box display="flex" alignItems="center" gap={0.8}>
            <Shield size={16} color="#FFD700" /> AMISTOSO ENTRE TIMES
          </Box>
          <Chip
            size="small"
            label={tipoLocal === 'Publica' ? 'Campo Público' : 'Arena Privada'}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, height: 22 }}
          />
        </Box>
      ) : isConfirmado && (
        <Box 
          sx={{ 
            bgcolor: 'success.main', 
            color: '#fff', 
            py: 0.6, 
            px: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            fontSize: '0.8rem', 
            fontWeight: 800 
          }}
        >
          <ShieldCheck size={16} /> VOCÊ ESTÁ CONFIRMADO NESTA PARTIDA
        </Box>
      )}

      <CardContent sx={{ p: 2.5 }}>
        {/* Placa de Confronto de Amistoso */}
        {isAmistoso ? (
          <Box 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: 3, 
              bgcolor: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              textAlign: 'center' 
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.5}>
              CONFRONTO DEFINIDO:
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1.5}>
              <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                🛡️ {timeMandante || 'Time da Casa'}
              </Typography>
              <Typography variant="body2" fontWeight={900} color="text.secondary">
                VS
              </Typography>
              <Typography 
                variant="subtitle1" 
                fontWeight={900} 
                color={timeVisitante ? 'primary.main' : 'text.disabled'}
              >
                {timeVisitante ? '🛡️ ' + timeVisitante : '❓ Aguardando Desafiante'}
              </Typography>
            </Box>
          </Box>
        ) : null}

        {/* Tags de Modalidade e Vagas */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip 
              label={esporte} 
              sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }} 
            />
            {!isAmistoso && (
              <Chip
                label={tipoLocal === 'Publica' ? 'Quadra Pública' : 'Quadra Privada'}
                size="small"
                sx={{ bgcolor: '#EFF6FF', color: 'primary.main', fontWeight: 700 }}
              />
            )}
          </Box>

          <Chip
            label={isAmistoso ? (timeVisitante ? 'AMISTOSO FECHADO' : 'BUSCA ADVERSÁRIO') : (isLotado ? 'LOTADO' : String(vagasRestantes) + ' vagas livres')}
            sx={{
              bgcolor: isLotado ? 'error.light' : '#FEF08A',
              color: isLotado ? 'error.dark' : '#854D0E',
              fontWeight: 800,
              fontSize: '0.78rem'
            }}
          />
        </Box>

        {descricao && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            {descricao}
          </Typography>
        )}

        {/* Informações da Partida */}
        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1.2} color="text.primary">
            <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#EFF6FF', color: 'primary.main', display: 'flex' }}>
              <Calendar size={18} />
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {new Date(dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.2} color="text.primary">
            <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#EFF6FF', color: 'primary.main', display: 'flex' }}>
              <MapPin size={18} />
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {bairro}, Franca/SP
            </Typography>
          </Box>
        </Box>

        {/* REQUISITO LGPD (RN02) + VISUALIZADOR DE MAPAS */}
        {isConfirmado ? (
          <Box sx={{ mt: 2, mb: 2, bgcolor: '#F0FDF4', p: 2, borderRadius: 3, border: '1px solid #BBF7D0' }}>
            <Typography variant="caption" color="success.dark" fontWeight={800} display="block" mb={0.5}>
              ENDEREÇO OFICIAL LIBERADO:
            </Typography>
            <Typography variant="body2" color="text.primary" fontWeight={800} mb={1.5}>
              📍 {enderecoCompleto || 'Av. Dr. Ismael Alonso y Alonso, 2000 - Franca/SP'}
            </Typography>

            <Box 
              component="iframe" 
              src={openStreetMapEmbed}
              sx={{
                width: '100%',
                height: 150,
                borderRadius: 2.5,
                border: 0,
                mb: 1.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            />

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<Navigation size={16} />}
              href={mapsUrl}
              target="_blank"
              sx={{ fontWeight: 800, borderRadius: 2.5, py: 1 }}
            >
              Abrir no Google Maps / GPS
            </Button>
          </Box>
        ) : (
          <Alert severity="info" icon={<ShieldAlert size={18} />} sx={{ mb: 2, borderRadius: 2.5, bgcolor: '#EFF6FF' }}>
            <Typography variant="caption" fontWeight={600} color="primary.dark">
              <strong>Proteção LGPD (RN02):</strong> O endereço e rota exatos do local são liberados no mapa assim que {isAmistoso ? 'o amistoso for confirmado' : 'sua vaga for confirmada'}.
            </Typography>
          </Alert>
        )}

        {/* BOTÃO DE AÇÃO CONDICIONAL */}
        {isAmistoso ? (
          <Button
            fullWidth
            variant="contained"
            color={timeVisitante ? 'success' : 'primary'}
            disabled={Boolean(timeVisitante)}
            onClick={() => onMarcarAmistoso && onMarcarAmistoso(id)}
            sx={{ py: 1.4, fontWeight: 800, borderRadius: 3 }}
          >
            {timeVisitante ? 'AMISTOSO CONFIRMADO' : 'MARCAR AMISTOSO COM MEU TIME'}
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            color={isConfirmado ? 'success' : 'primary'}
            disabled={isLotado && !isConfirmado}
            onClick={() => !isConfirmado && onSolicitarVaga && onSolicitarVaga(id)}
            sx={{ py: 1.4, fontWeight: 800, borderRadius: 3 }}
          >
            {isConfirmado ? 'PARTIDA CONFIRMADA' : (isLotado ? 'PARTIDA LOTADA' : 'SOLICITAR VAGA')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
