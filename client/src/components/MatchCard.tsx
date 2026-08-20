import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  MapPin, 
  Calendar, 
  Navigation, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Users, 
  Share2 
} from 'lucide-react';
import { obterClimaFranca, PrevisaoClima } from '../services/weatherService';

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
  taxaCampo?: number;
  taxaJuiz?: number;
  valorPorEquipe?: number;
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
  taxaCampo = 0,
  taxaJuiz = 0,
  valorPorEquipe = 0,
  onSolicitarVaga,
  onMarcarAmistoso,
}) => {
  const isAmistoso = formatoJogo === 'Amistoso_Times';
  const vagasRestantes = maxVagas - vagasPreenchidas;
  const isLotado = isAmistoso ? Boolean(timeVisitante) : vagasRestantes <= 0;

  const [clima, setClima] = useState<PrevisaoClima | null>(null);

  useEffect(() => {
    obterClimaFranca(lat, lng).then(setClima);
  }, [lat, lng]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const openStreetMapEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.005}%2C${lng + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;

  const dataFormatada = new Date(dataHora).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Gerador de Convite para WhatsApp
  const handleCompartilharWhatsApp = () => {
    const textoMensagem = isAmistoso
      ? `🏆 *DESAFIO DE AMISTOSO NO BORA! APP*\n` +
        `⚽ *Modalidade:* ${esporte}\n` +
        `🛡️ *Mandante:* ${timeMandante || 'Equipe de Franca'}\n` +
        `📍 *Local:* ${bairro}, Franca/SP\n` +
        `⏰ *Horário:* ${dataFormatada}\n` +
        `👉 Aceite o desafio no Bora! App: http://localhost:5173`
      : `⚽ *BORA PRO RACHA! — BORA! APP*\n` +
        `🏆 *Jogo:* ${esporte}\n` +
        `📍 *Local:* ${bairro}, Franca/SP\n` +
        `⏰ *Horário:* ${dataFormatada}\n` +
        `🎟️ *Vagas restantes:* ${vagasRestantes} de ${maxVagas}\n` +
        `👉 Garanta sua vaga no Bora! App: http://localhost:5173`;

    const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
    window.open(zapUrl, '_blank');
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        overflow: 'hidden',
        border: isAmistoso ? '1.5px solid #0066FF' : (isConfirmado ? '1.5px solid #10B981' : '1px solid rgba(226, 232, 240, 0.9)'),
        borderRadius: 3,
        boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 18px rgba(0,102,255,0.1)'
        }
      }}
    >
      {/* Header com Tipo de Jogo & Botão Compartilhar */}
      {isAmistoso ? (
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: '#fff', 
            py: 0.6, 
            px: 1.8, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center', 
            fontSize: '0.74rem', 
            fontWeight: 800 
          }}
        >
          <Box display="flex" alignItems="center" gap={0.6}>
            <Shield size={14} color="#FFD700" /> AMISTOSO ENTRE TIMES
          </Box>
          <Box display="flex" alignItems="center" gap={0.8}>
            <Chip
              size="small"
              label={tipoLocal === 'Publica' ? 'Campo Público' : 'Arena Privada'}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, height: 20, fontSize: '0.68rem' }}
            />
            <Tooltip title="Convidar no WhatsApp">
              <IconButton 
                size="small" 
                onClick={handleCompartilharWhatsApp} 
                sx={{ color: '#FFD700', p: 0.2, bgcolor: 'rgba(255,255,255,0.15)' }}
              >
                <Share2 size={13} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : (
        <Box 
          sx={{ 
            bgcolor: '#F8FAFC', 
            py: 0.5, 
            px: 1.8, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid #E2E8F0' 
          }}
        >
          <Box display="flex" alignItems="center" gap={0.6}>
            <Users size={13} color="#16A34A" />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.70rem' }}>
              PARTIDA ABERTA (AVULSO)
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.8}>
            <Chip
              size="small"
              label={tipoLocal === 'Publica' ? '100% Gratuito' : 'Aluguel Privado'}
              sx={{
                bgcolor: tipoLocal === 'Publica' ? '#DCFCE7' : '#EFF6FF',
                color: tipoLocal === 'Publica' ? '#166534' : 'primary.main',
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 19
              }}
            />
            <Tooltip title="Convidar no WhatsApp">
              <IconButton 
                size="small" 
                onClick={handleCompartilharWhatsApp} 
                sx={{ color: '#16A34A', p: 0.2, bgcolor: '#DCFCE7' }}
              >
                <Share2 size={12} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
        
        {/* Título da Partida / Confronto */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.8}>
          <Box>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800, fontSize: '0.94rem', lineHeight: 1.2, color: 'text.primary' }}>
              {esporte}
            </Typography>
            {isAmistoso && (
              <Typography variant="caption" color="primary.main" fontWeight={800} display="block" mt={0.2} sx={{ fontSize: '0.74rem' }}>
                ⚔️ {timeMandante || 'Bora Franca F.C.'} vs {timeVisitante ? <strong>{timeVisitante}</strong> : 'Aguardando Desafiante'}
              </Typography>
            )}
          </Box>

          {/* Badge de Vagas */}
          {isAmistoso ? (
            <Chip
              label={timeVisitante ? 'Duelo Fechado' : 'Desafio Aberto'}
              color={timeVisitante ? 'default' : 'primary'}
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.68rem', height: 21 }}
            />
          ) : (
            <Chip
              label={vagasRestantes > 0 ? `${vagasRestantes} vagas restantes` : 'Partida Lotada'}
              color={vagasRestantes > 0 ? 'secondary' : 'default'}
              size="small"
              sx={{ fontWeight: 800, color: vagasRestantes > 0 ? '#000' : 'inherit', fontSize: '0.68rem', height: 21 }}
            />
          )}
        </Box>

        {/* Data, Horário e Previsão do Tempo */}
        <Box display="flex" flexWrap="wrap" gap={0.8} alignItems="center" mb={1.2}>
          <Box display="flex" alignItems="center" gap={0.4}>
            <Calendar size={13} color="#0066FF" />
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
              {dataFormatada}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.4}>
            <MapPin size={13} color="#0066FF" />
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
              {bairro}, Franca/SP
            </Typography>
          </Box>

          {/* PREVISÃO DO TEMPO REAL COMPACTA */}
          {clima && (
            <Chip
              icon={<span style={{ fontSize: '11px', marginLeft: '4px' }}>{clima.icone}</span>}
              label={`${clima.temperatura}°C • ${clima.condicao}`}
              size="small"
              sx={{
                bgcolor: clima.alertaChuva ? '#FEE2E2' : '#FEF3C7',
                color: clima.alertaChuva ? '#991B1B' : '#92400E',
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 20,
                border: clima.alertaChuva ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                px: 0.2
              }}
            />
          )}
        </Box>

        {descricao && (
          <Typography variant="body2" color="text.secondary" mb={1.2} sx={{ fontStyle: 'italic', bgcolor: '#F8FAFC', p: 0.8, borderRadius: 1.5, fontSize: '0.75rem', lineHeight: 1.35 }}>
            "{descricao}"
          </Typography>
        )}

        {/* MAPA INTERATIVO / MINIMAPA LIBERADO COM LGPD */}
        {isConfirmado ? (
          <Box sx={{ mb: 1.5 }}>
            <Box display="flex" alignItems="center" gap={0.6} mb={0.6}>
              <ShieldCheck size={14} color="#10B981" />
              <Typography variant="caption" color="success.main" fontWeight={800} sx={{ fontSize: '0.72rem' }}>
                Local confirmado: {enderecoCompleto || `${bairro}, Franca/SP`}
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', width: '100%', height: 120, borderRadius: 2, overflow: 'hidden', mb: 0.8, border: '1.5px solid #10B981' }}>
              <Box component="iframe" src={openStreetMapEmbed} sx={{ width: '100%', height: '100%', border: 0 }} />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Navigation size={13} />}
              href={mapsUrl}
              target="_blank"
              sx={{ fontWeight: 800, borderRadius: 2, py: 0.6, fontSize: '0.74rem' }}
            >
              Abrir GPS / Google Maps
            </Button>
          </Box>
        ) : (
          <Alert severity="info" icon={<ShieldAlert size={14} />} sx={{ mb: 1.2, borderRadius: 2, bgcolor: '#EFF6FF', py: 0.2, px: 1, '& .MuiAlert-message': { p: 0 } }}>
            <Typography variant="caption" fontWeight={600} color="primary.dark" sx={{ fontSize: '0.70rem', lineHeight: 1.25 }}>
              <strong>Proteção LGPD (RN02):</strong> O endereço e mapa exatos são liberados assim que {isAmistoso ? 'o confronto for aceito' : 'sua vaga for confirmada'}.
            </Typography>
          </Alert>
        )}

        {/* BOTÃO DE AÇÃO */}
        {isAmistoso ? (
          <Button
            fullWidth
            variant="contained"
            color={timeVisitante ? 'success' : 'primary'}
            disabled={Boolean(timeVisitante)}
            onClick={() => onMarcarAmistoso && onMarcarAmistoso(id)}
            sx={{ py: 0.8, fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
          >
            {timeVisitante ? 'AMISTOSO CONFIRMADO' : 'DESAFIAR COM MEU TIME'}
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            color={isConfirmado ? 'success' : 'primary'}
            disabled={isLotado && !isConfirmado}
            onClick={() => !isConfirmado && onSolicitarVaga && onSolicitarVaga(id)}
            sx={{ py: 0.8, fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
          >
            {isConfirmado ? 'VAGA CONFIRMADA' : (isLotado ? 'PARTIDA LOTADA' : 'SOLICITAR VAGA')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCard;
