import { IPasswordHasher, IUsuarioRepository } from '../repositories/IRepositories';

export interface AlterarSenhaInput {
  usuarioId: string;
  senhaAtual: string;
  novaSenha: string;
}

export class AlterarSenhaUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  public async execute(input: AlterarSenhaInput): Promise<void> {
    const { usuarioId, senhaAtual, novaSenha } = input;

    if (!usuarioId || !senhaAtual || !novaSenha) {
      throw new Error('Informe a senha atual e a nova senha.');
    }

    const temMinimo6 = novaSenha.length >= 6;
    const temNumero = /\d/.test(novaSenha);
    const temEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha);
    if (!temMinimo6 || !temNumero || !temEspecial) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres, conter pelo menos 1 número e 1 caractere especial.');
    }

    const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const confere = await this.passwordHasher.compare(senhaAtual, usuario.senhaHash);
    if (!confere) {
      // Contas criadas com Google não possuem senha conhecida pelo usuário
      throw new Error('Senha atual incorreta. Se você entrou com o Google, sua senha é gerenciada pela sua conta Google.');
    }

    if (!this.usuarioRepo.atualizarSenha) {
      throw new Error('Alteração de senha indisponível no momento.');
    }
    const novoHash = await this.passwordHasher.hash(novaSenha);
    await this.usuarioRepo.atualizarSenha(usuarioId, novoHash);
  }
}
