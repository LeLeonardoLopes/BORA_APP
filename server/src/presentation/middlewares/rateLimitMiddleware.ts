import { FastifyRequest, FastifyReply } from 'fastify';

interface TentativaLogin {
  tentativas: number;
  bloqueadoAte?: number;
}

export class LoginRateLimiter {
  private tentativasPorChave = new Map<string, TentativaLogin>();
  private readonly MAX_TENTATIVAS = 3;
  private readonly TEMPO_BLOQUEIO_MS = 5 * 60 * 1000; // 5 minutos

  public verificarBloqueio(chave: string): { bloqueado: boolean; minutos?: number; segundos?: number } {
    const registro = this.tentativasPorChave.get(chave.toLowerCase());
    if (!registro || !registro.bloqueadoAte) {
      return { bloqueado: false };
    }

    const agora = Date.now();
    if (agora < registro.bloqueadoAte) {
      const segundosRestantes = Math.ceil((registro.bloqueadoAte - agora) / 1000);
      const minutos = Math.floor(segundosRestantes / 60);
      const segundos = segundosRestantes % 60;
      return { bloqueado: true, minutos, segundos };
    }

    // Período de bloqueio expirou, resetar
    this.tentativasPorChave.delete(chave.toLowerCase());
    return { bloqueado: false };
  }

  public registrarFalha(chave: string): { bloqueado: boolean; tentativasRestantes: number } {
    const chaveSanitizada = chave.toLowerCase();
    const registro = this.tentativasPorChave.get(chaveSanitizada) || { tentativas: 0 };
    registro.tentativas += 1;

    if (registro.tentativas >= this.MAX_TENTATIVAS) {
      registro.bloqueadoAte = Date.now() + this.TEMPO_BLOQUEIO_MS;
      this.tentativasPorChave.set(chaveSanitizada, registro);
      return { bloqueado: true, tentativasRestantes: 0 };
    }

    this.tentativasPorChave.set(chaveSanitizada, registro);
    return { bloqueado: false, tentativasRestantes: this.MAX_TENTATIVAS - registro.tentativas };
  }

  public limparTentativas(chave: string): void {
    this.tentativasPorChave.delete(chave.toLowerCase());
  }
}

export const loginRateLimiter = new LoginRateLimiter();

export async function rateLimitLoginMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = req.body as { email?: string };
  const chave = body?.email || req.ip;

  if (chave) {
    const statusBloqueio = loginRateLimiter.verificarBloqueio(chave);
    if (statusBloqueio.bloqueado) {
      return reply.status(429).send({
        error: `Muitas tentativas incorretas. Conta bloqueada. Tente novamente em ${statusBloqueio.minutos}m ${statusBloqueio.segundos}s.`,
      });
    }
  }
}
