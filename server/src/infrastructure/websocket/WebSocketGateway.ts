import { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { IWebSocketNotificationService } from '../../application/repositories/IRepositories';

interface ClienteConectado {
  socket: WebSocket;
  usuarioId?: string;
  partidaId?: string;
}

export class WebSocketGateway implements IWebSocketNotificationService {
  private clientesPorUsuario = new Map<string, Set<WebSocket>>();
  private clientesPorPartida = new Map<string, Set<WebSocket>>();
  private todosClientes = new Set<WebSocket>();

  public register(app: FastifyInstance): void {
    app.register(fastifyWebsocket, {
      options: {
        maxPayload: 1048576, // 1MB
      },
    });

    app.get('/ws', { websocket: true }, (connection: any, req) => {
      const socket: WebSocket = connection?.socket || connection;
      if (!socket || typeof socket.send !== 'function') {
        return;
      }
      const query = (req.query || {}) as { usuarioId?: string; partidaId?: string };
      const usuarioId = query.usuarioId;
      const partidaId = query.partidaId;

      this.adicionarCliente(socket, usuarioId, partidaId);

      socket.on('message', (messageBuffer: Buffer) => {
        try {
          const raw = messageBuffer.toString();
          const data = JSON.parse(raw);

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

      socket.on('close', () => {
        this.removerCliente(socket, usuarioId, partidaId);
      });

      socket.on('error', () => {
        this.removerCliente(socket, usuarioId, partidaId);
      });

      // Envia confirmação de handshake
      try {
        socket.send(
          JSON.stringify({
            event: 'connected',
            mensagem: 'Conexão WebSocket Bora! App estabelecida com sucesso.',
            usuarioId,
            partidaId,
          })
        );
      } catch (e) {
        // silencia se conexao fechar
      }
    });
  }

  private adicionarCliente(socket: WebSocket, usuarioId?: string, partidaId?: string): void {
    this.todosClientes.add(socket);

    if (usuarioId) {
      const lista = this.clientesPorUsuario.get(usuarioId) || new Set();
      lista.add(socket);
      this.clientesPorUsuario.set(usuarioId, lista);
    }

    if (partidaId) {
      const lista = this.clientesPorPartida.get(partidaId) || new Set();
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
