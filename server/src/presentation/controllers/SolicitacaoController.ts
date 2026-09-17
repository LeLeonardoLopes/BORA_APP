import { FastifyRequest, FastifyReply } from 'fastify';
import { CriarSolicitacaoUseCase } from '../../application/use-cases/CriarSolicitacaoUseCase';
import { ListarSolicitacoesUseCase } from '../../application/use-cases/ListarSolicitacoesUseCase';
import { GerenciarSolicitacaoUseCase } from '../../application/use-cases/GerenciarSolicitacaoUseCase';

export class SolicitacaoController {
  constructor(
    private criarSolicitacaoUseCase: CriarSolicitacaoUseCase,
    private listarSolicitacoesUseCase: ListarSolicitacoesUseCase,
    private gerenciarSolicitacaoUseCase: GerenciarSolicitacaoUseCase
  ) {}

  public create = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const { id: partidaId } = req.params as { id: string };
      const usuarioId = body?.usuarioId || (req.user as any)?.id || (req.headers['x-user-id'] as string) || (req.query as any)?.usuarioId || '11111111-1111-1111-1111-111111111101';

      const solicitacao = await this.criarSolicitacaoUseCase.execute({
        partidaId,
        usuarioId,
      });

      return reply.status(201).send({ data: solicitacao });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };

  public listAll = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const solicitacoes = await this.listarSolicitacoesUseCase.execute();
      return reply.status(200).send({ data: solicitacoes });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar solicitações: ' + err.message });
    }
  };

  public manage = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const { id: solicitacaoId } = req.params as { id: string };
      const organizadorId = body?.organizadorId || (req.user as any)?.id || (req.headers['x-user-id'] as string) || (req.query as any)?.organizadorId || '11111111-1111-1111-1111-111111111101';
      const acao = body?.acao as 'aprovar' | 'rejeitar';

      if (!acao || (acao !== 'aprovar' && acao !== 'rejeitar')) {
        return reply.status(400).send({ error: 'Ação inválida. Use "aprovar" ou "rejeitar".' });
      }

      await this.gerenciarSolicitacaoUseCase.execute({
        solicitacaoId,
        organizadorId,
        acao,
      });

      const mensagemSucesso = acao === 'aprovar'
        ? 'Solicitação aprovada com sucesso.'
        : 'Solicitação rejeitada com sucesso.';

      return reply.status(200).send({ message: mensagemSucesso });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };
}
