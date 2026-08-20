import { StatusPartidaEnum } from '../enums/StatusEnums';

export interface PartidaProps {
  id: string;
  organizadorId: string;
  esporte: string;
  descricao?: string | null;
  dataHora: Date;
  maxVagas: number;
  vagasPreenchidas: number;
  filtroGenero?: string | null;
  filtroNivel?: string | null;
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  lat: number;
  lng: number;
  statusPartida: StatusPartidaEnum;
  taxaCampo?: number;
  taxaJuiz?: number;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export class Partida {
  private props: PartidaProps;

  constructor(props: PartidaProps) {
    this.validar(props);
    this.props = props;
  }

  private validar(props: PartidaProps): void {
    if (props.maxVagas <= 1) {
      throw new Error('A partida deve ter pelo menos 2 vagas.');
    }
    if (props.vagasPreenchidas > props.maxVagas) {
      throw new Error('Número de vagas preenchidas não pode exceder o máximo.');
    }
  }

  public get id(): string { return this.props.id; }
  public get organizadorId(): string { return this.props.organizadorId; }
  public get esporte(): string { return this.props.esporte; }
  public get descricao(): string | null | undefined { return this.props.descricao; }
  public get dataHora(): Date { return this.props.dataHora; }
  public get maxVagas(): number { return this.props.maxVagas; }
  public get vagasPreenchidas(): number { return this.props.vagasPreenchidas; }
  public get filtroGenero(): string | null | undefined { return this.props.filtroGenero; }
  public get filtroNivel(): string | null | undefined { return this.props.filtroNivel; }
  public get enderecoCompleto(): string { return this.props.enderecoCompleto; }
  public get bairro(): string { return this.props.bairro; }
  public get cidade(): string { return this.props.cidade; }
  public get lat(): number { return this.props.lat; }
  public get lng(): number { return this.props.lng; }
  public get statusPartida(): StatusPartidaEnum { return this.props.statusPartida; }
  public get taxaCampo(): number { return this.props.taxaCampo || 0; }
  public get taxaJuiz(): number { return this.props.taxaJuiz || 0; }
  public get valorPorEquipe(): number { return (this.taxaCampo + this.taxaJuiz) / 2; }

  // Regra RN03: Bloqueio de cancelamento direto quando a partida estiver lotada
  public cancelar(solicitanteId: string): void {
    if (solicitanteId !== this.props.organizadorId) {
      throw new Error('Apenas o organizador pode solicitar o cancelamento da partida.');
    }
    if (this.props.vagasPreenchidas >= this.props.maxVagas) {
      throw new Error('Regra RN03: Partida com lotação esgotada não pode ser cancelada diretamente. Abra um chamado com o suporte.');
    }
    this.props.statusPartida = StatusPartidaEnum.CANCELADA;
  }

  public preencherVaga(): void {
    if (this.props.vagasPreenchidas >= this.props.maxVagas) {
      throw new Error('Todas as vagas já foram preenchidas.');
    }
    this.props.vagasPreenchidas += 1;
    if (this.props.vagasPreenchidas === this.props.maxVagas) {
      this.props.statusPartida = StatusPartidaEnum.LOTADA;
    }
  }
}
