import { db } from '../database/connection';
import { Partida } from '../../domain/entities/Partida';
import { IPartidaRepository } from '../../application/repositories/IRepositories';
import { StatusPartidaEnum } from '../../domain/enums/StatusEnums';

export class PgPartidaRepository implements IPartidaRepository {
  public async criar(partida: Partida): Promise<Partida> {
    const query = `
      INSERT INTO partida (
        id, organizador_id, esporte, descricao, data_hora, max_vagas, 
        vagas_preenchidas, filtro_genero, filtro_nivel, endereco_completo, 
        bairro, cidade, lat, lng, status_partida
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *;
    `;
    await db.query(query, [
      partida.id,
      partida.organizadorId,
      partida.esporte,
      partida.descricao,
      partida.dataHora,
      partida.maxVagas,
      partida.vagasPreenchidas,
      partida.filtroGenero,
      partida.filtroNivel,
      partida.enderecoCompleto,
      partida.bairro,
      partida.cidade,
      partida.lat,
      partida.lng,
      partida.statusPartida,
    ]);
    return partida;
  }

  public async buscarPorId(id: string): Promise<Partida | null> {
    const res = await db.query('SELECT * FROM partida WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async buscarPorRaio(
    lat: number,
    lng: number,
    raioMetros: number,
    esporte?: string,
    endereco?: string
  ): Promise<Partida[]> {
    let query = `
      SELECT *,
        (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($1)) * cos(radians(lat)) *
            cos(radians(lng) - radians($2)) +
            sin(radians($1)) * sin(radians(lat))
          ))
        )) AS distancia_km
      FROM partida
      WHERE status_partida IN ('Publicada', 'Lotada')
    `;
    const params: any[] = [lat, lng];

    if (esporte) {
      params.push(esporte);
      query += ` AND esporte ILIKE $${params.length}`;
    }

    if (endereco && endereco.trim()) {
      params.push(`%${endereco.trim()}%`);
      const pIdx = params.length;
      query += ` AND (bairro ILIKE $${pIdx} OR endereco_completo ILIKE $${pIdx} OR cidade ILIKE $${pIdx})`;
    }

    query += ` ORDER BY distancia_km ASC;`;

    const res = await db.query(query, params);
    return res.rows.map(this.mapToEntity);
  }

  public async atualizar(partida: Partida): Promise<void> {
    const query = 'UPDATE partida SET vagas_preenchidas = $1, status_partida = $2, atualizado_em = NOW() WHERE id = $3;';
    await db.query(query, [partida.vagasPreenchidas, partida.statusPartida, partida.id]);
  }

  private mapToEntity(r: any): Partida {
    return new Partida({
      id: r.id,
      organizadorId: r.organizador_id,
      esporte: r.esporte,
      descricao: r.descricao,
      dataHora: new Date(r.data_hora),
      maxVagas: r.max_vagas,
      vagasPreenchidas: r.vagas_preenchidas,
      filtroGenero: r.filtro_genero,
      filtroNivel: r.filtro_nivel,
      enderecoCompleto: r.endereco_completo,
      bairro: r.bairro,
      cidade: r.cidade,
      lat: Number(r.lat),
      lng: Number(r.lng),
      statusPartida: r.status_partida as StatusPartidaEnum,
      criadoEm: new Date(r.criado_em),
      atualizadoEm: new Date(r.atualizado_em),
    });
  }
}
