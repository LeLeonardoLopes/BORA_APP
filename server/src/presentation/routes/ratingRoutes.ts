import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AvaliacaoController } from '../controllers/AvaliacaoController';

export function createRatingRoutes(avaliacaoController: AvaliacaoController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/api/v1/ratings', avaliacaoController.listAll);
    app.post('/api/v1/ratings', avaliacaoController.create);
  };
}
