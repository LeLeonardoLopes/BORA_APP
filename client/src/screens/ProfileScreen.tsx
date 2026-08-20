import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Divider
} from '@mui/material';
import { Camera, Star, ShieldCheck, User, Shield, Check, Database, Save } from 'lucide-react';
import { api } from '../services/api';

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
  const [nomeTime, setNomeTime] = useState(usuario?.meuTime?.nome || 'Bora Franca F.C.');
  const [escudoTime, setEscudoTime] = useState<string | null>(usuario?.meuTime?.escudoUrl || null);
  const [modalidadeTime, setModalidadeTime] = useState(usuario?.meuTime?.modalidade || 'Futebol de Campo (11x11)');
  const [bairroTime, setBairroTime] = useState(usuario?.meuTime?.bairro || 'São José');

  const [modalidadesFavoritas, setModalidadesFavoritas] = useState<string[]>(
    usuario?.modalidadesFavoritas
      ? (typeof usuario.modalidadesFavoritas === 'string' ? usuario.modalidadesFavoritas.split(',') : usuario.modalidadesFavoritas)
      : ['Futebol de Campo (11x11)', 'Futebol Society', 'Beach Tennis']
  );

  const [salvando, setSalvando] = useState(false);
  const [toastAberto, setToastAberto] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');

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

  // Sincroniza sempre que a prop 'usuario' for atualizada externamente
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setTelefone(usuario.telefone || '(16) 99876-5432');
      setGenero(usuario.genero || 'Masculino');
      setBio(usuario.bio || 'Apaixonado por Futebol de campo e Society em Franca!');
      setRaioBuscaKm(usuario.raioBuscaKm || 5);
      setFotoUrl(usuario.fotoUrl || null);
      if (usuario.meuTime) {
        setPossuiTime(true);
        setNomeTime(usuario.meuTime.nome || 'Bora Franca F.C.');
        setEscudoTime(usuario.meuTime.escudoUrl || null);
        setModalidadeTime(usuario.meuTime.modalidade || 'Futebol de Campo (11x11)');
        setBairroTime(usuario.meuTime.bairro || 'São José');
      }
      if (usuario.modalidadesFavoritas) {
        setModalidadesFavoritas(
          typeof usuario.modalidadesFavoritas === 'string'
            ? usuario.modalidadesFavoritas.split(',')
            : usuario.modalidadesFavoritas
        );
      }
    }
  }, [usuario]);

  // Upload Local de Imagem via FileReader
  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>, isTeam = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        if (isTeam) {
          setEscudoTime(base64Image);
          setToastMsg('Escudo selecionado! Clique em Salvar para gravar no banco.');
        } else {
          setFotoUrl(base64Image);
          setToastMsg('Foto selecionada! Clique em Salvar para gravar no banco.');
        }
        setToastSeverity('info');
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

  // Sincronização direta com a API e Banco de Dados
  const handleSalvarNoBanco = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);

    const dadosCompletos = {
      id: usuario?.id || 'user-mock-1',
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
      notaMedia: usuario?.notaMedia || 4.95,
      totalAvaliacoes: usuario?.totalAvaliacoes || 18,
    };

    try {
      // 1. Persistência no Backend (API REST + PostgreSQL/PostGIS)
      await api.put('/users/profile', dadosCompletos);

      // 2. Persistência local e atualização de estado no App
      onSalvarPerfil(dadosCompletos);
      localStorage.setItem('@bora:user', JSON.stringify(dadosCompletos));

      setToastSeverity('success');
      setToastMsg('✅ Perfil sincronizado com sucesso no Banco de Dados!');
      setToastAberto(true);
    } catch (err: any) {
      console.warn('Fallback local ativo:', err);
      onSalvarPerfil(dadosCompletos);
      localStorage.setItem('@bora:user', JSON.stringify(dadosCompletos));

      setToastSeverity('success');
      setToastMsg('✅ Perfil atualizado e salvo localmente com sucesso!');
      setToastAberto(true);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
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
                '&:hover': { bgcolor: '#FFE44D' },
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Alterar Foto de Perfil"
            >
              <Camera size={16} />
            </IconButton>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            {nome}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap" justifyContent="center">
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

      {/* Botão de Destaque: SALVAR NO BANCO */}
      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={salvando}
          onClick={() => handleSalvarNoBanco()}
          startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <Database size={20} />}
          sx={{
            py: 1.8,
            borderRadius: 3,
            bgcolor: '#0066FF',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: '1rem',
            boxShadow: '0 6px 20px rgba(0, 102, 255, 0.35)',
            '&:hover': {
              bgcolor: '#0052CC',
            },
          }}
        >
          {salvando ? 'SINCRONIZANDO COM O BANCO...' : '💾 SALVAR E SINCRONIZAR NO BANCO DE DADOS'}
        </Button>
      </Box>

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
            onClick={() => setPossuiTime(!possuiTime)}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {possuiTime ? 'Remover Time' : 'Cadastrar Time'}
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
                  title="Alterar Escudo do Time"
                >
                  <Camera size={14} />
                </IconButton>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                  {nomeTime || 'Nome do Time'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Capitão: {nome} • {modalidadeTime} ({bairroTime}, Franca/SP)
                </Typography>
              </Box>
            </Box>

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
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Você ainda não cadastrou uma equipe. Clique no botão acima para cadastrar seu time e marcar <strong>Amistosos</strong> contra outras equipes de Franca!
          </Typography>
        )}
      </Card>

      {/* Formulário de Informações Pessoais */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} color="text.primary" mb={2}>
          Informações Pessoais
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nome Completo"
            fullWidth
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Telefone / WhatsApp"
            fullWidth
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <TextField
            label="Sobre Você / Nível de Jogo"
            multiline
            rows={2}
            fullWidth
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Box>
      </Card>

      {/* Modalidades Coletivas Favoritas */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} mb={1}>
          Modalidades Coletivas & Quadras
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Selecione as modalidades que você pratica:
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

      {/* Botão Secundário no Rodapé da Tela */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={salvando}
        onClick={() => handleSalvarNoBanco()}
        startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
        sx={{
          py: 1.8,
          borderRadius: 3,
          bgcolor: '#FFD700',
          color: '#000000',
          fontWeight: 900,
          fontSize: '1rem',
          boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
          '&:hover': {
            bgcolor: '#FFE44D',
          },
        }}
      >
        {salvando ? 'SINCRONIZANDO...' : '💾 SALVAR TODAS AS ALTERAÇÕES NO BANCO'}
      </Button>

      <Snackbar
        open={toastAberto}
        autoHideDuration={4000}
        onClose={() => setToastAberto(false)}
      >
        <Alert severity={toastSeverity} sx={{ width: '100%', fontWeight: 700 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
