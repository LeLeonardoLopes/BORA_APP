import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

// Infraestrutura - Repositórios & Segurança
import { PgUsuarioRepository } from '../infrastructure/repositories/PgUsuarioRepository';
import { PgPartidaRepository } from '../infrastructure/repositories/PgPartidaRepository';
import { PgSolicitacaoRepository } from '../infrastructure/repositories/PgSolicitacaoRepository';
import { PgAvaliacaoRepository } from '../infrastructure/repositories/PgAvaliacaoRepository';
import { PgMensagemChatRepository } from '../infrastructure/repositories/PgMensagemChatRepository';
import { PgAuditoriaRepository } from '../infrastructure/repositories/PgAuditoriaRepository';
import { PgCodigoVerificacaoRepository } from '../infrastructure/repositories/PgCodigoVerificacaoRepository';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher';
import { FastifyJwtTokenService } from '../infrastructure/security/JwtTokenService';
import { db } from '../infrastructure/database/connection';
import { WebSocketGateway } from '../infrastructure/websocket/WebSocketGateway';
import { MatchSchedulerWorker } from '../infrastructure/jobs/MatchSchedulerWorker';

// Aplicação - Casos de Uso
import { EnviarCodigoVerificacaoUseCase } from '../application/use-cases/EnviarCodigoVerificacaoUseCase';
import { RegistrarUsuarioUseCase } from '../application/use-cases/RegistrarUsuarioUseCase';
import { AutenticarUsuarioUseCase } from '../application/use-cases/AutenticarUsuarioUseCase';
import { ListarUsuariosUseCase } from '../application/use-cases/ListarUsuariosUseCase';
import { AtualizarPerfilUseCase } from '../application/use-cases/AtualizarPerfilUseCase';
import { CriarPartidaUseCase } from '../application/use-cases/CriarPartidaUseCase';
import { ConsultarMapaPartidasUseCase } from '../application/use-cases/ConsultarMapaPartidasUseCase';
import { CancelarPartidaUseCase } from '../application/use-cases/CancelarPartidaUseCase';
import { FinalizarPartidaUseCase } from '../application/use-cases/FinalizarPartidaUseCase';
import { SoftDeletePartidaUseCase } from '../application/use-cases/SoftDeletePartidaUseCase';
import { CriarSolicitacaoUseCase } from '../application/use-cases/CriarSolicitacaoUseCase';
import { ListarSolicitacoesUseCase } from '../application/use-cases/ListarSolicitacoesUseCase';
import { GerenciarSolicitacaoUseCase } from '../application/use-cases/GerenciarSolicitacaoUseCase';
import { ListarAvaliacoesUseCase } from '../application/use-cases/ListarAvaliacoesUseCase';
import { AvaliarAtletaUseCase } from '../application/use-cases/AvaliarAtletaUseCase';
import { EnviarMensagemChatUseCase } from '../application/use-cases/EnviarMensagemChatUseCase';
import { ListarMensagensChatUseCase } from '../application/use-cases/ListarMensagensChatUseCase';
import { ConsultarHistoricoAuditoriaUseCase } from '../application/use-cases/ConsultarHistoricoAuditoriaUseCase';
import { EntrarComGoogleUseCase } from '../application/use-cases/EntrarComGoogleUseCase';
import { AlterarSenhaUseCase } from '../application/use-cases/AlterarSenhaUseCase';
import { GoogleIdTokenVerifier } from '../infrastructure/security/GoogleIdTokenVerifier';

// Apresentação - Controladores & Rotas
import { AuthController } from './controllers/AuthController';
import { UsuarioController } from './controllers/UsuarioController';
import { PartidaController } from './controllers/PartidaController';
import { SolicitacaoController } from './controllers/SolicitacaoController';
import { AvaliacaoController } from './controllers/AvaliacaoController';
import { ChatController } from './controllers/ChatController';
import { AuditoriaController } from './controllers/AuditoriaController';

import { createAuthRoutes } from './routes/authRoutes';
import { createUserRoutes } from './routes/userRoutes';
import { createMatchRoutes } from './routes/matchRoutes';
import { createRequestRoutes } from './routes/requestRoutes';
import { createRatingRoutes } from './routes/ratingRoutes';
import { createChatRoutes } from './routes/chatRoutes';
import { createAuditRoutes } from './routes/auditRoutes';

dotenv.config();


// Diagnóstico de inicialização: deixa explícito se o PostgreSQL está acessível.
// Sem isso, os repositórios gravam em memória e a falha passa despercebida.
export async function verificarBancoDeDados(): Promise<void> {
  try {
    await db.query('SELECT 1');
    const tabelas = ['usuario', 'partida', 'solicitacao', 'avaliacao', 'chat_mensagem'];
    const res = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)",
      [tabelas]
    );
    const faltando = tabelas.filter((t) => !res.rows.some((r: any) => r.table_name === t));
    if (faltando.length > 0) {
      console.error(`\n[ERRO BANCO] Tabelas ausentes: ${faltando.join(', ')}. Rode: npm run db:setup\n`);
    } else {
      console.log('[OK] PostgreSQL conectado e tabelas encontradas.');
    }
  } catch (err: any) {
    console.error(`\n[ERRO BANCO] Não foi possível conectar ao PostgreSQL: ${err.message}\nVerifique DATABASE_URL no server/.env e se o container/serviço está rodando.\n`);
  }
}

export function buildApp(): { app: FastifyInstance; scheduler: MatchSchedulerWorker } {
  const app = Fastify({ logger: true });

  // 1. Plugins de Infraestrutura
  app.register(cors, { origin: true });
  app.register(jwt, { secret: process.env.JWT_SECRET || 'super_secret_bora_app_key_2026' });

  // 2. Gateway WebSocket (Tempo Real)
  const wsGateway = new WebSocketGateway();
  wsGateway.register(app);

  // 3. Repositórios
  const usuarioRepo = new PgUsuarioRepository();
  const partidaRepo = new PgPartidaRepository();
  const solicitacaoRepo = new PgSolicitacaoRepository(usuarioRepo, partidaRepo);
  const avaliacaoRepo = new PgAvaliacaoRepository();
  const mensagemRepo = new PgMensagemChatRepository();
  const auditoriaRepo = new PgAuditoriaRepository();
  const codigoRepo = new PgCodigoVerificacaoRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new FastifyJwtTokenService(app);

  // 4. Casos de Uso
  const enviarCodigoUseCase = new EnviarCodigoVerificacaoUseCase(usuarioRepo, codigoRepo);
  const registrarUsuarioUseCase = new RegistrarUsuarioUseCase(usuarioRepo, passwordHasher, tokenService, codigoRepo);
  const autenticarUsuarioUseCase = new AutenticarUsuarioUseCase(usuarioRepo, passwordHasher, tokenService);
  const listarUsuariosUseCase = new ListarUsuariosUseCase(usuarioRepo);
  const atualizarPerfilUseCase = new AtualizarPerfilUseCase(usuarioRepo);

  const criarPartidaUseCase = new CriarPartidaUseCase(partidaRepo);
  const consultarMapaPartidasUseCase = new ConsultarMapaPartidasUseCase(partidaRepo);
  const cancelarPartidaUseCase = new CancelarPartidaUseCase(partidaRepo, solicitacaoRepo);
  const finalizarPartidaUseCase = new FinalizarPartidaUseCase(partidaRepo, solicitacaoRepo, wsGateway);
  const softDeletePartidaUseCase = new SoftDeletePartidaUseCase(partidaRepo, solicitacaoRepo, auditoriaRepo, wsGateway);

  const criarSolicitacaoUseCase = new CriarSolicitacaoUseCase(solicitacaoRepo, partidaRepo, usuarioRepo, wsGateway);
  const listarSolicitacoesUseCase = new ListarSolicitacoesUseCase(solicitacaoRepo);
  const gerenciarSolicitacaoUseCase = new GerenciarSolicitacaoUseCase(solicitacaoRepo, partidaRepo, wsGateway);

  const listarAvaliacoesUseCase = new ListarAvaliacoesUseCase(avaliacaoRepo);
  const avaliarAtletaUseCase = new AvaliarAtletaUseCase(avaliacaoRepo, usuarioRepo);

  const enviarMensagemChatUseCase = new EnviarMensagemChatUseCase(mensagemRepo, usuarioRepo, wsGateway);
  const listarMensagensChatUseCase = new ListarMensagensChatUseCase(mensagemRepo);

  const consultarHistoricoAuditoriaUseCase = new ConsultarHistoricoAuditoriaUseCase(auditoriaRepo);

  // 5. Worker do Ciclo de Vida de Partidas
  const scheduler = new MatchSchedulerWorker(partidaRepo, finalizarPartidaUseCase);

  // 6. Controladores
  const googleVerifier = new GoogleIdTokenVerifier(process.env.GOOGLE_CLIENT_ID);
  const entrarComGoogleUseCase = new EntrarComGoogleUseCase(usuarioRepo, passwordHasher, tokenService, googleVerifier);
  const authController = new AuthController(registrarUsuarioUseCase, autenticarUsuarioUseCase, enviarCodigoUseCase, entrarComGoogleUseCase);
  const alterarSenhaUseCase = new AlterarSenhaUseCase(usuarioRepo, passwordHasher);
  const usuarioController = new UsuarioController(listarUsuariosUseCase, atualizarPerfilUseCase, alterarSenhaUseCase);
  const partidaController = new PartidaController(
    criarPartidaUseCase,
    consultarMapaPartidasUseCase,
    cancelarPartidaUseCase,
    finalizarPartidaUseCase,
    softDeletePartidaUseCase
  );
  const solicitacaoController = new SolicitacaoController(
    criarSolicitacaoUseCase,
    listarSolicitacoesUseCase,
    gerenciarSolicitacaoUseCase
  );
  const avaliacaoController = new AvaliacaoController(listarAvaliacoesUseCase, avaliarAtletaUseCase);
  const chatController = new ChatController(enviarMensagemChatUseCase, listarMensagensChatUseCase);
  const auditoriaController = new AuditoriaController(consultarHistoricoAuditoriaUseCase);

  // 7. Registro de Rotas
  app.register(createAuthRoutes(authController));
  app.register(createUserRoutes(usuarioController));
  app.register(createMatchRoutes(partidaController, solicitacaoController));
  app.register(createRequestRoutes(solicitacaoController));
  app.register(createRatingRoutes(avaliacaoController));
  app.register(createChatRoutes(chatController));
  app.register(createAuditRoutes(auditoriaController));

  // Healthcheck
  app.get('/health', async () => ({
    status: 'ok',
    sistema: 'Bora! App Backend (Fase 2 - Auditoria & Soft Delete)',
    arquitetura: 'Clean Architecture (4 Camadas) + SOLID + Universal Audit & Soft Delete',
    timestamp: new Date().toISOString(),
  }));

  return { app, scheduler };
}

const { app, scheduler } = buildApp();
export { app, scheduler };

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    console.log(`[INFO] Tentando iniciar servidor na porta ${port}...`);
    await verificarBancoDeDados();
    const address = await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Bora! App Backend rodando em ${address}`);

    // Inicia o agendador de encerramento automático de partidas
    scheduler.start();
  } catch (err: any) {
    console.error('❌ Erro ao iniciar Fastify:', err);
    process.exit(1);
  }
};

start();
