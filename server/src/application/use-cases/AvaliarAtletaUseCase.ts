import { Avaliacao } from '../../domain/entities/Avaliacao';
import { IUsuarioRepository, IAvaliacaoRepository } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface AvaliarAtletaInput {
  id?: string;
  partidaId?: string | null;
  avaliadorId: string;
  avaliadoId: string;
  nota: number;
  comentario?: string | null;
}

export interface AvaliarAtletaOutput {
  message: string;
  avaliacao: {
    id: string;
    partidaId?: string | null;
    avaliadorId: string;
    avaliadoId: string;
    nota: number;
    comentario?: string | null;
  };
  avaliadoStats: {
    notaMedia: number;
    totalAvaliacoes: number;
    statusUsuario: string;
  };
}

export class AvaliarAtletaUseCase {
  constructor(
    private avaliacaoRepo: IAvaliacaoRepository,
    private usuarioRepo: IUsuarioRepository
  ) {}

  public async execute(input: AvaliarAtletaInput): Promise<AvaliarAtletaOutput> {
    if (!input.avaliadoId || !input.nota || input.nota < 1 || input.nota > 5) {
      throw new Error('Informe o atleta avaliado e uma nota válida entre 1 e 5.');
    }

    if (input.avaliadorId === input.avaliadoId) {
      throw new Error('Um atleta não pode avaliar a si mesmo.');
    }

    const atletaAvaliado = await this.usuarioRepo.buscarPorId(input.avaliadoId);
    if (!atletaAvaliado) {
      throw new Error('Atleta avaliado não encontrado.');
    }

    const avaliacao = new Avaliacao({
      id: input.id || randomUUID(),
      partidaId: input.partidaId || '00000000-0000-0000-0000-000000000000',
      avaliadorId: input.avaliadorId,
      avaliadoId: input.avaliadoId,
      nota: input.nota,
      comentario: input.comentario,
      dataAvaliacao: new Date(),
    });

    await this.avaliacaoRepo.salvarOuAtualizar(avaliacao);

    // Atualiza a entidade de domínio Usuario aplicando as regras de recálculo e suspensão automática
    atletaAvaliado.adicionarAvaliacao(input.nota);
    await this.usuarioRepo.atualizar(atletaAvaliado);

    return {
      message: 'Avaliação computada com sucesso!',
      avaliacao: {
        id: avaliacao.id,
        partidaId: avaliacao.partidaId,
        avaliadorId: avaliacao.avaliadorId,
        avaliadoId: avaliacao.avaliadoId,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
      },
      avaliadoStats: {
        notaMedia: atletaAvaliado.notaMedia,
        totalAvaliacoes: atletaAvaliado.totalAvaliacoes,
        statusUsuario: atletaAvaliado.statusUsuario,
      },
    };
  }
}
