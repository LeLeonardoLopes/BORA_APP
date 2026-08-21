import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { UsuarioController } from '../controllers/UsuarioController';

export function createUserRoutes(usuarioController: UsuarioController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/api/v1/users', usuarioController.listAll);
    app.put('/api/v1/users/profile', usuarioController.updateProfile);
  };
}
