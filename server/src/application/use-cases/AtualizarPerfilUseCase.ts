import { Usuario } from '../../domain/entities/Usuario';
import { IUsuarioRepository } from '../repositories/IRepositories';

export interface AtualizarPerfilInput {
  id: string;
  email?: string;
  nome?: string;
  fotoUrl?: string | null;
  raioBuscaKm?: number;
  modalidadesFavoritas?: string | null;
  meuTime?: string | null;
}

export class AtualizarPerfilUseCase {
  constructor(private usuarioRepo: IUsuarioRepository) {}

  public async execute(input: AtualizarPerfilInput): Promise<Usuario> {
    let usuario = await this.usuarioRepo.buscarPorId(input.id);

    if (!usuario && input.email) {
      usuario = await this.usuarioRepo.buscarPorEmail(input.email);
    }

    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    usuario.atualizarPerfil({
      nome: input.nome,
      fotoUrl: input.fotoUrl,
      raioBuscaKm: input.raioBuscaKm ? Number(input.raioBuscaKm) : undefined,
      modalidadesFavoritas: input.modalidadesFavoritas,
    });

    await this.usuarioRepo.atualizar(usuario);
    return usuario;
  }
}
