import { db } from '../database/connection';
import { Partida } from '../../domain/entities/Partida';
import { IPartidaRepository } from '../../application/repositories/IRepositories';
import { StatusPartidaEnum } from '../../domain/enums/StatusEnums';

export class PgPartidaRepository implements IPartidaRepository {
  private memoriaFallback = new Map<string, Partida>();

  constructor() {
    this.removerPartidasDemonstracaoAntigas().catch(() => {});
  }

  /**
   * As partidas de demonstração (ids 22222222-2222-2222-2222-2222222222xx) foram removidas do sistema.
   * Caso ainda existam no banco de execuções anteriores, são arquivadas para não aparecerem mais.
   */
  private async removerPartidasDemonstracaoAntigas(): Promise<void> {
    try {
      await db.query(`
        UPDATE partida
        SET deletado_em = NOW(), status_partida = 'Cancelada', atualizado_em = NOW()
        WHERE deletado_em IS NULL
          AND id::text LIKE '22222222-2222-2222-2222-2222222222%';
      `);
    } catch {
      // Silencioso caso PostgreSQL esteja offline
    }
  }

  public async criar(partida: Partida): Promise<Partida> {
    try {
      const query = `
        INSERT INTO partida (
          id, organizador_id, esporte, descricao, data_hora, duracao_minutos,
          max_vagas, vagas_preenchidas, filtro_genero, filtro_nivel, endereco_completo, 
          bairro, cidade, lat, lng, localizacao, status_partida
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          $7, $8, $9, $10, $11, 
          $12, $13, $14::numeric, $15::numeric, 
          ST_SetSRID(ST_MakePoint($15::double precision, $14::double precision), 4326), 
          $16
        ) 
        RETURNING *;
      `;
      await db.query(query, [
        partida.id,
        partida.organizadorId,
        partida.esporte,
        partida.descricao,
        partida.dataHora,
        partida.duracaoMinutos,
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
    } catch (err: any) {
      console.error('[ERRO BANCO] Falha ao gravar partida no PostgreSQL. Registro mantido apenas em memória:', err.message);
    }
    this.memoriaFallback.set(partida.id, partida);
    return partida;
  }

  public async buscarPorId(id: string): Promise<Partida | null> {
    try {
      const res = await db.query('SELECT * FROM partida WHERE id = $1 AND deletado_em IS NULL', [id]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return this.memoriaFallback.get(id) || null;
  }

  /** Partidas mantidas em memória (criadas quando o banco falhou) que atendem aos filtros. */
  private filtrarMemoria(
    lat: number,
    lng: number,
    raioMetros: number,
    esporte?: string,
    endereco?: string
  ): Partida[] {
    const todas = Array.from(this.memoriaFallback.values());
    const raioKm = raioMetros / 1000;
    const limiteTolerancia = Date.now() - 15 * 60 * 1000;

    return todas.filter((p) => {
      if (p.statusPartida !== StatusPartidaEnum.PUBLICADA && p.statusPartida !== StatusPartidaEnum.LOTADA) {
        return false;
      }
      if (p.dataHora.getTime() < limiteTolerancia) {
        return false;
      }
      if (esporte && !p.esporte.toLowerCase().includes(esporte.toLowerCase())) {
        return false;
      }
      if (endereco && !p.bairro.toLowerCase().includes(endereco.toLowerCase()) && !p.enderecoCompleto.toLowerCase().includes(endereco.toLowerCase())) {
        return false;
      }
      const dLat = ((p.lat - lat) * Math.PI) / 180;
      const dLng = ((p.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = 6371 * c;
      return dist <= raioKm;
    });
  }

  /** Junta o resultado do banco com partidas só em memória (sem duplicar ids). */
  private mesclarComMemoria(
    doBanco: Partida[],
    lat: number,
    lng: number,
    raioMetros: number,
    esporte?: string,
    endereco?: string
  ): Partida[] {
    const ids = new Set(doBanco.map((p) => p.id));
    const extras = this.filtrarMemoria(lat, lng, raioMetros, esporte, endereco).filter((p) => !ids.has(p.id));
    return [...doBanco, ...extras];
  }

  public async buscarPorRaio(
    lat: number,
    lng: number,
    raioMetros: number,
    esporte?: string,
    endereco?: string
  ): Promise<Partida[]> {
    try {
      let query = `
        SELECT *,
          ST_Distance(
            COALESCE(localizacao, ST_SetSRID(ST_MakePoint(lng, lat), 4326))::geography,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          ) / 1000.0 AS distancia_km
        FROM partida
        WHERE status_partida IN ('Publicada', 'Lotada')
          AND deletado_em IS NULL
          AND data_hora > (NOW() - INTERVAL '15 minutes')
          AND ST_DWithin(
            COALESCE(localizacao, ST_SetSRID(ST_MakePoint(lng, lat), 4326))::geography,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
            $3
          )
      `;
      const params: any[] = [lat, lng, raioMetros];

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
      return this.mesclarComMemoria(res.rows.map(this.mapToEntity), lat, lng, raioMetros, esporte, endereco);
    } catch (err: any) {
      console.warn('Falha na consulta PostGIS ST_DWithin. Tentando consulta por fórmula esférica (Haversine):', err.message);

      try {
        let haversineQuery = `
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
            AND deletado_em IS NULL
            AND data_hora > (NOW() - INTERVAL '15 minutes')
        `;
        const params: any[] = [lat, lng];

        if (esporte) {
          params.push(esporte);
          haversineQuery += ` AND esporte ILIKE $${params.length}`;
        }

        if (endereco && endereco.trim()) {
          params.push(`%${endereco.trim()}%`);
          const pIdx = params.length;
          haversineQuery += ` AND (bairro ILIKE $${pIdx} OR endereco_completo ILIKE $${pIdx} OR cidade ILIKE $${pIdx})`;
        }

        haversineQuery += ` ORDER BY distancia_km ASC;`;

        const res = await db.query(haversineQuery, params);
        const raioKm = raioMetros / 1000;
        const filtradas = res.rows
          .filter((r: any) => Number(r.distancia_km) <= raioKm)
          .map(this.mapToEntity);
        return this.mesclarComMemoria(filtradas, lat, lng, raioMetros, esporte, endereco);
      } catch (sqlErr: any) {
        console.warn('Falha no fallback SQL Haversine. Buscando no fallback em memória:', sqlErr.message);
      }
    }

    // Fallback em memória (banco indisponível): somente partidas reais criadas pelos usuários
    return this.filtrarMemoria(lat, lng, raioMetros, esporte, endereco);
  }

  public async buscarPartidasExpiradas(agora: Date = new Date()): Promise<Partida[]> {
    try {
      const query = `
        SELECT * FROM partida 
        WHERE status_partida IN ('Publicada', 'Lotada', 'Em_Andamento')
          AND deletado_em IS NULL
          AND (data_hora + (COALESCE(duracao_minutos, 90) || ' minutes')::interval) <= $1;
      `;
      const res = await db.query(query, [agora]);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
    } catch (err: any) {
      console.warn('Falha na busca de partidas expiradas no PostgreSQL:', err.message);
    }

    const agoraTime = agora.getTime();
    return Array.from(this.memoriaFallback.values()).filter((p) => {
      const isAtiva =
        p.statusPartida === StatusPartidaEnum.PUBLICADA ||
        p.statusPartida === StatusPartidaEnum.LOTADA ||
        p.statusPartida === StatusPartidaEnum.EM_ANDAMENTO;
      if (!isAtiva) return false;
      const fimPartida = p.dataHora.getTime() + (p.duracaoMinutos || 90) * 60000;
      return fimPartida <= agoraTime;
    });
  }

  public async atualizar(partida: Partida): Promise<void> {
    try {
      const query = 'UPDATE partida SET vagas_preenchidas = $1, status_partida = $2, atualizado_em = NOW() WHERE id = $3;';
      await db.query(query, [partida.vagasPreenchidas, partida.statusPartida, partida.id]);
    } catch (err: any) {
      console.warn('Falha na atualização PostgreSQL. Atualizando no fallback em memória:', err.message);
    }
    this.memoriaFallback.set(partida.id, partida);
  }

  public async softDelete(id: string, usuarioId: string): Promise<void> {
    try {
      const query = `
        UPDATE partida 
        SET deletado_em = NOW(), deletado_por_id = $2, status_partida = 'Cancelada', atualizado_em = NOW() 
        WHERE id = $1;
      `;
      await db.query(query, [id, usuarioId]);
    } catch (err: any) {
      console.warn('Falha no softDelete de partida no PostgreSQL:', err.message);
    }
    this.memoriaFallback.delete(id);
  }

  public async verificarConflitoHorarioOrganizador(
    organizadorId: string,
    dataHora: Date,
    duracaoMinutos = 90
  ): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*)
        FROM partida
        WHERE organizador_id = $1
          AND status_partida IN ('Publicada', 'Lotada', 'Em_Andamento')
          AND deletado_em IS NULL
          AND (
            data_hora BETWEEN ($2::timestamp - (COALESCE(duracao_minutos, 90) || ' minutes')::interval)
                          AND ($2::timestamp + ($3 || ' minutes')::interval)
          );
      `;
      const res = await db.query(query, [organizadorId, dataHora, duracaoMinutos]);
      return parseInt(res.rows[0].count, 10) > 0;
    } catch (err: any) {
      console.warn('Falha ao verificar conflito de agenda do organizador no PostgreSQL:', err.message);
      const inicioNova = dataHora.getTime();
      const fimNova = inicioNova + duracaoMinutos * 60000;

      return Array.from(this.memoriaFallback.values()).some((p) => {
        if (p.organizadorId !== organizadorId) return false;
        if (p.statusPartida === StatusPartidaEnum.CANCELADA || p.statusPartida === StatusPartidaEnum.FINALIZADA) return false;
        const inicioExistente = p.dataHora.getTime();
        const fimExistente = inicioExistente + (p.duracaoMinutos || 90) * 60000;
        return inicioNova < fimExistente && fimNova > inicioExistente;
      });
    }
  }

  private mapToEntity(r: any): Partida {
    return new Partida({
      id: r.id,
      organizadorId: r.organizador_id,
      esporte: r.esporte,
      descricao: r.descricao,
      dataHora: new Date(r.data_hora),
      duracaoMinutos: r.duracao_minutos != null ? Number(r.duracao_minutos) : 90,
      maxVagas: Number(r.max_vagas),
      vagasPreenchidas: Number(r.vagas_preenchidas),
      filtroGenero: r.filtro_genero,
      filtroNivel: r.filtro_nivel,
      enderecoCompleto: r.endereco_completo,
      bairro: r.bairro,
      cidade: r.cidade,
      lat: Number(r.lat),
      lng: Number(r.lng),
      statusPartida: r.status_partida as StatusPartidaEnum,
      formatoJogo: r.formato_jogo,
      tipoLocal: r.tipo_local,
      taxaCampo: r.taxa_campo ? Number(r.taxa_campo) : 0,
      taxaJuiz: r.taxa_juiz ? Number(r.taxa_juiz) : 0,
      criadoEm: new Date(r.criado_em),
      atualizadoEm: new Date(r.atualizado_em),
    });
  }
}
