import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthController } from '../controllers/AuthController';

export function createAuthRoutes(authController: AuthController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.post('/api/v1/auth/send-code', authController.sendVerificationCode);
    app.post('/api/v1/auth/register', authController.register);
    app.post('/api/v1/auth/login', authController.login);
    app.post('/api/v1/auth/social-login', authController.socialLogin);
  };
}
