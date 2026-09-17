import { Solicitacao } from '../../domain/entities/Solicitacao';
import { StatusSolicitacaoEnum } from '../../domain/enums/StatusEnums';
import { IPartidaRepository, ISolicitacaoRepository, IUsuarioRepository, IWebSocketNotificationService } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface CriarSolicitacaoInput {
  id?: string;
  partidaId: string;
  usuarioId: string;
}

export class CriarSolicitacaoUseCase {
  constructor(
    private solicitacaoRepo: ISolicitacaoRepository,
    private partidaRepo: IPartidaRepository,
    private usuarioRepo?: IUsuarioRepository,
    private wsNotificationService?: IWebSocketNotificationService
  ) {}

  public async execute(input: CriarSolicitacaoInput): Promise<Solicitacao> {
    const partida = await this.partidaRepo.buscarPorId(input.partidaId);
    if (!partida) {
      throw new Error('Partida informada não foi encontrada.');
    }

    if (partida.organizadorId === input.usuarioId) {
      throw new Error('Você já é o organizador desta partida.');
    }

    // Regra RN06: Espaço Seguro Feminino
    if ((partida.filtroGenero === 'Feminino' || (partida as any).espacoSeguroFeminino) && this.usuarioRepo) {
      const solicitante = await this.usuarioRepo.buscarPorId(input.usuarioId);
      if (solicitante && String(solicitante.genero || '').toLowerCase() !== 'feminino') {
        throw new Error('Esta partida é exclusiva para o público feminino (RN06 - Espaço Seguro Feminino).');
      }
    }

    // Regra RN01: Anti-conflito de Agenda do Atleta
    const temConflito = await this.solicitacaoRepo.verificarConflitoHorario(input.usuarioId, partida.dataHora);
    if (temConflito) {
      throw new Error('VOCÊ JÁ TEM UMA PARTIDA CRIADA NESSE HORÁRIO OU VOCÊ JÁ ESTÁ PARTICIPANDO DE UMA PARTIDA NESTE HORÁRIO (RN01 - Anti-conflito de Agenda).');
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

    const solicitacaoCriada = await this.solicitacaoRepo.criar(novaSolicitacao);

    if (this.wsNotificationService && partida.organizadorId) {
      this.wsNotificationService.notificarUsuario(partida.organizadorId, 'request_received', {
        solicitacaoId: solicitacaoCriada.id,
        partidaId: partida.id,
        esporte: partida.esporte,
        bairro: partida.bairro,
        usuarioId: input.usuarioId,
      });
    }

    return solicitacaoCriada;
  }
}
