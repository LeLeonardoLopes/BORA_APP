import { Partida } from '../../domain/entities/Partida';
import { StatusPartidaEnum } from '../../domain/enums/StatusEnums';
import { IPartidaRepository } from '../repositories/IRepositories';
import { randomUUID } from 'crypto';

export interface CriarPartidaInput {
  id?: string;
  organizadorId: string;
  esporte: string;
  descricao?: string | null;
  dataHora: string | Date;
  duracaoMinutos?: number;
  maxVagas?: number;
  filtroGenero?: string | null;
  filtroNivel?: string | null;
  enderecoCompleto: string;
  bairro: string;
  cidade?: string;
  lat: number;
  lng: number;
  formatoJogo?: 'Avulso' | 'Amistoso_Times';
  tipoLocal?: 'Publica' | 'Privada';
  taxaCampo?: number;
  taxaJuiz?: number;
}

export class CriarPartidaUseCase {
  constructor(private partidaRepo: IPartidaRepository) {}

  public async execute(input: CriarPartidaInput): Promise<Partida> {
    const dataHoraPartida = new Date(input.dataHora);
    const duracao = input.duracaoMinutos || 90;

    // Regra RN01: Anti-conflito de Agenda para Organizador
    if (this.partidaRepo.verificarConflitoHorarioOrganizador) {
      const temConflito = await this.partidaRepo.verificarConflitoHorarioOrganizador(
        input.organizadorId,
        dataHoraPartida,
        duracao
      );
      if (temConflito) {
        throw new Error('VOCÊ JÁ TEM UMA PARTIDA CRIADA NESSE HORÁRIO OU VOCÊ JÁ ESTÁ PARTICIPANDO DE UMA PARTIDA NESTE HORÁRIO (RN01 - Anti-conflito de Agenda).');
      }
    }

    const novaPartida = new Partida({
      id: input.id || randomUUID(),
      organizadorId: input.organizadorId,
      esporte: input.esporte,
      descricao: input.descricao,
      dataHora: new Date(input.dataHora),
      duracaoMinutos: input.duracaoMinutos || 90,
      maxVagas: input.maxVagas || 14,
      vagasPreenchidas: 1, // O organizador já ocupa a 1ª vaga
      filtroGenero: input.filtroGenero,
      filtroNivel: input.filtroNivel,
      enderecoCompleto: input.enderecoCompleto,
      bairro: input.bairro,
      cidade: input.cidade || 'Franca',
      lat: Number(input.lat),
      lng: Number(input.lng),
      statusPartida: StatusPartidaEnum.PUBLICADA,
      formatoJogo: input.formatoJogo,
      tipoLocal: input.tipoLocal,
      taxaCampo: input.taxaCampo,
      taxaJuiz: input.taxaJuiz,
    });

    return await this.partidaRepo.criar(novaPartida);
  }
}
