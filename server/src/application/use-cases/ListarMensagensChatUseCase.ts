import { MensagemChat } from '../../domain/entities/MensagemChat';
import { IMensagemChatRepository } from '../repositories/IRepositories';

export class ListarMensagensChatUseCase {
  constructor(private mensagemRepo: IMensagemChatRepository) {}

  public async execute(partidaId: string): Promise<MensagemChat[]> {
    if (!partidaId) {
      throw new Error('ID da partida é obrigatório.');
    }
    return await this.mensagemRepo.listarPorPartida(partidaId);
  }
}
