export interface ArenaFranca {
  id: string;
  nome: string;
  /** Outros nomes pelos quais o local é conhecido (usados na busca por endereço). */
  apelidos?: string[];
  tipo: 'Publica' | 'Privada';
  categoria: 'Campo Público' | 'Centro Esportivo' | 'Arena Society' | 'Clube / Ginásio' | 'Arena de Areia';
  bairro: string;
  endereco: string;
  cep?: string;
  lat: number;
  lng: number;
  esportesSugeridos: string[];
}

/**
 * Catálogo de locais esportivos de Franca/SP.
 * IMPORTANTE: só entram aqui locais com endereço conferido em fonte oficial.
 * Qualquer outro endereço digitado é localizado em tempo real pelo OpenStreetMap (Nominatim/Photon).
 */
export const CATALOGO_ARENAS_FRANCA: ArenaFranca[] = [
  {
    id: '1',
    nome: 'Ginásio Poliesportivo Pedro Morilla Fuentes (Pedrocão)',
    apelidos: [
      'pedrocao',
      'pedrocão',
      'ginasio poliesportivo',
      'ginásio poliesportivo',
      'ginasio poli esportivo',
      'ginásio poli esportivo',
      'poliesportivo',
      'poli esportivo',
      'pedro morilla',
      'pedro morilla fuentes',
      'ginasio pedro morilla',
    ],
    tipo: 'Publica',
    categoria: 'Centro Esportivo',
    bairro: 'Residencial Paraíso',
    endereco: 'Rua dos Pracinhas, 510',
    cep: '14403-160',
    lat: -20.56229,
    lng: -47.40686,
    esportesSugeridos: ['Basquete', 'Futsal', 'Vôlei de Quadra', 'Handebol'],
  },
];
