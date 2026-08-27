const pg = require('pg');

async function renewMatches() {
  const client = new pg.Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/bora_app_db' });
  await client.connect();

  const query = "UPDATE partida SET data_hora = NOW() + (INTERVAL '1 day' * (FLOOR(RANDOM() * 5 + 1))), status_partida = 'Publicada', vagas_preenchidas = CASE WHEN max_vagas > 4 THEN 3 ELSE 1 END;";
  await client.query(query);

  const res = await client.query('SELECT esporte, bairro, data_hora, status_partida, vagas_preenchidas, max_vagas FROM partida ORDER BY data_hora ASC');
  console.log('PARTIDAS_ATUALIZADAS_FUTURAS:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

renewMatches().catch(console.error);
