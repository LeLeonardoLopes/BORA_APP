import { FastifyRequest, FastifyReply } from 'fastify';
import { EnviarMensagemChatUseCase } from '../../application/use-cases/EnviarMensagemChatUseCase';
import { ListarMensagensChatUseCase } from '../../application/use-cases/ListarMensagensChatUseCase';

export class ChatController {
  constructor(
    private enviarMensagemChatUseCase: EnviarMensagemChatUseCase,
    private listarMensagensChatUseCase: ListarMensagensChatUseCase
  ) {}

  public listMessages = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id: partidaId } = req.params as { id: string };
      const mensagens = await this.listarMensagensChatUseCase.execute(partidaId);

      return reply.status(200).send({
        data: mensagens.map((m) => ({
          id: m.id,
          partidaId: m.partidaId,
          usuarioId: m.usuarioId,
          usuarioNome: m.usuarioNome,
          usuarioFoto: m.usuarioFoto,
          texto: m.texto,
          criadoEm: m.criadoEm,
        })),
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao carregar mensagens: ' + err.message });
    }
  };

  public sendMessage = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id: partidaId } = req.params as { id: string };
      const body = req.body as any;
      const usuarioId = body?.usuarioId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
      const texto = body?.texto || body?.conteudo || body?.mensagem;

      if (!texto || String(texto).trim().length === 0) {
        return reply.status(400).send({ error: 'O conteúdo da mensagem é obrigatório.' });
      }

      const mensagem = await this.enviarMensagemChatUseCase.execute({
        partidaId,
        usuarioId,
        texto: String(texto),
        usuarioNome: body?.usuarioNome,
        usuarioFoto: body?.usuarioFoto,
      });

      return reply.status(201).send({
        data: {
          id: mensagem.id,
          partidaId: mensagem.partidaId,
          usuarioId: mensagem.usuarioId,
          usuarioNome: mensagem.usuarioNome,
          usuarioFoto: mensagem.usuarioFoto,
          texto: mensagem.texto,
          criadoEm: mensagem.criadoEm,
        },
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };
}
