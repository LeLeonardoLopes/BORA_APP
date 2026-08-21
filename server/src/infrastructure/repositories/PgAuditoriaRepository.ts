import { db } from '../database/connection';
import { AuditoriaLog, TipoOperacaoAuditoria } from '../../domain/entities/AuditoriaLog';
import { IAuditoriaRepository } from '../../application/repositories/IRepositories';

export class PgAuditoriaRepository implements IAuditoriaRepository {
  private memoriaFallback: AuditoriaLog[] = [];

  public async salvar(log: AuditoriaLog): Promise<AuditoriaLog> {
    try {
      const query = `
        INSERT INTO auditoria_log (
          id, tabela_nome, registro_id, operacao, usuario_id,
          dados_anteriores, dados_novos, campos_alterados, criado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      await db.query(query, [
        log.id,
        log.tabelaNome,
        log.registroId,
        log.operacao,
        log.usuarioId || null,
        log.dadosAnteriores ? JSON.stringify(log.dadosAnteriores) : null,
        log.dadosNovos ? JSON.stringify(log.dadosNovos) : null,
        log.camposAlterados || null,
        log.criadoEm,
      ]);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível para auditoria. Armazenando log em memória:', err.message);
    }

    this.memoriaFallback.unshift(log);
    return log;
  }

  public async listarPorRegistro(tabelaNome: string, registroId: string): Promise<AuditoriaLog[]> {
    try {
      const query = `
        SELECT 
          id,
          tabela_nome as "tabelaNome",
          registro_id as "registroId",
          operacao,
          usuario_id as "usuarioId",
          dados_anteriores as "dadosAnteriores",
          dados_novos as "dadosNovos",
          campos_alterados as "camposAlterados",
          criado_em as "criadoEm"
        FROM auditoria_log
        WHERE tabela_nome = $1 AND registro_id = $2
        ORDER BY criado_em DESC;
      `;
      const res = await db.query(query, [tabelaNome, registroId]);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
    } catch (err: any) {
      console.warn('Falha na consulta de auditoria por registro no PostgreSQL:', err.message);
    }

    return this.memoriaFallback.filter(
      (l) => l.tabelaNome.toLowerCase() === tabelaNome.toLowerCase() && l.registroId === registroId
    );
  }

  public async listarRecentes(limite: number = 50): Promise<AuditoriaLog[]> {
    try {
      const query = `
        SELECT 
          id,
          tabela_nome as "tabelaNome",
          registro_id as "registroId",
          operacao,
          usuario_id as "usuarioId",
          dados_anteriores as "dadosAnteriores",
          dados_novos as "dadosNovos",
          campos_alterados as "camposAlterados",
          criado_em as "criadoEm"
        FROM auditoria_log
        ORDER BY criado_em DESC
        LIMIT $1;
      `;
      const res = await db.query(query, [limite]);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
    } catch (err: any) {
      console.warn('Falha na consulta de auditoria recente no PostgreSQL:', err.message);
    }

    return this.memoriaFallback.slice(0, limite);
  }

  private mapToEntity(r: any): AuditoriaLog {
    return new AuditoriaLog({
      id: r.id,
      tabelaNome: r.tabelaNome,
      registroId: r.registroId,
      operacao: r.operacao as TipoOperacaoAuditoria,
      usuarioId: r.usuarioId,
      dadosAnteriores: typeof r.dadosAnteriores === 'string' ? JSON.parse(r.dadosAnteriores) : r.dadosAnteriores,
      dadosNovos: typeof r.dadosNovos === 'string' ? JSON.parse(r.dadosNovos) : r.dadosNovos,
      camposAlterados: r.camposAlterados,
      criadoEm: new Date(r.criadoEm),
    });
  }
}
