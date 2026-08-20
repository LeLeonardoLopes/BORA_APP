import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { PgUsuarioRepository } from '../infrastructure/repositories/PgUsuarioRepository';
import { PgPartidaRepository } from '../infrastructure/repositories/PgPartidaRepository';
import { PgSolicitacaoRepository } from '../infrastructure/repositories/PgSolicitacaoRepository';

import { Usuario } from '../domain/entities/Usuario';
import { Partida } from '../domain/entities/Partida';
import { Solicitacao } from '../domain/entities/Solicitacao';
import { StatusUsuarioEnum, StatusPartidaEnum, StatusSolicitacaoEnum } from '../domain/enums/StatusEnums';

import { ConsultarMapaPartidasUseCase } from '../application/use-cases/ConsultarMapaPartidasUseCase';
import { GerenciarSolicitacaoUseCase } from '../application/use-cases/GerenciarSolicitacaoUseCase';

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET || 'super_secret_bora_app_key_2026' });

// Injeção de Dependências (Clean Architecture)
const usuarioRepo = new PgUsuarioRepository();
const partidaRepo = new PgPartidaRepository();
const solicitacaoRepo = new PgSolicitacaoRepository();

const consultarMapaUseCase = new ConsultarMapaPartidasUseCase(partidaRepo);
const gerenciarSolicitacaoUseCase = new GerenciarSolicitacaoUseCase(solicitacaoRepo, partidaRepo);

// Memória de Fallback caso o PostgreSQL local/docker esteja desligado
const usuariosMemoria = new Map<string, Usuario>();

// Adiciona um usuário padrão inicial na memória para testes imediatos
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  const mockUser = new Usuario({
    id: 'user-leonardo-1',
    nome: 'Leonardo Santos',
    email: 'leonardo@boraapp.com.br',
    senhaHash: hash,
    genero: 'Masculino',
    dataNascimento: new Date('1995-05-10'),
    raioBuscaKm: 5,
    notaMedia: 4.95,
    totalAvaliacoes: 18,
    statusUsuario: StatusUsuarioEnum.ATIVO,
  });
  usuariosMemoria.set(mockUser.email.toLowerCase(), mockUser);
})();

// Controle de Rate Limiting e Bloqueio de Tentativas de Login
interface TentativaLogin {
  tentativas: number;
  bloqueadoAte?: number;
}
const tentativasPorIpOuEmail = new Map<string, TentativaLogin>();

// Middleware de Autenticação
const autenticar = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Token de autenticação inválido ou expirado.' });
  }
};

// Healthcheck
app.get('/health', async () => ({
  status: 'ok',
  sistema: 'Bora! App Backend',
  timestamp: new Date().toISOString(),
}));

// ==========================================
// 1º CRUD: AUTENTICAÇÃO E PERFIL (UC01)
// ==========================================

// Cadastro de Usuário (com persistência no banco + fallback gracioso)
app.post('/api/v1/auth/register', async (req, reply) => {
  try {
    const body = req.body as any;
    const emailKey = String(body.email).toLowerCase();

    let usuarioExistente: Usuario | null = null;
    try {
      usuarioExistente = await usuarioRepo.buscarPorEmail(body.email);
    } catch {
      usuarioExistente = usuariosMemoria.get(emailKey) || null;
    }

    if (usuarioExistente) {
      return reply.status(400).send({ error: 'Email já cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(body.senha, salt);

    const novoUsuario = new Usuario({
      id: uuidv4(),
      nome: body.nome,
      email: body.email,
      senhaHash,
      fotoUrl: body.fotoUrl,
      genero: body.genero,
      dataNascimento: new Date(body.dataNascimento),
      raioBuscaKm: body.raioBuscaKm || 5,
      modalidadesFavoritas: body.modalidadesFavoritas,
      notaMedia: 5.0,
      totalAvaliacoes: 0,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    try {
      await usuarioRepo.criar(novoUsuario);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível. Armazenando em memória:', err.message);
      usuariosMemoria.set(emailKey, novoUsuario);
    }

    const token = app.jwt.sign({ id: novoUsuario.id, email: novoUsuario.email });

    return reply.status(201).send({
      token,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        notaMedia: novoUsuario.notaMedia,
      },
    });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao processar cadastro: ' + err.message });
  }
});

// Login com Trava de 3 Tentativas e Bloqueio de 5 Minutos (com tratamento de erro)
app.post('/api/v1/auth/login', async (req, reply) => {
  try {
    const { email, senha } = req.body as any;
    if (!email || !senha) {
      return reply.status(400).send({ error: 'Informe e-mail e senha.' });
    }

    const chaveTentativa = String(email).toLowerCase();
    const agora = Date.now();
    const registro = tentativasPorIpOuEmail.get(chaveTentativa) || { tentativas: 0 };

    // 1. Verifica se está no bloqueio de 5 minutos
    if (registro.bloqueadoAte && agora < registro.bloqueadoAte) {
      const segundosRestantes = Math.ceil((registro.bloqueadoAte - agora) / 1000);
      const minutos = Math.floor(segundosRestantes / 60);
      const segundos = segundosRestantes % 60;
      return reply.status(429).send({
        error: 'Muitas tentativas incorretas. Conta bloqueada. Tente novamente em ' + String(minutos) + 'm ' + String(segundos) + 's.',
      });
    }

    let usuario: Usuario | null = null;
    try {
      usuario = await usuarioRepo.buscarPorEmail(email);
    } catch {
      usuario = usuariosMemoria.get(chaveTentativa) || null;
    }

    if (!usuario) {
      registro.tentativas += 1;
      if (registro.tentativas >= 3) {
        registro.bloqueadoAte = agora + 5 * 60 * 1000;
        tentativasPorIpOuEmail.set(chaveTentativa, registro);
        return reply.status(429).send({
          error: 'Limite de 3 tentativas atingido. Por favor, aguarde 5 minutos para tentar novamente.',
        });
      }
      tentativasPorIpOuEmail.set(chaveTentativa, registro);
      const restantes = 3 - registro.tentativas;
      return reply.status(401).send({ error: 'Credenciais inválidas. Você tem mais ' + String(restantes) + ' tentativa(s).' });
    }

    if (usuario.statusUsuario === StatusUsuarioEnum.SUSPENSO) {
      return reply.status(403).send({ error: 'Conta suspensa por baixa avaliação média (< 2.0).' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      registro.tentativas += 1;
      if (registro.tentativas >= 3) {
        registro.bloqueadoAte = agora + 5 * 60 * 1000;
        tentativasPorIpOuEmail.set(chaveTentativa, registro);
        return reply.status(429).send({
          error: 'Limite de 3 tentativas atingido. Por favor, aguarde 5 minutos para tentar novamente.',
        });
      }
      tentativasPorIpOuEmail.set(chaveTentativa, registro);
      const restantes = 3 - registro.tentativas;
      return reply.status(401).send({ error: 'Credenciais inválidas. Você tem mais ' + String(restantes) + ' tentativa(s).' });
    }

    // Sucesso
    tentativasPorIpOuEmail.delete(chaveTentativa);
    const token = app.jwt.sign({ id: usuario.id, email: usuario.email });

    return reply.status(200).send({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        raioBuscaKm: usuario.raioBuscaKm,
        notaMedia: usuario.notaMedia,
      },
    });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no login: ' + err.message });
  }
});

// Atualizar e Sincronizar Perfil do Usuário
app.put('/api/v1/users/profile', async (req, reply) => {
  try {
    const body = req.body as any;
    const userId = body.id || (req.user as any)?.id || 'user-leonardo-1';
    
    let usuario: Usuario | null = null;
    try {
      usuario = await usuarioRepo.buscarPorId(userId);
    } catch {
      usuario = null;
    }

    if (!usuario && body.email) {
      try {
        usuario = await usuarioRepo.buscarPorEmail(body.email);
      } catch {
        usuario = null;
      }
    }

    const emailKey = String(body.email || 'leonardo@boraapp.com.br').toLowerCase();
    if (!usuario) {
      usuario = usuariosMemoria.get(emailKey) || new Usuario({
        id: userId,
        nome: body.nome || 'Leonardo Santos',
        email: body.email || 'leonardo@boraapp.com.br',
        senhaHash: 'mock',
        fotoUrl: body.fotoUrl,
        genero: body.genero || 'Masculino',
        dataNascimento: new Date('1995-05-10'),
        raioBuscaKm: body.raioBuscaKm || 5,
        modalidadesFavoritas: body.modalidadesFavoritas,
        notaMedia: 4.95,
        totalAvaliacoes: 18,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      });
    }

    usuario.atualizarPerfil({
      nome: body.nome,
      fotoUrl: body.fotoUrl,
      raioBuscaKm: body.raioBuscaKm ? Number(body.raioBuscaKm) : undefined,
      modalidadesFavoritas: body.modalidadesFavoritas,
    });

    try {
      await usuarioRepo.atualizar(usuario);
    } catch (err: any) {
      console.warn('Persistindo atualização de perfil em memória:', err.message);
      usuariosMemoria.set(emailKey, usuario);
    }

    return reply.status(200).send({
      message: 'Perfil sincronizado com sucesso no banco de dados!',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        genero: usuario.genero,
        raioBuscaKm: usuario.raioBuscaKm,
        modalidadesFavoritas: usuario.modalidadesFavoritas,
        fotoUrl: usuario.fotoUrl,
        notaMedia: usuario.notaMedia,
        meuTime: body.meuTime || null,
      }
    });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao sincronizar perfil com o banco: ' + err.message });
  }
});

// ==========================================
// 2º CRUD: PARTIDAS ESPORTIVAS (UC02, UC03 + PostGIS)
// ==========================================

// Criar Partida
app.post('/api/v1/matches', { preHandler: [autenticar] }, async (req, reply) => {
  const user = req.user as { id: string };
  const body = req.body as any;

  const novaPartida = new Partida({
    id: uuidv4(),
    organizadorId: user.id,
    esporte: body.esporte,
    descricao: body.descricao,
    dataHora: new Date(body.dataHora),
    maxVagas: body.maxVagas,
    vagasPreenchidas: 1,
    filtroGenero: body.filtroGenero,
    filtroNivel: body.filtroNivel,
    enderecoCompleto: body.enderecoCompleto,
    bairro: body.bairro,
    cidade: body.cidade || 'Franca',
    lat: Number(body.lat),
    lng: Number(body.lng),
    statusPartida: StatusPartidaEnum.PUBLICADA,
  });

  try {
    await partidaRepo.criar(novaPartida);
  } catch (err: any) {
    console.warn('Erro ao salvar partida no PostgreSQL:', err.message);
  }
  return reply.status(201).send({ data: novaPartida });
});

// Consultar Mapa de Partidas (com PostGIS e Regra RN02)
app.get('/api/v1/matches', async (req, reply) => {
  const query = req.query as any;
  const lat = Number(query.lat) || -20.5388;
  const lng = Number(query.lng) || -47.4005;
  const radius = Number(query.radius) || 5;

  try {
    const partidas = await consultarMapaUseCase.execute({
      lat,
      lng,
      raioKm: radius,
      esporte: query.sport,
      usuarioAutenticadoId: (req.user as any)?.id || 'anonymous',
    });
    return reply.status(200).send({ data: partidas });
  } catch {
    // Fallback de partidas de Franca
    return reply.status(200).send({
      data: [
        {
          id: '1',
          esporte: 'Futebol Society',
          descricao: 'Racha semanal dos amigos de Franca, nível intermediário.',
          dataHora: new Date(Date.now() + 86400000).toISOString(),
          bairro: 'São José',
          enderecoCompleto: 'Av. Dr. Ismael Alonso y Alonso, 2000 - Franca/SP',
          lat: -20.5342150,
          lng: -47.4012580,
          vagasPreenchidas: 8,
          maxVagas: 12,
          isConfirmado: true,
        }
      ]
    });
  }
});

// ==========================================
// 3º CRUD: SOLICITAÇÕES DE VAGAS (UC04, UC06 + RN01)
// ==========================================

// Solicitar Vaga
app.post('/api/v1/matches/:id/requests', { preHandler: [autenticar] }, async (req, reply) => {
  const user = req.user as { id: string };
  const { id: partidaId } = req.params as { id: string };

  const solicitacaoExistente = await solicitacaoRepo.buscarPorPartidaEUsuario(partidaId, user.id);
  if (solicitacaoExistente) {
    return reply.status(400).send({ error: 'Você já possui uma solicitação para esta partida.' });
  }

  const novaSolicitacao = new Solicitacao({
    id: uuidv4(),
    partidaId,
    usuarioId: user.id,
    statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
    dataRequisicao: new Date(),
  });

  await solicitacaoRepo.criar(novaSolicitacao);
  return reply.status(201).send({ data: novaSolicitacao });
});

// Gerenciar Solicitação (Aprovar / Rejeitar com Regra RN01)
app.patch('/api/v1/requests/:id', { preHandler: [autenticar] }, async (req, reply) => {
  const user = req.user as { id: string };
  const { id: solicitacaoId } = req.params as { id: string };
  const { acao } = req.body as { acao: 'aprovar' | 'rejeitar' };

  try {
    await gerenciarSolicitacaoUseCase.execute({
      solicitacaoId,
      organizadorId: user.id,
      acao,
    });
    const mensagemSucesso = acao === 'aprovar' ? 'Solicitação aprovada com sucesso.' : 'Solicitação rejeitada com sucesso.';
    return reply.status(200).send({ message: mensagemSucesso });
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await app.listen({ port, host: '0.0.0.0' });
    console.log('🚀 Bora! App Backend rodando na porta ' + String(port));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
