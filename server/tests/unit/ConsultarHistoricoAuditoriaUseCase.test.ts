import { ConsultarHistoricoAuditoriaUseCase } from '../../src/application/use-cases/ConsultarHistoricoAuditoriaUseCase';
import { AuditoriaLog } from '../../src/domain/entities/AuditoriaLog';
import { IAuditoriaRepository } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: ConsultarHistoricoAuditoriaUseCase', () => {
  let fakeAuditoriaRepo: jest.Mocked<IAuditoriaRepository>;
  let useCase: ConsultarHistoricoAuditoriaUseCase;

  beforeEach(() => {
    fakeAuditoriaRepo = {
      salvar: jest.fn(),
      listarPorRegistro: jest.fn(),
      listarRecentes: jest.fn(),
    };

    useCase = new ConsultarHistoricoAuditoriaUseCase(fakeAuditoriaRepo);
  });

  it('deve listar histórico de auditoria por tabela e ID do registro', async () => {
    const logs = [
      new AuditoriaLog({
        id: 'log-1',
        tabelaNome: 'partida',
        registroId: 'partida-100',
        operacao: 'SOFT_DELETE',
        usuarioId: 'user-org',
        dadosAnteriores: { status: 'Publicada' },
        dadosNovos: { status: 'Cancelada' },
        camposAlterados: ['status_partida', 'deletado_em'],
      }),
    ];

    fakeAuditoriaRepo.listarPorRegistro.mockResolvedValue(logs);

    const resultado = await useCase.execute({
      tabelaNome: 'partida',
      registroId: 'partida-100',
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].operacao).toBe('SOFT_DELETE');
    expect(fakeAuditoriaRepo.listarPorRegistro).toHaveBeenCalledWith('partida', 'partida-100');
  });

  it('deve listar registros recentes quando tabela/id não forem informados', async () => {
    const logs = [
      new AuditoriaLog({
        id: 'log-2',
        tabelaNome: 'usuario',
        registroId: 'user-200',
        operacao: 'UPDATE',
      }),
    ];

    fakeAuditoriaRepo.listarRecentes.mockResolvedValue(logs);

    const resultado = await useCase.execute({ limite: 10 });

    expect(resultado).toHaveLength(1);
    expect(fakeAuditoriaRepo.listarRecentes).toHaveBeenCalledWith(10);
  });
});
