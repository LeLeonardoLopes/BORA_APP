import { ITokenService } from '../../application/repositories/IRepositories';
import { FastifyInstance } from 'fastify';

export class FastifyJwtTokenService implements ITokenService {
  constructor(private fastifyApp: FastifyInstance) {}

  public gerarToken(payload: { id: string; email: string }): string {
    return this.fastifyApp.jwt.sign(payload);
  }
}
