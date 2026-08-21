import { MatchSchedulerWorker } from '../../src/infrastructure/jobs/MatchSchedulerWorker';
import { Partida } from '../../src/domain/entities/Partida';
import { StatusPartidaEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository } from '../../src/application/repositories/IRepositories';
import { FinalizarPartidaUseCase } from '../../src/application/use-cases/FinalizarPartidaUseCase';

describe('Worker: MatchSchedulerWorker', () => {
  let fakePartidaRepo: jest.Mocked<IPartidaRepository>;
  let fakeFinalizarUseCase: jest.Mocked<FinalizarPartidaUseCase>;
  let worker: MatchSchedulerWorker;

  beforeEach(() => {
    fakePartidaRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorRaio: jest.fn(),
      buscarPartidasExpiradas: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    fakeFinalizarUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FinalizarPartidaUseCase>;

    worker = new MatchSchedulerWorker(fakePartidaRepo, fakeFinalizarUseCase, 1000);
  });

  afterEach(() => {
    worker.stop();
  });

  it('deve buscar partidas expiradas e invocar FinalizarPartidaUseCase para cada uma', async () => {
    const partidaExpirada1 = new Partida({
      id: 'partida-exp-1',
      organizadorId: 'org-1',
      esporte: 'Futebol',
      dataHora: new Date(Date.now() - 7200000), // 2h atrás
      duracaoMinutos: 90,
      maxVagas: 10,
      vagasPreenchidas: 8,
      enderecoCompleto: 'Rua A, 1',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    const partidaExpirada2 = new Partida({
      id: 'partida-exp-2',
      organizadorId: 'org-2',
      esporte: 'Vôlei',
      dataHora: new Date(Date.now() - 5400000), // 1.5h atrás
      duracaoMinutos: 60,
      maxVagas: 12,
      vagasPreenchidas: 12,
      enderecoCompleto: 'Rua B, 2',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.LOTADA,
    });

    fakePartidaRepo.buscarPartidasExpiradas.mockResolvedValue([partidaExpirada1, partidaExpirada2]);

    const totalProcessadas = await worker.processarPartidasExpiradas();

    expect(totalProcessadas).toBe(2);
    expect(fakeFinalizarUseCase.execute).toHaveBeenCalledTimes(2);
    expect(fakeFinalizarUseCase.execute).toHaveBeenCalledWith({ partidaId: 'partida-exp-1' });
    expect(fakeFinalizarUseCase.execute).toHaveBeenCalledWith({ partidaId: 'partida-exp-2' });
  });

  it('deve retornar 0 quando não houver partidas expiradas', async () => {
    fakePartidaRepo.buscarPartidasExpiradas.mockResolvedValue([]);

    const total = await worker.processarPartidasExpiradas();
    expect(total).toBe(0);
    expect(fakeFinalizarUseCase.execute).not.toHaveBeenCalled();
  });
});
