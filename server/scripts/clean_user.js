const { Client } = require('pg');

async function main() {
  const client = new Client('postgres://postgres:postgres@localhost:5432/bora_app_db');
  await client.connect();

  const email = 'leleonardolopes@gmail.com';
  const res = await client.query('SELECT id, nome, email, cpf FROM usuario WHERE LOWER(email) = $1', [email]);
  
  if (res.rows.length > 0) {
    const userId = res.rows[0].id;
    console.log('Encontrado usuário para exclusão:', res.rows[0]);
    
    // Tenta limpar tabelas filhas caso existam vínculos
    try { await client.query('DELETE FROM chat_mensagem WHERE usuario_id = $1', [userId]); } catch (e) {}
    try { await client.query('DELETE FROM avaliacao WHERE avaliador_id = $1 OR avaliado_id = $1', [userId]); } catch (e) {}
    try { await client.query('DELETE FROM solicitacao WHERE usuario_id = $1', [userId]); } catch (e) {}
    try { await client.query('DELETE FROM partida WHERE organizador_id = $1', [userId]); } catch (e) {}
    
    // Deleta o usuário
    await client.query('DELETE FROM usuario WHERE id = $1', [userId]);
    console.log('✅ Usuário removido com sucesso do PostgreSQL!');
  } else {
    console.log('ℹ️ Usuário não encontrado no banco PostgreSQL.');
  }

  const resOtp = await client.query('DELETE FROM codigo_verificacao_email WHERE LOWER(email) = $1', [email]);
  console.log(`✅ Códigos OTP removidos: ${resOtp.rowCount}`);

  // Validação final
  const check = await client.query('SELECT count(*) FROM usuario WHERE LOWER(email) = $1', [email]);
  console.log('Total de registros restantes com esse email:', check.rows[0].count);

  await client.end();
}

main().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
