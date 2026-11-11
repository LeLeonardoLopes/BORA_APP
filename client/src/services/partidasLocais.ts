/**
 * Armazenamento local (navegador) das partidas e solicitações criadas quando o servidor está offline
 * e controle das partidas excluídas. Usado pela tela Explorar e pela tela de Gestão,
 * para que ambas sempre mostrem exatamente as mesmas partidas e solicitações.
 */
const CHAVE_LOCAIS = '@bora:partidas_locais';
const CHAVE_EXCLUIDAS = '@bora:partidas_excluidas';
const CHAVE_SOLICITACOES_LOCAIS = '@bora:solicitacoes_locais';

export function lerPartidasLocais(): any[] {
  try {
    const raw = localStorage.getItem(CHAVE_LOCAIS);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function salvarPartidaLocal(partida: any): void {
  try {
    const locais = lerPartidasLocais().filter((p) => p.id !== partida.id);
    localStorage.setItem(CHAVE_LOCAIS, JSON.stringify([partida, ...locais]));
  } catch {
    // ignora falha de armazenamento
  }
}

export function lerPartidasExcluidas(): string[] {
  try {
    const raw = localStorage.getItem(CHAVE_EXCLUIDAS);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

/** Remove a partida do armazenamento local e registra o id como excluído (some de todas as telas). */
export function excluirPartidaLocal(id: string): void {
  try {
    const locais = lerPartidasLocais().filter((p) => p.id !== id);
    localStorage.setItem(CHAVE_LOCAIS, JSON.stringify(locais));
    const excluidas = lerPartidasExcluidas();
    if (!excluidas.includes(id)) {
      localStorage.setItem(CHAVE_EXCLUIDAS, JSON.stringify([...excluidas, id]));
    }
  } catch {
    // ignora falha de armazenamento
  }
}

export function partidaFoiExcluida(id: string): boolean {
  return lerPartidasExcluidas().includes(id);
}

export function lerSolicitacoesLocais(): any[] {
  try {
    const raw = localStorage.getItem(CHAVE_SOLICITACOES_LOCAIS);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function salvarSolicitacaoLocal(solicitacao: any): void {
  try {
    const atuais = lerSolicitacoesLocais().filter(
      (s) => !(s.partidaId === solicitacao.partidaId && s.usuarioId === solicitacao.usuarioId)
    );
    localStorage.setItem(CHAVE_SOLICITACOES_LOCAIS, JSON.stringify([solicitacao, ...atuais]));
  } catch {
    // ignora falha de armazenamento
  }
}

export function atualizarStatusSolicitacaoLocal(idOuPartidaId: string, usuarioId: string | undefined, novoStatus: string): void {
  try {
    const atuais = lerSolicitacoesLocais().map((s) => {
      if (s.id === idOuPartidaId || (s.partidaId === idOuPartidaId && (!usuarioId || s.usuarioId === usuarioId))) {
        return { ...s, statusSolicitacao: novoStatus };
      }
      return s;
    });
    localStorage.setItem(CHAVE_SOLICITACOES_LOCAIS, JSON.stringify(atuais));
  } catch {
    // ignora falha
  }
}
