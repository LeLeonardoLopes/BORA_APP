// Teste de fumaça ponta a ponta contra a API em execução (npm run smoke).
// Exercita: cadastro, login, partida, solicitação, aprovação, chat, finalização,
// avaliação e exclusão — e confere no PostgreSQL que cada passo foi gravado de fato.
require('dotenv').config();
const { Client } = require('pg');

const API = process.env.API_URL || 'http://localhost:3333/api/v1';
const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:524231@localhost:5432/bora_app_db';
const SENHA = 'Senha@123';
let falhas = 0;

const passo = (nome, ok, extra = '') => {
  console.log(`${ok ? '[OK]  ' : '[FALHA]'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!ok) falhas++;
};

async function api(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* sem corpo */ }
  return { status: res.status, json };
}

async function cadastrar(email, nome, genero) {
  const codigo = (await api('POST', '/auth/send-code', { email })).json?.codigoDev;
  await api('POST', '/auth/register', { nome, email, senha: SENHA, genero, codigoVerificacao: codigo });
  const login = await api('POST', '/auth/login', { email, senha: SENHA });
  return { token: login.json?.token, id: login.json?.usuario?.id };
}

(async () => {
  const db = new Client({ connectionString: DB_URL });
  try {
    await db.connect();
  } catch (e) {
    console.log('[FALHA] Não conectou ao PostgreSQL:', e.message);
    process.exit(1);
  }

  let health;
  try { health = (await fetch(API.replace('/api/v1', '') + '/health')).status; } catch { health = 0; }
  passo('API respondendo em /health', health === 200, `status ${health}`);
  if (health !== 200) { await db.end(); process.exit(1); }

  const suf = Date.now();
  const org = await cadastrar(`org${suf}@teste.com`, `Organizador ${suf}`, 'Masculino');
  const atl = await cadastrar(`atl${suf}@teste.com`, `Atleta ${suf}`, 'Masculino');
  passo('cadastro e login de organizador e atleta', Boolean(org.token && atl.token));

  const dataHora = new Date(Date.now() + 10 * 86400000).toISOString();
  const criada = await api('POST', '/matches', {
    esporte: 'Futsal', descricao: `Smoke ${suf}`, dataHora, maxVagas: 10,
    enderecoCompleto: 'Rua Teste, 100', bairro: 'Centro', lat: -20.5388, lng: -47.4005, organizadorId: org.id,
  }, org.token);
  const partidaId = criada.json?.data?.props?.id;
  const { rows: [pDb] } = await db.query('SELECT id FROM partida WHERE id = $1', [partidaId || null]);
  passo('criar partida (gravada no banco)', Boolean(partidaId && pDb), partidaId || JSON.stringify(criada.json));
  if (!pDb) { falhas++; }

  const sol = await api('POST', `/matches/${partidaId}/requests`, { usuarioId: atl.id }, atl.token);
  const solicitacaoId = sol.json?.data?.props?.id;
  passo('atleta solicita vaga', Boolean(solicitacaoId), solicitacaoId || JSON.stringify(sol.json));

  const lista = await api('GET', '/requests', null, org.token);
  passo('organizador vê a solicitação na listagem', (lista.json?.data || []).some((s) => s.id === solicitacaoId));

  const aprova = await api('PATCH', `/requests/${solicitacaoId}`, { acao: 'aprovar', organizadorId: org.id }, org.token);
  const { rows: [sDb] } = await db.query('SELECT status_solicitacao FROM solicitacao WHERE id = $1', [solicitacaoId || null]);
  passo('organizador aprova e status é gravado', aprova.status === 200 && sDb?.status_solicitacao === 'Aprovada');

  const msg = await api('POST', `/matches/${partidaId}/messages`, { usuarioId: atl.id, texto: 'Bora!', usuarioNome: 'Atleta' }, atl.token);
  const { rows: [mDb] } = await db.query('SELECT count(*)::int AS n FROM chat_mensagem WHERE partida_id = $1', [partidaId || null]);
  passo('mensagem no mural gravada no banco', msg.status < 300 && mDb.n === 1);

  const fim = await api('PATCH', `/matches/${partidaId}/finish`, { solicitanteId: org.id }, org.token);
  passo('organizador encerra a partida', fim.status === 200);

  const av = await api('POST', '/ratings', { avaliadorId: atl.id, partidaId, avaliadoId: org.id, nota: 5, comentario: 'Ótimo' }, atl.token);
  passo('atleta avalia o organizador', av.status < 300, `status ${av.status}`);

  const del = await api('DELETE', `/matches/${partidaId}`, { solicitanteId: org.id }, org.token);
  const { rows: [pFinal] } = await db.query('SELECT deletado_em IS NOT NULL AS apagada FROM partida WHERE id = $1', [partidaId || null]);
  passo('exclusão lógica da partida gravada', del.status === 200 && pFinal?.apagada === true);

  const { rows: [erros] } = await db.query("SELECT count(*)::int AS n FROM auditoria_log WHERE registro_id = $1", [partidaId || null]);
  passo('auditoria registrou as alterações da partida', erros.n > 0, `${erros.n} registros`);

  await db.end();
  console.log(falhas === 0 ? '\nFLUXO COMPLETO OK' : `\n${falhas} verificação(ões) falharam`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => { console.error('[FALHA] Erro inesperado:', e); process.exit(1); });
