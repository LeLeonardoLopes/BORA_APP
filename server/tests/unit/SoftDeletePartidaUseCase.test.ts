import { SoftDeletePartidaUseCase } from '../../src/application/use-cases/SoftDeletePartidaUseCase';
import { Partida } from '../../src/domain/entities/Partida';
import { StatusPartidaEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository, IAuditoriaRepository, IWebSocketNotificationService } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: SoftDeletePartidaUseCase', () => {
  let fakePartidaRepo: jest.Mocked<IPartidaRepository>;
  let fakeSolicitacaoRepo: jest.Mocked<ISolicitacaoRepository>;
  let fakeAuditoriaRepo: jest.Mocked<IAuditoriaRepository>;
  let fakeWsService: jest.Mocked<IWebSocketNotificationService>;
  let useCase: SoftDeletePartidaUseCase;

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

    fakeAuditoriaRepo = {
      salvar: jest.fn().mockImplementation(async (l) => l),
      listarPorRegistro: jest.fn(),
      listarRecentes: jest.fn(),
    };

    fakeWsService = {
      notificarUsuario: jest.fn(),
      broadcastParaPartida: jest.fn(),
      notificarPartidaFinalizada: jest.fn(),
    };

    useCase = new SoftDeletePartidaUseCase(fakePartidaRepo, fakeSolicitacaoRepo, fakeAuditoriaRepo, fakeWsService);
  });

  it('deve realizar soft delete da partida, rejeitar solicitações e registrar log de auditoria', async () => {
    const partida = new Partida({
      id: 'partida-del-1',
      organizadorId: 'org-dono',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 14,
      vagasPreenchidas: 4,
      enderecoCompleto: 'Rua das Palmeiras, 50',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await useCase.execute({
      partidaId: 'partida-del-1',
      solicitanteId: 'org-dono',
      motivo: 'Chuva forte no local',
    });

    expect(fakePartidaRepo.softDelete).toHaveBeenCalledWith('partida-del-1', 'org-dono');
    expect(fakeSolicitacaoRepo.rejeitarPendentesPorPartida).toHaveBeenCalledWith('partida-del-1');
    expect(fakeAuditoriaRepo.salvar).toHaveBeenCalledWith(
      expect.objectContaining({
        tabelaNome: 'partida',
        registroId: 'partida-del-1',
        operacao: 'SOFT_DELETE',
        usuarioId: 'org-dono',
      })
    );
    expect(fakeWsService.broadcastParaPartida).toHaveBeenCalledWith(
      'partida-del-1',
      'match_deleted',
      expect.objectContaining({
        partidaId: 'partida-del-1',
      })
    );
  });

  it('deve lançar erro se a partida não for encontrada', async () => {
    fakePartidaRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        partidaId: 'inexistente',
        solicitanteId: 'org-dono',
      })
    ).rejects.toThrow('Partida não encontrada.');
  });

  it('deve bloquear soft delete por usuário que não seja o organizador', async () => {
    const partida = new Partida({
      id: 'partida-del-2',
      organizadorId: 'org-dono',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 14,
      vagasPreenchidas: 4,
      enderecoCompleto: 'Rua das Palmeiras, 50',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await expect(
      useCase.execute({
        partidaId: 'partida-del-2',
        solicitanteId: 'outro-atleta',
      })
    ).rejects.toThrow('Apenas o organizador pode excluir a partida.');
  });
});
