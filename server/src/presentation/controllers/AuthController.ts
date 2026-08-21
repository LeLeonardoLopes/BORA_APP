import { FastifyRequest, FastifyReply } from 'fastify';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase';
import { AutenticarUsuarioUseCase } from '../../application/use-cases/AutenticarUsuarioUseCase';
import { EnviarCodigoVerificacaoUseCase } from '../../application/use-cases/EnviarCodigoVerificacaoUseCase';
import { loginRateLimiter } from '../middlewares/rateLimitMiddleware';

export class AuthController {
  constructor(
    private registrarUsuarioUseCase: RegistrarUsuarioUseCase,
    private autenticarUsuarioUseCase: AutenticarUsuarioUseCase,
    private enviarCodigoUseCase?: EnviarCodigoVerificacaoUseCase
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

  public socialLogin = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const provider = body?.provider === 'apple' ? 'apple' : 'google';
      const email = (body?.email || `${provider}.atleta@boraapp.com.br`).trim().toLowerCase();
      const nome = body?.nome || (provider === 'apple' ? 'Atleta Apple' : 'Atleta Google');

      // Tenta autenticar se já existir
      try {
        const resultadoLogin = await this.autenticarUsuarioUseCase.execute({
          email,
          senha: `SocialAuth@2026_${provider}`,
        });
        return reply.status(200).send(resultadoLogin);
      } catch (err: any) {
        // Se usuário não existir, cadastra automaticamente com conta limpa
        if (err.message.includes('Credenciais')) {
          const resultadoCadastro = await this.registrarUsuarioUseCase.execute({
            nome,
            email,
            senha: `SocialAuth@2026_${provider}`,
            genero: 'Misto',
            dataNascimento: '2000-01-01',
            raioBuscaKm: 5,
            modalidadesFavoritas: 'Futebol Society',
          });
          return reply.status(200).send(resultadoCadastro);
        }
        throw err;
      }
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro na autenticação social: ' + err.message });
    }
  };
}
