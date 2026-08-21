import { MensagemChat } from '../../domain/entities/MensagemChat';
import { IMensagemChatRepository, IUsuarioRepository, IWebSocketNotificationService } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface EnviarMensagemChatInput {
  id?: string;
  partidaId: string;
  usuarioId: string;
  texto: string;
  usuarioNome?: string;
  usuarioFoto?: string | null;
}

export class EnviarMensagemChatUseCase {
  constructor(
    private mensagemRepo: IMensagemChatRepository,
    private usuarioRepo?: IUsuarioRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: EnviarMensagemChatInput): Promise<MensagemChat> {
    let nome = input.usuarioNome;
    let foto = input.usuarioFoto;

    if (!nome && this.usuarioRepo) {
      const usuario = await this.usuarioRepo.buscarPorId(input.usuarioId);
      if (usuario) {
        nome = usuario.nome;
        foto = usuario.fotoUrl;
      }
    }

    const mensagem = new MensagemChat({
      id: input.id || randomUUID(),
      partidaId: input.partidaId,
      usuarioId: input.usuarioId,
      texto: input.texto,
      usuarioNome: nome || 'Atleta Bora!',
      usuarioFoto: foto || null,
      criadoEm: new Date(),
    });

    const mensagemSalva = await this.mensagemRepo.criar(mensagem);

    if (this.wsNotificationService) {
      this.wsNotificationService.broadcastParaPartida(input.partidaId, 'chat_message', {
        id: mensagemSalva.id,
        partidaId: mensagemSalva.partidaId,
        usuarioId: mensagemSalva.usuarioId,
        usuarioNome: mensagemSalva.usuarioNome,
        usuarioFoto: mensagemSalva.usuarioFoto,
        texto: mensagemSalva.texto,
        criadoEm: mensagemSalva.criadoEm.toISOString(),
      });
    }

    return mensagemSalva;
  }
}
