-- ============================================================================
-- SCRIPT DE SEED INICIAL (001_seed_franca.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Localização: Pontos esportivos reais de Franca/SP
-- ============================================================================

INSERT INTO usuario (id, nome, email, senha_hash, foto_url, genero, data_nascimento, raio_busca_km, modalidades_favoritas, nota_media, total_avaliacoes, status_usuario)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'Leonardo Santos',
    'leonardo@boraapp.com.br',
    '.nS02q7cQ6gU9zEO8zNqB0OqI0rZfB4mK2X/bK9P3G5W1',
    NULL,
    'Masculino',
    '1998-05-15',
    5,
    'Futebol,Volei,Basquete',
    4.95,
    18,
    'Ativo'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'Renata Claudino',
    'renata@boraapp.com.br',
    '.nS02q7cQ6gU9zEO8zNqB0OqI0rZfB4mK2X/bK9P3G5W1',
    NULL,
    'Feminino',
    '2000-08-20',
    4,
    'Beach Tennis,Volei',
    5.00,
    22,
    'Ativo'
),
(
    'c3333333-3333-3333-3333-333333333333',
    'Carlos Eduardo Roland',
    'carlos.roland@fatecfranca.edu.br',
    '.nS02q7cQ6gU9zEO8zNqB0OqI0rZfB4mK2X/bK9P3G5W1',
    NULL,
    'Masculino',
    '1985-03-10',
    5,
    'Futebol,Corrida',
    4.80,
    30,
    'Ativo'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO partida (id, organizador_id, esporte, descricao, data_hora, max_vagas, vagas_preenchidas, filtro_genero, filtro_nivel, endereco_completo, bairro, cidade, lat, lng, status_partida)
VALUES
(
    'd4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Futebol Society',
    'Racha semanal dos amigos de Franca, nivel intermediario.',
    NOW() + INTERVAL '2 days',
    12,
    4,
    'Misto',
    'Intermediario',
    'Av. Dr. Ismael Alonso y Alonso, 2000',
    'Sao Jose',
    'Franca',
    -20.5342150,
    -47.4012580,
    'Publicada'
),
(
    'e5555555-5555-5555-5555-555555555555',
    'b2222222-2222-2222-2222-222222222222',
    'Beach Tennis',
    'Treino e partida em dupla na Arena Beach Franca.',
    NOW() + INTERVAL '3 days',
    4,
    2,
    'Feminino',
    'Iniciante',
    'Rua Francisco Marques, 850',
    'Vila Nova',
    'Franca',
    -20.5411200,
    -47.3956400,
    'Publicada'
),
(
    'f6666666-6666-6666-6666-666666666666',
    'c3333333-3333-3333-3333-333333333333',
    'Basquete 3x3',
    'Jogo 3x3 na quadra aberta do Poliesportivo de Franca.',
    NOW() + INTERVAL '1 day',
    6,
    5,
    'Misto',
    'Avancado',
    'Av. dos Sapateiros, s/n',
    'Residencial Paraiso',
    'Franca',
    -20.5289400,
    -47.4128900,
    'Publicada'
)
ON CONFLICT (id) DO NOTHING;
