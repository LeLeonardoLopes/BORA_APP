export interface ArenaFranca {
  id: string;
  nome: string;
  tipo: 'Publica' | 'Privada';
  categoria: 'Campo Público' | 'Centro Esportivo' | 'Arena Society' | 'Clube / Ginásio' | 'Arena de Areia';
  bairro: string;
  endereco: string;
  cep?: string;
  lat: number;
  lng: number;
  esportesSugeridos: string[];
}

export const CATALOGO_ARENAS_FRANCA: ArenaFranca[] = [
  {
    id: '1',
    nome: 'Campo do Continental / São José',
    tipo: 'Publica',
    categoria: 'Campo Público',
    bairro: 'São José',
    endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000',
    cep: '14401-426',
    lat: -20.534215,
    lng: -47.401258,
    esportesSugeridos: ['Futebol de Campo (11x11)', 'Futebol de 7 (Terrão)']
  },
  {
    id: '2',
    nome: 'Centro Esportivo & Ginásio Poliesportivo Pedrocão',
    tipo: 'Publica',
    categoria: 'Centro Esportivo',
    bairro: 'São José',
    endereco: 'Rua Francisco Marques, 500',
    cep: '14401-200',
    lat: -20.536850,
    lng: -47.404210,
    esportesSugeridos: ['Basquete', 'Futsal', 'Vôlei de Quadra', 'Handebol']
  },
  {
    id: '3',
    nome: 'Complexo Esportivo CEPEL / Parque Progresso',
    tipo: 'Publica',
    categoria: 'Campo Público',
    bairro: 'Parque Progresso',
    endereco: 'Av. Paulo VI, 2727',
    cep: '14403-010',
    lat: -20.541120,
    lng: -47.395640,
    esportesSugeridos: ['Futebol de 7 (Terrão)', 'Futsal', 'Basquete 3x3']
  },
  {
    id: '4',
    nome: 'Centro Esportivo & Campo do Leporace',
    tipo: 'Publica',
    categoria: 'Centro Esportivo',
    bairro: 'Leporace',
    endereco: 'Av. Abrahão Brickmann, 1200',
    cep: '14404-000',
    lat: -20.505020,
    lng: -47.418040,
    esportesSugeridos: ['Futebol de Campo (11x11)', 'Futsal']
  },
  {
    id: '5',
    nome: 'Arena Franca Society (Grama Sintética)',
    tipo: 'Privada',
    categoria: 'Arena Society',
    bairro: 'Vila Nova',
    endereco: 'Rua Francisco Marques, 850',
    cep: '14401-220',
    lat: -20.528940,
    lng: -47.412890,
    esportesSugeridos: ['Futebol Society', 'Futebol de 7 (Terrão)']
  },
  {
    id: '6',
    nome: 'Arena Sunset Beach Tennis & Futevôlei',
    tipo: 'Privada',
    categoria: 'Arena de Areia',
    bairro: 'Parque Universitário',
    endereco: 'Av. Armando Salles de Oliveira, 1500',
    cep: '14404-600',
    lat: -20.550210,
    lng: -47.380450,
    esportesSugeridos: ['Beach Tennis', 'Vôlei de Praia / Futevôlei']
  },
  {
    id: '7',
    nome: 'Campo Municipal da Estação / Champagnat',
    tipo: 'Publica',
    categoria: 'Campo Público',
    bairro: 'Estação',
    endereco: 'Rua General Carneiro, 900',
    cep: '14405-000',
    lat: -20.531020,
    lng: -47.408010,
    esportesSugeridos: ['Futebol de Campo (11x11)']
  },
  {
    id: '8',
    nome: 'Arena Play Ball Society & Churrasqueira',
    tipo: 'Privada',
    categoria: 'Arena Society',
    bairro: 'Paulistano',
    endereco: 'Av. Brasil, 1900',
    cep: '14402-400',
    lat: -20.522030,
    lng: -47.385020,
    esportesSugeridos: ['Futebol Society', 'Futsal']
  },
  {
    id: '9',
    nome: 'Campo do Santa Cruz / Brasilândia',
    tipo: 'Publica',
    categoria: 'Campo Público',
    bairro: 'Santa Cruz',
    endereco: 'Rua Santa Cruz, 450',
    cep: '14403-450',
    lat: -20.545010,
    lng: -47.408030,
    esportesSugeridos: ['Futebol de Campo (11x11)']
  }
];
