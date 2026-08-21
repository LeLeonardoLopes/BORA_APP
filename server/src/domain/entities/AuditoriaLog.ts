export type TipoOperacaoAuditoria = 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE';

export interface AuditoriaLogProps {
  id: string;
  tabelaNome: string;
  registroId: string;
  operacao: TipoOperacaoAuditoria;
  usuarioId?: string | null;
  dadosAnteriores?: any;
  dadosNovos?: any;
  camposAlterados?: string[] | null;
  criadoEm?: Date;
}

export class AuditoriaLog {
  private props: AuditoriaLogProps;

  constructor(props: AuditoriaLogProps) {
    this.validar(props);
    this.props = {
      ...props,
      criadoEm: props.criadoEm || new Date(),
    };
  }

  private validar(props: AuditoriaLogProps): void {
    if (!props.tabelaNome || props.tabelaNome.trim().length === 0) {
      throw new Error('Nome da tabela auditada é obrigatório.');
    }
    if (!props.registroId || props.registroId.trim().length === 0) {
      throw new Error('ID do registro auditado é obrigatório.');
    }
    if (!props.operacao) {
      throw new Error('Operação de auditoria é obrigatória.');
    }
  }

  public get id(): string { return this.props.id; }
  public get tabelaNome(): string { return this.props.tabelaNome; }
  public get registroId(): string { return this.props.registroId; }
  public get operacao(): TipoOperacaoAuditoria { return this.props.operacao; }
  public get usuarioId(): string | null | undefined { return this.props.usuarioId; }
  public get dadosAnteriores(): any { return this.props.dadosAnteriores; }
  public get dadosNovos(): any { return this.props.dadosNovos; }
  public get camposAlterados(): string[] | null | undefined { return this.props.camposAlterados; }
  public get criadoEm(): Date { return this.props.criadoEm || new Date(); }
}
