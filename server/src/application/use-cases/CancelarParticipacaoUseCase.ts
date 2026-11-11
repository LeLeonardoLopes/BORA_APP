import { IPartidaRepository, ISolicitacaoRepository, IWebSocketNotificationService } from '../repositories/IRepositories';
import { StatusSolicitacaoEnum } from '../../domain/enums/StatusEnums';

export interface CancelarParticipacaoInput {
  solicitacaoId: string;
  usuarioId: string;
}

/**
 * Permite que o atleta (jogador) cancele a própria solicitação ou participação em uma partida.
 * Se a vaga já estava aprovada, ela é devolvida para a partida e o organizador é avisado.
 */
export class CancelarParticipacaoUseCase {
  constructor(
    private solicitacaoRepo: ISolicitacaoRepository,
    private partidaRepo: IPartidaRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: CancelarParticipacaoInput): Promise<void> {
    const solicitacao = await this.solicitacaoRepo.buscarPorId(input.solicitacaoId);
    if (!solicitacao) {
      throw new Error('Solicitação não encontrada.');
    }
    if (solicitacao.usuarioId !== input.usuarioId) {
      throw new Error('Você só pode cancelar a sua própria participação.');
    }

    const estavaAprovada = solicitacao.statusSolicitacao === StatusSolicitacaoEnum.APROVADA;
    solicitacao.cancelar();
    await this.solicitacaoRepo.atualizar(solicitacao);

    const partida = await this.partidaRepo.buscarPorId(solicitacao.partidaId);
    if (!partida) return;

    if (estavaAprovada) {
      partida.liberarVaga();
      await this.partidaRepo.atualizar(partida);
    }

    if (this.wsNotificationService) {
      this.wsNotificationService.notificarUsuario(partida.organizadorId, 'request_cancelled', {
        solicitacaoId: solicitacao.id,
        partidaId: partida.id,
        usuarioId: input.usuarioId,
        vagaLiberada: estavaAprovada,
      });
      if (estavaAprovada) {
        this.wsNotificationService.broadcastParaPartida(partida.id, 'match_slot_filled', {
          partidaId: partida.id,
          vagasPreenchidas: partida.vagasPreenchidas,
          maxVagas: partida.maxVagas,
        });
      }
    }
  }
}
