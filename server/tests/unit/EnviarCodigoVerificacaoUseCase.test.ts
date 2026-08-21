import { EnviarCodigoVerificacaoUseCase } from '../../src/application/use-cases/EnviarCodigoVerificacaoUseCase';
import { IUsuarioRepository, ICodigoVerificacaoRepository } from '../../src/application/repositories/IRepositories';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';

describe('Caso de Uso: EnviarCodigoVerificacaoUseCase', () => {
  let fakeUsuarioRepo: jest.Mocked<IUsuarioRepository>;
  let fakeCodigoRepo: jest.Mocked<ICodigoVerificacaoRepository>;
  let useCase: EnviarCodigoVerificacaoUseCase;

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

    fakeCodigoRepo = {
      salvarCodigo: jest.fn().mockResolvedValue(undefined),
      buscarCodigoValido: jest.fn(),
      consumirCodigo: jest.fn(),
    };

    useCase = new EnviarCodigoVerificacaoUseCase(fakeUsuarioRepo, fakeCodigoRepo);
  });

  it('deve gerar e salvar código OTP de 6 dígitos para e-mail inédito', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    const resultado = await useCase.execute({
      email: 'novoatleta@boraapp.com.br',
    });

    expect(resultado.success).toBe(true);
    expect(resultado.codigoDev).toBeDefined();
    expect(resultado.codigoDev?.length).toBe(6);
    expect(fakeCodigoRepo.salvarCodigo).toHaveBeenCalledWith(
      'novoatleta@boraapp.com.br',
      expect.any(String),
      expect.any(Date)
    );
  });

  it('deve lançar erro se o e-mail já estiver cadastrado', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(
      new Usuario({
        id: 'u1',
        nome: 'Atleta Existente',
        email: 'existente@boraapp.com.br',
        senhaHash: 'hash',
        genero: 'M',
        dataNascimento: new Date('2000-01-01'),
        raioBuscaKm: 5,
        notaMedia: 5.0,
        totalAvaliacoes: 0,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      })
    );

    await expect(
      useCase.execute({ email: 'existente@boraapp.com.br' })
    ).rejects.toThrow('Email já cadastrado.');
  });

  it('deve lançar erro se o CPF for inválido', async () => {
    fakeUsuarioRepo.buscarPorEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'atleta@teste.com',
        cpf: '000.000.000-00',
      })
    ).rejects.toThrow('CPF inválido.');
  });
});
