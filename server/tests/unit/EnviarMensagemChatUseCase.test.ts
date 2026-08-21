import { EnviarMensagemChatUseCase } from '../../src/application/use-cases/EnviarMensagemChatUseCase';
import { MensagemChat } from '../../src/domain/entities/MensagemChat';
import { IMensagemChatRepository, IUsuarioRepository, IWebSocketNotificationService } from '../../src/application/repositories/IRepositories';

describe('Caso de Uso: EnviarMensagemChatUseCase', () => {
  let fakeMensagemRepo: jest.Mocked<IMensagemChatRepository>;
  let fakeUsuarioRepo: jest.Mocked<IUsuarioRepository>;
  let fakeWsService: jest.Mocked<IWebSocketNotificationService>;
  let useCase: EnviarMensagemChatUseCase;

  beforeEach(() => {
    fakeMensagemRepo = {
      criar: jest.fn().mockImplementation(async (m: MensagemChat) => m),
      listarPorPartida: jest.fn(),
    };

    fakeUsuarioRepo = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      listarTodos: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
    };

    fakeWsService = {
      notificarUsuario: jest.fn(),
      broadcastParaPartida: jest.fn(),
      notificarPartidaFinalizada: jest.fn(),
    };

    useCase = new EnviarMensagemChatUseCase(fakeMensagemRepo, fakeUsuarioRepo, fakeWsService);
  });

  it('deve enviar mensagem de chat e emitir broadcast para os atletas da partida', async () => {
    const mensagem = await useCase.execute({
      partidaId: 'partida-chat-1',
      usuarioId: 'user-autor-1',
      texto: 'E aí pessoal, todos confirmados?',
      usuarioNome: 'Lucas Atleta',
      usuarioFoto: 'https://exemplo.com/foto.jpg',
    });

    expect(mensagem.texto).toBe('E aí pessoal, todos confirmados?');
    expect(fakeMensagemRepo.criar).toHaveBeenCalled();
    expect(fakeWsService.broadcastParaPartida).toHaveBeenCalledWith(
      'partida-chat-1',
      'chat_message',
      expect.objectContaining({
        partidaId: 'partida-chat-1',
        usuarioId: 'user-autor-1',
        texto: 'E aí pessoal, todos confirmados?',
      })
    );
  });

  it('deve lançar erro se o texto da mensagem for vazio', async () => {
    await expect(
      useCase.execute({
        partidaId: 'partida-chat-1',
        usuarioId: 'user-autor-1',
        texto: '   ',
      })
    ).rejects.toThrow('O conteúdo da mensagem não pode ser vazio.');
  });
});
