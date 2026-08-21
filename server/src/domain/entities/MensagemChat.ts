export interface MensagemChatProps {
  id: string;
  partidaId: string;
  usuarioId: string;
  texto: string;
  usuarioNome?: string;
  usuarioFoto?: string | null;
  criadoEm?: Date;
}

export class MensagemChat {
  private props: MensagemChatProps;

  constructor(props: MensagemChatProps) {
    this.validar(props);
    this.props = {
      ...props,
      criadoEm: props.criadoEm || new Date(),
    };
  }

  private validar(props: MensagemChatProps): void {
    if (!props.partidaId) {
      throw new Error('Partida vinculada é obrigatória.');
    }
    if (!props.usuarioId) {
      throw new Error('Autor da mensagem é obrigatório.');
    }
    if (!props.texto || props.texto.trim().length === 0) {
      throw new Error('O conteúdo da mensagem não pode ser vazio.');
    }
  }

  public get id(): string { return this.props.id; }
  public get partidaId(): string { return this.props.partidaId; }
  public get usuarioId(): string { return this.props.usuarioId; }
  public get texto(): string { return this.props.texto.trim(); }
  public get usuarioNome(): string | undefined { return this.props.usuarioNome; }
  public get usuarioFoto(): string | null | undefined { return this.props.usuarioFoto; }
  public get criadoEm(): Date { return this.props.criadoEm || new Date(); }
}
