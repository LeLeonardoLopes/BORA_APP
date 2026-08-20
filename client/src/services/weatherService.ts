export interface PrevisaoClima {
  temperatura: number;
  condicao: string;
  icone: string;
  cor: string;
  alertaChuva: boolean;
}

const CODIGOS_CLIMA: Record<number, { condicao: string; icone: string; cor: string; alertaChuva: boolean }> = {
  0: { condicao: 'Ensolarado', icone: '☀️', cor: '#EAB308', alertaChuva: false },
  1: { condicao: 'Sol', icone: '🌤️', cor: '#EAB308', alertaChuva: false },
  2: { condicao: 'Nublado', icone: '⛅', cor: '#0284C7', alertaChuva: false },
  3: { condicao: 'Nublado', icone: '☁️', cor: '#64748B', alertaChuva: false },
  45: { condicao: 'Neblina', icone: '🌫️', cor: '#64748B', alertaChuva: false },
  48: { condicao: 'Nevoeiro', icone: '🌫️', cor: '#64748B', alertaChuva: false },
  51: { condicao: 'Garoa', icone: '🌦️', cor: '#0284C7', alertaChuva: true },
  53: { condicao: 'Garoa', icone: '🌦️', cor: '#0284C7', alertaChuva: true },
  55: { condicao: 'Chuva', icone: '🌧️', cor: '#2563EB', alertaChuva: true },
  61: { condicao: 'Chuva', icone: '🌧️', cor: '#2563EB', alertaChuva: true },
  63: { condicao: 'Chuva', icone: '🌧️', cor: '#1D4ED8', alertaChuva: true },
  65: { condicao: 'Chuva Forte', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  80: { condicao: 'Pancadas', icone: '🌧️', cor: '#2563EB', alertaChuva: true },
  81: { condicao: 'Chuva Forte', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  82: { condicao: 'Tempestade', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  95: { condicao: 'Tempestade', icone: '⚡', cor: '#DC2626', alertaChuva: true },
};

/**
 * Consulta a previsão do tempo real em Franca/SP via Open-Meteo (API Gratuita sem chave)
 */
export async function obterClimaFranca(lat = -20.5388, lng = -47.4005): Promise<PrevisaoClima> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=America%2FSao_Paulo`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const current = data.current_weather;
      const info = CODIGOS_CLIMA[current.weathercode] || {
        condicao: 'Bom',
        icone: '🌤️',
        cor: '#0066FF',
        alertaChuva: false
      };

      return {
        temperatura: Math.round(current.temperature),
        condicao: info.condicao,
        icone: info.icone,
        cor: info.cor,
        alertaChuva: info.alertaChuva
      };
    }
  } catch (err) {
    // Fallback de clima para Franca/SP em caso de offline
  }

  return {
    temperatura: 26,
    condicao: 'Ensolarado',
    icone: '☀️',
    cor: '#EAB308',
    alertaChuva: false
  };
}
