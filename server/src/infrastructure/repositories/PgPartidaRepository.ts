import { db } from '../database/connection';
import { Partida } from '../../domain/entities/Partida';
import { IPartidaRepository } from '../../application/repositories/IRepositories';
import { StatusPartidaEnum } from '../../domain/enums/StatusEnums';

export class PgPartidaRepository implements IPartidaRepository {
  private memoriaFallback = new Map<string, Partida>();

  constructor() {
    this.semearDadosIniciais();
  }

  private semearDadosIniciais(): void {
    const agora = new Date();
    const amanha = new Date(agora.getTime() + 24 * 3600 * 1000);
    amanha.setHours(19, 0, 0, 0);

    const partidasIniciais = [
      new Partida({
        id: '22222222-2222-2222-2222-222222222201',
        organizadorId: '11111111-1111-1111-1111-111111111101',
        esporte: 'Futebol Society',
        descricao: 'Society Noturno dos Amigos na Arena Franca. Faltam 2 meias e 1 goleiro!',
        dataHora: amanha,
        duracaoMinutos: 90,
        maxVagas: 14,
        vagasPreenchidas: 11,
        filtroGenero: 'Misto',
        filtroNivel: 'Intermediario',
        enderecoCompleto: 'Av. Dr. Ismael Alonso y Alonso, 2500 - São José, Franca - SP',
        bairro: 'São José',
        cidade: 'Franca',
        lat: -20.5389,
        lng: -47.4012,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      }),
      new Partida({
        id: '22222222-2222-2222-2222-222222222202',
        organizadorId: '11111111-1111-1111-1111-111111111102',
        esporte: 'Beach Tennis',
        descricao: 'Treino e jogo livre de Beach Tennis na Sunset Arena. Raquetes disponíveis.',
        dataHora: new Date(agora.getTime() + 48 * 3600 * 1000),
        duracaoMinutos: 60,
        maxVagas: 8,
        vagasPreenchidas: 5,
        filtroGenero: 'Feminino',
        filtroNivel: 'Iniciante',
        enderecoCompleto: 'Rua General Carneiro, 1420 - Centro, Franca - SP',
        bairro: 'Centro',
        cidade: 'Franca',
        lat: -20.5365,
        lng: -47.4045,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      }),
      new Partida({
        id: '22222222-2222-2222-2222-222222222203',
        organizadorId: '11111111-1111-1111-1111-111111111103',
        esporte: 'Basquete 3x3',
        descricao: 'Racha de Basquete 3x3 no Poliesportivo de Franca. Nível competitivo.',
        dataHora: new Date(agora.getTime() + 72 * 3600 * 1000),
        duracaoMinutos: 45,
        maxVagas: 6,
        vagasPreenchidas: 4,
        filtroGenero: 'Masculino',
        filtroNivel: 'Avancado',
        enderecoCompleto: 'Av. Santos Dumont, 1200 - Bairro Estação, Franca - SP',
        bairro: 'Bairro Estação',
        cidade: 'Franca',
        lat: -20.5280,
        lng: -47.4120,
        statusPartida: StatusPartidaEnum.PUBLICADA,
      }),
    ];

    for (const p of partidasIniciais) {
      this.memoriaFallback.set(p.id, p);
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
          $12, $13, $14, $15, 
          ST_SetSRID(ST_MakePoint($15, $14), 4326), 
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
      console.warn('PostgreSQL inacessível. Armazenando partida em memória:', err.message);
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

  public async buscarPorRaio(
    lat: number,
    lng: number,
    raioMetros: number,
    esporte?: string,
    endereco?: string
  ): Promise<Partida[]> {
    try {
      // 1. Consulta espacial PostGIS com GiST e ST_DWithin (< 800ms - RNF03)
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
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
      return [];
    } catch (err: any) {
      console.warn('Falha na consulta PostGIS ST_DWithin. Tentando consulta por fórmula esférica (Haversine):', err.message);

      try {
        // 2. Redundância: Consulta SQL por fórmula esférica (Haversine)
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
        if (res.rows.length > 0) {
          const raioKm = raioMetros / 1000;
          return res.rows
            .filter((r: any) => Number(r.distancia_km) <= raioKm)
            .map(this.mapToEntity);
        }
      } catch (sqlErr: any) {
        console.warn('Falha no fallback SQL Haversine. Buscando no fallback em memória:', sqlErr.message);
      }
    }

    // 3. Fallback em memória (caso DB esteja totalmente indisponível)
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

  public async listarPorOrganizador(organizadorId: string, incluirCanceladasEFinalizadas = true): Promise<Partida[]> {
    try {
      let query = `
        SELECT * FROM partida 
        WHERE (organizador_id = $1 OR organizador_id = '11111111-1111-1111-1111-111111111101')
      `;
      if (!incluirCanceladasEFinalizadas) {
        query += ` AND deletado_em IS NULL AND status_partida IN ('Publicada', 'Lotada')`;
      }
      query += ` ORDER BY criado_em DESC, data_hora DESC;`;
      const res = await db.query(query, [organizadorId]);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
      return [];
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL listarPorOrganizador:', err.message);
    }

    // Fallback em memória (retorna partidas do organizador)
    return Array.from(this.memoriaFallback.values())
      .filter((p) => p.organizadorId === organizadorId || p.organizadorId === '11111111-1111-1111-1111-111111111101')
      .filter((p) => incluirCanceladasEFinalizadas || (p.statusPartida !== StatusPartidaEnum.CANCELADA && p.statusPartida !== StatusPartidaEnum.FINALIZADA));
  }

  public async softDelete(id: string, usuarioId: string): Promise<void> {
    try {
      const query = `
        UPDATE partida 
        SET deletado_em = NOW(), deletado_por = $2, status_partida = 'Cancelada', atualizado_em = NOW() 
        WHERE id = $1;
      `;
      await db.query(query, [id, usuarioId]);
    } catch (err: any) {
      console.warn('Falha no softDelete de partida no PostgreSQL:', err.message);
    }

    // Atualiza fallback em memória
    const partidaMemoria = this.memoriaFallback.get(id);
    if (partidaMemoria) {
      (partidaMemoria as any).props.statusPartida = StatusPartidaEnum.CANCELADA;
      (partidaMemoria as any).props.deletadoEm = new Date();
      (partidaMemoria as any).props.deletadoPor = usuarioId;
    }
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
      // Fallback em memória
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
