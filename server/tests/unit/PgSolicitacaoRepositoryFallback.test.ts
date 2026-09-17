jest.mock('../../src/infrastructure/database/connection', () => ({
  db: {
    query: jest.fn().mockRejectedValue(new Error('PostgreSQL indisponível (simulado no teste)')),
  },
}));

import { PgSolicitacaoRepository } from '../../src/infrastructure/repositories/PgSolicitacaoRepository';
import { Solicitacao } from '../../src/domain/entities/Solicitacao';
import { Partida } from '../../src/domain/entities/Partida';
import { Usuario } from '../../src/domain/entities/Usuario';
import { StatusPartidaEnum, StatusSolicitacaoEnum, StatusUsuarioEnum } from '../../src/domain/enums/StatusEnums';
import { IPartidaRepository, IUsuarioRepository } from '../../src/application/repositories/IRepositories';

describe('PgSolicitacaoRepository — fallback em memória (bug: solicitação não aparecia pro organizador)', () => {
  it('deve incluir, em listarTodasDetalhes(), solicitações que só existem no fallback em memória, com o organizadorId correto', async () => {
    const partida = new Partida({
      id: 'partida-1',
      organizadorId: 'organizador-1',
      esporte: 'Futebol Society',
      dataHora: new Date(Date.now() + 86400000),
      maxVagas: 10,
      vagasPreenchidas: 2,
      enderecoCompleto: 'Rua X, 1',
      bairro: 'Centro',
      cidade: 'Franca',
      lat: -20.53,
      lng: -47.4,
      statusPartida: StatusPartidaEnum.PUBLICADA,
    });

    const atleta = new Usuario({
      id: 'atleta-1',
      nome: 'Fulano Jogador',
      email: 'fulano@teste.com',
      senhaHash: 'hash',
      genero: 'Masculino',
      dataNascimento: new Date('2000-01-01'),
      raioBuscaKm: 5,
      notaMedia: 4.5,
      totalAvaliacoes: 3,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    const fakePartidaRepo: jest.Mocked<IPartidaRepository> = {
      criar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(partida),
      buscarPorRaio: jest.fn(),
      buscarPartidasExpiradas: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    const fakeUsuarioRepo: jest.Mocked<IUsuarioRepository> = {
      criar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(atleta),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarTodos: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    const repo = new PgSolicitacaoRepository(fakeUsuarioRepo, fakePartidaRepo);

    const solicitacao = new Solicitacao({
      id: 'solicitacao-1',
      partidaId: 'partida-1',
      usuarioId: 'atleta-1',
      statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
      dataRequisicao: new Date(),
    });

    // Simula a criação da solicitação com o Postgres fora do ar: o registro
    // fica apenas no fallback em memória (comportamento já existente de `criar`).
    await repo.criar(solicitacao);

    // Antes da correção, `listarTodasDetalhes()` retornava [] sempre que a
    // consulta ao banco falhasse, mesmo com o registro salvo em memória —
    // por isso a solicitação nunca aparecia para o organizador.
    const detalhes = await repo.listarTodasDetalhes();

    expect(detalhes).toHaveLength(1);
    expect(detalhes[0]).toMatchObject({
      id: 'solicitacao-1',
      partidaId: 'partida-1',
      usuarioId: 'atleta-1',
      statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
      organizadorId: 'organizador-1',
      atletaNome: 'Fulano Jogador',
    });
  });
});
