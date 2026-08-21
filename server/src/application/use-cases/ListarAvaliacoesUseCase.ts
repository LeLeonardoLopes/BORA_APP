import { IAvaliacaoDetalhada, IAvaliacaoRepository } from '../repositories/IRepositories';

export class ListarAvaliacoesUseCase {
  constructor(private avaliacaoRepo: IAvaliacaoRepository) {}

  public async execute(): Promise<IAvaliacaoDetalhada[]> {
    return await this.avaliacaoRepo.listarTodasDetalhes();
  }
}
