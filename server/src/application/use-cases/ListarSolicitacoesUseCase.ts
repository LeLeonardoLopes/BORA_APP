import { ISolicitacaoDetalhada, ISolicitacaoRepository } from '../repositories/IRepositories';

export class ListarSolicitacoesUseCase {
  constructor(private solicitacaoRepo: ISolicitacaoRepository) {}

  public async execute(): Promise<ISolicitacaoDetalhada[]> {
    return await this.solicitacaoRepo.listarTodasDetalhes();
  }
}
