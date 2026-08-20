const pg = require('pg');
const fs = require('fs');
const path = require('path');

const passwordsToTry = ['524231', 'postgrespassword', 'postgres', 'admin', 'root', '123456', ''];

async function tryConnect() {
  for (const pwd of passwordsToTry) {
    try {
      const client = new pg.Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: pwd,
        database: 'postgres',
      });
      await client.connect();
      console.log('CONECTADO_COM_SUCESSO! Senha correta: ' + pwd);
      
      try {
        await client.query('CREATE DATABASE bora_app_db;');
        console.log('Banco de dados bora_app_db criado com sucesso!');
      } catch (e) {
        console.log('Nota sobre criação do banco:', e.message);
      }
      await client.end();

      const appDb = new pg.Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: pwd,
        database: 'bora_app_db',
      });
      await appDb.connect();

      const ddl = fs.readFileSync(path.join(__dirname, 'src', 'infrastructure', 'database', 'migrations', '001_initial_schema.sql'), 'utf8');
      await appDb.query(ddl);
      console.log('Tabelas DDL criadas com sucesso!');

      const seed = fs.readFileSync(path.join(__dirname, 'src', 'infrastructure', 'database', 'seeds', '001_seed_franca.sql'), 'utf8');
      await appDb.query(seed);
      console.log('Seeds de Franca/SP inseridos com sucesso!');

      await appDb.end();
      return true;
    } catch (err) {
      // continua tentando
    }
  }
  console.log('Nenhuma das senhas conectou no PostgreSQL.');
  return false;
}

tryConnect();
