import { AuditoriaLog } from '../../domain/entities/AuditoriaLog';
import { IAuditoriaRepository } from '../repositories/IRepositories';

export interface ConsultarHistoricoAuditoriaInput {
  tabelaNome?: string;
  registroId?: string;
  limite?: number;
}

export class ConsultarHistoricoAuditoriaUseCase {
  constructor(private auditoriaRepo: IAuditoriaRepository) {}

  public async execute(input: ConsultarHistoricoAuditoriaInput): Promise<AuditoriaLog[]> {
    if (input.tabelaNome && input.registroId) {
      return await this.auditoriaRepo.listarPorRegistro(input.tabelaNome, input.registroId);
    }
    return await this.auditoriaRepo.listarRecentes(input.limite || 50);
  }
}
