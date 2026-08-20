import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { Star, ShieldCheck } from 'lucide-react';

export interface RatingScreenProps {
  atletaNome: string;
  partidaEsporte: string;
  onConcluir: () => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({
  atletaNome = 'Leonardo Santos',
  partidaEsporte = 'Futebol Society',
  onConcluir,
}) => {
  const [nota, setNota] = useState<number | null>(5);
  const [comentario, setComentario] = useState('');
  const [feedbackAberto, setFeedbackAberto] = useState(false);

  const handleEnviar = () => {
    setFeedbackAberto(true);
    setTimeout(() => {
      onConcluir();
    }, 1500);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 4 }}>
      <Card sx={{ borderRadius: 4, textAlign: 'center', p: 2 }}>
        <CardContent>
          <Avatar 
            sx={{ width: 64, height: 64, bgcolor: 'secondary.main', color: '#000', mx: 'auto', mb: 2, fontSize: 24, fontWeight: 700 }}
          >
            {atletaNome.charAt(0)}
          </Avatar>

          <Typography variant="h6" fontWeight={800}>
            Avaliar Jogador
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Como foi jogar com <strong>{atletaNome}</strong> na partida de <strong>{partidaEsporte}</strong>?
          </Typography>

          <Box display="flex" justifyContent="center" mb={3}>
            <Rating
              value={nota}
              precision={1}
              size="large"
              onChange={(_, val) => setNota(val)}
              sx={{ fontSize: '2.5rem' }}
            />
          </Box>

          <TextField
            label="Comentário sobre o jogo (opcional)"
            multiline
            rows={3}
            fullWidth
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleEnviar}
            sx={{ py: 1.5, fontWeight: 800, borderRadius: 3 }}
          >
            CONFIRMAR AVALIAÇÃO
          </Button>
        </CardContent>
      </Card>

      <Snackbar open={feedbackAberto} autoHideDuration={3000}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Avaliação registrada! A nota média do atleta foi recalculada.
        </Alert>
      </Snackbar>
    </Container>
  );
};
