import { db } from '../database/connection';
import { Usuario } from '../../domain/entities/Usuario';
import { IUsuarioRepository } from '../../application/repositories/IRepositories';
import { StatusUsuarioEnum } from '../../domain/enums/StatusEnums';

export class PgUsuarioRepository implements IUsuarioRepository {
  private memoriaFallback = new Map<string, Usuario>();

  constructor() {
    this.semearDadosIniciais();
  }

  private semearDadosIniciais(): void {
    const usuariosIniciais = [
      new Usuario({
        id: '11111111-1111-1111-1111-111111111101',
        nome: 'Leonardo Lopes (Capitão Bora Franca)',
        email: 'leonardo.lopes@boraapp.com.br',
        senhaHash: '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
        fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        genero: 'Masculino',
        dataNascimento: new Date('1998-05-15'),
        raioBuscaKm: 5,
        modalidadesFavoritas: 'Futebol Society,Futsal,Basquete',
        notaMedia: 4.95,
        totalAvaliacoes: 28,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      }),
      new Usuario({
        id: '11111111-1111-1111-1111-111111111102',
        nome: 'Renata Saraiva (Sunset Beach Team)',
        email: 'renata.saraiva@boraapp.com.br',
        senhaHash: '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
        fotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        genero: 'Feminino',
        dataNascimento: new Date('2000-08-20'),
        raioBuscaKm: 5,
        modalidadesFavoritas: 'Beach Tennis,Vôlei de Praia,Futsal',
        notaMedia: 5.0,
        totalAvaliacoes: 34,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      }),
      new Usuario({
        id: '11111111-1111-1111-1111-111111111103',
        nome: 'Prof. Carlos Eduardo (FATEC Franca)',
        email: 'carlos.eduardo@fatecfranca.edu.br',
        senhaHash: '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
        fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        genero: 'Masculino',
        dataNascimento: new Date('1985-03-10'),
        raioBuscaKm: 5,
        modalidadesFavoritas: 'Futebol Society,Basquete 3x3,Futsal',
        notaMedia: 4.85,
        totalAvaliacoes: 42,
        statusUsuario: StatusUsuarioEnum.ATIVO,
      }),
    ];

    for (const u of usuariosIniciais) {
      this.memoriaFallback.set(u.id, u);
      this.memoriaFallback.set(u.email.toLowerCase(), u);
    }
  }

  public async criar(usuario: Usuario): Promise<Usuario> {
    try {
      const query = `
        INSERT INTO usuario (
          id, nome, email, cpf, senha_hash, foto_url, genero, data_nascimento,
          raio_busca_km, modalidades_favoritas, nota_media, total_avaliacoes, status_usuario
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      await db.query(query, [
        usuario.id, usuario.nome, usuario.email, usuario.cpf || null, usuario.senhaHash,
        usuario.fotoUrl, usuario.genero, usuario.dataNascimento,
        usuario.raioBuscaKm, usuario.modalidadesFavoritas,
        usuario.notaMedia, usuario.totalAvaliacoes, usuario.statusUsuario
      ]);
    } catch (err: any) {
      console.warn('PostgreSQL inacessível. Armazenando usuário em memória:', err.message);
    }
    this.memoriaFallback.set(usuario.id, usuario);
    this.memoriaFallback.set(usuario.email.toLowerCase(), usuario);
    if (usuario.cpf) {
      this.memoriaFallback.set(`cpf_${usuario.cpf.replace(/\D/g, '')}`, usuario);
    }
    return usuario;
  }

  public async buscarPorId(id: string): Promise<Usuario | null> {
    try {
      const res = await db.query('SELECT * FROM usuario WHERE id = $1 AND deletado_em IS NULL', [id]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return this.memoriaFallback.get(id) || null;
  }

  public async buscarPorEmail(email: string): Promise<Usuario | null> {
    const emailSanitizado = email.toLowerCase().trim();
    try {
      const res = await db.query('SELECT * FROM usuario WHERE LOWER(email) = $1 AND deletado_em IS NULL', [emailSanitizado]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL. Buscando no fallback em memória:', err.message);
    }
    return this.memoriaFallback.get(emailSanitizado) || null;
  }

  public async buscarPorCpf(cpf: string): Promise<Usuario | null> {
    const cpfLimpo = cpf.replace(/\D/g, '');
    try {
      const res = await db.query('SELECT * FROM usuario WHERE regexp_replace(cpf, \'\\D\', \'\', \'g\') = $1 AND deletado_em IS NULL', [cpfLimpo]);
      if (res.rows.length > 0) return this.mapToEntity(res.rows[0]);
    } catch (err: any) {
      console.warn('Falha na consulta PostgreSQL por CPF:', err.message);
    }
    return this.memoriaFallback.get(`cpf_${cpfLimpo}`) || null;
  }

  public async listarTodos(): Promise<Usuario[]> {
    try {
      const res = await db.query(`
        SELECT * FROM usuario
        WHERE deletado_em IS NULL
        ORDER BY nota_media DESC, total_avaliacoes DESC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map(this.mapToEntity);
      }
    } catch (err: any) {
      console.warn('Falha na listagem PostgreSQL. Retornando dados em memória:', err.message);
    }
    return Array.from(new Set(this.memoriaFallback.values()));
  }

  public async atualizar(usuario: Usuario): Promise<void> {
    try {
      const query = `
        UPDATE usuario 
        SET nome = $1, foto_url = $2, raio_busca_km = $3, 
            modalidades_favoritas = $4, nota_media = $5, 
            total_avaliacoes = $6, status_usuario = $7, atualizado_em = NOW() 
        WHERE id = $8;
      `;
      await db.query(query, [
        usuario.nome, usuario.fotoUrl, usuario.raioBuscaKm,
        usuario.modalidadesFavoritas, usuario.notaMedia,
        usuario.totalAvaliacoes, usuario.statusUsuario, usuario.id
      ]);
    } catch (err: any) {
      console.warn('Falha na atualização PostgreSQL. Atualizando no fallback em memória:', err.message);
    }
    this.memoriaFallback.set(usuario.id, usuario);
    this.memoriaFallback.set(usuario.email.toLowerCase(), usuario);
  }

  public async softDelete(id: string, usuarioId: string): Promise<void> {
    try {
      const query = `
        UPDATE usuario 
        SET deletado_em = NOW(), deletado_por = $2, status_usuario = 'Banido', atualizado_em = NOW() 
        WHERE id = $1;
      `;
      await db.query(query, [id, usuarioId]);
    } catch (err: any) {
      console.warn('Falha no softDelete de usuário no PostgreSQL:', err.message);
    }
    const usuario = this.memoriaFallback.get(id);
    if (usuario) {
      this.memoriaFallback.delete(id);
      this.memoriaFallback.delete(usuario.email.toLowerCase());
    }
  }

  private mapToEntity(r: any): Usuario {
    return new Usuario({
      id: r.id,
      nome: r.nome,
      email: r.email,
      cpf: r.cpf || null,
      senhaHash: r.senha_hash,
      fotoUrl: r.foto_url,
      genero: r.genero,
      dataNascimento: new Date(r.data_nascimento),
      raioBuscaKm: Number(r.raio_busca_km),
      modalidadesFavoritas: r.modalidades_favoritas,
      notaMedia: Number(r.nota_media),
      totalAvaliacoes: Number(r.total_avaliacoes),
      statusUsuario: r.status_usuario as StatusUsuarioEnum,
      criadoEm: new Date(r.criado_em),
      atualizadoEm: new Date(r.atualizado_em),
    });
  }
}
