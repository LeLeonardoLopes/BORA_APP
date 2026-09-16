import { StatusUsuarioEnum } from '../../domain/enums/StatusEnums';
import { IUsuarioRepository, IPasswordHasher, ITokenService } from '../repositories/IRepositories';

export interface AutenticarUsuarioInput {
  email: string;
  senha: string;
}

export interface AutenticarUsuarioOutput {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    genero: string;
    raioBuscaKm: number;
    notaMedia: number;
    fotoUrl?: string | null;
  };
}

export class AutenticarUsuarioUseCase {
  constructor(
    private usuarioRepo: IUsuarioRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  public async execute(input: AutenticarUsuarioInput): Promise<AutenticarUsuarioOutput> {
    if (!input.email || !input.senha) {
      throw new Error('Informe e-mail e senha.');
    }

    const emailSanitizado = input.email.trim().toLowerCase();
    const usuario = await this.usuarioRepo.buscarPorEmail(emailSanitizado);

    if (!usuario) {
      throw new Error('Credenciais inválidas.');
    }

    if (usuario.statusUsuario === StatusUsuarioEnum.SUSPENSO) {
      throw new Error('Conta suspensa por baixa avaliação média (< 2.0).');
    }

    if (usuario.statusUsuario === StatusUsuarioEnum.BANIDO) {
      throw new Error('Conta banida por violação dos termos de uso da comunidade.');
    }

    const senhaCorreta = await this.passwordHasher.compare(input.senha, usuario.senhaHash);
    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas.');
    }

    const token = this.tokenService.gerarToken({ id: usuario.id, email: usuario.email, genero: usuario.genero });

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        genero: usuario.genero,
        raioBuscaKm: usuario.raioBuscaKm,
        notaMedia: usuario.notaMedia,
        fotoUrl: usuario.fotoUrl,
      },
    };
  }
}
