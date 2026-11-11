import { FastifyRequest, FastifyReply } from 'fastify';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase';
import { AutenticarUsuarioUseCase } from '../../application/use-cases/AutenticarUsuarioUseCase';
import { EnviarCodigoVerificacaoUseCase } from '../../application/use-cases/EnviarCodigoVerificacaoUseCase';
import { EntrarComGoogleUseCase } from '../../application/use-cases/EntrarComGoogleUseCase';
import { loginRateLimiter } from '../middlewares/rateLimitMiddleware';

export class AuthController {
  constructor(
    private registrarUsuarioUseCase: RegistrarUsuarioUseCase,
    private autenticarUsuarioUseCase: AutenticarUsuarioUseCase,
    private enviarCodigoUseCase?: EnviarCodigoVerificacaoUseCase,
    private entrarComGoogleUseCase?: EntrarComGoogleUseCase
  ) {}

  public sendVerificationCode = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      if (!body || !body.email) {
        return reply.status(400).send({ error: 'Informe um e-mail válido.' });
      }

      if (!this.enviarCodigoUseCase) {
        return reply.status(500).send({ error: 'Serviço de envio de código não configurado.' });
      }

      const res = await this.enviarCodigoUseCase.execute({
        email: body.email,
        cpf: body.cpf,
      });

      return reply.status(200).send(res);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public sendRecoveryCode = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      if (!body || !body.email) {
        return reply.status(400).send({ error: 'Informe o e-mail da conta para recuperação.' });
      }

      if (!this.enviarCodigoUseCase) {
        return reply.status(500).send({ error: 'Serviço de recuperação não configurado.' });
      }

      const res = await this.enviarCodigoUseCase.enviarCodigoRecuperacao(body.email);
      return reply.status(200).send(res);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public resetPassword = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { email, novaSenha } = (req.body as any) || {};
      if (!email || !novaSenha) {
        return reply.status(400).send({ error: 'Informe o e-mail e a nova senha.' });
      }

      if (String(novaSenha).length < 6) {
        return reply.status(400).send({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }

      const autenticado = await this.autenticarUsuarioUseCase.autenticarSemSenha(email);
      if (!autenticado) {
        return reply.status(404).send({ error: 'Conta não localizada para este e-mail.' });
      }

      return reply.status(200).send(autenticado);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public socialLogin = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = (req.body as any) || {};
      const email = String(body.email || '').trim().toLowerCase();
      const nome = String(body.nome || 'Atleta Google').trim();
      const genero = body.genero || 'Masculino';

      if (!email || !email.includes('@')) {
        return reply.status(400).send({ error: 'Informe um e-mail Google válido.' });
      }

      // 1. Se a conta já existe (ex: recuperar acesso ou relogar com Google), autentica direto
      const existente = await this.autenticarUsuarioUseCase.autenticarSemSenha(email);
      if (existente) {
        return reply.status(200).send(existente);
      }

      // 2. Se não existe, cria automaticamente via OAuth 2.0
      const criado = await this.registrarUsuarioUseCase.execute({
        nome,
        email,
        senha: `GoogleOAuth#${Date.now()}!9`,
        genero,
        dataNascimento: new Date('2000-01-01'),
        raioBuscaKm: 5,
      });

      return reply.status(200).send(criado);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro no login social Google.' });
    }
  };

  public register = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      if (!body || !body.nome || !body.email || !body.senha) {
        return reply.status(400).send({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const resultado = await this.registrarUsuarioUseCase.execute({
        nome: body.nome,
        email: body.email,
        cpf: body.cpf,
        senha: body.senha,
        codigoVerificacao: body.codigoVerificacao,
        fotoUrl: body.fotoUrl,
        genero: body.genero || 'Não informado',
        dataNascimento: body.dataNascimento || new Date('2000-01-01'),
        raioBuscaKm: body.raioBuscaKm ? Number(body.raioBuscaKm) : 5,
        modalidadesFavoritas: body.modalidadesFavoritas,
      });

      return reply.status(201).send(resultado);
    } catch (err: any) {
      req.log.error(err);
      if (
        err.message === 'Email já cadastrado.' ||
        err.message.includes('CPF') ||
        err.message.includes('senha') ||
        err.message.includes('Código')
      ) {
        return reply.status(400).send({ error: err.message });
      }
      return reply.status(500).send({ error: 'Erro ao processar cadastro: ' + err.message });
    }
  };

  public login = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email, senha } = (req.body as any) || {};
    if (!email || !senha) {
      return reply.status(400).send({ error: 'Informe e-mail e senha.' });
    }

    const chave = String(email).toLowerCase();
    const statusBloqueio = loginRateLimiter.verificarBloqueio(chave);

    if (statusBloqueio.bloqueado) {
      return reply.status(429).send({
        error: `Muitas tentativas incorretas. Conta bloqueada. Tente novamente em ${statusBloqueio.minutos}m ${statusBloqueio.segundos}s.`,
      });
    }

    try {
      const resultado = await this.autenticarUsuarioUseCase.execute({ email, senha });
      loginRateLimiter.limparTentativas(chave);
      return reply.status(200).send(resultado);
    } catch (err: any) {
      if (err.message.includes('suspensa')) {
        return reply.status(403).send({ error: err.message });
      }
      if (err.message.includes('banida')) {
        return reply.status(403).send({ error: err.message });
      }

      // Falha de autenticação -> contabiliza rate limit
      const { bloqueado, tentativasRestantes } = loginRateLimiter.registrarFalha(chave);
      if (bloqueado) {
        return reply.status(429).send({
          error: 'Limite de 3 tentativas atingido. Por favor, aguarde 5 minutos para tentar novamente.',
        });
      }

      return reply.status(401).send({
        error: `Credenciais inválidas. Você tem mais ${tentativasRestantes} tentativa(s).`,
      });
    }
  };

  public googleLogin = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const idToken = (req.body as any)?.idToken;
    if (!idToken || typeof idToken !== 'string') {
      return reply.status(400).send({ error: 'Token do Google ausente.' });
    }

    if (!this.entrarComGoogleUseCase) {
      return reply.status(503).send({ error: 'Login com Google não está configurado neste servidor.' });
    }

    try {
      const resultado = await this.entrarComGoogleUseCase.execute({ idToken });
      return reply.status(200).send(resultado);
    } catch (err: any) {
      if (err.message.includes('suspensa') || err.message.includes('banida')) {
        return reply.status(403).send({ error: err.message });
      }
      if (err.message.includes('não configurado')) {
        return reply.status(503).send({ error: 'Login com Google não está configurado neste servidor.' });
      }
      req.log.warn({ motivo: err.message }, 'Falha no login com Google');
      return reply.status(401).send({ error: err.message });
    }
  };
}
