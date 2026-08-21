import { FastifyRequest, FastifyReply } from 'fastify';
import { ConsultarHistoricoAuditoriaUseCase } from '../../application/use-cases/ConsultarHistoricoAuditoriaUseCase';

export class AuditoriaController {
  constructor(private consultarHistoricoAuditoriaUseCase: ConsultarHistoricoAuditoriaUseCase) {}

  public listByRecord = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { tabela, id } = req.params as { tabela: string; id: string };
      const logs = await this.consultarHistoricoAuditoriaUseCase.execute({
        tabelaNome: tabela,
        registroId: id,
      });

      return reply.status(200).send({
        data: logs.map((l) => ({
          id: l.id,
          tabelaNome: l.tabelaNome,
          registroId: l.registroId,
          operacao: l.operacao,
          usuarioId: l.usuarioId,
          dadosAnteriores: l.dadosAnteriores,
          dadosNovos: l.dadosNovos,
          camposAlterados: l.camposAlterados,
          criadoEm: l.criadoEm,
        })),
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao consultar histórico de auditoria: ' + err.message });
    }
  };

  public listRecent = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = req.query as { limit?: string };
      const limite = query?.limit ? parseInt(query.limit, 10) : 50;

      const logs = await this.consultarHistoricoAuditoriaUseCase.execute({
        limite,
      });

      return reply.status(200).send({
        data: logs.map((l) => ({
          id: l.id,
          tabelaNome: l.tabelaNome,
          registroId: l.registroId,
          operacao: l.operacao,
          usuarioId: l.usuarioId,
          dadosAnteriores: l.dadosAnteriores,
          dadosNovos: l.dadosNovos,
          camposAlterados: l.camposAlterados,
          criadoEm: l.criadoEm,
        })),
      });
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: 'Erro ao consultar auditoria recente: ' + err.message });
    }
  };
}
