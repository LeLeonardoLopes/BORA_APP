import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PartidaController } from '../controllers/PartidaController';
import { SolicitacaoController } from '../controllers/SolicitacaoController';
import { ChatController } from '../controllers/ChatController';

export function createMatchRoutes(
  partidaController: PartidaController,
  solicitacaoController: SolicitacaoController
): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.post('/api/v1/matches', partidaController.create);
    app.get('/api/v1/matches', partidaController.listMap);
    app.patch('/api/v1/matches/:id/cancel', partidaController.cancel);
    app.patch('/api/v1/matches/:id/finish', partidaController.finish);
    app.delete('/api/v1/matches/:id', partidaController.delete);
    app.post('/api/v1/matches/:id/requests', solicitacaoController.create);
  };
}
