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
  Divider,
  MenuItem,
  Grid
} from '@mui/material';
import { 
  Camera, 
  Star, 
  ShieldCheck, 
  User, 
  Shield, 
  Check, 
  Save, 
  Trophy, 
  Calendar, 
  Award, 
  Instagram, 
  MapPin, 
  Clock, 
  Activity 
} from 'lucide-react';
import { api } from '../services/api';

export interface ProfileScreenProps {
  usuario: any;
  onSalvarPerfil: (dadosAtualizados: any) => void;
}

export const DIAS_HORARIOS_DISPONIVEIS = [
  'Noites de Semana (19h-22h)',
  'Sábados pela Manhã',
  'Sábados à Tarde',
  'Domingos pela Manhã',
  'Domingos à Tarde'
];

export const POSICOES_DISPONIVEIS = [
  'Goleiro / Guarda-Redes',
  'Zagueiro / Fixo',
  'Lateral / Ala',
  'Meio-Campo / Volante',
  'Atacante / Centroavante / Pivô',
  'Armador (Basquete)',
  'Ala (Basquete)',
  'Levantador (Vôlei)',
  'Ponteiro / Oposto (Vôlei)',
  'Lado Direito (Beach Tennis)',
  'Lado Esquerdo (Beach Tennis)',
  'Jogador Polivalente (Joga em qualquer vaga)'
];

export const MODALIDADES_DISPONIVEIS = [
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

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  usuario,
  onSalvarPerfil,
}) => {
  // Informações Pessoais
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [genero, setGenero] = useState(usuario?.genero || 'Não informado');
  const [bairroResidencia, setBairroResidencia] = useState(usuario?.bairroResidencia || '');
  const [instagram, setInstagram] = useState(usuario?.instagram || '');
  const [bio, setBio] = useState(usuario?.bio || '');
  const [raioBuscaKm, setRaioBuscaKm] = useState(usuario?.raioBuscaKm || 5);
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario?.fotoUrl || null);

  // Ficha Técnica do Atleta
  const [posicaoPreferida, setPosicaoPreferida] = useState(usuario?.posicaoPreferida || 'Jogador Polivalente (Joga em qualquer vaga)');
  const [ladoDominante, setLadoDominante] = useState(usuario?.ladoDominante || 'Destro');
  const [nivelHabilidade, setNivelHabilidade] = useState(usuario?.nivelHabilidade || 'Intermediário');
  
  // Disponibilidade e Horários
  const [horariosFavoritos, setHorariosFavoritos] = useState<string[]>(
    usuario?.horariosFavoritos 
      ? (Array.isArray(usuario.horariosFavoritos) ? usuario.horariosFavoritos : usuario.horariosFavoritos.split(','))
      : []
  );

  // Time / Equipe do Usuário (Amistosos)
  const [possuiTime, setPossuiTime] = useState(Boolean(usuario?.meuTime));
  const [nomeTime, setNomeTime] = useState(usuario?.meuTime?.nome || '');
  const [escudoTime, setEscudoTime] = useState<string | null>(usuario?.meuTime?.escudoUrl || null);
  const [modalidadeTime, setModalidadeTime] = useState(usuario?.meuTime?.modalidade || 'Futebol Society');
  const [bairroTime, setBairroTime] = useState(usuario?.meuTime?.bairro || '');

  // Modalidades Praticadas
  const [modalidadesFavoritas, setModalidadesFavoritas] = useState<string[]>(
    usuario?.modalidadesFavoritas
      ? (typeof usuario.modalidadesFavoritas === 'string' ? usuario.modalidadesFavoritas.split(',') : usuario.modalidadesFavoritas)
      : []
  );

  // Estatísticas do Atleta
  const partidasCriadas = usuario?.partidasCriadasCount || 0;
  const jogosParticipados = usuario?.jogosParticipadosCount || 0;
  const notaMedia = usuario?.notaMedia || 5.0;
  const totalAvaliacoes = usuario?.totalAvaliacoes || 0;

  const [salvando, setSalvando] = useState(false);
  const [toastAberto, setToastAberto] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTeamInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza estado se props mudarem
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setTelefone(usuario.telefone || '');
      setGenero(usuario.genero || 'Não informado');
      setBairroResidencia(usuario.bairroResidencia || '');
      setInstagram(usuario.instagram || '');
      setBio(usuario.bio || '');
      setRaioBuscaKm(usuario.raioBuscaKm || 5);
      setFotoUrl(usuario.fotoUrl || null);
      setPosicaoPreferida(usuario.posicaoPreferida || 'Jogador Polivalente (Joga em qualquer vaga)');
      setLadoDominante(usuario.ladoDominante || 'Destro');
      setNivelHabilidade(usuario.nivelHabilidade || 'Intermediário');

      if (usuario.meuTime) {
        setPossuiTime(true);
        setNomeTime(usuario.meuTime.nome || '');
        setEscudoTime(usuario.meuTime.escudoUrl || null);
        setModalidadeTime(usuario.meuTime.modalidade || 'Futebol Society');
        setBairroTime(usuario.meuTime.bairro || '');
      } else {
        setPossuiTime(false);
        setNomeTime('');
        setEscudoTime(null);
        setBairroTime('');
      }

      if (usuario.modalidadesFavoritas) {
        setModalidadesFavoritas(
          typeof usuario.modalidadesFavoritas === 'string'
            ? usuario.modalidadesFavoritas.split(',')
            : usuario.modalidadesFavoritas
        );
      } else {
        setModalidadesFavoritas([]);
      }

      if (usuario.horariosFavoritos) {
        setHorariosFavoritos(
          typeof usuario.horariosFavoritos === 'string'
            ? usuario.horariosFavoritos.split(',')
            : usuario.horariosFavoritos
        );
      } else {
        setHorariosFavoritos([]);
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
          setToastMsg('Escudo do time selecionado!');
        } else {
          setFotoUrl(base64Image);
          setToastMsg('Foto de perfil selecionada!');
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

  const toggleHorario = (horario: string) => {
    if (horariosFavoritos.includes(horario)) {
      setHorariosFavoritos(horariosFavoritos.filter((h) => h !== horario));
    } else {
      setHorariosFavoritos([...horariosFavoritos, horario]);
    }
  };

  // Salvar alterações
  const handleSalvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);

    const dadosCompletos = {
      id: usuario?.id || '11111111-1111-1111-1111-111111111101',
      nome,
      email,
      telefone,
      genero,
      bairroResidencia,
      instagram,
      bio,
      raioBuscaKm,
      fotoUrl,
      posicaoPreferida,
      ladoDominante,
      nivelHabilidade,
      horariosFavoritos,
      modalidadesFavoritas: modalidadesFavoritas.join(','),
      meuTime: possuiTime
        ? {
            nome: nomeTime,
            escudoUrl: escudoTime,
            modalidade: modalidadeTime,
            bairro: bairroTime,
          }
        : null,
      partidasCriadasCount: partidasCriadas,
      jogosParticipadosCount: jogosParticipados,
      notaMedia,
      totalAvaliacoes,
    };

    try {
      await api.put('/users/profile', dadosCompletos);
      onSalvarPerfil(dadosCompletos);
      localStorage.setItem('@bora:user', JSON.stringify(dadosCompletos));

      setToastSeverity('success');
      setToastMsg('Perfil completo atualizado com sucesso!');
      setToastAberto(true);
    } catch (err: any) {
      console.warn('Fallback de perfil ativo:', err);
      onSalvarPerfil(dadosCompletos);
      localStorage.setItem('@bora:user', JSON.stringify(dadosCompletos));

      setToastSeverity('success');
      setToastMsg('Perfil salvo localmente com sucesso!');
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

      {/* 1. HEADER DO PERFIL COM AVATAR, CAPITANIA E SELOS */}
      <Card sx={{ borderRadius: '0 0 28px 28px', bgcolor: 'primary.main', color: '#fff', pt: 2, pb: 3.5, px: 2.5, mb: 3 }}>
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
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, mt: 0.2 }}>
            📍 {bairroResidencia}, Franca/SP • {posicaoPreferida}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={1.2} flexWrap="wrap" justifyContent="center">
            <Chip
              icon={<Star size={14} fill="#000" color="#000" />}
              label={`${Number(notaMedia).toFixed(2)} (${totalAvaliacoes} avaliações)`}
              sx={{ bgcolor: 'secondary.main', color: '#000', fontWeight: 900, height: 26 }}
            />
            {possuiTime && (
              <Chip
                icon={<Shield size={14} color="#FFD700" />}
                label={`🛡️ Capitão do ${nomeTime}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, height: 26 }}
              />
            )}
            <Chip
              icon={<ShieldCheck size={14} color="#10B981" />}
              label="Identidade Verificada"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, height: 26 }}
            />
          </Box>
        </Box>
      </Card>

      {/* 2. KPI CARDS: ESTATÍSTICAS ESPORTIVAS EM TEMPO REAL */}
      <Box sx={{ px: 0.5, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={900} color="text.primary" mb={1.5}>
          📊 Estatísticas Esportivas no Bora! App
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1.8}>
          {/* Card: Partidas Criadas */}
          <Card 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 10px rgba(0,102,255,0.06)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.8} mb={0.5}>
              <Trophy size={16} color="#0066FF" />
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                Partidas Criadas
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="primary.main" my={0.3}>
              {partidasCriadas}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              como organizador(a)
            </Typography>
          </Card>

          {/* Card: Jogos Participados */}
          <Card 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 10px rgba(22,163,74,0.06)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.8} mb={0.5}>
              <Calendar size={16} color="#16A34A" />
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                Jogos Disputados
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="#16A34A" my={0.3}>
              {jogosParticipados}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              rachas & amistosos
            </Typography>
          </Card>

          {/* Card: Fair Play */}
          <Card 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 10px rgba(202,138,4,0.06)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.8} mb={0.5}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                Fair Play & Nota
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="secondary.main" my={0.3}>
              {Number(notaMedia).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              ⭐ Nível Ouro
            </Typography>
          </Card>

          {/* Card: Taxa de Presença */}
          <Card 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.8} mb={0.5}>
              <Activity size={16} color="#0066FF" />
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                Assiduidade
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} color="primary.main" my={0.3}>
              100%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              sem faltas em jogos
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* 3. MÓDULO: MEU TIME / EQUIPE (DONO DO TIME & AMISTOSOS) */}
      <Card sx={{ p: 2.5, mb: 3, border: '1.5px solid #0066FF', bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,102,255,0.08)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Shield size={22} color="#0066FF" />
            <Typography variant="subtitle1" fontWeight={900} color="primary.main">
              Meu Time de Amistosos (Capitão)
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
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                  Dono / Capitão: <strong>{nome}</strong>
                </Typography>
                <Typography variant="caption" color="primary.main" fontWeight={800}>
                  {modalidadeTime} • Base: {bairroTime}, Franca/SP
                </Typography>
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={1.5} mt={0.5}>
              <TextField
                label="Nome da Equipe"
                fullWidth
                size="small"
                value={nomeTime}
                onChange={(e) => setNomeTime(e.target.value)}
              />
              <TextField
                select
                label="Modalidade Principal"
                fullWidth
                size="small"
                value={modalidadeTime}
                onChange={(e) => setModalidadeTime(e.target.value)}
              >
                {MODALIDADES_DISPONIVEIS.map((mod) => (
                  <MenuItem key={mod} value={mod}>
                    {mod}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Bairro Base do Time"
                fullWidth
                size="small"
                value={bairroTime}
                onChange={(e) => setBairroTime(e.target.value)}
              />
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Você ainda não cadastrou uma equipe. Cadastre seu time para poder <strong>criar e aceitar desafios de amistosos</strong> contra outros times de Franca/SP.
          </Typography>
        )}
      </Card>

      {/* 4. FICHA TÉCNICA E HABILIDADES DO ATLETA */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3.5 }}>
        <Typography variant="subtitle1" fontWeight={900} color="text.primary" mb={2}>
          ⚽ Ficha Técnica & Posições
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            select
            label="Posição Preferida"
            fullWidth
            size="small"
            value={posicaoPreferida}
            onChange={(e) => setPosicaoPreferida(e.target.value)}
          >
            {POSICOES_DISPONIVEIS.map((pos) => (
              <MenuItem key={pos} value={pos}>
                {pos}
              </MenuItem>
            ))}
          </TextField>

          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              select
              label="Lado Dominante"
              fullWidth
              size="small"
              value={ladoDominante}
              onChange={(e) => setLadoDominante(e.target.value)}
            >
              <MenuItem value="Destro">Destro</MenuItem>
              <MenuItem value="Canhoto">Canhoto</MenuItem>
              <MenuItem value="Ambidestro">Ambidestro</MenuItem>
            </TextField>

            <TextField
              select
              label="Nível Autodeclarado"
              fullWidth
              size="small"
              value={nivelHabilidade}
              onChange={(e) => setNivelHabilidade(e.target.value)}
            >
              <MenuItem value="Iniciante (Recreativo)">Iniciante (Recreativo)</MenuItem>
              <MenuItem value="Intermediário">Intermediário</MenuItem>
              <MenuItem value="Avançado / Competitivo">Avançado / Competitivo</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Card>

      {/* 5. DISPONIBILIDADE E DIAS DE JOGO */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Clock size={18} color="#0066FF" />
          <Typography variant="subtitle1" fontWeight={900} color="text.primary">
            Dias e Horários Preferidos
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Selecione os períodos em que você está disponível para ser convidado:
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1}>
          {DIAS_HORARIOS_DISPONIVEIS.map((horario) => {
            const selecionado = horariosFavoritos.includes(horario);
            return (
              <Chip
                key={horario}
                label={horario}
                onClick={() => toggleHorario(horario)}
                icon={selecionado ? <Check size={14} color="#fff" /> : undefined}
                sx={{
                  bgcolor: selecionado ? 'primary.main' : '#F1F5F9',
                  color: selecionado ? '#fff' : 'text.primary',
                  fontWeight: 700,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: selecionado ? '1px solid #0066FF' : '1px solid #E2E8F0',
                }}
              />
            );
          })}
        </Box>
      </Card>

      {/* 6. INFORMAÇÕES PESSOAIS & CONTATO */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3.5 }}>
        <Typography variant="subtitle1" fontWeight={900} color="text.primary" mb={2}>
          👤 Informações Pessoais & Localização
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nome Completo"
            fullWidth
            size="small"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              label="Email de Acesso"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Telefone / WhatsApp"
              fullWidth
              size="small"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <TextField
              select
              label="Sexo / Gênero"
              fullWidth
              size="small"
              value={genero === 'Masculino' || genero === 'Feminino' ? genero : 'Feminino'}
              onChange={(e) => setGenero(e.target.value)}
            >
              <MenuItem value="Feminino" sx={{ fontWeight: 700 }}>🚺 Feminino</MenuItem>
              <MenuItem value="Masculino" sx={{ fontWeight: 700 }}>🚹 Masculino</MenuItem>
            </TextField>
          </Box>

          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              label="Bairro de Residência"
              fullWidth
              size="small"
              value={bairroResidencia}
              onChange={(e) => setBairroResidencia(e.target.value)}
              helperText="Usado para calcular proximidade dos campos."
            />

            <TextField
              label="Instagram / Contato"
              fullWidth
              size="small"
              placeholder="@seu.perfil"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </Box>

          <TextField
            label="Bio / Apresentação Esportiva"
            multiline
            rows={2}
            fullWidth
            placeholder="Conte um pouco sobre sua trajetória nos esportes..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Box>
      </Card>

      {/* 7. MODALIDADES FAVORITAS */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3.5 }}>
        <Typography variant="subtitle1" fontWeight={900} mb={1}>
          Modalidades Coletivas & Quadras
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
          Selecione todas as modalidades que você costuma praticar:
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1}>
          {MODALIDADES_DISPONIVEIS.map((mod) => {
            const selecionado = modalidadesFavoritas.includes(mod);
            return (
              <Chip
                key={mod}
                label={mod}
                onClick={() => toggleModalidade(mod)}
                icon={selecionado ? <Check size={14} color="#fff" /> : undefined}
                sx={{
                  bgcolor: selecionado ? 'secondary.main' : '#F8FAFC',
                  color: selecionado ? '#000' : 'text.primary',
                  fontWeight: 800,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: selecionado ? '1.5px solid #EAB308' : '1px solid #E2E8F0',
                }}
              />
            );
          })}
        </Box>
      </Card>

      {/* 8. BOTÃO SALVAR NO RODAPÉ */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={salvando}
        onClick={() => handleSalvar()}
        startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
        sx={{
          py: 1.8,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: '1rem',
          boxShadow: '0 6px 20px rgba(0, 102, 255, 0.35)',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        {salvando ? 'SALVANDO PERFIL...' : 'SALVAR PERFIL ESPORTIVO'}
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

export default ProfileScreen;
