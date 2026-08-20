import { IPartidaRepository } from '../repositories/IRepositories';

export interface ConsultarMapaInput {
  lat: number;
  lng: number;
  raioKm: number;
  esporte?: string;
  usuarioAutenticadoId: string;
}

export interface PartidaMapaOutput {
  id: string;
  esporte: string;
  descricao?: string | null;
  dataHora: Date;
  maxVagas: number;
  vagasPreenchidas: number;
  bairro: string;
  cidade: string;
  // Regra RN02 (LGPD): Endereço e Coordenadas exatas são omitidos ou ofuscados para não confirmados
  enderecoCompleto?: string;
  lat: number;
  lng: number;
  isOrganizador: boolean;
}

export class ConsultarMapaPartidasUseCase {
  constructor(private partidaRepo: IPartidaRepository) {}

  public async execute(input: ConsultarMapaInput): Promise<PartidaMapaOutput[]> {
    const raioMetros = Math.min(Math.max(input.raioKm, 1), 5) * 1000;
    const partidas = await this.partidaRepo.buscarPorRaio(input.lat, input.lng, raioMetros, input.esporte);

    return partidas.map((partida) => {
      const isOrganizador = partida.organizadorId === input.usuarioAutenticadoId;

      return {
        id: partida.id,
        esporte: partida.esporte,
        descricao: partida.descricao,
        dataHora: partida.dataHora,
        maxVagas: partida.maxVagas,
        vagasPreenchidas: partida.vagasPreenchidas,
        bairro: partida.bairro,
        cidade: partida.cidade,
        // Aplicação da RN02: Endereço completo só é visível se for o organizador
        enderecoCompleto: isOrganizador ? partida.enderecoCompleto : undefined,
        lat: Number(partida.lat),
        lng: Number(partida.lng),
        isOrganizador,
      };
    });
  }
}
