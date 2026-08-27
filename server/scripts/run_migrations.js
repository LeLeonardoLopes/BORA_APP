const pg = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new pg.Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/bora_app_db'
  });
  await client.connect();
  console.log('Conectado ao PostgreSQL bora_app_db!');

  const migrationsDir = path.join(__dirname, '..', 'src', 'infrastructure', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log('Executando migration:', file);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await client.query(sql);
      console.log('  -> OK:', file);
    } catch (e) {
      console.log('  -> Nota / Ja aplicado:', e.message);
    }
  }

  const seedsDir = path.join(__dirname, '..', 'src', 'infrastructure', 'database', 'seeds');
  if (fs.existsSync(seedsDir)) {
    const seedFiles = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
    for (const sFile of seedFiles) {
      console.log('Executando seed:', sFile);
      const sSql = fs.readFileSync(path.join(seedsDir, sFile), 'utf8');
      try {
        await client.query(sSql);
        console.log('  -> OK Seed:', sFile);
      } catch (e) {
        console.log('  -> Nota Seed:', e.message);
      }
    }
  }

  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
  console.log('TABELAS_NO_BANCO:', res.rows.map(r => r.table_name));

  await client.end();
}

migrate().catch(console.error);
