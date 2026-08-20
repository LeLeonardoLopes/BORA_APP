import { db } from '../database/connection';
import { Solicitacao } from '../../domain/entities/Solicitacao';
import { ISolicitacaoRepository } from '../../application/repositories/IRepositories';
import { StatusSolicitacaoEnum } from '../../domain/enums/StatusEnums';

export class PgSolicitacaoRepository implements ISolicitacaoRepository {
  public async criar(solicitacao: Solicitacao): Promise<Solicitacao> {
    const query = 'INSERT INTO solicitacao (id, partida_id, usuario_id, status_solicitacao, data_requisicao) VALUES (, , , , ) RETURNING *;';
    await db.query(query, [
      solicitacao.id, solicitacao.partidaId, solicitacao.usuarioId,
      solicitacao.statusSolicitacao, solicitacao.dataRequisicao
    ]);
    return solicitacao;
  }

  public async buscarPorId(id: string): Promise<Solicitacao | null> {
    const res = await db.query('SELECT * FROM solicitacao WHERE id = ', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async buscarPorPartidaEUsuario(partidaId: string, usuarioId: string): Promise<Solicitacao | null> {
    const res = await db.query('SELECT * FROM solicitacao WHERE partida_id =  AND usuario_id = ', [partidaId, usuarioId]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async listarPorPartida(partidaId: string): Promise<Solicitacao[]> {
    const res = await db.query('SELECT * FROM solicitacao WHERE partida_id =  ORDER BY data_requisicao ASC', [partidaId]);
    return res.rows.map(this.mapToEntity);
  }

  public async listarPorUsuario(usuarioId: string): Promise<Solicitacao[]> {
    const res = await db.query('SELECT * FROM solicitacao WHERE usuario_id =  ORDER BY data_requisicao DESC', [usuarioId]);
    return res.rows.map(this.mapToEntity);
  }

  public async atualizar(solicitacao: Solicitacao): Promise<void> {
    const query = 'UPDATE solicitacao SET status_solicitacao = , data_decisao =  WHERE id = ;';
    await db.query(query, [solicitacao.statusSolicitacao, solicitacao.dataDecisao, solicitacao.id]);
  }

  public async verificarConflitoHorario(usuarioId: string, dataHoraPartida: Date): Promise<boolean> {
    const query = 'SELECT COUNT(*) FROM solicitacao s INNER JOIN partida p ON s.partida_id = p.id WHERE s.usuario_id =  AND s.status_solicitacao = \'Aprovada\' AND p.status_partida IN (\'Publicada\', \'Lotada\', \'Em_Andamento\') AND p.data_hora BETWEEN (::timestamp - INTERVAL \'2 hours\') AND (::timestamp + INTERVAL \'2 hours\');';
    const res = await db.query(query, [usuarioId, dataHoraPartida]);
    return parseInt(res.rows[0].count, 10) > 0;
  }

  private mapToEntity(r: any): Solicitacao {
    return new Solicitacao({
      id: r.id,
      partidaId: r.partida_id,
      usuarioId: r.usuario_id,
      statusSolicitacao: r.status_solicitacao as StatusSolicitacaoEnum,
      dataRequisicao: new Date(r.data_requisicao),
      dataDecisao: r.data_decisao ? new Date(r.data_decisao) : null,
    });
  }
}
