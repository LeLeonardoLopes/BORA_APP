import { RegistrarUsuarioUseCase } from '../../src/application/use-cases/RegistrarUsuarioUseCase';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';
import { IUsuarioRepository, IPasswordHasher, ITokenService } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: RegistrarUsuarioUseCase', () => {
  let fakeUsuarioRepo: jest.Mocked<IUsuarioRepository>;
  let fakePasswordHasher: jest.Mocked<IPasswordHasher>;
  let fakeTokenService: jest.Mocked<ITokenService>;
  let useCase: RegistrarUsuarioUseCase;

  beforeEach(() => {
    fakeUsuarioRepo = {
      criar: jest.fn().mockImplementation(async (u) => u),
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarTodos: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    fakePasswordHasher = {
      hash: jest.fn().mockResolvedValue('senha_hasheada_123'),
      compare: jest.fn(),
    };

    fakeTokenService = {
      gerarToken: jest.fn().mockReturnValue('mocked_jwt_token'),
    };

    useCase = new RegistrarUsuarioUseCase(fakeUsuarioRepo, fakePasswordHasher, fakeTokenService);
  });

  it('deve registrar um novo usuário com senha criptografada e gerar token JWT', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    const resultado = await useCase.execute({
      nome: 'Carlos Silva',
      email: 'carlos@teste.com',
      senha: 'SenhaForte@123',
      genero: 'Masculino',
      dataNascimento: '1998-04-10',
      raioBuscaKm: 4,
      modalidadesFavoritas: 'Futebol Society',
    });

    expect(resultado.token).toBe('mocked_jwt_token');
    expect(resultado.usuario.nome).toBe('Carlos Silva');
    expect(resultado.usuario.email).toBe('carlos@teste.com');
    expect(resultado.usuario.notaMedia).toBe(5.0);
    expect(fakePasswordHasher.hash).toHaveBeenCalledWith('SenhaForte@123');
    expect(fakeUsuarioRepo.criar).toHaveBeenCalled();
  });

  it('deve lançar erro se o e-mail já estiver cadastrado', async () => {
    const usuarioExistente = new Usuario({
      id: 'existente-1',
      nome: 'Existente',
      email: 'carlos@teste.com',
      senhaHash: 'hash',
      genero: 'Masculino',
      dataNascimento: new Date('1990-01-01'),
      raioBuscaKm: 5,
      notaMedia: 5.0,
      totalAvaliacoes: 0,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(usuarioExistente);

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        senha: 'SenhaForte@123',
        genero: 'Masculino',
        dataNascimento: '1998-04-10',
      })
    ).rejects.toThrow('Email já cadastrado.');
  });

  it('deve lançar erro se a senha tiver menos de 6 caracteres', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        senha: '123',
        genero: 'Masculino',
        dataNascimento: '1998-04-10',
      })
    ).rejects.toThrow('A senha deve conter pelo menos 6 caracteres.');
  });

  it('deve lançar erro se a senha não contiver número', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        senha: 'SenhaSemNumero@',
        genero: 'Masculino',
        dataNascimento: '1998-04-10',
      })
    ).rejects.toThrow('A senha deve conter pelo menos um número.');
  });

  it('deve lançar erro se a senha não contiver caractere especial', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        senha: 'Senha123SemEspecial',
        genero: 'Masculino',
        dataNascimento: '1998-04-10',
      })
    ).rejects.toThrow('A senha deve conter pelo menos um caractere especial (ex: @, #, $, !).');
  });

  it('deve lançar erro se o CPF for inválido', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        cpf: '111.111.111-11',
        senha: 'SenhaForte@123',
      })
    ).rejects.toThrow('CPF inválido.');
  });

  it('deve lançar erro se o CPF já estiver cadastrado em outra conta', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);
    fakeUsuarioRepo.buscarPorCpf.mockResolvedValue(
      new Usuario({
        id: 'outro-user',
        nome: 'Outro Atleta',
        email: 'outro@teste.com',
        cpf: '52998224725',
        senhaHash: 'hash',
        genero: 'Masculino',
        dataNascimento: new Date('1990-01-01'),
        raioBuscaKm: 5,
        notaMedia: 5.0,
        totalAvaliacoes: 0,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      })
    );

    await expect(
      useCase.execute({
        nome: 'Carlos Silva',
        email: 'carlos@teste.com',
        cpf: '529.982.247-25',
        senha: 'SenhaForte@123',
      })
    ).rejects.toThrow('CPF já cadastrado em outra conta.');
  });
});
