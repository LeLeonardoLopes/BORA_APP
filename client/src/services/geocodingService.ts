import { CATALOGO_ARENAS_FRANCA } from '../data/francaArenas';

export interface Coordenadas {
  lat: number;
  lng: number;
  displayName?: string;
  bairroDetectado?: string;
  enderecoDetectado?: string;
  precisaoMetros?: number;
  origem:
    | 'satelite_nominatim'
    | 'base_franca'
    | 'gps_dispositivo'
    | 'catalogo_arena'
    | 'viacep'
    | 'ajuste_manual_mapa'
    | 'fallback_centro';
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const FRANCA_PONTOS_REFERENCIA: Record<
  string,
  { lat: number; lng: number; bairro: string; endereco?: string }
> = {
  'são josé': { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000' },
  'sao jose': { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000' },
  continental: { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000' },
  'ismael alonso': { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000' },
  'alonso y alonso': { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2000' },
  sesc: { lat: -20.534215, lng: -47.401258, bairro: 'São José', endereco: 'Av. Dr. Ismael Alonso y Alonso, 2712 (SESC Franca)' },
  'parque progresso': { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Av. Paulo VI' },
  progresso: { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Av. Paulo VI, 2727' },
  cepel: { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Av. Paulo VI, 2727 (CEPEL)' },
  'paulo vi': { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Avenida Paulo VI' },
  'avenida paulo vi': { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Avenida Paulo VI' },
  'av paulo vi': { lat: -20.54112, lng: -47.39564, bairro: 'Parque Progresso', endereco: 'Avenida Paulo VI' },
  'vila nova': { lat: -20.52894, lng: -47.41289, bairro: 'Vila Nova', endereco: 'Rua Francisco Marques, 850' },
  'arena franca': { lat: -20.52894, lng: -47.41289, bairro: 'Vila Nova', endereco: 'Rua Francisco Marques, 850 (Arena Franca)' },
  centro: { lat: -20.5388, lng: -47.4005, bairro: 'Centro', endereco: 'Centro, Franca - SP' },
  estação: { lat: -20.531, lng: -47.408, bairro: 'Estação', endereco: 'Rua General Carneiro, 900' },
  estacao: { lat: -20.531, lng: -47.408, bairro: 'Estação', endereco: 'Rua General Carneiro, 900' },
  champagnat: { lat: -20.531, lng: -47.408, bairro: 'Estação', endereco: 'Rua General Carneiro, 900' },
  leporace: { lat: -20.505, lng: -47.418, bairro: 'Leporace', endereco: 'Av. Abrahão Brickmann, 1200' },
  'abrahao brickmann': { lat: -20.505, lng: -47.418, bairro: 'Leporace', endereco: 'Av. Abrahão Brickmann, 1200' },
  aeroporto: { lat: -20.562, lng: -47.378, bairro: 'Jardim Aeroporto', endereco: 'Av. César Martins Pirajá - Aeroporto' },
  'jardim aeroporto': { lat: -20.562, lng: -47.378, bairro: 'Jardim Aeroporto', endereco: 'Av. César Martins Pirajá - Aeroporto' },
  paulistano: { lat: -20.522, lng: -47.385, bairro: 'Paulistano', endereco: 'Av. Brasil, 1900' },
  'play ball': { lat: -20.522, lng: -47.385, bairro: 'Paulistano', endereco: 'Av. Brasil, 1900 (Arena Play Ball)' },
  brasil: { lat: -20.522, lng: -47.385, bairro: 'Paulistano', endereco: 'Av. Brasil, 1900' },
  'santa efigênia': { lat: -20.525, lng: -47.398, bairro: 'Santa Efigênia', endereco: 'Santa Efigênia, Franca - SP' },
  'santa cruz': { lat: -20.545, lng: -47.408, bairro: 'Santa Cruz', endereco: 'Rua Santa Cruz, 450' },
  'parque universitário': { lat: -20.55021, lng: -47.38045, bairro: 'Parque Universitário', endereco: 'Av. Armando Salles de Oliveira, 1500' },
  'parque universitario': { lat: -20.55021, lng: -47.38045, bairro: 'Parque Universitário', endereco: 'Av. Armando Salles de Oliveira, 1500' },
  fatec: { lat: -20.5145, lng: -47.4008, bairro: 'Vila Imperador', endereco: 'Rua Irênio Grecco, 4580 (FATEC Franca)' },
  'fatec franca': { lat: -20.5145, lng: -47.4008, bairro: 'Vila Imperador', endereco: 'Rua Irênio Grecco, 4580 (FATEC Franca)' },
  unifran: { lat: -20.55021, lng: -47.38045, bairro: 'Parque Universitário', endereco: 'Av. Dr. Armando Salles Oliveira, 201 (Unifran)' },
  sunset: { lat: -20.55021, lng: -47.38045, bairro: 'Parque Universitário', endereco: 'Av. Armando Salles de Oliveira, 1500 (Arena Sunset)' },
  'jardim franca': { lat: -20.515, lng: -47.41, bairro: 'Jardim Francano', endereco: 'Jardim Francano, Franca - SP' },
  'cidade nova': { lat: -20.5335, lng: -47.392, bairro: 'Cidade Nova', endereco: 'Av. Presidente Vargas - Cidade Nova' },
  'presidente vargas': { lat: -20.5335, lng: -47.392, bairro: 'Cidade Nova', endereco: 'Av. Presidente Vargas - Cidade Nova' },
  noêmia: { lat: -20.548, lng: -47.402, bairro: 'Jardim Noêmia', endereco: 'Jardim Noêmia, Franca - SP' },
  noemia: { lat: -20.548, lng: -47.402, bairro: 'Jardim Noêmia', endereco: 'Jardim Noêmia, Franca - SP' },
  'city petropolis': { lat: -20.495, lng: -47.392, bairro: 'City Petrópolis', endereco: 'Av. Santa Terezinha - City Petrópolis' },
  'angelo tomazi': { lat: -20.526, lng: -47.391, bairro: 'Parque Progresso', endereco: 'Rua Ângelo Tomazi, Franca - SP' },
};

const FRANCA_BBOX = { minLng: -47.55, maxLng: -47.25, minLat: -20.68, maxLat: -20.42 };

const dentroDeFranca = (lat: number, lng: number) =>
  lat >= FRANCA_BBOX.minLat && lat <= FRANCA_BBOX.maxLat && lng >= FRANCA_BBOX.minLng && lng <= FRANCA_BBOX.maxLng;

/**
 * Calcula a distância em quilômetros (Fórmula de Haversine) entre dois pontos geográficos em Franca/SP.
 */
export function calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Consulta oficial de endereço pelo CEP brasileiro via ViaCEP API.
 */
export async function consultarViaCep(cep: string): Promise<ViaCepResponse | null> {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    throw new Error('O CEP deve conter exatamente 8 dígitos numéricos.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  if (!response.ok) {
    throw new Error('Falha ao comunicar com o serviço ViaCEP.');
  }

  const data: ViaCepResponse = await response.json();
  if (data.erro) {
    throw new Error('CEP não encontrado na base oficial dos Correios.');
  }

  return data;
}

/**
 * Geocodificação Reversa: Converte coordenadas (lat, lng) em Rua e Bairro reais de Franca/SP.
 */
export async function reverterCoordenadasParaEndereco(
  lat: number,
  lng: number
): Promise<{ enderecoCompleto: string; bairro: string }> {
  // 1. Verifica proximidade imediata com arenas do catálogo
  for (const arena of CATALOGO_ARENAS_FRANCA) {
    if (Math.abs(arena.lat - lat) < 0.0025 && Math.abs(arena.lng - lng) < 0.0025) {
      return {
        enderecoCompleto: `${arena.endereco} (${arena.nome})`,
        bairro: arena.bairro,
      };
    }
  }

  // 2. Consulta Nominatim Reverse Geocoding (OpenStreetMap)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const road = data.address.road || data.address.pedestrian || data.address.footway || '';
        const number = data.address.house_number ? `, ${data.address.house_number}` : '';
        const suburb =
          data.address.suburb ||
          data.address.neighbourhood ||
          data.address.quarter ||
          data.address.city_district ||
          'Centro';

        const ruaFormatada = road
          ? `${road}${number}`
          : data.display_name?.split(',').slice(0, 2).join(',').trim() || `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        return {
          enderecoCompleto: ruaFormatada,
          bairro: suburb,
        };
      }
    }
  } catch {
    // Continua para o fallback por proximidade
  }

  // 3. Fallback: ponto de referência mais próximo em Franca
  let melhorBairro = 'Centro';
  let melhorEnd = `Local selecionado (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  let menorDist = Infinity;

  for (const ref of Object.values(FRANCA_PONTOS_REFERENCIA)) {
    const d = Math.hypot(ref.lat - lat, ref.lng - lng);
    if (d < menorDist) {
      menorDist = d;
      melhorBairro = ref.bairro;
      melhorEnd = `Próx. ao bairro ${ref.bairro}`;
    }
  }

  return { enderecoCompleto: melhorEnd, bairro: melhorBairro };
}

/**
 * Converte endereço ou bairro textual em coordenadas exatas (lat, lng).
 * Prioriza:
 * 1) Catálogo de Arenas de Franca
 * 2) Pontos de referência exatos conhecidos em Franca
 * 3) Satélite Nominatim (OpenStreetMap) com viewbox focado em Franca/SP e extração de bairro
 * 4) Photon (Komoot) focado em Franca/SP
 */
export async function geocodificarEndereco(
  endereco: string,
  bairro = '',
  cidade = 'Franca, SP'
): Promise<Coordenadas> {
  const buscaTexto = `${endereco} ${bairro}`.trim();
  if (!buscaTexto) {
    return { lat: -20.5388, lng: -47.4005, bairroDetectado: 'Centro', origem: 'fallback_centro' };
  }

  const textoEndNorm = normalizar(endereco || '');
  const textoBairroNorm = normalizar(bairro || '');
  const textoCombinadoNorm = normalizar(buscaTexto);

  // 1. Verifica correspondência direta no Catálogo Oficial de Locais de Franca (nome, apelidos, endereço ou CEP)
  for (const arena of CATALOGO_ARENAS_FRANCA) {
    const termosArena = [arena.nome, arena.endereco, ...(arena.apelidos || [])].map(normalizar);
    const bateTexto =
      textoEndNorm.length >= 4 &&
      termosArena.some((t) => t.includes(textoEndNorm) || (t.length >= 4 && textoEndNorm.includes(t)));
    const bateCep = arena.cep && textoCombinadoNorm.includes(normalizar(arena.cep));
    if (bateTexto || bateCep) {
      return {
        lat: arena.lat,
        lng: arena.lng,
        displayName: `${arena.nome} — ${arena.endereco}, ${arena.bairro}, Franca/SP`,
        bairroDetectado: arena.bairro,
        enderecoDetectado: arena.endereco,
        origem: 'catalogo_arena',
      };
    }
  }

  // 2. Consultas online gratuitas com foco geográfico em Franca/SP: Nominatim (OpenStreetMap) e Photon (Komoot)
  const partes = (...p: string[]) => p.map((x) => x.trim()).filter(Boolean).join(', ');
  const consultas = [
    partes(endereco, bairro, cidade, 'Brasil'),
    partes(endereco, 'Franca', 'SP', 'Brasil'),
    partes(bairro, 'Franca', 'SP', 'Brasil'),
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  const comTimeout = async (url: string, headers: Record<string, string> = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  for (const queryCompleta of consultas) {
    const dadosNominatim = await comTimeout(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(queryCompleta)}&limit=3&countrycodes=br&viewbox=-47.55,-20.42,-47.25,-20.68&bounded=0`,
      { 'Accept-Language': 'pt-BR' }
    );
    if (Array.isArray(dadosNominatim) && dadosNominatim.length > 0) {
      const itemFranca =
        dadosNominatim.find((d: any) => dentroDeFranca(parseFloat(d.lat), parseFloat(d.lon))) || dadosNominatim[0];

      if (itemFranca?.lat && itemFranca?.lon) {
        const addr = itemFranca.address || {};
        const bairroExtraido =
          addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || bairro || 'Centro';
        const ruaExtraida = addr.road
          ? `${addr.road}${addr.house_number ? `, ${addr.house_number}` : ''}`
          : (endereco || bairroExtraido);
        const displayLimpo = `${ruaExtraida} — ${bairroExtraido}, Franca/SP`;

        return {
          lat: parseFloat(itemFranca.lat),
          lng: parseFloat(itemFranca.lon),
          displayName: displayLimpo,
          bairroDetectado: bairroExtraido,
          enderecoDetectado: ruaExtraida,
          origem: 'satelite_nominatim',
        };
      }
    }

    const dadosPhoton = await comTimeout(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(queryCompleta)}&limit=4&lang=pt&lat=-20.5388&lon=-47.4005`
    );
    if (Array.isArray(dadosPhoton?.features) && dadosPhoton.features.length > 0) {
      const feature =
        dadosPhoton.features.find((f: any) => {
          const [lngP, latP] = f.geometry?.coordinates || [];
          return typeof latP === 'number' && typeof lngP === 'number' && dentroDeFranca(latP, lngP);
        }) || dadosPhoton.features[0];

      if (feature?.geometry?.coordinates) {
        const [lngPhoton, latPhoton] = feature.geometry.coordinates;
        if (dentroDeFranca(Number(latPhoton), Number(lngPhoton))) {
          const props = feature.properties || {};
          const bairroPhoton = props.district || props.suburb || props.locality || bairro || 'Centro';
          const ruaPhoton = props.street
            ? `${props.street}${props.housenumber ? `, ${props.housenumber}` : ''}`
            : props.name || endereco;
          const nomePhoton = `${ruaPhoton} — ${bairroPhoton}, Franca/SP`;
          return {
            lat: Number(latPhoton),
            lng: Number(lngPhoton),
            displayName: nomePhoton,
            bairroDetectado: bairroPhoton,
            enderecoDetectado: ruaPhoton,
            origem: 'satelite_nominatim',
          };
        }
      }
    }
  }

  // 3. Fallback local de alta precisão: procura primeiro no ENDEREÇO digitado e depois no bairro
  const chaves = Object.keys(FRANCA_PONTOS_REFERENCIA);
  const acharChave = (texto: string) => {
    if (!texto) return null;
    return [...chaves].sort((a, b) => b.length - a.length).find((c) => texto.includes(normalizar(c))) || null;
  };
  const chaveEndereco = acharChave(textoEndNorm);
  const chaveBairro = acharChave(textoBairroNorm);
  const chaveEscolhida = chaveEndereco || chaveBairro;
  if (chaveEscolhida) {
    const coords = FRANCA_PONTOS_REFERENCIA[chaveEscolhida];
    return {
      lat: coords.lat,
      lng: coords.lng,
      bairroDetectado: coords.bairro,
      enderecoDetectado: endereco || undefined,
      displayName: `${endereco || `Bairro ${coords.bairro}`} — ${coords.bairro}, Franca/SP`,
      origem: 'base_franca',
    };
  }

  // 4. Fallback para o Centro de Franca
  return {
    lat: -20.5388,
    lng: -47.4005,
    bairroDetectado: bairro || 'Centro',
    origem: 'fallback_centro',
  };
}

/**
 * Obtém coordenadas reais do GPS do navegador ou dispositivo do atleta
 * com fallback de rede (Wi-Fi/IP) e Geocodificação Reversa automática.
 */
export function obterLocalizacaoAtualGPS(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada no seu dispositivo.'));
      return;
    }

    const aoObterPosicao = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const precisaoMetros = Math.round(pos.coords.accuracy || 15);
      const rev = await reverterCoordenadasParaEndereco(lat, lng);

      resolve({
        lat,
        lng,
        precisaoMetros,
        bairroDetectado: rev.bairro,
        enderecoDetectado: rev.enderecoCompleto,
        displayName: `${rev.enderecoCompleto} (${rev.bairro})`,
        origem: 'gps_dispositivo',
      });
    };

    navigator.geolocation.getCurrentPosition(
      aoObterPosicao,
      () => {
        // 2ª tentativa rápida via rede/Wi-Fi caso GPS de hardware demore em notebooks/desktops
        navigator.geolocation.getCurrentPosition(
          aoObterPosicao,
          (errFinal) => reject(errFinal),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  });
}

export interface SugestaoEndereco {
  label: string;
  endereco?: string;
  bairro?: string;
  lat: number;
  lng: number;
}

/**
 * Sugestões enquanto a pessoa digita (autocomplete).
 * Junta: locais conhecidos de Franca (catálogo local + pontos de referência) + resultados do Photon/Nominatim em Franca.
 */
export async function buscarSugestoesEndereco(texto: string): Promise<SugestaoEndereco[]> {
  const termo = texto.trim();
  if (termo.length < 2) return [];

  const sugestoes: SugestaoEndereco[] = [];
  const termoNorm = normalizar(termo);

  // 1. Locais conhecidos (catálogo local de arenas)
  for (const arena of CATALOGO_ARENAS_FRANCA) {
    const alvo = normalizar(`${arena.nome} ${arena.endereco} ${arena.bairro} ${(arena.apelidos || []).join(' ')}`);
    if (alvo.includes(termoNorm)) {
      sugestoes.push({
        label: `${arena.endereco} — ${arena.bairro}, Franca/SP (${arena.nome})`,
        endereco: arena.endereco,
        bairro: arena.bairro,
        lat: arena.lat,
        lng: arena.lng,
      });
    }
  }

  // 2. Pontos de referência conhecidos de Franca
  for (const [chave, ref] of Object.entries(FRANCA_PONTOS_REFERENCIA)) {
    if (normalizar(chave).includes(termoNorm) || normalizar(ref.bairro).includes(termoNorm)) {
      const endTexto = `Bairro ${ref.bairro}`;
      sugestoes.push({
        label: `${endTexto} — ${ref.bairro}, Franca/SP`,
        endereco: endTexto,
        bairro: ref.bairro,
        lat: ref.lat,
        lng: ref.lng,
      });
    }
  }

  // 3. Photon (Komoot): busca de endereços com viés para o centro de Franca
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(`${termo} Franca SP`)}&limit=6&lang=pt&lat=-20.5388&lon=-47.4005`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      for (const f of data?.features || []) {
        const [lng, lat] = f.geometry?.coordinates || [];
        if (typeof lat !== 'number' || typeof lng !== 'number') continue;
        if (!dentroDeFranca(lat, lng)) continue;
        const p = f.properties || {};
        const rua = p.street ? `${p.street}${p.housenumber ? `, ${p.housenumber}` : ''}` : p.name || termo;
        const bairro = p.district || p.suburb || 'Centro';
        const label = `${rua} — ${bairro}, Franca/SP`;
        sugestoes.push({
          label,
          endereco: rua,
          bairro,
          lat,
          lng,
        });
      }
    }
  } catch {
    // sem internet ou timeout: mantém as sugestões locais
  }

  // Remove duplicadas e limita a 8 opções
  const vistos = new Set<string>();
  return sugestoes
    .filter((s) => {
      const chave = `${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .slice(0, 8);
}
