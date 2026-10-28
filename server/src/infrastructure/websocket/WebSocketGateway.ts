import { FastifyInstance } from 'fastify';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, RawData } from 'ws';
import { IWebSocketNotificationService } from '../../application/repositories/IRepositories';

const CAMINHO_WS = '/ws';
const TAMANHO_MAXIMO_MENSAGEM = 1048576; // 1MB

export class WebSocketGateway implements IWebSocketNotificationService {
  private clientesPorUsuario = new Map<string, Set<WebSocket>>();
  private clientesPorPartida = new Map<string, Set<WebSocket>>();
  private todosClientes = new Set<WebSocket>();

  /**
   * Usa o pacote `ws` diretamente (modo noServer) e intercepta apenas o upgrade
   * da rota /ws no servidor HTTP do Fastify. Evita o @fastify/websocket, que
   * entregava um objeto de conexão incompatível com `socket.send` e causava HTTP 500.
   */
  public register(app: FastifyInstance): void {
    const wss = new WebSocketServer({ noServer: true, maxPayload: TAMANHO_MAXIMO_MENSAGEM });

    app.server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const url = new URL(req.url || '/', 'http://localhost');
      if (url.pathname !== CAMINHO_WS) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });

    wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '/', 'http://localhost');
      const usuarioId = url.searchParams.get('usuarioId') || undefined;
      const partidaId = url.searchParams.get('partidaId') || undefined;

      this.adicionarCliente(socket, usuarioId, partidaId);

      socket.on('message', (messageBuffer: RawData) => {
        try {
          const data = JSON.parse(messageBuffer.toString());

          if (data.type === 'join_room' && data.partidaId) {
            this.adicionarCliente(socket, data.usuarioId || usuarioId, data.partidaId);
            socket.send(JSON.stringify({ event: 'joined_room', partidaId: data.partidaId }));
          }

          if (data.type === 'ping') {
            socket.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
          }
        } catch {
          // Mensagem inválida, ignorar
        }
      });

      socket.on('close', () => this.removerCliente(socket, usuarioId, partidaId));
      socket.on('error', () => this.removerCliente(socket, usuarioId, partidaId));

      // Confirmação de handshake
      socket.send(
        JSON.stringify({
          event: 'connected',
          mensagem: 'Conexão WebSocket Bora! App estabelecida com sucesso.',
          usuarioId,
          partidaId,
        })
      );
    });
  }

  private adicionarCliente(socket: WebSocket, usuarioId?: string, partidaId?: string): void {
    this.todosClientes.add(socket);

    if (usuarioId) {
      const lista = this.clientesPorUsuario.get(usuarioId) || new Set<WebSocket>();
      lista.add(socket);
      this.clientesPorUsuario.set(usuarioId, lista);
    }

    if (partidaId) {
      const lista = this.clientesPorPartida.get(partidaId) || new Set<WebSocket>();
      lista.add(socket);
      this.clientesPorPartida.set(partidaId, lista);
    }
  }

  private removerCliente(socket: WebSocket, usuarioId?: string, partidaId?: string): void {
    this.todosClientes.delete(socket);

    if (usuarioId) {
      const lista = this.clientesPorUsuario.get(usuarioId);
      if (lista) {
        lista.delete(socket);
        if (lista.size === 0) this.clientesPorUsuario.delete(usuarioId);
      }
    }

    if (partidaId) {
      const lista = this.clientesPorPartida.get(partidaId);
      if (lista) {
        lista.delete(socket);
        if (lista.size === 0) this.clientesPorPartida.delete(partidaId);
      }
    }
  }

  public notificarUsuario(usuarioId: string, event: string, payload: any): void {
    const sockets = this.clientesPorUsuario.get(usuarioId);
    if (!sockets || sockets.size === 0) return;

    const mensagem = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(mensagem);
      }
    }
  }

  public broadcastParaPartida(partidaId: string, event: string, payload: any): void {
    const sockets = this.clientesPorPartida.get(partidaId);
    if (!sockets || sockets.size === 0) return;

    const mensagem = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(mensagem);
      }
    }
  }

  public notificarPartidaFinalizada(partidaId: string): void {
    this.broadcastParaPartida(partidaId, 'match_finished', {
      partidaId,
      status: 'Finalizada',
      mensagem: 'A partida foi finalizada. O chat está agora em modo somente leitura.',
      timestamp: new Date().toISOString(),
    });
  }
}
