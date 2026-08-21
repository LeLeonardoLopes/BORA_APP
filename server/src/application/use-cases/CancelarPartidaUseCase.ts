import { IPartidaRepository, ISolicitacaoRepository } from '../repositories/IRepositories';

export interface CancelarPartidaInput {
  partidaId: string;
  solicitanteId: string;
}

export class CancelarPartidaUseCase {
  constructor(
    private partidaRepo: IPartidaRepository,
    private solicitacaoRepo?: ISolicitacaoRepository
  ) {}

  public async execute(input: CancelarPartidaInput): Promise<void> {
    const partida = await this.partidaRepo.buscarPorId(input.partidaId);
    if (!partida) {
      throw new Error('Partida não encontrada.');
    }

    // Regra RN03 e Validação de Organizador encapsuladas no domínio
    partida.cancelar(input.solicitanteId);

    // Persiste atualização no repositório de partidas
    await this.partidaRepo.atualizar(partida);

    // Rejeita solicitações que estavam pendentes para esta partida cancelada
    if (this.solicitacaoRepo) {
      await this.solicitacaoRepo.rejeitarPendentesPorPartida(partida.id);
    }
  }
}
