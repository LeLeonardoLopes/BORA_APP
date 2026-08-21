import { db } from '../database/connection';
import { MensagemChat } from '../../domain/entities/MensagemChat';
import { IMensagemChatRepository } from '../../application/repositories/IRepositories';

export class PgMensagemChatRepository implements IMensagemChatRepository {
  private memoriaFallback = new Map<string, MensagemChat[]>();

  public async criar(mensagem: MensagemChat): Promise<MensagemChat> {
    try {
      const query = `
        INSERT INTO mensagem_chat (id, partida_id, usuario_id, texto, criado_em)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      await db.query(query, [
        mensagem.id,
        mensagem.partidaId,
        mensagem.usuarioId,
        mensagem.texto,
        mensagem.criadoEm,
      ]);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível para chat. Armazenando mensagem em memória:', err.message);
    }

    const lista = this.memoriaFallback.get(mensagem.partidaId) || [];
    lista.push(mensagem);
    this.memoriaFallback.set(mensagem.partidaId, lista);
    return mensagem;
  }

  public async listarPorPartida(partidaId: string): Promise<MensagemChat[]> {
    try {
      const query = `
        SELECT 
          m.id,
          m.partida_id as "partidaId",
          m.usuario_id as "usuarioId",
          m.texto,
          m.criado_em as "criadoEm",
          u.nome as "usuarioNome",
          u.foto_url as "usuarioFoto"
        FROM mensagem_chat m
        LEFT JOIN usuario u ON m.usuario_id = u.id
        WHERE m.partida_id = $1
        ORDER BY m.criado_em ASC;
      `;
      const res = await db.query(query, [partidaId]);
      if (res.rows.length > 0) {
        return res.rows.map(
          (r: any) =>
            new MensagemChat({
              id: r.id,
              partidaId: r.partidaId,
              usuarioId: r.usuarioId,
              texto: r.texto,
              usuarioNome: r.usuarioNome,
              usuarioFoto: r.usuarioFoto,
              criadoEm: new Date(r.criadoEm),
            })
        );
      }
    } catch (err: any) {
      console.warn('Falha ao listar mensagens de chat no PostgreSQL:', err.message);
    }

    return this.memoriaFallback.get(partidaId) || [];
  }
}
