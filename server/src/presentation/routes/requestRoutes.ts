import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SolicitacaoController } from '../controllers/SolicitacaoController';

export function createRequestRoutes(solicitacaoController: SolicitacaoController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/api/v1/requests', solicitacaoController.listAll);
    app.patch('/api/v1/requests/:id', solicitacaoController.manage);
  };
}
