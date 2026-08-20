import { GerenciarSolicitacaoUseCase } from '../../src/application/use-cases/GerenciarSolicitacaoUseCase';
import { Partida } from '../../src/domain/entities/Partida';
import { Solicitacao } from '../../src/domain/entities/Solicitacao';
import { StatusPartidaEnum, StatusSolicitacaoEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: GerenciarSolicitacaoUseCase (Regra RN01)', () => {
  let fakePartidaRepo: jest.Mocked<IPartidaRepository>;
  let fakeSolicitacaoRepo: jest.Mocked<ISolicitacaoRepository>;
  let useCase: GerenciarSolicitacaoUseCase;

  beforeEach(() => {
    fakePartidaRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorRaio: jest.fn(),
      atualizar: jest.fn(),
    };

    fakeSolicitacaoRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorPartidaEUsuario: jest.fn(),
      listarPorPartida: jest.fn(),
      listarPorUsuario: jest.fn(),
      atualizar: jest.fn(),
      verificarConflitoHorario: jest.fn(),
    };

    useCase = new GerenciarSolicitacaoUseCase(fakeSolicitacaoRepo, fakePartidaRepo);
  });

  it('deve aprovar a solicitação quando não houver conflito de horário (+/- 2h)', async () => {
    const partida = new Partida({
      id: 'partida-10',
      organizadorId: 'org-1',
      esporte: 'Vôlei',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 6,
      vagasPreenchidas: 2,
      enderecoCompleto: 'Rua C, 789',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    const solicitacao = new Solicitacao({
      id: 'solic-10',
      partidaId: 'partida-10',
      usuarioId: 'user-atleta',
      statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
      dataRequisicao: new Date(),
    });

    fakeSolicitacaoRepo.buscarPorId.mockResolvedValue(solicitacao);
    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);
    fakeSolicitacaoRepo.verificarConflitoHorario.mockResolvedValue(false); // Sem conflito

    await useCase.execute({
      solicitacaoId: 'solic-10',
      organizadorId: 'org-1',
      acao: 'aprovar',
    });

    expect(solicitacao.statusSolicitacao).toBe(StatusSolicitacaoEnum.APROVADA);
    expect(partida.vagasPreenchidas).toBe(3);
    expect(fakePartidaRepo.atualizar).toHaveBeenCalledWith(partida);
    expect(fakeSolicitacaoRepo.atualizar).toHaveBeenCalledWith(solicitacao);
  });

  it('deve bloquear a aprovação caso exista conflito de agenda no intervalo de 2h (RN01)', async () => {
    const partida = new Partida({
      id: 'partida-11',
      organizadorId: 'org-1',
      esporte: 'Vôlei',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 6,
      vagasPreenchidas: 2,
      enderecoCompleto: 'Rua C, 789',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.40,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    const solicitacao = new Solicitacao({
      id: 'solic-11',
      partidaId: 'partida-11',
      usuarioId: 'user-atleta',
      statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
      dataRequisicao: new Date(),
    });

    fakeSolicitacaoRepo.buscarPorId.mockResolvedValue(solicitacao);
    fakePartidaRepo.buscarPorId.mockResolvedValue(partida);
    fakeSolicitacaoRepo.verificarConflitoHorario.mockResolvedValue(true); // Conflito detectado!

    await expect(useCase.execute({
      solicitacaoId: 'solic-11',
      organizadorId: 'org-1',
      acao: 'aprovar',
    })).rejects.toThrow('Regra RN01: O atleta possui outra partida confirmada no intervalo de 2 horas.');

    expect(solicitacao.statusSolicitacao).toBe(StatusSolicitacaoEnum.PENDENTE);
  });
});
