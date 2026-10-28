import { IGoogleIdentityVerifier, IdentidadeGoogle } from '../../application/repositories/IRepositories';

// Verifica o ID token emitido pelo Google Identity Services.
// Confere assinatura (pelo endpoint oficial tokeninfo), audiência (Client ID deste app),
// emissor, validade e se o e-mail foi verificado pelo Google.
export class GoogleIdTokenVerifier implements IGoogleIdentityVerifier {
  private static readonly EMISSORES_VALIDOS = ['accounts.google.com', 'https://accounts.google.com'];

  constructor(private readonly clientId: string | undefined) {}

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientId.trim().length > 0);
  }

  public async verify(idToken: string): Promise<IdentidadeGoogle> {
    if (!this.isConfigured()) {
      throw new Error('Login com Google não configurado no servidor (GOOGLE_CLIENT_ID).');
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Não foi possível confirmar sua conta Google. Tente novamente.');
    }

    const payload = (await res.json()) as Record<string, string | undefined>;

    if (payload.aud !== this.clientId) {
      throw new Error('O login Google não pertence a este aplicativo.');
    }
    if (!payload.iss || !GoogleIdTokenVerifier.EMISSORES_VALIDOS.includes(payload.iss)) {
      throw new Error('Emissor do login Google inválido.');
    }
    if (Number(payload.exp) * 1000 <= Date.now()) {
      throw new Error('Sessão do Google expirada. Tente novamente.');
    }
    if (String(payload.email_verified) !== 'true' || !payload.email) {
      throw new Error('Sua conta Google precisa ter o e-mail verificado.');
    }

    return {
      email: payload.email.trim().toLowerCase(),
      nome: (payload.name || payload.email.split('@')[0]).trim(),
      fotoUrl: payload.picture || null,
    };
  }
}
