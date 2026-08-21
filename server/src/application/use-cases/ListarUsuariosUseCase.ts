import { Usuario } from '../../domain/entities/Usuario';
import { IUsuarioRepository } from '../repositories/IRepositories';

export class ListarUsuariosUseCase {
  constructor(private usuarioRepo: IUsuarioRepository) {}

  public async execute(): Promise<Usuario[]> {
    return await this.usuarioRepo.listarTodos();
  }
}
