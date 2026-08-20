import { db } from '../database/connection';
import { Partida } from '../../domain/entities/Partida';
import { IPartidaRepository } from '../../application/repositories/IRepositories';
import { StatusPartidaEnum } from '../../domain/enums/StatusEnums';

export class PgPartidaRepository implements IPartidaRepository {
  public async criar(partida: Partida): Promise<Partida> {
    const query = 'INSERT INTO partida (id, organizador_id, esporte, descricao, data_hora, max_vagas, vagas_preenchidas, filtro_genero, filtro_nivel, endereco_completo, bairro, cidade, lat, lng, geom, status_partida) VALUES (, , , , , , , , , , , , , , ST_SetSRID(ST_MakePoint(, ), 4326)::geography, ) RETURNING *;';
    await db.query(query, [
      partida.id, partida.organizadorId, partida.esporte, partida.descricao,
      partida.dataHora, partida.maxVagas, partida.vagasPreenchidas,
      partida.filtroGenero, partida.filtroNivel, partida.enderecoCompleto,
      partida.bairro, partida.cidade, partida.lat, partida.lng, partida.statusPartida
    ]);
    return partida;
  }

  public async buscarPorId(id: string): Promise<Partida | null> {
    const res = await db.query('SELECT * FROM partida WHERE id = ', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async buscarPorRaio(lat: number, lng: number, raioMetros: number, esporte?: string): Promise<Partida[]> {
    let query = 'SELECT * FROM partida WHERE status_partida =  AND data_hora > NOW() AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint(, ), 4326)::geography, )';
    const params: any[] = ['Publicada', lat, lng, raioMetros];

    if (esporte) {
      params.push(esporte);
      query += ' AND esporte ILIKE $' + String(params.length);
    }

    query += ' ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(, ), 4326)::geography) ASC;';

    const res = await db.query(query, params);
    return res.rows.map(this.mapToEntity);
  }

  public async atualizar(partida: Partida): Promise<void> {
    const query = 'UPDATE partida SET vagas_preenchidas = , status_partida = , atualizado_em = NOW() WHERE id = ;';
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
