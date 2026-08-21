import { AutenticarUsuarioUseCase } from '../../src/application/use-cases/AutenticarUsuarioUseCase';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';
import { IUsuarioRepository, IPasswordHasher, ITokenService } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: AutenticarUsuarioUseCase', () => {
  let fakeUsuarioRepo: jest.Mocked<IUsuarioRepository>;
  let fakePasswordHasher: jest.Mocked<IPasswordHasher>;
  let fakeTokenService: jest.Mocked<ITokenService>;
  let useCase: AutenticarUsuarioUseCase;

  const mockUsuario = new Usuario({
    id: 'user-auth-1',
    nome: 'Maria Santos',
    email: 'maria@teste.com',
    senhaHash: 'hashed_password_123',
    genero: 'Feminino',
    dataNascimento: new Date('1997-08-20'),
    raioBuscaKm: 5,
    notaMedia: 4.85,
    totalAvaliacoes: 12,
    statusUsuario: StatusUsuarioEnum.ATIVO,
  });

  beforeEach(() => {
    fakeUsuarioRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarTodos: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    fakePasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    fakeTokenService = {
      gerarToken: jest.fn().mockReturnValue('mocked_jwt_token_maria'),
    };

    useCase = new AutenticarUsuarioUseCase(fakeUsuarioRepo, fakePasswordHasher, fakeTokenService);
  });

  it('deve autenticar usuário com sucesso retornando payload e token JWT', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(mockUsuario);
    fakePasswordHasher.compare.mockResolvedValue(true);

    const resultado = await useCase.execute({
      email: 'maria@teste.com',
      senha: 'correta123',
    });

    expect(resultado.token).toBe('mocked_jwt_token_maria');
    expect(resultado.usuario.id).toBe('user-auth-1');
    expect(resultado.usuario.nome).toBe('Maria Santos');
    expect(resultado.usuario.notaMedia).toBe(4.85);
  });

  it('deve lançar erro se o usuário não for encontrado', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'inexistente@teste.com',
        senha: 'qualquersenhakk',
      })
    ).rejects.toThrow('Credenciais inválidas.');
  });

  it('deve lançar erro se a senha estiver incorreta', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(mockUsuario);
    fakePasswordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'maria@teste.com',
        senha: 'senhaerrada',
      })
    ).rejects.toThrow('Credenciais inválidas.');
  });

  it('deve bloquear login se o usuário estiver suspenso por avaliação baixa', async () => {
    const usuarioSuspenso = new Usuario({
      id: 'user-suspenso',
      nome: 'Suspenso Silva',
      email: 'suspenso@teste.com',
      senhaHash: 'hash',
      genero: 'Masculino',
      dataNascimento: new Date('1995-01-01'),
      raioBuscaKm: 5,
      notaMedia: 1.8,
      totalAvaliacoes: 6,
      statusUsuario: StatusUsuarioEnum.SUSPENSO,
    });

    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(usuarioSuspenso);

    await expect(
      useCase.execute({
        email: 'suspenso@teste.com',
        senha: 'qualquer',
      })
    ).rejects.toThrow('Conta suspensa por baixa avaliação média (< 2.0).');
  });
});
