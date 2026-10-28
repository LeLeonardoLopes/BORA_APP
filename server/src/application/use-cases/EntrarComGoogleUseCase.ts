import { randomBytes, randomUUID } from 'crypto';
import { Usuario } from '../../domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../domain/enums/StatusEnums';
import {
  IUsuarioRepository,
  IPasswordHasher,
  ITokenService,
  IGoogleIdentityVerifier,
} from '../repositories/IRepositories';

export interface EntrarComGoogleOutput {
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

export class EntrarComGoogleUseCase {
  constructor(
    private usuarioRepo: IUsuarioRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
    private verifier: IGoogleIdentityVerifier
  ) {}

  public async execute(input: { idToken: string }): Promise<EntrarComGoogleOutput> {
    if (!input.idToken) {
      throw new Error('Token do Google ausente.');
    }

    const bruta = await this.verifier.verify(input.idToken);
    const identidade = { ...bruta, email: bruta.email.trim().toLowerCase() };

    let usuario = await this.usuarioRepo.buscarPorEmail(identidade.email);

    if (!usuario) {
      // Conta criada pelo login Google: não recebe senha conhecida.
      // Quem entra é sempre o dono da conta Google, verificada acima.
      const senhaAleatoria = randomBytes(32).toString('hex');
      const senhaHash = await this.passwordHasher.hash(senhaAleatoria);

      usuario = await this.usuarioRepo.criar(
        new Usuario({
          id: randomUUID(),
          nome: identidade.nome,
          email: identidade.email,
          senhaHash,
          fotoUrl: identidade.fotoUrl ?? null,
          genero: 'Não informado',
          // Data de nascimento ainda não é coletada pelo login Google (campo obrigatório no banco).
          dataNascimento: new Date('2000-01-01'),
          raioBuscaKm: 5,
          notaMedia: 5.0,
          totalAvaliacoes: 0,
          statusUsuario: StatusUsuarioEnum.ATIVO,
        })
      );
    }

    if (usuario.statusUsuario === StatusUsuarioEnum.SUSPENSO) {
      throw new Error('Conta suspensa por baixa avaliação média (< 2.0).');
    }
    if (usuario.statusUsuario === StatusUsuarioEnum.BANIDO) {
      throw new Error('Conta banida por violação dos termos de uso da comunidade.');
    }

    const token = this.tokenService.gerarToken({
      id: usuario.id,
      email: usuario.email,
      genero: usuario.genero,
    });

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
