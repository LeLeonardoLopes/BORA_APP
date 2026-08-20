import { StatusSolicitacaoEnum } from '../enums/StatusEnums';

export interface SolicitacaoProps {
  id: string;
  partidaId: string;
  usuarioId: string;
  statusSolicitacao: StatusSolicitacaoEnum;
  dataRequisicao: Date;
  dataDecisao?: Date | null;
}

export class Solicitacao {
  private props: SolicitacaoProps;

  constructor(props: SolicitacaoProps) {
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get partidaId(): string { return this.props.partidaId; }
  public get usuarioId(): string { return this.props.usuarioId; }
  public get statusSolicitacao(): StatusSolicitacaoEnum { return this.props.statusSolicitacao; }
  public get dataRequisicao(): Date { return this.props.dataRequisicao; }
  public get dataDecisao(): Date | null | undefined { return this.props.dataDecisao; }

  public aprovar(): void {
    if (this.props.statusSolicitacao !== StatusSolicitacaoEnum.PENDENTE) {
      throw new Error('Apenas solicitações pendentes podem ser aprovadas.');
    }
    this.props.statusSolicitacao = StatusSolicitacaoEnum.APROVADA;
    this.props.dataDecisao = new Date();
  }

  public rejeitar(): void {
    if (this.props.statusSolicitacao !== StatusSolicitacaoEnum.PENDENTE) {
      throw new Error('Apenas solicitações pendentes podem ser rejeitadas.');
    }
    this.props.statusSolicitacao = StatusSolicitacaoEnum.REJEITADA;
    this.props.dataDecisao = new Date();
  }
}
