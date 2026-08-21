import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditoriaController } from '../controllers/AuditoriaController';

export function createAuditRoutes(auditoriaController: AuditoriaController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/api/v1/audit/recent', auditoriaController.listRecent);
    app.get('/api/v1/audit/:tabela/:id', auditoriaController.listByRecord);
  };
}
