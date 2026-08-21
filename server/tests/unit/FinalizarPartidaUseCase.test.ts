import { FinalizarPartidaUseCase } from '../../src/application/use-cases/FinalizarPartidaUseCase';
import { Partida } from '../../src/domain/entities/Partida';
import { StatusPartidaEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository, IWebSocketNotificationService } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: FinalizarPartidaUseCase', () => {
  let fakePartidaRepo: jest.Mocked<IPartidaRepository>;
  let fakeSolicitacaoRepo: jest.Mocked<ISolicitacaoRepository>;
  let fakeWsService: jest.Mocked<IWebSocketNotificationService>;
  let useCase: FinalizarPartidaUseCase;

  beforeEach(() => {
    fakePartidaRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorRaio: jest.fn(),
      buscarPartidasExpiradas: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    fakeSolicitacaoRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorPartidaEUsuario: jest.fn(),
      listarPorPartida: jest.fn(),
      listarPorUsuario: jest.fn(),
      listarTodasDetalhes: jest.fn(),
      atualizar: jest.fn(),
      rejeitarPendentesPorPartida: jest.fn(),
      verificarConflitoHorario: jest.fn(),
    };

    fakeWsService = {
      notificarUsuario: jest.fn(),
      broadcastParaPartida: jest.fn(),
      notificarPartidaFinalizada: jest.fn(),
    };

    useCase = new FinalizarPartidaUseCase(fakePartidaRepo, fakeSolicitacaoRepo, fakeWsService);
  });

  it('deve finalizar partida pelo organizador, rejeitar pendentes e notificar via WebSocket', async () => {
    const partida = new Partida({
      id: 'partida-fin-1',
      organizadorId: 'org-123',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() - 3600000), // Começou 1h atrás
      duracaoMinutos: 90,
      maxVagas: 14,
      vagasPreenchidas: 10,
      enderecoCompleto: 'Rua A, 100',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await useCase.execute({
      partidaId: 'partida-fin-1',
      solicitanteId: 'org-123',
    });

    expect(partida.statusPartida).toBe(StatusPartidaEnum.FINALIZADA);
    expect(fakePartidaRepo.atualizar).toHaveBeenCalledWith(partida);
    expect(fakeSolicitacaoRepo.rejeitarPendentesPorPartida).toHaveBeenCalledWith('partida-fin-1');
    expect(fakeWsService.notificarPartidaFinalizada).toHaveBeenCalledWith('partida-fin-1');
  });

  it('deve bloquear finalização manual por usuário não-organizador', async () => {
    const partida = new Partida({
      id: 'partida-fin-2',
      organizadorId: 'org-123',
      esporte: 'Vôlei',
      dataHora: new Date(),
      maxVagas: 12,
      vagasPreenchidas: 8,
      enderecoCompleto: 'Rua B, 200',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await expect(
      useCase.execute({
        partidaId: 'partida-fin-2',
        solicitanteId: 'intruso-999',
      })
    ).rejects.toThrow('Apenas o organizador pode finalizar a partida manualmente.');
  });

  it('deve permitir finalização automática pelo sistema (sem solicitanteId)', async () => {
    const partida = new Partida({
      id: 'partida-fin-auto',
      organizadorId: 'org-123',
      esporte: 'Basquete',
      dataHora: new Date(Date.now() - 7200000),
      duracaoMinutos: 60,
      maxVagas: 10,
      vagasPreenchidas: 10,
      enderecoCompleto: 'Rua C, 300',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.LOTADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await useCase.execute({
      partidaId: 'partida-fin-auto',
    });

    expect(partida.statusPartida).toBe(StatusPartidaEnum.FINALIZADA);
    expect(fakePartidaRepo.atualizar).toHaveBeenCalledWith(partida);
  });
});
