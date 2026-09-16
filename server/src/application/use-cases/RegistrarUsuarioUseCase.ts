import { Usuario } from '../../domain/entities/Usuario';
import { StatusUsuarioEnum } from '../../domain/enums/StatusEnums';
import { IUsuarioRepository, IPasswordHasher, ITokenService, ICodigoVerificacaoRepository } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface RegistrarUsuarioInput {
  id?: string;
  nome: string;
  email: string;
  cpf?: string | null;
  senha: string;
  codigoVerificacao?: string;
  fotoUrl?: string | null;
  genero?: string;
  dataNascimento?: string | Date;
  raioBuscaKm?: number;
  modalidadesFavoritas?: string | null;
}

export interface RegistrarUsuarioOutput {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    cpf?: string | null;
    genero: string;
    notaMedia: number;
    fotoUrl?: string | null;
  };
}

export class RegistrarUsuarioUseCase {
  constructor(
    private usuarioRepo: IUsuarioRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
    private codigoRepo?: ICodigoVerificacaoRepository
  ) {}

  public async execute(input: RegistrarUsuarioInput): Promise<RegistrarUsuarioOutput> {
    const emailSanitizado = input.email.trim().toLowerCase();

    // 1. Trava de E-mail Único
    const usuarioExistente = await this.usuarioRepo.buscarPorEmail(emailSanitizado);
    if (usuarioExistente) {
      throw new Error('Email já cadastrado.');
    }

    // 2. Trava de CPF (Validação matemática e Unicidade)
    let cpfLimpo: string | null = null;
    if (input.cpf && input.cpf.trim().length > 0) {
      cpfLimpo = input.cpf.replace(/\D/g, '');
      if (!Usuario.validarCpf(cpfLimpo)) {
        throw new Error('CPF inválido.');
      }

      const usuarioPorCpf = await this.usuarioRepo.buscarPorCpf(cpfLimpo);
      if (usuarioPorCpf) {
        throw new Error('CPF já cadastrado em outra conta.');
      }
    }

    // 3. Validação do Código de Verificação de E-mail (se fornecido / configurado)
    if (this.codigoRepo && input.codigoVerificacao) {
      const codigoValido = await this.codigoRepo.buscarCodigoValido(emailSanitizado, input.codigoVerificacao.trim());
      if (!codigoValido) {
        throw new Error('Código de verificação incorreto ou expirado.');
      }
      await this.codigoRepo.consumirCodigo(emailSanitizado, input.codigoVerificacao.trim());
    }

    // 4. Validação de Força de Senha
    if (!input.senha || input.senha.length < 6) {
      throw new Error('A senha deve conter pelo menos 6 caracteres.');
    }

    if (!/\d/.test(input.senha)) {
      throw new Error('A senha deve conter pelo menos um número.');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(input.senha)) {
      throw new Error('A senha deve conter pelo menos um caractere especial (ex: @, #, $, !).');
    }

    const senhaHash = await this.passwordHasher.hash(input.senha);

    const novoUsuario = new Usuario({
      id: input.id || randomUUID(),
      nome: input.nome.trim(),
      email: emailSanitizado,
      cpf: cpfLimpo,
      senhaHash,
      fotoUrl: input.fotoUrl,
      genero: input.genero || 'Não informado',
      dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : new Date('2000-01-01'),
      raioBuscaKm: input.raioBuscaKm ? Number(input.raioBuscaKm) : 5,
      modalidadesFavoritas: input.modalidadesFavoritas,
      notaMedia: 5.0,
      totalAvaliacoes: 0,
      statusUsuario: StatusUsuarioEnum.ATIVO,
    });

    const usuarioCriado = await this.usuarioRepo.criar(novoUsuario);
    const token = this.tokenService.gerarToken({ id: usuarioCriado.id, email: usuarioCriado.email, genero: usuarioCriado.genero });

    return {
      token,
      usuario: {
        id: usuarioCriado.id,
        nome: usuarioCriado.nome,
        email: usuarioCriado.email,
        cpf: usuarioCriado.cpf,
        genero: usuarioCriado.genero,
        notaMedia: usuarioCriado.notaMedia,
        fotoUrl: usuarioCriado.fotoUrl,
      },
    };
  }
}
