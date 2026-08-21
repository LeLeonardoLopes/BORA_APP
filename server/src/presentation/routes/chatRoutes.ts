import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ChatController } from '../controllers/ChatController';

export function createChatRoutes(chatController: ChatController): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/api/v1/matches/:id/messages', chatController.listMessages);
    app.post('/api/v1/matches/:id/messages', chatController.sendMessage);
  };
}
