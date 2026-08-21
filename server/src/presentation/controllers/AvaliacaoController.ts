import { FastifyRequest, FastifyReply } from 'fastify';
import { ListarAvaliacoesUseCase } from '../../application/use-cases/ListarAvaliacoesUseCase';
import { AvaliarAtletaUseCase } from '../../application/use-cases/AvaliarAtletaUseCase';

export class AvaliacaoController {
  constructor(
    private listarAvaliacoesUseCase: ListarAvaliacoesUseCase,
    private avaliarAtletaUseCase: AvaliarAtletaUseCase
  ) {}

  public listAll = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const avaliacoes = await this.listarAvaliacoesUseCase.execute();
      return reply.status(200).send({ data: avaliacoes });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar avaliações: ' + err.message });
    }
  };

  public create = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = req.body as any;
      const avaliadorId = body?.avaliadorId || (req.user as any)?.id || '11111111-1111-1111-1111-111111111101';
      const { partidaId, avaliadoId, nota, comentario } = body;

      const resultado = await this.avaliarAtletaUseCase.execute({
        partidaId,
        avaliadorId,
        avaliadoId,
        nota: Number(nota),
        comentario,
      });

      return reply.status(201).send(resultado);
    } catch (err: any) {
      req.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  };
}
