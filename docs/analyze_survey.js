const fs = require('fs');
const content = fs.readFileSync('docs/survey_extracted.txt', 'utf8');
const lines = content.split('\n').filter(l => l.trim().length > 0);

const rows = lines.slice(2).map(l => l.split(' | '));
console.log('Total de respondentes:', rows.length);

function countFreq(colIdx, name) {
  const counts = {};
  rows.forEach(r => {
    const val = (r[colIdx] || '').trim();
    if (!val) return;
    counts[val] = (counts[val] || 0) + 1;
  });
  console.log('\n=== ' + name + ' ===');
  Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = ((v / rows.length) * 100).toFixed(1);
    console.log(`- ${k}: ${v} (${pct}%)`);
  });
}

// Modalidades
const sportsCount = {};
rows.forEach(r => {
  const sports = (r[7] || '').split(';').map(s => s.trim()).filter(s => s.length > 0);
  sports.forEach(s => {
    sportsCount[s] = (sportsCount[s] || 0) + 1;
  });
});
console.log('\n=== Modalidades Mais Praticadas / Desejadas ===');
Object.entries(sportsCount).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
  const pct = ((v / rows.length) * 100).toFixed(1);
  console.log(`- ${k}: ${v} (${pct}%)`);
});

countFreq(6, 'Faixa Etária');
countFreq(10, 'Gênero');
countFreq(8, 'Principal Obstáculo');
countFreq(9, 'Distância Máxima de Deslocamento');

const womenRows = rows.filter(r => (r[10] || '').includes('Feminino'));
console.log('\n=== [Mulheres - Total: ' + womenRows.length + '] Deixou de praticar por medo/assédio ===');
const wAssedio = {};
womenRows.forEach(r => {
  const v = (r[11] || '').trim();
  wAssedio[v] = (wAssedio[v] || 0) + 1;
});
Object.entries(wAssedio).forEach(([k, v]) => {
  console.log(`- ${k}: ${v} (${((v/womenRows.length)*100).toFixed(1)}%)`);
});

console.log('\n=== [Mulheres] Importância do Mapa Blindado (RN06) ===');
const wBlind = {};
womenRows.forEach(r => {
  const v = (r[12] || '').trim();
  wBlind[v] = (wBlind[v] || 0) + 1;
});
Object.entries(wBlind).forEach(([k, v]) => {
  console.log(`- ${k}: ${v} (${((v/womenRows.length)*100).toFixed(1)}%)`);
});

countFreq(13, 'Sistema de Avaliação 360 / Notas de Jogador');
countFreq(14, 'Avaliação de Anfitrião, Quadra e Clima do Jogo');
countFreq(15, 'Súmula Digital em Amistosos');
countFreq(16, 'Perfil de Árbitro em Amistosos');
countFreq(17, 'Tolerância Zero (Banimento por Assédio/Racismo/Agressão)');
