import { LoginRateLimiter } from '../../src/presentation/middlewares/rateLimitMiddleware';

describe('Middleware: LoginRateLimiter', () => {
  let rateLimiter: LoginRateLimiter;

  beforeEach(() => {
    rateLimiter = new LoginRateLimiter();
  });

  it('deve permitir as 2 primeiras tentativas e bloquear na 3ª', () => {
    const email = 'teste@exemplo.com';

    const tentativa1 = rateLimiter.registrarFalha(email);
    expect(tentativa1.bloqueado).toBe(false);
    expect(tentativa1.tentativasRestantes).toBe(2);

    const tentativa2 = rateLimiter.registrarFalha(email);
    expect(tentativa2.bloqueado).toBe(false);
    expect(tentativa2.tentativasRestantes).toBe(1);

    const tentativa3 = rateLimiter.registrarFalha(email);
    expect(tentativa3.bloqueado).toBe(true);
    expect(tentativa3.tentativasRestantes).toBe(0);

    const statusBloqueio = rateLimiter.verificarBloqueio(email);
    expect(statusBloqueio.bloqueado).toBe(true);
    expect(statusBloqueio.minutos).toBeGreaterThanOrEqual(4);
  });

  it('deve limpar as tentativas ao efetuar login com sucesso', () => {
    const email = 'sucesso@exemplo.com';
    rateLimiter.registrarFalha(email);
    rateLimiter.limparTentativas(email);

    const status = rateLimiter.verificarBloqueio(email);
    expect(status.bloqueado).toBe(false);
  });
});
