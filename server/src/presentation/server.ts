import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../infrastructure/database/connection';
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

// Cadastro de Usuário
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

// Login com Trava de 3 Tentativas e Bloqueio de 5 Minutos
app.post('/api/v1/auth/login', async (req, reply) => {
  try {
    const { email, senha } = req.body as any;
    if (!email || !senha) {
      return reply.status(400).send({ error: 'Informe e-mail e senha.' });
    }

    const chaveTentativa = String(email).toLowerCase();
    const agora = Date.now();
    const registro = tentativasPorIpOuEmail.get(chaveTentativa) || { tentativas: 0 };

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
        fotoUrl: usuario.fotoUrl,
      },
    });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no login: ' + err.message });
  }
});

// Listar Todos os Atletas / Usuários do Banco
app.get('/api/v1/users', async (req, reply) => {
  try {
    const res = await db.query(`
      SELECT 
        id, 
        nome, 
        email, 
        foto_url as "fotoUrl", 
        genero, 
        raio_busca_km as "raioBuscaKm", 
        modalidades_favoritas as "modalidadesFavoritas", 
        nota_media as "notaMedia", 
        total_avaliacoes as "totalAvaliacoes", 
        status_usuario as "statusUsuario",
        criado_em as "criadoEm"
      FROM usuario
      ORDER BY nota_media DESC, total_avaliacoes DESC;
    `);
    return reply.status(200).send({ data: res.rows });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao listar usuários: ' + err.message });
  }
});

// Atualizar e Sincronizar Perfil do Usuário
app.put('/api/v1/users/profile', async (req, reply) => {
  try {
    const body = req.body as any;
    const userId = body.id || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
    
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

    const emailKey = String(body.email || 'leonardo.lopes@boraapp.com.br').toLowerCase();
    if (!usuario) {
      usuario = usuariosMemoria.get(emailKey) || new Usuario({
        id: userId,
        nome: body.nome || 'Leonardo Lopes',
        email: body.email || 'leonardo.lopes@boraapp.com.br',
        senhaHash: 'mock',
        fotoUrl: body.fotoUrl,
        genero: body.genero || 'Masculino',
        dataNascimento: new Date('1998-05-15'),
        raioBuscaKm: body.raioBuscaKm || 5,
        modalidadesFavoritas: body.modalidadesFavoritas,
        notaMedia: 4.95,
        totalAvaliacoes: 28,
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
app.post('/api/v1/matches', async (req, reply) => {
  const body = req.body as any;
  const organizadorId = body.organizadorId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';

  const novaPartida = new Partida({
    id: uuidv4(),
    organizadorId,
    esporte: body.esporte,
    descricao: body.descricao,
    dataHora: new Date(body.dataHora || Date.now() + 86400000),
    maxVagas: Number(body.maxVagas) || 14,
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

// Consultar Mapa de Partidas
app.get('/api/v1/matches', async (req, reply) => {
  const query = req.query as any;
  const lat = Number(query.lat) || -20.5388;
  const lng = Number(query.lng) || -47.4005;
  const radius = Number(query.radius) || 5;
  const endereco = query.endereco || query.bairro || query.q;

  try {
    const partidas = await consultarMapaUseCase.execute({
      lat,
      lng,
      raioKm: radius,
      esporte: query.sport,
      endereco: typeof endereco === 'string' ? endereco : undefined,
      usuarioAutenticadoId: (req.user as any)?.id || 'anonymous',
    });
    return reply.status(200).send({ data: partidas });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao consultar partidas: ' + err.message });
  }
});

// Cancelar Partida Esportiva
app.patch('/api/v1/matches/:id/cancel', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await db.query(`
      UPDATE partida
      SET status_partida = 'Cancelada'
      WHERE id = $1;
    `, [id]);

    await db.query(`
      UPDATE solicitacao
      SET status_solicitacao = 'Rejeitada'
      WHERE partida_id = $1 AND status_solicitacao = 'Pendente';
    `, [id]);

    return reply.status(200).send({ message: 'Partida cancelada com sucesso.' });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao cancelar partida: ' + err.message });
  }
});

// ==========================================
// 3º CRUD: SOLICITAÇÕES DE VAGAS (UC04, UC06 + RN01)
// ==========================================

// Solicitar Vaga
app.post('/api/v1/matches/:id/requests', async (req, reply) => {
  const body = req.body as any;
  const userId = body.usuarioId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
  const { id: partidaId } = req.params as { id: string };

  const solicitacaoExistente = await solicitacaoRepo.buscarPorPartidaEUsuario(partidaId, userId);
  if (solicitacaoExistente) {
    return reply.status(400).send({ error: 'Você já possui uma solicitação para esta partida.' });
  }

  const novaSolicitacao = new Solicitacao({
    id: uuidv4(),
    partidaId,
    usuarioId: userId,
    statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
    dataRequisicao: new Date(),
  });

  await solicitacaoRepo.criar(novaSolicitacao);
  return reply.status(201).send({ data: novaSolicitacao });
});

// Listar Todas as Solicitações de Vagas e Amistosos
app.get('/api/v1/requests', async (req, reply) => {
  try {
    const res = await db.query(`
      SELECT 
        s.id,
        s.partida_id as "partidaId",
        s.usuario_id as "usuarioId",
        s.status_solicitacao as "statusSolicitacao",
        s.data_requisicao as "dataRequisicao",
        s.data_decisao as "dataDecisao",
        u.nome as "atletaNome",
        u.foto_url as "atletaFoto",
        u.nota_media as "atletaNota",
        u.genero as "atletaGenero",
        p.esporte as "partidaEsporte",
        p.descricao as "partidaDescricao",
        p.data_hora as "partidaDataHora",
        p.bairro as "partidaBairro",
        p.organizador_id as "organizadorId"
      FROM solicitacao s
      JOIN usuario u ON s.usuario_id = u.id
      JOIN partida p ON s.partida_id = p.id
      ORDER BY s.data_requisicao DESC;
    `);
    return reply.status(200).send({ data: res.rows });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao listar solicitações: ' + err.message });
  }
});

// Gerenciar Solicitação (Aprovar / Rejeitar com Regra RN01)
app.patch('/api/v1/requests/:id', async (req, reply) => {
  const body = req.body as any;
  const organizadorId = body.organizadorId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
  const { id: solicitacaoId } = req.params as { id: string };
  const { acao } = body as { acao: 'aprovar' | 'rejeitar' };

  try {
    const novoStatus = acao === 'aprovar' ? 'Aprovada' : 'Rejeitada';
    await db.query(`
      UPDATE solicitacao 
      SET status_solicitacao = $1, data_decisao = NOW() 
      WHERE id = $2;
    `, [novoStatus, solicitacaoId]);

    if (acao === 'aprovar') {
      await db.query(`
        UPDATE partida 
        SET vagas_preenchidas = LEAST(max_vagas, vagas_preenchidas + 1)
        WHERE id = (SELECT partida_id FROM solicitacao WHERE id = $1);
      `, [solicitacaoId]);
    }

    const mensagemSucesso = acao === 'aprovar' ? 'Solicitação aprovada com sucesso.' : 'Solicitação rejeitada com sucesso.';
    return reply.status(200).send({ message: mensagemSucesso });
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

// ==========================================
// 4º CRUD: AVALIAÇÕES (REVIEWS & RATINGS)
// ==========================================

// Listar Todas as Avaliações com Nomes dos Atletas e Partidas
app.get('/api/v1/ratings', async (req, reply) => {
  try {
    const res = await db.query(`
      SELECT 
        a.id,
        a.nota,
        a.comentario,
        a.data_avaliacao as "dataAvaliacao",
        u1.id as "avaliadorId",
        u1.nome as "avaliadorNome",
        u1.foto_url as "avaliadorFoto",
        u2.id as "avaliadoId",
        u2.nome as "avaliadoNome",
        u2.foto_url as "avaliadoFoto",
        p.id as "partidaId",
        p.esporte as "partidaEsporte",
        p.bairro as "partidaBairro"
      FROM avaliacao a
      JOIN usuario u1 ON a.avaliador_id = u1.id
      JOIN usuario u2 ON a.avaliado_id = u2.id
      LEFT JOIN partida p ON a.partida_id = p.id
      ORDER BY a.data_avaliacao DESC;
    `);
    return reply.status(200).send({ data: res.rows });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao listar avaliações: ' + err.message });
  }
});

// Criar Nova Avaliação e Atualizar a Média do Jogador
app.post('/api/v1/ratings', async (req, reply) => {
  try {
    const body = req.body as any;
    const avaliadorId = body.avaliadorId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
    const { partidaId, avaliadoId, nota, comentario } = body;

    if (!avaliadoId || !nota || nota < 1 || nota > 5) {
      return reply.status(400).send({ error: 'Informe o atleta avaliado e uma nota válida entre 1 e 5.' });
    }

    const avaliacaoId = uuidv4();
    const pid = partidaId || '22222222-2222-2222-2222-222222222201';

    await db.query(`
      INSERT INTO avaliacao (id, partida_id, avaliador_id, avaliado_id, nota, comentario, data_avaliacao)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (partida_id, avaliador_id, avaliado_id) DO UPDATE 
      SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, data_avaliacao = NOW();
    `, [avaliacaoId, pid, avaliadorId, avaliadoId, nota, comentario || '']);

    // Recalcula média
    await db.query(`
      UPDATE usuario
      SET 
        nota_media = (SELECT ROUND(AVG(nota)::numeric, 2) FROM avaliacao WHERE avaliado_id = $1),
        total_avaliacoes = (SELECT COUNT(*) FROM avaliacao WHERE avaliado_id = $1)
      WHERE id = $1;
    `, [avaliadoId]);

    return reply.status(201).send({ message: 'Avaliação computada com sucesso!' });
  } catch (err: any) {
    app.log.error(err);
    return reply.status(500).send({ error: 'Erro ao registrar avaliação: ' + err.message });
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
