import { IPartidaRepository, ISolicitacaoRepository, IWebSocketNotificationService } from '../repositories/IRepositories';

export interface GerenciarSolicitacaoInput {
  solicitacaoId: string;
  organizadorId: string;
  acao: 'aprovar' | 'rejeitar';
}

export class GerenciarSolicitacaoUseCase {
  constructor(
    private solicitacaoRepo: ISolicitacaoRepository,
    private partidaRepo: IPartidaRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: GerenciarSolicitacaoInput): Promise<void> {
    const solicitacao = await this.solicitacaoRepo.buscarPorId(input.solicitacaoId);
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada.');
    }

    const partida = await this.partidaRepo.buscarPorId(solicitacao.partidaId);
    if (!partida) {
      throw new Error('Partida vinculada não encontrada.');
    }

    if (partida.organizadorId !== input.organizadorId) {
      throw new Error('Apenas o organizador da partida pode aprovar ou rejeitar solicitações.');
    }

    if (input.acao === 'rejeitar') {
      solicitacao.rejeitar();
      await this.solicitacaoRepo.atualizar(solicitacao);
      if (this.wsNotificationService) {
        this.wsNotificationService.notificarUsuario(solicitacao.usuarioId, 'request_decision', {
          solicitacaoId: solicitacao.id,
          partidaId: partida.id,
          status: 'Rejeitada',
        });
      }
      return;
    }

    // Regra RN01: Anti-conflito de agenda (2 horas antes ou depois)
    const existeConflito = await this.solicitacaoRepo.verificarConflitoHorario(
      solicitacao.usuarioId,
      partida.dataHora
    );

    if (existeConflito) {
      throw new Error('Regra RN01: O atleta possui outra partida confirmada no intervalo de 2 horas.');
    }

    // Preenche vaga e aprova
    partida.preencherVaga();
    solicitacao.aprovar();

    await this.partidaRepo.atualizar(partida);
    await this.solicitacaoRepo.atualizar(solicitacao);

    if (this.wsNotificationService) {
      this.wsNotificationService.notificarUsuario(solicitacao.usuarioId, 'request_decision', {
        solicitacaoId: solicitacao.id,
        partidaId: partida.id,
        status: 'Aprovada',
      });
      this.wsNotificationService.broadcastParaPartida(partida.id, 'match_slot_filled', {
        partidaId: partida.id,
        vagasPreenchidas: partida.vagasPreenchidas,
        maxVagas: partida.maxVagas,
      });
    }
  }
}
