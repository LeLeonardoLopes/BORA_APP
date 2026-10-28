export interface Coordenadas {
  lat: number;
  lng: number;
  displayName?: string;
  origem: 'satelite_nominatim' | 'base_franca' | 'gps_dispositivo' | 'catalogo_arena' | 'viacep' | 'ajuste_manual_mapa' | 'fallback_centro';
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

export const FRANCA_PONTOS_REFERENCIA: Record<string, { lat: number; lng: number }> = {
  'poliesportivo': { lat: -20.536850, lng: -47.404210 },
  'poli': { lat: -20.536850, lng: -47.404210 },
  'ginasio': { lat: -20.536850, lng: -47.404210 },
  'ginasio poliesportivo': { lat: -20.536850, lng: -47.404210 },
  'francisco marques': { lat: -20.536850, lng: -47.404210 },
  'pedrocao': { lat: -20.536850, lng: -47.404210 },
  'pedrocão': { lat: -20.536850, lng: -47.404210 },
  'pedro morilla': { lat: -20.536850, lng: -47.404210 },
  'morilla': { lat: -20.536850, lng: -47.404210 },
  'pedro morila': { lat: -20.536850, lng: -47.404210 },
  'rua dos pracinhas': { lat: -20.536850, lng: -47.404210 },
  'pracinhas': { lat: -20.536850, lng: -47.404210 },
  'são josé': { lat: -20.534215, lng: -47.401258 },
  'sao jose': { lat: -20.534215, lng: -47.401258 },
  'continental': { lat: -20.534215, lng: -47.401258 },
  'parque progresso': { lat: -20.54112, lng: -47.39564 },
  'progresso': { lat: -20.54112, lng: -47.39564 },
  'cepel': { lat: -20.54112, lng: -47.39564 },
  'paulo vi': { lat: -20.54112, lng: -47.39564 },
  'vila nova': { lat: -20.52894, lng: -47.41289 },
  'centro': { lat: -20.5388, lng: -47.4005 },
  'estação': { lat: -20.5310, lng: -47.4080 },
  'estacao': { lat: -20.5310, lng: -47.4080 },
  'leporace': { lat: -20.5050, lng: -47.4180 },
  'aeroporto': { lat: -20.5620, lng: -47.3780 },
  'paulistano': { lat: -20.5220, lng: -47.3850 },
  'brasil': { lat: -20.5360, lng: -47.4050 },
  'santa efigênia': { lat: -20.5250, lng: -47.3980 },
  'santa cruz': { lat: -20.5450, lng: -47.4080 },
  'parque universitário': { lat: -20.5500, lng: -47.3800 },
  'jardim franca': { lat: -20.5150, lng: -47.4100 },
  'noêmia': { lat: -20.5480, lng: -47.4020 },
  'angelo tomazi': { lat: -20.5260, lng: -47.3910 }
};

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
 * Converte endereço ou bairro textual em coordenadas exatas (lat, lng).
 * Tenta busca geoespacial via OpenStreetMap Nominatim e possui fallback de alta precisão para Franca/SP.
 */
export async function geocodificarEndereco(
  endereco: string,
  bairro = '',
  cidade = 'Franca, SP'
): Promise<Coordenadas> {
  const buscaTexto = `${endereco} ${bairro}`.trim();
  if (!buscaTexto) {
    return { lat: -20.5388, lng: -47.4005, origem: 'fallback_centro' };
  }

  // 1. Consultas online gratuitas: Nominatim (OpenStreetMap) e, se falhar, Photon (Komoot).
  // Partes vazias são descartadas para não gerar consultas como "Rua X, , Franca".
  const partes = (...p: string[]) => p.map((x) => x.trim()).filter(Boolean).join(', ');
  const consultas = [
    partes(endereco, bairro, cidade, 'Brasil'),
    partes(endereco, 'Franca', 'SP', 'Brasil'),
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  const comTimeout = async (url: string, headers: Record<string, string> = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryCompleta)}&limit=1&countrycodes=br`,
      { 'Accept-Language': 'pt-BR' }
    );
    if (Array.isArray(dadosNominatim) && dadosNominatim.length > 0 && dadosNominatim[0].lat && dadosNominatim[0].lon) {
      return {
        lat: parseFloat(dadosNominatim[0].lat),
        lng: parseFloat(dadosNominatim[0].lon),
        displayName: dadosNominatim[0].display_name,
        origem: 'satelite_nominatim',
      };
    }

    const dadosPhoton = await comTimeout(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(queryCompleta)}&limit=1&lang=pt&lat=-20.5388&lon=-47.4005`
    );
    const feature = dadosPhoton?.features?.[0];
    if (feature?.geometry?.coordinates) {
      const [lngPhoton, latPhoton] = feature.geometry.coordinates;
      const nomePhoton = [feature.properties?.name, feature.properties?.street, feature.properties?.city]
        .filter(Boolean)
        .join(', ');
      return {
        lat: Number(latPhoton),
        lng: Number(lngPhoton),
        displayName: nomePhoton || queryCompleta,
        origem: 'satelite_nominatim',
      };
    }
  }

  // 2. Fallback local: procura primeiro no ENDEREÇO digitado e só depois no bairro.
  // (Antes a busca juntava endereço + bairro, e o bairro padrão "São José" vencia o endereço.)
  const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const textoEndereco = normalizar(endereco || '');
  const textoBairro = normalizar(bairro || '');
  const chaves = Object.keys(FRANCA_PONTOS_REFERENCIA);
  const acharChave = (texto: string) => {
    if (!texto) return null;
    // Chaves mais longas primeiro, para "poliesportivo" vencer um bairro genérico
    return [...chaves].sort((a, b) => b.length - a.length).find((c) => texto.includes(normalizar(c))) || null;
  };
  const chaveEndereco = acharChave(textoEndereco);
  const chaveBairro = acharChave(textoBairro);
  const chaveEscolhida = chaveEndereco || chaveBairro;
  if (chaveEscolhida) {
    const coords = FRANCA_PONTOS_REFERENCIA[chaveEscolhida];
    return { lat: coords.lat, lng: coords.lng, origem: 'base_franca' };
  }

  // 3. Fallback para o Centro de Franca
  return {
    lat: -20.5388,
    lng: -47.4005,
    origem: 'fallback_centro',
  };
}

/**
 * Obtém coordenadas reais do GPS do navegador ou dispositivo do atleta.
 */
export function obterLocalizacaoAtualGPS(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada no seu dispositivo.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          origem: 'gps_dispositivo',
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

export interface SugestaoEndereco {
  label: string;
  lat: number;
  lng: number;
}

const FRANCA_BBOX = { minLng: -47.55, maxLng: -47.3, minLat: -20.66, maxLat: -20.45 };

const dentroDeFranca = (lat: number, lng: number) =>
  lat >= FRANCA_BBOX.minLat && lat <= FRANCA_BBOX.maxLat && lng >= FRANCA_BBOX.minLng && lng <= FRANCA_BBOX.maxLng;

/**
 * Sugestões enquanto a pessoa digita (autocomplete).
 * Junta: locais conhecidos de Franca (catálogo local) + resultados do Photon (Komoot), com viés para Franca.
 */
export async function buscarSugestoesEndereco(texto: string): Promise<SugestaoEndereco[]> {
  const termo = texto.trim();
  if (termo.length < 3) return [];

  const sugestoes: SugestaoEndereco[] = [];
  const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const termoNorm = normalizar(termo);

  // 1. Locais conhecidos (catálogo local) que contenham o texto digitado
  try {
    const { CATALOGO_ARENAS_FRANCA } = await import('../data/francaArenas');
    for (const arena of CATALOGO_ARENAS_FRANCA) {
      const alvo = normalizar(`${arena.nome} ${arena.endereco} ${arena.bairro}`);
      if (alvo.includes(termoNorm)) {
        sugestoes.push({ label: `${arena.nome} — ${arena.endereco}`, lat: arena.lat, lng: arena.lng });
      }
    }
  } catch {
    // catálogo indisponível: segue só com o Photon
  }

  // 2. Photon (Komoot): busca de endereços com viés para o centro de Franca
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
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
        const partes = [p.name, p.street, p.housenumber, p.district, p.city].filter(Boolean);
        const label = partes.join(', ');
        if (!label) continue;
        sugestoes.push({ label, lat, lng });
      }
    }
  } catch {
    // sem internet ou timeout: mantém só as sugestões locais
  }

  // Remove duplicadas (mesmo nome/coordenada) e limita a 8 opções
  const vistos = new Set<string>();
  return sugestoes
    .filter((s) => {
      const chave = `${s.label.toLowerCase()}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .slice(0, 8);
}
