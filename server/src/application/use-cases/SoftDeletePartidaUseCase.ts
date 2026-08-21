import { IPartidaRepository, ISolicitacaoRepository, IAuditoriaRepository, IWebSocketNotificationService } from '../repositories/IRepositories';
import { AuditoriaLog } from '../../domain/entities/AuditoriaLog';
import { randomUUID } from 'crypto';

export interface SoftDeletePartidaInput {
  partidaId: string;
  solicitanteId: string;
  motivo?: string;
}

export class SoftDeletePartidaUseCase {
  constructor(
    private partidaRepo: IPartidaRepository,
    private solicitacaoRepo?: ISolicitacaoRepository,
    private auditoriaRepo?: IAuditoriaRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: SoftDeletePartidaInput): Promise<void> {
    const partida = await this.partidaRepo.buscarPorId(input.partidaId);
    if (!partida) {
      throw new Error('Partida não encontrada.');
    }

    if (partida.organizadorId !== input.solicitanteId) {
      throw new Error('Apenas o organizador pode excluir a partida.');
    }

    // Executa o soft delete no repositório
    await this.partidaRepo.softDelete(input.partidaId, input.solicitanteId);

    // Rejeita solicitações que estavam pendentes
    if (this.solicitacaoRepo) {
      await this.solicitacaoRepo.rejeitarPendentesPorPartida(input.partidaId);
    }

    // Registra log na trilha de auditoria universal
    if (this.auditoriaRepo) {
      const logAuditoria = new AuditoriaLog({
        id: randomUUID(),
        tabelaNome: 'partida',
        registroId: input.partidaId,
        operacao: 'SOFT_DELETE',
        usuarioId: input.solicitanteId,
        dadosAnteriores: {
          id: partida.id,
          esporte: partida.esporte,
          organizadorId: partida.organizadorId,
          statusPartida: partida.statusPartida,
          dataHora: partida.dataHora,
          vagasPreenchidas: partida.vagasPreenchidas,
        },
        dadosNovos: {
          statusPartida: 'Cancelada',
          deletadoEm: new Date(),
          deletadoPor: input.solicitanteId,
          motivo: input.motivo || 'Exclusão solicitada pelo organizador',
        },
        camposAlterados: ['deletado_em', 'deletado_por', 'status_partida'],
      });

      await this.auditoriaRepo.salvar(logAuditoria);
    }

    // Emite notificação via WebSocket
    if (this.wsNotificationService) {
      this.wsNotificationService.broadcastParaPartida(input.partidaId, 'match_deleted', {
        partidaId: input.partidaId,
        mensagem: 'A partida foi excluída pelo organizador.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
