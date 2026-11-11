import crypto from 'crypto';
import { IUsuarioRepository, ICodigoVerificacaoRepository } from '../repositories/IRepositories';
import { Usuario } from '../../domain/entities/Usuario';

export interface EnviarCodigoVerificacaoInput {
  email: string;
  cpf?: string;
}

export interface EnviarCodigoVerificacaoOutput {
  success: boolean;
  message: string;
  codigoDev?: string;
}

export class EnviarCodigoVerificacaoUseCase {
  constructor(
    private usuarioRepo: IUsuarioRepository,
    private codigoRepo: ICodigoVerificacaoRepository
  ) {}

  public async execute(input: EnviarCodigoVerificacaoInput): Promise<EnviarCodigoVerificacaoOutput> {
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }

    const emailSanitizado = input.email.trim().toLowerCase();

    // 1. Trava de E-mail Único
    const usuarioPorEmail = await this.usuarioRepo.buscarPorEmail(emailSanitizado);
    if (usuarioPorEmail) {
      throw new Error('Email já cadastrado.');
    }

    // 2. Trava de CPF (Validação matemática e Unicidade)
    if (input.cpf && input.cpf.trim().length > 0) {
      const cpfLimpo = input.cpf.replace(/\D/g, '');
      if (!Usuario.validarCpf(cpfLimpo)) {
        throw new Error('CPF inválido. Verifique os números informados.');
      }

      const usuarioPorCpf = await this.usuarioRepo.buscarPorCpf(cpfLimpo);
      if (usuarioPorCpf) {
        throw new Error('CPF já cadastrado em outra conta.');
      }
    }

    // 3. Geração do código OTP de 6 dígitos
    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validade

    await this.codigoRepo.salvarCodigo(emailSanitizado, codigo, expiraEm);

    console.log(`\n📬 [Bora! App Mailer] Código de confirmação para ${emailSanitizado}: >>> ${codigo} <<<\n`);

    return {
      success: true,
      message: `Código de verificação enviado para ${emailSanitizado}.`,
      codigoDev: codigo,
    };
  }

  public async enviarCodigoRecuperacao(email: string): Promise<EnviarCodigoVerificacaoOutput> {
    if (!email || !email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }

    const emailSanitizado = email.trim().toLowerCase();
    const usuario = await this.usuarioRepo.buscarPorEmail(emailSanitizado);
    if (!usuario) {
      throw new Error('Nenhuma conta encontrada com este e-mail. Use o botão "Continuar com o Google" para criar/acessar.');
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    await this.codigoRepo.salvarCodigo(emailSanitizado, codigo, expiraEm);

    console.log(`\n🔑 [Bora! App Recuperação] Código de recuperação para ${emailSanitizado}: >>> ${codigo} <<<\n`);

    return {
      success: true,
      message: `Código de recuperação enviado para ${emailSanitizado}.`,
      codigoDev: codigo,
    };
  }
}
