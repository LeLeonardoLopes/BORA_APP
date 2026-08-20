import { db } from '../database/connection';
import { Usuario } from '../../domain/entities/Usuario';
import { IUsuarioRepository } from '../../application/repositories/IRepositories';
import { StatusUsuarioEnum } from '../../domain/enums/StatusEnums';

export class PgUsuarioRepository implements IUsuarioRepository {
  public async criar(usuario: Usuario): Promise<Usuario> {
    const query = 'INSERT INTO usuario (id, nome, email, senha_hash, foto_url, genero, data_nascimento, raio_busca_km, modalidades_favoritas, nota_media, total_avaliacoes, status_usuario) VALUES (, , , , , , , , , , , ) RETURNING *;';
    await db.query(query, [
      usuario.id, usuario.nome, usuario.email, usuario.senhaHash,
      usuario.fotoUrl, usuario.genero, usuario.dataNascimento,
      usuario.raioBuscaKm, usuario.modalidadesFavoritas,
      usuario.notaMedia, usuario.totalAvaliacoes, usuario.statusUsuario
    ]);
    return usuario;
  }

  public async buscarPorId(id: string): Promise<Usuario | null> {
    const res = await db.query('SELECT * FROM usuario WHERE id = ', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async buscarPorEmail(email: string): Promise<Usuario | null> {
    const res = await db.query('SELECT * FROM usuario WHERE email = ', [email]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async atualizar(usuario: Usuario): Promise<void> {
    const query = 'UPDATE usuario SET nome = , foto_url = , raio_busca_km = , modalidades_favoritas = , nota_media = , total_avaliacoes = , status_usuario = , atualizado_em = NOW() WHERE id = ;';
    await db.query(query, [
      usuario.nome, usuario.fotoUrl, usuario.raioBuscaKm,
      usuario.modalidadesFavoritas, usuario.notaMedia,
      usuario.totalAvaliacoes, usuario.statusUsuario, usuario.id
    ]);
  }

  private mapToEntity(r: any): Usuario {
    return new Usuario({
      id: r.id,
      nome: r.nome,
      email: r.email,
      senhaHash: r.senha_hash,
      fotoUrl: r.foto_url,
      genero: r.genero,
      dataNascimento: new Date(r.data_nascimento),
      raioBuscaKm: r.raio_busca_km,
      modalidadesFavoritas: r.modalidades_favoritas,
      notaMedia: Number(r.nota_media),
      totalAvaliacoes: r.total_avaliacoes,
      statusUsuario: r.status_usuario as StatusUsuarioEnum,
      criadoEm: new Date(r.criado_em),
      atualizadoEm: new Date(r.atualizado_em),
    });
  }
}
