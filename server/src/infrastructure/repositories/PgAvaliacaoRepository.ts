import { db } from '../database/connection';
import { Avaliacao } from '../../domain/entities/Avaliacao';
import { IAvaliacaoRepository, IAvaliacaoDetalhada } from '../../application/repositories/IRepositories';

export class PgAvaliacaoRepository implements IAvaliacaoRepository {
  private memoriaFallback = new Map<string, Avaliacao>();

  public async salvarOuAtualizar(avaliacao: Avaliacao): Promise<void> {
    try {
      const query = `
        INSERT INTO avaliacao (id, partida_id, avaliador_id, avaliado_id, nota, comentario, data_avaliacao)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (partida_id, avaliador_id, avaliado_id) DO UPDATE 
        SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, data_avaliacao = NOW();
      `;
      await db.query(query, [
        avaliacao.id,
        avaliacao.partidaId,
        avaliacao.avaliadorId,
        avaliacao.avaliadoId,
        avaliacao.nota,
        avaliacao.comentario || ''
      ]);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível. Armazenando avaliação em memória:', err.message);
    }
    const chave = `${avaliacao.partidaId}_${avaliacao.avaliadorId}_${avaliacao.avaliadoId}`;
    this.memoriaFallback.set(chave, avaliacao);
  }

  public async listarTodasDetalhes(): Promise<IAvaliacaoDetalhada[]> {
    try {
      const res = await db.query(`
        SELECT 
          a.id,
          a.nota,
          a.comentario,
          a.data_avaliacao as "dataAvaliacao",
          u1.id as "avaliadorId",
          u1.nome as "avaliadorNome",
          u1.foto_url as "avaliadorFoto",
          u2.id as "avaliadoId",
          u2.nome as "avaliadoNome",
          u2.foto_url as "avaliadoFoto",
          p.id as "partidaId",
          p.esporte as "partidaEsporte",
          p.bairro as "partidaBairro"
        FROM avaliacao a
        JOIN usuario u1 ON a.avaliador_id = u1.id
        JOIN usuario u2 ON a.avaliado_id = u2.id
        LEFT JOIN partida p ON a.partida_id = p.id
        WHERE u1.deletado_em IS NULL AND u2.deletado_em IS NULL
        ORDER BY a.data_avaliacao DESC;
      `);
      if (res.rows.length > 0) return res.rows;
    } catch (err: any) {
      console.warn('Falha ao listar avaliações no PostgreSQL:', err.message);
    }
    return [];
  }

  public async calcularMediaETotal(avaliadoId: string): Promise<{ notaMedia: number; totalAvaliacoes: number }> {
    try {
      const res = await db.query(`
        SELECT 
          COALESCE(ROUND(AVG(nota)::numeric, 2), 5.00) as "notaMedia",
          COUNT(*) as "totalAvaliacoes"
        FROM avaliacao
        WHERE avaliado_id = $1;
      `, [avaliadoId]);

      if (res.rows.length > 0) {
        return {
          notaMedia: Number(res.rows[0].notaMedia),
          totalAvaliacoes: parseInt(res.rows[0].totalAvaliacoes, 10),
        };
      }
    } catch (err: any) {
      console.warn('Falha ao calcular média no PostgreSQL:', err.message);
    }

    const avaliacoesDoAtleta = Array.from(this.memoriaFallback.values()).filter(
      (a) => a.avaliadoId === avaliadoId
    );
    const total = avaliacoesDoAtleta.length;
    if (total === 0) return { notaMedia: 5.0, totalAvaliacoes: 0 };
    const soma = avaliacoesDoAtleta.reduce((acc, curr) => acc + curr.nota, 0);
    return {
      notaMedia: Number((soma / total).toFixed(2)),
      totalAvaliacoes: total,
    };
  }
}
