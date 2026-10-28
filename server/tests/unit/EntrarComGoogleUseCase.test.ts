import { EntrarComGoogleUseCase } from '../../src/application/use-cases/EntrarComGoogleUseCase';
import { GoogleIdTokenVerifier } from '../../src/infrastructure/security/GoogleIdTokenVerifier';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';
import { IUsuarioRepository, IGoogleIdentityVerifier } from '../../src/application/repositories/IRepositories';

const criarRepo = (existente: Usuario | null = null): jest.Mocked<IUsuarioRepository> => ({
  criar: jest.fn(async (u: Usuario) => u),
  buscarPorId: jest.fn(),
  buscarPorEmail: jest.fn().mockResolvedValue(existente),
  buscarPorCpf: jest.fn(),
  listarTodos: jest.fn(),
  atualizar: jest.fn(),
  softDelete: jest.fn(),
});

const hasher = { hash: jest.fn(async (s: string) => 'hash:' + s), compare: jest.fn() };
const tokens = { gerarToken: jest.fn(() => 'jwt-token') };

const verifierOk = (email = 'Atleta.Google@Gmail.com'): IGoogleIdentityVerifier => ({
  isConfigured: () => true,
  verify: jest.fn(async () => ({ email, nome: 'Atleta Google', fotoUrl: 'https://foto' })),
});

describe('EntrarComGoogleUseCase', () => {
  it('cria a conta na primeira entrada, sem senha conhecida, e devolve o token da aplicação', async () => {
    const repo = criarRepo(null);
    const useCase = new EntrarComGoogleUseCase(repo, hasher, tokens, verifierOk());

    const r = await useCase.execute({ idToken: 'abc' });

    expect(r.token).toBe('jwt-token');
    expect(repo.criar).toHaveBeenCalledTimes(1);
    const criado = repo.criar.mock.calls[0][0];
    expect(criado.email).toBe('atleta.google@gmail.com');
    expect(criado.statusUsuario).toBe(StatusUsuarioEnum.ATIVO);
    expect(hasher.hash).toHaveBeenCalledTimes(1);
    expect(String(hasher.hash.mock.calls[0][0]).length).toBeGreaterThanOrEqual(64);
  });

  it('reutiliza a conta existente com o mesmo e-mail (não duplica)', async () => {
    const existente = new Usuario({
      id: 'u1', nome: 'Já existe', email: 'atleta.google@gmail.com', senhaHash: 'h',
      genero: 'Masculino', dataNascimento: new Date('1999-01-01'), raioBuscaKm: 5,
      notaMedia: 4.5, totalAvaliacoes: 2, statusUsuario: StatusUsuarioEnum.ATIVO,
    });
    const repo = criarRepo(existente);
    const r = await new EntrarComGoogleUseCase(repo, hasher, tokens, verifierOk()).execute({ idToken: 'abc' });

    expect(repo.criar).not.toHaveBeenCalled();
    expect(r.usuario.id).toBe('u1');
  });

  it('bloqueia conta suspensa', async () => {
    const suspenso = new Usuario({
      id: 'u2', nome: 'X', email: 'x@gmail.com', senhaHash: 'h', genero: 'Masculino',
      dataNascimento: new Date('1999-01-01'), raioBuscaKm: 5, notaMedia: 1.5,
      totalAvaliacoes: 9, statusUsuario: StatusUsuarioEnum.SUSPENSO,
    });
    await expect(
      new EntrarComGoogleUseCase(criarRepo(suspenso), hasher, tokens, verifierOk('x@gmail.com')).execute({ idToken: 'abc' })
    ).rejects.toThrow('suspensa');
  });

  it('não cria nada quando o token do Google é rejeitado', async () => {
    const repo = criarRepo(null);
    const verifierFalha: IGoogleIdentityVerifier = {
      isConfigured: () => true,
      verify: jest.fn().mockRejectedValue(new Error('Sessão do Google expirada. Tente novamente.')),
    };
    await expect(new EntrarComGoogleUseCase(repo, hasher, tokens, verifierFalha).execute({ idToken: 'x' })).rejects.toThrow('expirada');
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('rejeita requisição sem token', async () => {
    await expect(
      new EntrarComGoogleUseCase(criarRepo(), hasher, tokens, verifierOk()).execute({ idToken: '' })
    ).rejects.toThrow('ausente');
  });
});

describe('GoogleIdTokenVerifier', () => {
  const CLIENT = 'meu-client-id.apps.googleusercontent.com';
  const agora = () => Math.floor(Date.now() / 1000);
  const payloadValido = () => ({
    aud: CLIENT, iss: 'https://accounts.google.com', exp: String(agora() + 3600),
    email: 'Pessoa@Gmail.com', email_verified: 'true', name: 'Pessoa Teste', picture: 'https://p',
  });
  const responder = (body: any, ok = true) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok, json: async () => body } as any);

  afterEach(() => jest.restoreAllMocks());

  it('aceita token válido e normaliza o e-mail', async () => {
    responder(payloadValido());
    const id = await new GoogleIdTokenVerifier(CLIENT).verify('tok');
    expect(id).toEqual({ email: 'pessoa@gmail.com', nome: 'Pessoa Teste', fotoUrl: 'https://p' });
  });

  it('rejeita token emitido para outro aplicativo (aud diferente)', async () => {
    responder({ ...payloadValido(), aud: 'outro-app' });
    await expect(new GoogleIdTokenVerifier(CLIENT).verify('tok')).rejects.toThrow('não pertence');
  });

  it('rejeita e-mail não verificado no Google', async () => {
    responder({ ...payloadValido(), email_verified: 'false' });
    await expect(new GoogleIdTokenVerifier(CLIENT).verify('tok')).rejects.toThrow('verificado');
  });

  it('rejeita token expirado', async () => {
    responder({ ...payloadValido(), exp: String(agora() - 10) });
    await expect(new GoogleIdTokenVerifier(CLIENT).verify('tok')).rejects.toThrow('expirada');
  });

  it('rejeita quando o Google não confirma o token', async () => {
    responder({ error: 'invalid_token' }, false);
    await expect(new GoogleIdTokenVerifier(CLIENT).verify('tok')).rejects.toThrow('Não foi possível');
  });

  it('informa claramente quando o Client ID não está configurado', async () => {
    const v = new GoogleIdTokenVerifier(undefined);
    expect(v.isConfigured()).toBe(false);
    await expect(v.verify('tok')).rejects.toThrow('não configurado');
  });
});
