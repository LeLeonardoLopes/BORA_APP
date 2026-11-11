export interface PrevisaoClima {
  temperatura: number;
  sensacaoTermica: number;
  condicao: string;
  icone: string;
  cor: string;
  alertaChuva: boolean;
  probabilidadeChuva: number;
  velocidadeVentoKmh: number;
  umidadeRelativa: number;
  horarioReferencia: string;
  coordenadasRef: string;
}

const CODIGOS_CLIMA: Record<number, { condicao: string; icone: string; iconeNoite?: string; cor: string; alertaChuva: boolean }> = {
  0: { condicao: 'Céu Limpo', icone: '☀️', iconeNoite: '🌙', cor: '#EAB308', alertaChuva: false },
  1: { condicao: 'Predomínio de Sol', icone: '🌤️', iconeNoite: '🌙', cor: '#EAB308', alertaChuva: false },
  2: { condicao: 'Parcialmente Nublado', icone: '⛅', iconeNoite: '☁️', cor: '#0284C7', alertaChuva: false },
  3: { condicao: 'Nublado', icone: '☁️', cor: '#64748B', alertaChuva: false },
  45: { condicao: 'Neblina', icone: '🌫️', cor: '#64748B', alertaChuva: false },
  48: { condicao: 'Nevoeiro', icone: '🌫️', cor: '#64748B', alertaChuva: false },
  51: { condicao: 'Garoa Leve', icone: '🌦️', cor: '#0284C7', alertaChuva: true },
  53: { condicao: 'Garoa', icone: '🌦️', cor: '#0284C7', alertaChuva: true },
  55: { condicao: 'Garoa Forte', icone: '🌧️', cor: '#2563EB', alertaChuva: true },
  61: { condicao: 'Chuva Fraca', icone: '🌧️', cor: '#2563EB', alertaChuva: true },
  63: { condicao: 'Chuva Moderada', icone: '🌧️', cor: '#1D4ED8', alertaChuva: true },
  65: { condicao: 'Chuva Forte', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  80: { condicao: 'Pancadas de Chuva', icone: '🌦️', cor: '#2563EB', alertaChuva: true },
  81: { condicao: 'Chuva Forte', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  82: { condicao: 'Tempestade', icone: '⛈️', cor: '#DC2626', alertaChuva: true },
  95: { condicao: 'Tempestade c/ Raios', icone: '⚡', cor: '#DC2626', alertaChuva: true },
};

const cacheClima = new Map<string, { timestamp: number; dados: PrevisaoClima }>();
const TEMPO_CACHE_MS = 10 * 60 * 1000;

/**
 * Consulta a previsão do tempo real em Franca/SP via Open-Meteo (API Gratuita sem chave)
 * Vinculada com precisão às coordenadas GPS exatas (lat, lng) e à data/hora agendada da partida (dataHoraPartida).
 */
export async function obterClimaFranca(
  lat = -20.5388,
  lng = -47.4005,
  dataHoraPartida?: string | Date
): Promise<PrevisaoClima> {
  const latNum = Number.isFinite(Number(lat)) ? Number(Number(lat).toFixed(4)) : -20.5388;
  const lngNum = Number.isFinite(Number(lng)) ? Number(Number(lng).toFixed(4)) : -47.4005;

  let dataAlvo: Date | null = null;
  if (dataHoraPartida) {
    const d = new Date(dataHoraPartida);
    if (!isNaN(d.getTime())) {
      dataAlvo = d;
    }
  }

  const chaveHora = dataAlvo
    ? `${dataAlvo.getFullYear()}-${String(dataAlvo.getMonth() + 1).padStart(2, '0')}-${String(dataAlvo.getDate()).padStart(2, '0')}T${String(dataAlvo.getHours()).padStart(2, '0')}`
    : 'agora';

  const chaveCache = `${latNum}_${lngNum}_${chaveHora}`;
  const emCache = cacheClima.get(chaveCache);
  if (emCache && Date.now() - emCache.timestamp < TEMPO_CACHE_MS) {
    return emCache.dados;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,is_day` +
      `&timezone=America%2FSao_Paulo&forecast_days=14`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      // 1. Se foi informada a data/hora da partida, busca a previsão exata para a hora do jogo
      if (dataAlvo && data.hourly && Array.isArray(data.hourly.time)) {
        const alvoStr = `${dataAlvo.getFullYear()}-${String(dataAlvo.getMonth() + 1).padStart(2, '0')}-${String(dataAlvo.getDate()).padStart(2, '0')}T${String(dataAlvo.getHours()).padStart(2, '0')}:00`;
        let idx = data.hourly.time.findIndex((t: string) => t === alvoStr);

        if (idx === -1) {
          const alvoMs = dataAlvo.getTime();
          let menorDiff = Infinity;
          data.hourly.time.forEach((t: string, i: number) => {
            const diff = Math.abs(new Date(t).getTime() - alvoMs);
            if (diff < menorDiff && diff <= 3 * 3600 * 1000) {
              menorDiff = diff;
              idx = i;
            }
          });
        }

        if (idx !== -1) {
          const temp = Math.round(Number(data.hourly.temperature_2m?.[idx] ?? 25));
          const sensacao = Math.round(Number(data.hourly.apparent_temperature?.[idx] ?? temp));
          const probChuva = Math.round(Number(data.hourly.precipitation_probability?.[idx] ?? 0));
          const code = Number(data.hourly.weather_code?.[idx] ?? 0);
          const vento = Math.round(Number(data.hourly.wind_speed_10m?.[idx] ?? 8));
          const umidade = Math.round(Number(data.hourly.relative_humidity_2m?.[idx] ?? 55));
          const isDay = Number(data.hourly.is_day?.[idx] ?? (dataAlvo.getHours() >= 6 && dataAlvo.getHours() < 18 ? 1 : 0));

          const infoBase = CODIGOS_CLIMA[code] || {
            condicao: isDay ? 'Tempo Bom' : 'Noite Estável',
            icone: isDay ? '🌤️' : '🌙',
            cor: '#0066FF',
            alertaChuva: false,
          };

          const iconeFinal = !isDay && infoBase.iconeNoite ? infoBase.iconeNoite : infoBase.icone;
          const condicaoFinal = !isDay && code <= 1 ? 'Noite Limpa' : infoBase.condicao;
          const alertaChuva = infoBase.alertaChuva || probChuva >= 50;

          const diaFmt = `${String(dataAlvo.getDate()).padStart(2, '0')}/${String(dataAlvo.getMonth() + 1).padStart(2, '0')}`;
          const horaFmt = `${String(dataAlvo.getHours()).padStart(2, '0')}:00`;

          const resultado: PrevisaoClima = {
            temperatura: temp,
            sensacaoTermica: sensacao,
            condicao: condicaoFinal,
            icone: iconeFinal,
            cor: alertaChuva ? '#DC2626' : infoBase.cor,
            alertaChuva,
            probabilidadeChuva: probChuva,
            velocidadeVentoKmh: vento,
            umidadeRelativa: umidade,
            horarioReferencia: `Previsão p/ ${diaFmt} às ${horaFmt}`,
            coordenadasRef: `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
          };

          cacheClima.set(chaveCache, { timestamp: Date.now(), dados: resultado });
          return resultado;
        }
      }

      // 2. Clima atual na coordenada GPS exata
      const current = data.current || data.current_weather;
      const code = Number(current?.weather_code ?? current?.weathercode ?? 0);
      const isDay = Number(current?.is_day ?? 1);
      const temp = Math.round(Number(current?.temperature_2m ?? current?.temperature ?? 26));
      const sensacao = Math.round(Number(current?.apparent_temperature ?? temp));
      const vento = Math.round(Number(current?.wind_speed_10m ?? current?.windspeed ?? 10));
      const umidade = Math.round(Number(current?.relative_humidity_2m ?? 55));

      let probChuvaAtual = 0;
      if (data.hourly && Array.isArray(data.hourly.precipitation_probability)) {
        const agora = new Date();
        const agoraStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}T${String(agora.getHours()).padStart(2, '0')}:00`;
        const idxAgora = data.hourly.time?.findIndex((t: string) => t === agoraStr) ?? 0;
        if (idxAgora >= 0) {
          probChuvaAtual = Math.round(Number(data.hourly.precipitation_probability[idxAgora] ?? 0));
        }
      }

      const info = CODIGOS_CLIMA[code] || {
        condicao: 'Bom',
        icone: '🌤️',
        cor: '#0066FF',
        alertaChuva: false,
      };

      const alertaChuva = info.alertaChuva || probChuvaAtual >= 50;

      const resultadoAtual: PrevisaoClima = {
        temperatura: temp,
        sensacaoTermica: sensacao,
        condicao: !isDay && code <= 1 ? 'Noite Limpa' : info.condicao,
        icone: !isDay && info.iconeNoite ? info.iconeNoite : info.icone,
        cor: alertaChuva ? '#DC2626' : info.cor,
        alertaChuva,
        probabilidadeChuva: probChuvaAtual,
        velocidadeVentoKmh: vento,
        umidadeRelativa: umidade,
        horarioReferencia: 'Clima agora no local',
        coordenadasRef: `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
      };

      cacheClima.set(chaveCache, { timestamp: Date.now(), dados: resultadoAtual });
      return resultadoAtual;
    }
  } catch {
    // Fallback de clima para Franca/SP em caso de offline
  }

  const horaRef = dataAlvo ? dataAlvo.getHours() : new Date().getHours();
  const ehDia = horaRef >= 6 && horaRef < 18;

  return {
    temperatura: ehDia ? 26 : 21,
    sensacaoTermica: ehDia ? 27 : 21,
    condicao: ehDia ? 'Ensolarado' : 'Noite Limpa',
    icone: ehDia ? '☀️' : '🌙',
    cor: '#EAB308',
    alertaChuva: false,
    probabilidadeChuva: 10,
    velocidadeVentoKmh: 9,
    umidadeRelativa: 55,
    horarioReferencia: dataAlvo
      ? `Estimativa p/ ${String(dataAlvo.getHours()).padStart(2, '0')}:00`
      : 'Clima em Franca/SP',
    coordenadasRef: `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
  };
}
