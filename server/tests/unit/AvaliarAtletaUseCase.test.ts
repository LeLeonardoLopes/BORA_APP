import { AvaliarAtletaUseCase } from '../../src/application/use-cases/AvaliarAtletaUseCase';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';
import { IUsuarioRepository, IAvaliacaoRepository } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: AvaliarAtletaUseCase', () => {
  let fakeUsuarioRepo: jest.Mocked<IUsuarioRepository>;
  let fakeAvaliacaoRepo: jest.Mocked<IAvaliacaoRepository>;
  let useCase: AvaliarAtletaUseCase;

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

    fakeAvaliacaoRepo = {
      salvarOuAtualizar: jest.fn(),
      listarTodasDetalhes: jest.fn(),
      calcularMediaETotal: jest.fn(),
    };

    useCase = new AvaliarAtletaUseCase(fakeAvaliacaoRepo, fakeUsuarioRepo);
  });

  it('deve registrar avaliação, atualizar a média do atleta e salvar no repositório', async () => {
    const atleta = new Usuario({
      id: 'atleta-100',
      nome: 'Bruno Meia',
      email: 'bruno@teste.com',
      senhaHash: 'hash123',
      genero: 'Masculino',
      dataNascimento: new Date('1996-03-12'),
      raioBuscaKm: 5,
      notaMedia: 4.0,
      totalAvaliacoes: 1,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    fakeUsuarioRepo.buscarPorId.mockResolvedValue(atleta);

    const resultado = await useCase.execute({
      partidaId: 'partida-50',
      avaliadorId: 'avaliador-1',
      avaliadoId: 'atleta-100',
      nota: 5,
      comentario: 'Jogou muito bem, pontual e respeitoso!',
    });

    expect(resultado.message).toBe('Avaliação computada com sucesso!');
    expect(resultado.avaliacao.nota).toBe(5);
    expect(fakeAvaliacaoRepo.salvarOuAtualizar).toHaveBeenCalled();
    expect(fakeUsuarioRepo.atualizar).toHaveBeenCalledWith(atleta);
    // (4.0 * 1 + 5) / 2 = 4.5
    expect(atleta.notaMedia).toBe(4.5);
    expect(atleta.totalAvaliacoes).toBe(2);
  });

  it('deve suspender o atleta se atingir 5 avaliações com nota média < 2.0', async () => {
    const atleta = new Usuario({
      id: 'atleta-infracao',
      nome: 'Jogador Conflituoso',
      email: 'conflito@teste.com',
      senhaHash: 'hash123',
      genero: 'Masculino',
      dataNascimento: new Date('1994-01-01'),
      raioBuscaKm: 5,
      notaMedia: 2.1,
      totalAvaliacoes: 4,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    fakeUsuarioRepo.buscarPorId.mockResolvedValue(atleta);

    const resultado = await useCase.execute({
      partidaId: 'partida-50',
      avaliadorId: 'avaliador-2',
      avaliadoId: 'atleta-infracao',
      nota: 1, // Puxa a média para baixo de 2.0 na 5ª avaliação
      comentario: 'Falta de respeito com os outros jogadores.',
    });

    expect(atleta.totalAvaliacoes).toBe(5);
    expect(atleta.notaMedia).toBeLessThan(2.0);
    expect(resultado.avaliadoStats.statusUsuario).toBe(StatusUsuarioEnum.SUSPENSO);
  });

  it('deve bloquear autoavaliação (avaliador == avaliado)', async () => {
    await expect(
      useCase.execute({
        avaliadorId: 'mesmo-id',
        avaliadoId: 'mesmo-id',
        nota: 5,
      })
    ).rejects.toThrow('Um atleta não pode avaliar a si mesmo.');
  });

  it('deve bloquear nota fora da escala de 1 a 5', async () => {
    await expect(
      useCase.execute({
        avaliadorId: 'avaliador-1',
        avaliadoId: 'avaliado-2',
        nota: 6,
      })
    ).rejects.toThrow('Informe o atleta avaliado e uma nota válida entre 1 e 5.');
  });
});
