export interface AvaliacaoProps {
  id: string;
  partidaId: string;
  avaliadorId: string;
  avaliadoId: string;
  nota: number;
  comentario?: string | null;
  dataAvaliacao?: Date;
}

export class Avaliacao {
  private props: AvaliacaoProps;

  constructor(props: AvaliacaoProps) {
    this.validar(props);
    this.props = props;
  }

  private validar(props: AvaliacaoProps): void {
    if (!props.avaliadorId || !props.avaliadoId) {
      throw new Error('Avaliador e atleta avaliado são obrigatórios.');
    }
    if (props.avaliadorId === props.avaliadoId) {
      throw new Error('Um atleta não pode avaliar a si mesmo.');
    }
    if (props.nota === undefined || props.nota === null || props.nota < 1 || props.nota > 5) {
      throw new Error('A nota deve ser um valor entre 1 e 5.');
    }
  }

  public get id(): string { return this.props.id; }
  public get partidaId(): string { return this.props.partidaId; }
  public get avaliadorId(): string { return this.props.avaliadorId; }
  public get avaliadoId(): string { return this.props.avaliadoId; }
  public get nota(): number { return this.props.nota; }
  public get comentario(): string | null | undefined { return this.props.comentario; }
  public get dataAvaliacao(): Date | undefined { return this.props.dataAvaliacao; }
}
