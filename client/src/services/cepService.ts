export interface CepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  sucesso: boolean;
}

/**
 * Consulta de CEP gratuita utilizando a API pública do ViaCEP com fallback para BrasilAPI.
 * @param cepInput String contendo o CEP (com ou sem traço/ponto)
 */
export async function buscarEnderecoPorCep(cepInput: string): Promise<CepResult | null> {
  const cepLimpo = cepInput.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    return null;
  }

  // 1. Tenta ViaCEP (Gratuito e sem limites estritos)
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      if (!data.erro) {
        return {
          cep: data.cep || cepLimpo,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || 'Franca',
          uf: data.uf || 'SP',
          sucesso: true,
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP offline ou indisponível, tentando BrasilAPI...');
  }

  // 2. Fallback para BrasilAPI
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
    if (response.ok) {
      const data = await response.json();
      return {
        cep: data.cep || cepLimpo,
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        cidade: data.city || 'Franca',
        uf: data.state || 'SP',
        sucesso: true,
      };
    }
  } catch (err) {
    console.error('Erro ao consultar BrasilAPI:', err);
  }

  return null;
}
