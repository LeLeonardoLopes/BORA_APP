import { CancelarPartidaUseCase } from '../../src/application/use-cases/CancelarPartidaUseCase';
import { Partida } from '../../src/domain/entities/Partida';
import { StatusPartidaEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: CancelarPartidaUseCase', () => {
  let fakePartidaRepo: jest.Mocked<IPartidaRepository>;
  let fakeSolicitacaoRepo: jest.Mocked<ISolicitacaoRepository>;
  let useCase: CancelarPartidaUseCase;

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

    useCase = new CancelarPartidaUseCase(fakePartidaRepo, fakeSolicitacaoRepo);
  });

  it('deve cancelar a partida e rejeitar solicitações pendentes com sucesso', async () => {
    const partida = new Partida({
      id: 'partida-1',
      organizadorId: 'org-123',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 10,
      vagasPreenchidas: 3,
      enderecoCompleto: 'Rua das Flores, 100',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await useCase.execute({
      partidaId: 'partida-1',
      solicitanteId: 'org-123',
    });

    expect(partida.statusPartida).toBe(StatusPartidaEnum.CANCELADA);
    expect(fakePartidaRepo.atualizar).toHaveBeenCalledWith(partida);
    expect(fakeSolicitacaoRepo.rejeitarPendentesPorPartida).toHaveBeenCalledWith('partida-1');
  });

  it('deve lançar erro se a partida não for encontrada', async () => {
    fakePartidaRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        partidaId: 'inexistente',
        solicitanteId: 'org-123',
      })
    ).rejects.toThrow('Partida não encontrada.');
  });

  it('deve bloquear cancelamento por usuário que não seja o organizador', async () => {
    const partida = new Partida({
      id: 'partida-1',
      organizadorId: 'org-123',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 10,
      vagasPreenchidas: 3,
      enderecoCompleto: 'Rua das Flores, 100',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);

    await expect(
      useCase.execute({
        partidaId: 'partida-1',
        solicitanteId: 'outro-usuario',
      })
    ).rejects.toThrow('Apenas o organizador pode solicitar o cancelamento da partida.');
  });

  it('deve bloquear cancelamento de partida com lotação esgotada (Regra RN03)', async () => {
    const partidaLotada = new Partida({
      id: 'partida-lotada',
      organizadorId: 'org-123',
      esporte: 'Beach Tennis',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 4,
      vagasPreenchidas: 4,
      enderecoCompleto: 'Arena Beach, 50',
      bairro: 'São José',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.LOTADA,
    });

    fakePartidaRepo.buscarPorId.mockResolvedValue(partidaLotada);

    await expect(
      useCase.execute({
        partidaId: 'partida-lotada',
        solicitanteId: 'org-123',
      })
    ).rejects.toThrow('Regra RN03: Partida com lotação esgotada não pode ser cancelada diretamente.');
  });
});
