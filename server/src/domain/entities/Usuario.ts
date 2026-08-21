import { StatusUsuarioEnum } from '../enums/StatusEnums';

export interface UsuarioProps {
  id: string;
  nome: string;
  email: string;
  cpf?: string | null;
  senhaHash: string;
  fotoUrl?: string | null;
  genero: string;
  dataNascimento: Date;
  raioBuscaKm: number;
  modalidadesFavoritas?: string | null;
  notaMedia: number;
  totalAvaliacoes: number;
  statusUsuario: StatusUsuarioEnum;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class Usuario {
  private props: UsuarioProps;

  constructor(props: UsuarioProps) {
    this.validar(props);
    this.props = props;
  }

  public static validarCpf(cpf: string): boolean {
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(limpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(limpo.charAt(i), 10) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    const dig1 = resto === 10 || resto === 11 ? 0 : resto;
    if (dig1 !== parseInt(limpo.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(limpo.charAt(i), 10) * (11 - i);
    }
    resto = 11 - (soma % 11);
    const dig2 = resto === 10 || resto === 11 ? 0 : resto;
    return dig2 === parseInt(limpo.charAt(10), 10);
  }

  private validar(props: UsuarioProps): void {
    if (!props.nome || props.nome.trim().length === 0) {
      throw new Error('Nome do usuário é obrigatório.');
    }
    if (!props.email || !props.email.includes('@')) {
      throw new Error('Email inválido.');
    }
    if (props.cpf) {
      if (!Usuario.validarCpf(props.cpf)) {
        throw new Error('CPF inválido.');
      }
    }
    if (props.raioBuscaKm !== undefined && (props.raioBuscaKm < 1 || props.raioBuscaKm > 50)) {
      throw new Error('Raio de busca deve estar entre 1 e 50 km.');
    }
  }

  public get id(): string { return this.props.id; }
  public get nome(): string { return this.props.nome; }
  public get email(): string { return this.props.email; }
  public get cpf(): string | null | undefined { return this.props.cpf; }
  public get senhaHash(): string { return this.props.senhaHash; }
  public get fotoUrl(): string | null | undefined { return this.props.fotoUrl; }
  public get genero(): string { return this.props.genero; }
  public get dataNascimento(): Date { return this.props.dataNascimento; }
  public get raioBuscaKm(): number { return this.props.raioBuscaKm; }
  public get modalidadesFavoritas(): string | null | undefined { return this.props.modalidadesFavoritas; }
  public get notaMedia(): number { return this.props.notaMedia; }
  public get totalAvaliacoes(): number { return this.props.totalAvaliacoes; }
  public get statusUsuario(): StatusUsuarioEnum { return this.props.statusUsuario; }

  // Regra de Negócio: Recálculo de média e moderação automática (< 2.0 com >= 5 avaliações)
  public adicionarAvaliacao(novaNota: number): void {
    if (novaNota < 1 || novaNota > 5) {
      throw new Error('Nota deve ser entre 1 e 5.');
    }
    const somaAtual = this.props.notaMedia * this.props.totalAvaliacoes;
    this.props.totalAvaliacoes += 1;
    this.props.notaMedia = Number(((somaAtual + novaNota) / this.props.totalAvaliacoes).toFixed(2));

    if (this.props.totalAvaliacoes >= 5 && this.props.notaMedia < 2.0) {
      this.props.statusUsuario = StatusUsuarioEnum.SUSPENSO;
    }
  }

  // Atualização de Perfil
  public atualizarPerfil(dados: {
    nome?: string;
    fotoUrl?: string | null;
    raioBuscaKm?: number;
    modalidadesFavoritas?: string | null;
  }): void {
    if (dados.nome !== undefined) {
      if (!dados.nome || dados.nome.trim().length === 0) {
        throw new Error('Nome do usuário não pode ser vazio.');
      }
      this.props.nome = dados.nome.trim();
    }
    if (dados.fotoUrl !== undefined) {
      this.props.fotoUrl = dados.fotoUrl;
    }
    if (dados.raioBuscaKm !== undefined) {
      if (dados.raioBuscaKm < 1 || dados.raioBuscaKm > 50) {
        throw new Error('Raio de busca deve estar entre 1 e 50 km.');
      }
      this.props.raioBuscaKm = dados.raioBuscaKm;
    }
    if (dados.modalidadesFavoritas !== undefined) {
      this.props.modalidadesFavoritas = dados.modalidadesFavoritas;
    }
    this.props.atualizadoEm = new Date();
  }
}
