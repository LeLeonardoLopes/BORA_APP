import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  TextField,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { Camera, Star, ShieldCheck, User, Shield, Plus, Check } from 'lucide-react';

export interface ProfileScreenProps {
  usuario: any;
  onSalvarPerfil: (dadosAtualizados: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  usuario,
  onSalvarPerfil,
}) => {
  const [nome, setNome] = useState(usuario?.nome || 'Leonardo Santos');
  const [email, setEmail] = useState(usuario?.email || 'leonardo@boraapp.com.br');
  const [telefone, setTelefone] = useState(usuario?.telefone || '(16) 99876-5432');
  const [genero, setGenero] = useState(usuario?.genero || 'Masculino');
  const [bio, setBio] = useState(usuario?.bio || 'Apaixonado por Futebol de campo e Society em Franca!');
  const [raioBuscaKm, setRaioBuscaKm] = useState(usuario?.raioBuscaKm || 5);
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario?.fotoUrl || null);

  // Time / Equipe do Usuário
  const [possuiTime, setPossuiTime] = useState(Boolean(usuario?.meuTime));
  const [nomeTime, setNomeTime] = useState(usuario?.meuTime?.nome || 'Franca F.C.');
  const [escudoTime, setEscudoTime] = useState<string | null>(usuario?.meuTime?.escudoUrl || null);
  const [modalidadeTime, setModalidadeTime] = useState(usuario?.meuTime?.modalidade || 'Futebol Society');
  const [bairroTime, setBairroTime] = useState(usuario?.meuTime?.bairro || 'São José');

  const [editando, setEditando] = useState(false);
  const [editandoTime, setEditandoTime] = useState(false);
  const [toastAberto, setToastAberto] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTeamInputRef = useRef<HTMLInputElement>(null);

  const modalidadesDisponiveis = [
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

  const [modalidadesFavoritas, setModalidadesFavoritas] = useState<string[]>(
    usuario?.modalidadesFavoritas?.split(',') || ['Futebol de Campo (11x11)', 'Futebol Society', 'Beach Tennis']
  );

  // Upload Local de Imagem via FileReader
  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>, isTeam = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isTeam) {
          setEscudoTime(reader.result as string);
          setToastMsg('Escudo do time atualizado com sucesso!');
        } else {
          setFotoUrl(reader.result as string);
          setToastMsg('Foto de perfil atualizada com sucesso!');
        }
        setToastAberto(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleModalidade = (mod: string) => {
    if (modalidadesFavoritas.includes(mod)) {
      setModalidadesFavoritas(modalidadesFavoritas.filter((m) => m !== mod));
    } else {
      setModalidadesFavoritas([...modalidadesFavoritas, mod]);
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarPerfil({
      ...usuario,
      nome,
      email,
      telefone,
      genero,
      bio,
      raioBuscaKm,
      fotoUrl,
      modalidadesFavoritas: modalidadesFavoritas.join(','),
      meuTime: possuiTime
        ? {
            nome: nomeTime,
            escudoUrl: escudoTime,
            modalidade: modalidadeTime,
            bairro: bairroTime,
          }
        : null,
    });
    setEditando(false);
    setEditandoTime(false);
    setToastMsg('Perfil atualizado com sucesso!');
    setToastAberto(true);
  };

  return (
    <Box sx={{ pb: 8 }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => handleUploadFoto(e, false)}
      />
      <input
        type="file"
        ref={fileTeamInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => handleUploadFoto(e, true)}
      />

      {/* Header do Perfil com Avatar e Upload Local */}
      <Card sx={{ borderRadius: '0 0 28px 28px', bgcolor: 'primary.main', color: '#fff', pt: 2, pb: 4, px: 3, mb: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Box position="relative" mb={1.5}>
            <Avatar
              src={fotoUrl || undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: '#D9D9D9',
                color: '#0066FF',
                border: '4px solid #FFD700',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              <User size={54} strokeWidth={2.2} />
            </Avatar>
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'secondary.main',
                color: '#000',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: 'secondary.light' },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
            </IconButton>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            {nome}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip
              icon={<Star size={14} fill="#000" color="#000" />}
              label={(usuario?.notaMedia || 4.95).toFixed(2) + ' • Atleta Confiável'}
              sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 800, height: 26 }}
            />
            <Chip
              icon={<ShieldCheck size={14} color="#10B981" />}
              label="Identidade Verificada"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, height: 26 }}
            />
          </Box>
        </Box>
      </Card>

      {/* Módulo: Meu Time / Equipe (Dono do Time & Amistosos) */}
      <Card sx={{ p: 2.5, mb: 3, border: '1.5px solid #0066FF', bgcolor: '#FFFFFF' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Shield size={22} color="#0066FF" />
            <Typography variant="subtitle1" fontWeight={900} color="primary.main">
              Meu Time / Equipe (Amistosos)
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => {
              setPossuiTime(true);
              setEditandoTime(!editandoTime);
            }}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {possuiTime ? (editandoTime ? 'Cancelar' : 'Gerenciar Time') : 'Cadastrar Time'}
          </Button>
        </Box>

        {possuiTime ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box position="relative">
                <Avatar
                  src={escudoTime || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: '#EFF6FF',
                    color: '#0066FF',
                    border: '2px solid #0066FF',
                  }}
                >
                  <Shield size={32} />
                </Avatar>
                {editandoTime && (
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      bgcolor: '#0066FF',
                      color: '#fff',
                      p: 0.5,
                      '&:hover': { bgcolor: '#0052CC' },
                    }}
                    onClick={() => fileTeamInputRef.current?.click()}
                  >
                    <Camera size={14} />
                  </IconButton>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                  {nomeTime}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Capitão: {nome} • {modalidadeTime} ({bairroTime}, Franca/SP)
                </Typography>
              </Box>
            </Box>

            {editandoTime && (
              <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                <TextField
                  label="Nome da Equipe / Time"
                  fullWidth
                  size="small"
                  value={nomeTime}
                  onChange={(e) => setNomeTime(e.target.value)}
                />
                <TextField
                  label="Modalidade Principal"
                  fullWidth
                  size="small"
                  value={modalidadeTime}
                  onChange={(e) => setModalidadeTime(e.target.value)}
                />
                <TextField
                  label="Bairro Base em Franca/SP"
                  fullWidth
                  size="small"
                  value={bairroTime}
                  onChange={(e) => setBairroTime(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSalvar}
                  sx={{ fontWeight: 800, mt: 0.5 }}
                >
                  Salvar Dados do Time
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Você ainda não cadastrou uma equipe. Cadastre seu time para poder marcar <strong>Amistosos</strong> contra outras equipes de Franca!
          </Typography>
        )}
      </Card>

      {/* Formulário de Informações Pessoais */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">
            Informações Pessoais
          </Typography>
          <Button
            size="small"
            variant={editando ? 'outlined' : 'contained'}
            color="primary"
            onClick={() => setEditando(!editando)}
            sx={{ fontWeight: 700, borderRadius: 3 }}
          >
            {editando ? 'Cancelar' : 'Editar'}
          </Button>
        </Box>

        <Box component="form" onSubmit={handleSalvar} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nome Completo"
            fullWidth
            disabled={!editando}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            disabled={!editando}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Telefone / WhatsApp"
            fullWidth
            disabled={!editando}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <TextField
            label="Sobre Você / Nível de Jogo"
            multiline
            rows={2}
            fullWidth
            disabled={!editando}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          {editando && (
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mt: 1, py: 1.4, fontWeight: 800 }}
            >
              SALVAR ALTERAÇÕES
            </Button>
          )}
        </Box>
      </Card>

      {/* Modalidades Coletivas Favoritas */}
      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={800} mb={1}>
          Modalidades Coletivas & Quadras
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Clique para selecionar os esportes que você pratica:
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1}>
          {modalidadesDisponiveis.map((mod) => {
            const selecionado = modalidadesFavoritas.includes(mod);
            return (
              <Chip
                key={mod}
                label={mod}
                onClick={() => toggleModalidade(mod)}
                icon={selecionado ? <Check size={14} color="#fff" /> : undefined}
                sx={{
                  bgcolor: selecionado ? 'primary.main' : '#E2E8F0',
                  color: selecionado ? '#fff' : 'text.primary',
                  fontWeight: 700,
                  borderRadius: 3,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: selecionado ? 'primary.dark' : '#CBD5E1',
                  },
                }}
              />
            );
          })}
        </Box>
      </Card>

      <Snackbar
        open={toastAberto}
        autoHideDuration={3000}
        onClose={() => setToastAberto(false)}
      >
        <Alert severity="success" sx={{ width: '100%', fontWeight: 700 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
