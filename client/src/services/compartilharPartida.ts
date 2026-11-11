export interface DadosCompartilhamento {
  esporte: string;
  dataHora: string;
  bairro: string;
  /** Endereço exato: só deve ser informado para quem já pode vê-lo (organizador ou vaga confirmada). */
  enderecoCompleto?: string | null;
  duracaoMinutos?: number;
  vagasRestantes?: number;
  maxVagas?: number;
  gratuita?: boolean;
  valorPorAtleta?: number;
  amistoso?: boolean;
  timeMandante?: string | null;
  descricao?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Mostra o convite na perspectiva de quem divulga a própria partida. */
  organizador?: boolean;
}

export function formatarDataPartida(dataHora: string): string {
  try {
    const d = new Date(dataHora);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    // ignora
  }
  return 'Data a definir';
}

export function montarTextoConvite(p: DadosCompartilhamento): string {
  const linhas: string[] = [];
  linhas.push(p.amistoso ? '🏆 *DESAFIO DE AMISTOSO — BORA! APP*' : '⚽ *CONVITE PRO JOGO — BORA! APP*');
  linhas.push('');
  linhas.push(`🏅 *Modalidade:* ${p.esporte}`);
  if (p.amistoso && p.timeMandante) linhas.push(`🛡️ *Time:* ${p.timeMandante}`);
  linhas.push(`📅 *Quando:* ${formatarDataPartida(p.dataHora)}`);
  if (p.duracaoMinutos) linhas.push(`⏱️ *Duração:* ${p.duracaoMinutos} min`);

  const local = p.enderecoCompleto && p.enderecoCompleto.trim() ? `${p.enderecoCompleto}, ${p.bairro}` : p.bairro;
  linhas.push(`📍 *Local:* ${local}, Franca/SP`);
  if (p.enderecoCompleto && p.lat != null && p.lng != null) {
    linhas.push(`🗺️ *Mapa:* https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`);
  }

  if (!p.amistoso && p.vagasRestantes != null && p.maxVagas != null) {
    linhas.push(`🎟️ *Vagas:* ${p.vagasRestantes} de ${p.maxVagas}`);
  }
  if (p.gratuita) {
    linhas.push('🎉 *100% gratuito*');
  } else if (p.valorPorAtleta && p.valorPorAtleta > 0) {
    linhas.push(`💰 *Rateio:* R$ ${p.valorPorAtleta.toFixed(2)} por atleta`);
  }
  if (p.descricao) linhas.push(`📝 ${p.descricao}`);

  linhas.push('');
  const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  linhas.push(p.organizador ? `👉 Solicite sua vaga no Bora! App:\n${url}` : `👉 Bora jogar? Entre no Bora! App:\n${url}`);
  return linhas.join('\n');
}

export type ResultadoCompartilhamento = 'compartilhado' | 'copiado' | 'whatsapp' | 'cancelado';

/**
 * Compartilha o convite da partida: usa o menu nativo de compartilhamento do celular quando disponível;
 * no computador abre o WhatsApp Web (e copia o texto como alternativa).
 */
export async function compartilharPartida(p: DadosCompartilhamento): Promise<ResultadoCompartilhamento> {
  const texto = montarTextoConvite(p);
  const titulo = `${p.esporte} — Bora! App`;

  const nav: any = typeof navigator !== 'undefined' ? navigator : null;
  if (nav?.share) {
    try {
      await nav.share({ title: titulo, text: texto });
      return 'compartilhado';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelado';
      // segue para as alternativas
    }
  }

  try {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    return 'whatsapp';
  } catch {
    // segue para copiar
  }

  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'cancelado';
  }
}

export async function copiarConvite(p: DadosCompartilhamento): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(montarTextoConvite(p));
    return true;
  } catch {
    return false;
  }
}
