import { db } from '../database/connection';
import { Solicitacao } from '../../domain/entities/Solicitacao';
import { ISolicitacaoRepository, ISolicitacaoDetalhada, IPartidaRepository, IUsuarioRepository } from '../../application/repositories/IRepositories';
import { StatusSolicitacaoEnum } from '../../domain/enums/StatusEnums';

export class PgSolicitacaoRepository implements ISolicitacaoRepository {
  private memoriaFallback = new Map<string, Solicitacao>();
  private partidaRepo?: IPartidaRepository;
  private usuarioRepo?: IUsuarioRepository;

  public setRepositories(partidaRepo: IPartidaRepository, usuarioRepo: IUsuarioRepository) {
    this.partidaRepo = partidaRepo;
    this.usuarioRepo = usuarioRepo;
  }

  public async criar(solicitacao: Solicitacao): Promise<Solicitacao> {
    try {
      const query = `
        INSERT INTO solicitacao (id, partida_id, usuario_id, status_solicitacao, data_requisicao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      await db.query(query, [
        solicitacao.id, solicitacao.partidaId, solicitacao.usuarioId,
        solicitacao.statusSolicitacao, solicitacao.dataRequisicao
      ]);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível. Armazenando solicitação em memória:', err.message);
    }
    this.memoriaFallback.set(solicitacao.id, solicitacao);
    return solicitacao;
  }

  public async buscarPorId(id: string): Promise<Solicitacao | null> {
    try {
      const res = await db.query('SELECT * FROM solicitacao WHERE id = $1', [id]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return this.memoriaFallback.get(id) || null;
  }

  public async buscarPorPartidaEUsuario(partidaId: string, usuarioId: string): Promise<Solicitacao | null> {
    try {
      const res = await db.query('SELECT * FROM solicitacao WHERE partida_id = $1 AND usuario_id = $2', [partidaId, usuarioId]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    const achada = Array.from(this.memoriaFallback.values()).find(
      (s) => s.partidaId === partidaId && s.usuarioId === usuarioId
    );
    return achada || null;
  }

  public async listarPorPartida(partidaId: string): Promise<Solicitacao[]> {
    try {
      const res = await db.query('SELECT * FROM solicitacao WHERE partida_id = $1 ORDER BY data_requisicao ASC', [partidaId]);
      if (res.rows.length > 0) return res.rows.map(this.mapToEntity);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return Array.from(this.memoriaFallback.values()).filter((s) => s.partidaId === partidaId);
  }

  public async listarPorUsuario(usuarioId: string): Promise<Solicitacao[]> {
    try {
      const res = await db.query('SELECT * FROM solicitacao WHERE usuario_id = $1 ORDER BY data_requisicao DESC', [usuarioId]);
      if (res.rows.length > 0) return res.rows.map(this.mapToEntity);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return Array.from(this.memoriaFallback.values()).filter((s) => s.usuarioId === usuarioId);
  }

  public async listarTodasDetalhes(): Promise<ISolicitacaoDetalhada[]> {
    try {
      const res = await db.query(`
        SELECT 
          s.id,
          s.partida_id as "partidaId",
          s.usuario_id as "usuarioId",
          s.status_solicitacao as "statusSolicitacao",
          s.data_requisicao as "dataRequisicao",
          s.data_decisao as "dataDecisao",
          u.nome as "atletaNome",
          u.foto_url as "atletaFoto",
          u.nota_media as "atletaNota",
          u.genero as "atletaGenero",
          p.esporte as "partidaEsporte",
          p.descricao as "partidaDescricao",
          p.data_hora as "partidaDataHora",
          p.bairro as "partidaBairro",
          p.organizador_id as "organizadorId",
          p.status_partida as "partidaStatus",
          (p.deletado_em IS NOT NULL) as "partidaExcluida"
        FROM solicitacao s
        LEFT JOIN usuario u ON s.usuario_id = u.id
        LEFT JOIN partida p ON s.partida_id = p.id
        ORDER BY s.data_requisicao DESC;
      `);
      if (res.rows.length > 0) return res.rows;
    } catch (err: any) {
      console.warn('Falha na listagem detalhada de solicitações PostgreSQL:', err.message);
    }

    // Fallback completo em memória
    const lista: ISolicitacaoDetalhada[] = [];
    for (const s of Array.from(this.memoriaFallback.values())) {
      const partida = this.partidaRepo ? await this.partidaRepo.buscarPorId(s.partidaId) : null;
      const usuario = this.usuarioRepo ? await this.usuarioRepo.buscarPorId(s.usuarioId) : null;

      lista.push({
        id: s.id,
        partidaId: s.partidaId,
        usuarioId: s.usuarioId,
        statusSolicitacao: s.statusSolicitacao,
        dataRequisicao: s.dataRequisicao,
        dataDecisao: s.dataDecisao,
        atletaNome: usuario?.nome || 'Atleta Bora!',
        atletaFoto: usuario?.fotoUrl || null,
        atletaNota: usuario?.notaMedia || 5.0,
        atletaGenero: usuario?.genero || 'Masculino',
        partidaEsporte: partida?.esporte || 'Futebol Society',
        partidaDescricao: partida?.descricao || '',
        partidaDataHora: partida?.dataHora || new Date(),
        partidaBairro: partida?.bairro || 'São José',
        organizadorId: partida?.organizadorId || '',
        partidaStatus: partida?.statusPartida || 'Publicada',
        partidaExcluida: Boolean(partida?.deletadoEm),
      });
    }

    return lista.sort((a, b) => new Date(b.dataRequisicao).getTime() - new Date(a.dataRequisicao).getTime());
  }

  public async atualizar(solicitacao: Solicitacao): Promise<void> {
    try {
      const query = 'UPDATE solicitacao SET status_solicitacao = $1, data_decisao = $2 WHERE id = $3;';
      await db.query(query, [solicitacao.statusSolicitacao, solicitacao.dataDecisao, solicitacao.id]);
    } catch (err: any) {
      console.warn('Falha na atualização PostgreSQL. Atualizando no fallback em memória:', err.message);
    }
    this.memoriaFallback.set(solicitacao.id, solicitacao);
  }

  public async rejeitarPendentesPorPartida(partidaId: string): Promise<void> {
    try {
      await db.query(`
        UPDATE solicitacao
        SET status_solicitacao = 'Rejeitada', data_decisao = NOW()
        WHERE partida_id = $1 AND status_solicitacao = 'Pendente';
      `, [partidaId]);
    } catch (err: any) {
      console.warn('Falha na rejeição em lote PostgreSQL:', err.message);
    }
    for (const solicitacao of this.memoriaFallback.values()) {
      if (solicitacao.partidaId === partidaId && solicitacao.statusSolicitacao === StatusSolicitacaoEnum.PENDENTE) {
        solicitacao.rejeitar();
      }
    }
  }

  public async verificarConflitoHorario(usuarioId: string, dataHoraPartida: Date): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) 
        FROM solicitacao s 
        INNER JOIN partida p ON s.partida_id = p.id 
        WHERE s.usuario_id = $1 
          AND s.status_solicitacao = 'Aprovada' 
          AND p.deletado_em IS NULL
          AND p.status_partida IN ('Publicada', 'Lotada', 'Em_Andamento') 
          AND p.data_hora BETWEEN ($2::timestamp - INTERVAL '2 hours') AND ($2::timestamp + INTERVAL '2 hours');
      `;
      const res = await db.query(query, [usuarioId, dataHoraPartida]);
      return parseInt(res.rows[0].count, 10) > 0;
    } catch (err: any) {
      console.warn('Falha ao verificar conflito horário no PostgreSQL:', err.message);
      return false;
    }
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
