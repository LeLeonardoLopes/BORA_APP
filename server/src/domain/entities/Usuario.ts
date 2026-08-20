import { StatusUsuarioEnum } from '../enums/StatusEnums';

export interface UsuarioProps {
  id: string;
  nome: string;
  email: string;
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

  private validar(props: UsuarioProps): void {
    if (!props.nome || props.nome.trim().length === 0) {
      throw new Error('Nome do usuário é obrigatório.');
    }
    if (!props.email || !props.email.includes('@')) {
      throw new Error('Email inválido.');
    }
    if (props.raioBuscaKm < 1 || props.raioBuscaKm > 5) {
      throw new Error('Raio de busca deve estar entre 1 e 5 km.');
    }
  }

  public get id(): string { return this.props.id; }
  public get nome(): string { return this.props.nome; }
  public get email(): string { return this.props.email; }
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
}
