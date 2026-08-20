-- ============================================================================
-- SEED COMPLETO COM 10 ITENS POR TABELA — BORA! APP
-- Usuários, Partidas Esportivas, Solicitações de Vagas e Avaliações
-- Região: Franca/SP (Locais reais e coordenadas de quadras/campos)
-- ============================================================================

-- 1. POVOAMENTO DE 10 USUÁRIOS
INSERT INTO usuario (id, nome, email, senha_hash, foto_url, genero, data_nascimento, raio_busca_km, modalidades_favoritas, nota_media, total_avaliacoes, status_usuario)
VALUES 
(
    '11111111-1111-1111-1111-111111111101',
    'Leonardo Lopes (Capitão Bora Franca F.C.)',
    'leonardo.lopes@boraapp.com.br',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'Masculino',
    '1998-05-15',
    5,
    'Futebol Society,Futebol de Campo (11x11),Basquete',
    4.95,
    28,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111102',
    'Renata Saraiva (Líder Sunset Beach Team)',
    'renata.saraiva@boraapp.com.br',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'Feminino',
    '2000-08-20',
    5,
    'Beach Tennis,Vôlei de Praia / Futevôlei,Futsal',
    5.00,
    34,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111103',
    'Prof. Carlos Eduardo Roland (FATEC)',
    'carlos.eduardo@fatecfranca.edu.br',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'Masculino',
    '1985-03-10',
    5,
    'Futebol Society,Basquete 3x3,Futsal',
    4.85,
    42,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111104',
    'Matheus Oliveira (EC Leporace)',
    'matheus.oliveira@gmail.com',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'Masculino',
    '1996-11-22',
    4,
    'Futebol de Campo (11x11),Futebol de 7 (Terrão)',
    4.70,
    19,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111105',
    'Gabriela Mendes (Franca Vôlei Clube)',
    'gabi.mendes@hotmail.com',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    'Feminino',
    '1999-04-18',
    5,
    'Vôlei de Quadra,Beach Tennis',
    4.90,
    25,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111106',
    'Felipe Augusto (União Continental)',
    'felipe.augusto@yahoo.com.br',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'Masculino',
    '1994-09-05',
    5,
    'Futebol Society,Futsal',
    4.80,
    15,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111107',
    'Juliana Peixoto (Capitã Ases da Areia)',
    'juliana.peixoto@outlook.com',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    'Feminino',
    '2001-01-30',
    4,
    'Beach Tennis,Futevôlei',
    4.95,
    31,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111108',
    'Lucas Ferreira (Basquete Francana Sub-25)',
    'lucas.ferreira@gmail.com',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    'Masculino',
    '1997-07-12',
    5,
    'Basquete,Basquete 3x3',
    4.88,
    21,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111109',
    'Bruna Alcantara (Guerreiras do CEPEL)',
    'bruna.alcantara@gmail.com',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    'Feminino',
    '2002-06-14',
    5,
    'Futsal,Handebol',
    4.75,
    12,
    'Ativo'
),
(
    '11111111-1111-1111-1111-111111111110',
    'Rodrigo Silveira (Capitão Santa Cruz FC)',
    'rodrigo.silveira@uol.com.br',
    '$2a$10$WpZ6GfZt.7qO8KzV4X0Nze8tQzI3L2mN1bV4C5X6Z7A8S9D0F1G2H',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    'Masculino',
    '1992-12-08',
    5,
    'Futebol de Campo (11x11),Futebol Society',
    4.92,
    50,
    'Ativo'
)
ON CONFLICT (email) DO UPDATE SET 
    nome = EXCLUDED.nome,
    nota_media = EXCLUDED.nota_media,
    total_avaliacoes = EXCLUDED.total_avaliacoes;

-- 2. POVOAMENTO DE 10 PARTIDAS ESPORTIVAS (CAMPOS PÚBLICOS E PRIVADOS DE FRANCA)
INSERT INTO partida (id, organizador_id, esporte, descricao, data_hora, max_vagas, vagas_preenchidas, filtro_genero, filtro_nivel, endereco_completo, bairro, cidade, lat, lng, status_partida)
VALUES
(
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'Futebol Society',
    'Grande Amistoso: Bora Franca F.C. vs Desafiante no Continental. Levar chuteira society.',
    NOW() + INTERVAL '1 day',
    14,
    10,
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
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'Beach Tennis',
    'Torneio de duplas mistas na Arena Sunset. Raquetes disponíveis no local.',
    NOW() + INTERVAL '2 days',
    8,
    6,
    'Misto',
    'Todos os niveis',
    'Av. Armando Salles de Oliveira, 1500',
    'Parque Universitario',
    'Franca',
    -20.5502100,
    -47.3804500,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'Basquete',
    'Racha clássico no Ginásio Pedrocão. Nível intermediário a avançado.',
    NOW() + INTERVAL '12 hours',
    10,
    9,
    'Misto',
    'Avancado',
    'Rua Francisco Marques, 500',
    'Sao Jose',
    'Franca',
    -20.5368500,
    -47.4042100,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111104',
    'Futebol de Campo (11x11)',
    'Amistoso no Campo do Leporace. Jogo de 1º e 2º quadro completo.',
    NOW() + INTERVAL '3 days',
    22,
    22,
    'Masculino',
    'Intermediario',
    'Av. Abrahao Brickmann, 1200',
    'Leporace',
    'Franca',
    -20.5050200,
    -47.4180400,
    'Lotada'
),
(
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111105',
    'Vôlei de Quadra',
    'Partida mista de integração na quadra do Parque Progresso / CEPEL.',
    NOW() + INTERVAL '4 days',
    12,
    7,
    'Misto',
    'Iniciante/Intermediario',
    'Av. Paulo VI, 2727',
    'Parque Progresso',
    'Franca',
    -20.5411200,
    -47.3956400,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111106',
    'Futebol Society',
    'Pelada na Arena Franca Society. Grama sintética de alta performance.',
    NOW() + INTERVAL '2 days',
    12,
    11,
    'Masculino',
    'Intermediario',
    'Rua Francisco Marques, 850',
    'Vila Nova',
    'Franca',
    -20.5289400,
    -47.4128900,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222207',
    '11111111-1111-1111-1111-111111111107',
    'Vôlei de Praia / Futevôlei',
    'Treino tático de futevôlei e amistoso de duplas na areia.',
    NOW() + INTERVAL '5 days',
    6,
    4,
    'Feminino',
    'Intermediario',
    'Av. Armando Salles de Oliveira, 1500',
    'Parque Universitario',
    'Franca',
    -20.5502100,
    -47.3804500,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222208',
    '11111111-1111-1111-1111-111111111108',
    'Basquete 3x3',
    'Desafio de meia quadra no Poliesportivo. 4 equipes no sistema rei da quadra.',
    NOW() + INTERVAL '1 day',
    12,
    8,
    'Misto',
    'Avancado',
    'Rua Francisco Marques, 500',
    'Sao Jose',
    'Franca',
    -20.5368500,
    -47.4042100,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222209',
    '11111111-1111-1111-1111-111111111109',
    'Futsal',
    'Futsal feminino e misto na quadra coberta da Estação / Champagnat.',
    NOW() + INTERVAL '6 days',
    10,
    5,
    'Feminino',
    'Iniciante',
    'Rua General Carneiro, 900',
    'Estacao',
    'Franca',
    -20.5310200,
    -47.4080100,
    'Publicada'
),
(
    '22222222-2222-2222-2222-222222222210',
    '11111111-1111-1111-1111-111111111110',
    'Futebol de 7 (Terrão)',
    'Clássico de Terrão: Santa Cruz F.C. vs Desafiante no Campo do Santa Cruz.',
    NOW() + INTERVAL '3 days',
    14,
    14,
    'Masculino',
    'Intermediario',
    'Rua Santa Cruz, 450',
    'Santa Cruz',
    'Franca',
    -20.5450100,
    -47.4080300,
    'Lotada'
)
ON CONFLICT (id) DO UPDATE SET 
    descricao = EXCLUDED.descricao,
    status_partida = EXCLUDED.status_partida,
    vagas_preenchidas = EXCLUDED.vagas_preenchidas;

-- 3. POVOAMENTO DE 10 SOLICITAÇÕES DE VAGAS E AMISTOSOS
INSERT INTO solicitacao (id, partida_id, usuario_id, status_solicitacao, data_requisicao, data_decisao)
VALUES
(
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111104',
    'Aprovada',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours'
),
(
    '33333333-3333-3333-3333-333333333302',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111106',
    'Aprovada',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
),
(
    '33333333-3333-3333-3333-333333333303',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111110',
    'Pendente',
    NOW() - INTERVAL '30 minutes',
    NULL
),
(
    '33333333-3333-3333-3333-333333333304',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111105',
    'Aprovada',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '3 hours'
),
(
    '33333333-3333-3333-3333-333333333305',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111107',
    'Aprovada',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours'
),
(
    '33333333-3333-3333-3333-333333333306',
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111108',
    'Aprovada',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours'
),
(
    '33333333-3333-3333-3333-333333333307',
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111102',
    'Pendente',
    NOW() - INTERVAL '1 hour',
    NULL
),
(
    '33333333-3333-3333-3333-333333333308',
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111101',
    'Aprovada',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours'
),
(
    '33333333-3333-3333-3333-333333333309',
    '22222222-2222-2222-2222-222222222208',
    '11111111-1111-1111-1111-111111111103',
    'Aprovada',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '7 hours'
),
(
    '33333333-3333-3333-3333-333333333310',
    '22222222-2222-2222-2222-222222222209',
    '11111111-1111-1111-1111-111111111107',
    'Pendente',
    NOW() - INTERVAL '40 minutes',
    NULL
)
ON CONFLICT (partida_id, usuario_id) DO UPDATE SET 
    status_solicitacao = EXCLUDED.status_solicitacao;

-- 4. POVOAMENTO DE 10 AVALIAÇÕES ENTRE ATLETAS E ORGANIZADORES
INSERT INTO avaliacao (id, partida_id, avaliador_id, avaliado_id, nota, comentario, data_avaliacao)
VALUES
(
    '44444444-4444-4444-4444-444444444401',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111104',
    5,
    'Excelente zagueiro, jogo limpo e pontualidade exemplar.',
    NOW() - INTERVAL '2 days'
),
(
    '44444444-4444-4444-4444-444444444402',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111101',
    5,
    'Organização impecável da partida pelo Leonardo! Campo muito bom.',
    NOW() - INTERVAL '2 days'
),
(
    '44444444-4444-4444-4444-444444444403',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111105',
    5,
    'Excelente jogadora de beach tennis, muita energia e fair play!',
    NOW() - INTERVAL '1 day'
),
(
    '44444444-4444-4444-4444-444444444404',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111102',
    5,
    'Renata conduziu a partida perfeitamente. Quadra impecável.',
    NOW() - INTERVAL '1 day'
),
(
    '44444444-4444-4444-4444-444444444405',
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111108',
    5,
    'Ótimo armador no basquete, joga para a equipe e respeita as regras.',
    NOW() - INTERVAL '18 hours'
),
(
    '44444444-4444-4444-4444-444444444406',
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111108',
    '11111111-1111-1111-1111-111111111103',
    5,
    'Professor Carlos Eduardo organiza jogos de altíssimo nível!',
    NOW() - INTERVAL '18 hours'
),
(
    '44444444-4444-4444-4444-444444444407',
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111101',
    5,
    'Jogou muito bem, pontual e muito comunicativo durante o racha.',
    NOW() - INTERVAL '12 hours'
),
(
    '44444444-4444-4444-4444-444444444408',
    '22222222-2222-2222-2222-222222222208',
    '11111111-1111-1111-1111-111111111108',
    '11111111-1111-1111-1111-111111111103',
    4,
    'Boa intensidade e espírito esportivo no basquete 3x3.',
    NOW() - INTERVAL '10 hours'
),
(
    '44444444-4444-4444-4444-444444444409',
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111106',
    5,
    'Felipe é um camisa 10 clássico, passe refinado e joga sem faltas.',
    NOW() - INTERVAL '8 hours'
),
(
    '44444444-4444-4444-4444-444444444410',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111107',
    '11111111-1111-1111-1111-111111111102',
    5,
    'Amistoso muito bem disputado, recomendo para todos os praticantes!',
    NOW() - INTERVAL '5 hours'
)
ON CONFLICT (partida_id, avaliador_id, avaliado_id) DO UPDATE SET 
    nota = EXCLUDED.nota,
    comentario = EXCLUDED.comentario;
