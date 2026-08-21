import { IPartidaRepository, ISolicitacaoRepository, IWebSocketNotificationService } from '../repositories/IRepositories';

export interface FinalizarPartidaInput {
  partidaId: string;
  solicitanteId?: string;
}

export class FinalizarPartidaUseCase {
  constructor(
    private partidaRepo: IPartidaRepository,
    private solicitacaoRepo?: ISolicitacaoRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: FinalizarPartidaInput): Promise<void> {
    const partida = await this.partidaRepo.buscarPorId(input.partidaId);
    if (!partida) {
      throw new Error('Partida não encontrada.');
    }

    // Regra de domínio: se solicitanteId fornecido, apenas o organizador pode finalizar
    partida.finalizar(input.solicitanteId);

    // Persiste atualização no banco
    await this.partidaRepo.atualizar(partida);

    // Rejeita solicitações que ainda estavam pendentes
    if (this.solicitacaoRepo) {
      await this.solicitacaoRepo.rejeitarPendentesPorPartida(partida.id);
    }

    // Emite notificação de broadcast via WebSocket
    if (this.wsNotificationService) {
      this.wsNotificationService.notificarPartidaFinalizada(partida.id);
      this.wsNotificationService.broadcastParaPartida(partida.id, 'match_finished', {
        partidaId: partida.id,
        status: partida.statusPartida,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
