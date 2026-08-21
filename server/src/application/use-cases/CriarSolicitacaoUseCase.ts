import { Solicitacao } from '../../domain/entities/Solicitacao';
import { StatusSolicitacaoEnum } from '../../domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface CriarSolicitacaoInput {
  id?: string;
  partidaId: string;
  usuarioId: string;
}

export class CriarSolicitacaoUseCase {
  constructor(
    private solicitacaoRepo: ISolicitacaoRepository,
    private partidaRepo: IPartidaRepository
  ) {}

  public async execute(input: CriarSolicitacaoInput): Promise<Solicitacao> {
    const partida = await this.partidaRepo.buscarPorId(input.partidaId);
    if (!partida) {
      throw new Error('Partida informada não foi encontrada.');
    }

    if (partida.organizadorId === input.usuarioId) {
      throw new Error('Você já é o organizador desta partida.');
    }

    const solicitacaoExistente = await this.solicitacaoRepo.buscarPorPartidaEUsuario(
      input.partidaId,
      input.usuarioId
    );
    if (solicitacaoExistente) {
      throw new Error('Você já possui uma solicitação para esta partida.');
    }

    const novaSolicitacao = new Solicitacao({
      id: input.id || randomUUID(),
      partidaId: input.partidaId,
      usuarioId: input.usuarioId,
      statusSolicitacao: StatusSolicitacaoEnum.PENDENTE,
      dataRequisicao: new Date(),
    });

    return await this.solicitacaoRepo.criar(novaSolicitacao);
  }
}
