import { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch (err: any) {
    return reply.status(401).send({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

export async function optionalAuthMiddleware(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch {
    // Continua sem autenticação (usuário anônimo)
  }
}
