export interface Coordenadas {
  lat: number;
  lng: number;
  displayName?: string;
  origem: 'satelite_nominatim' | 'base_franca' | 'gps_dispositivo' | 'fallback_centro';
}

export const FRANCA_PONTOS_REFERENCIA: Record<string, { lat: number; lng: number }> = {
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

  // 1. Tenta consulta ao serviço de Geocoding OpenStreetMap Nominatim
  try {
    const queryCompleta = `${endereco}, ${bairro}, ${cidade}, Brasil`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryCompleta)}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR',
          'User-Agent': 'BoraApp-Geocoding/1.0',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          origem: 'satelite_nominatim',
        };
      }
    }
  } catch (err) {
    // Continua para o fallback local em caso de timeout ou rede
  }

  // 2. Fallback de alta precisão com os bairros e pontos conhecidos de Franca/SP
  const textoLower = buscaTexto.toLowerCase();
  for (const [chave, coords] of Object.entries(FRANCA_PONTOS_REFERENCIA)) {
    if (textoLower.includes(chave)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        origem: 'base_franca',
      };
    }
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
