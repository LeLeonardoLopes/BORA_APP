import { IPartidaRepository } from '../repositories/IRepositories';

export interface ConsultarMapaInput {
  lat: number;
  lng: number;
  raioKm: number;
  esporte?: string;
  endereco?: string;
  usuarioAutenticadoId: string;
  generoUsuario?: string;
}

export interface PartidaMapaOutput {
  id: string;
  organizadorId: string;
  esporte: string;
  descricao?: string | null;
  dataHora: Date;
  duracaoMinutos?: number;
  maxVagas: number;
  vagasPreenchidas: number;
  filtroGenero?: string | null;
  filtroNivel?: string | null;
  formatoJogo?: string;
  tipoLocal?: string;
  taxaCampo?: number;
  taxaJuiz?: number;
  statusPartida?: string;
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
    const raioMetros = Math.min(Math.max(input.raioKm, 1), 30) * 1000;
    const partidas = await this.partidaRepo.buscarPorRaio(input.lat, input.lng, raioMetros, input.esporte, input.endereco);

    const partidasVisiveis = partidas.filter((partida) => {
      // Regra RN06 (Espaço Seguro Feminino): Homens não têm acesso a partidas exclusivas para mulheres
      const isFeminina = partida.filtroGenero === 'Feminino' || (partida as any).espacoSeguroFeminino;
      const isHomem = String(input.generoUsuario || '').toLowerCase() === 'masculino';
      if (isFeminina && isHomem) {
        return false;
      }
      return true;
    });

    return partidasVisiveis.map((partida) => {
      const isOrganizador = partida.organizadorId === input.usuarioAutenticadoId;

      return {
        id: partida.id,
        organizadorId: partida.organizadorId,
        esporte: partida.esporte,
        descricao: partida.descricao,
        dataHora: partida.dataHora,
        duracaoMinutos: partida.duracaoMinutos,
        maxVagas: partida.maxVagas,
        vagasPreenchidas: partida.vagasPreenchidas,
        filtroGenero: partida.filtroGenero,
        filtroNivel: partida.filtroNivel,
        formatoJogo: partida.formatoJogo,
        tipoLocal: partida.tipoLocal,
        taxaCampo: partida.taxaCampo,
        taxaJuiz: partida.taxaJuiz,
        statusPartida: partida.statusPartida,
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
