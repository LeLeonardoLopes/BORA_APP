// Apaga todas as tabelas do schema public e recria o banco do zero (migrations + seeds).
// Uso: npm run db:reset   (destrutivo: apaga os dados locais)
require('dotenv').config();
const pg = require('pg');
const { execFileSync } = require('child_process');
const path = require('path');

async function reset() {
  const url = process.env.DATABASE_URL || 'postgres://postgres:524231@localhost:5432/bora_app_db';
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log('Limpando schema public...');
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');
  await client.end();
  execFileSync(process.execPath, [path.join(__dirname, 'run_migrations.js')], { stdio: 'inherit' });
}

reset().catch((e) => { console.error('Falha ao resetar o banco:', e.message); process.exit(1); });
