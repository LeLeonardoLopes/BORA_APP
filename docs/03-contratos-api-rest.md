# 03 — Contratos da API REST — Bora! App

## 1. Convenções Gerais

* **Base URL:** `http://localhost:3333/api/v1`
* **Formato de Envio/Retorno:** `application/json; charset=utf-8`
* **Autenticação:** Header `Authorization: Bearer <JWT_TOKEN>`
* **Padrão de Resposta de Erro:**
```json
{
  "sucesso": false,
  "erro": {
    "codigo": "RN01_CONFLITO_AGENDA",
    "mensagem": "Você já possui uma partida aprovada no mesmo horário."
  }
}
```

---

## 2. Endpoints do 1º CRUD (Autenticação e Perfis)

### 2.1. Cadastro de Usuário (`POST /auth/register`)
* **Acesso:** Público
* **Request Body:**
```json
{
  "nome": "Carlos Silva",
  "email": "carlos@email.com",
  "senha": "SenhaForte@123",
  "genero": "Masculino",
  "data_nascimento": "1998-05-15"
}
```
* **Response (HTTP 201 Created):**
```json
{
  "sucesso": true,
  "dados": {
    "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
    "nome": "Carlos Silva",
    "email": "carlos@email.com",
    "status_usuario": "Pendente_Validacao",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2. Login de Usuário (`POST /auth/login`)
* **Acesso:** Público
* **Request Body:**
```json
{
  "email": "carlos@email.com",
  "senha": "SenhaForte@123"
}
```
* **Response (HTTP 200 OK):**
```json
{
  "sucesso": true,
  "dados": {
    "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
    "nome": "Carlos Silva",
    "email": "carlos@email.com",
    "nota_media": 5.0,
    "status_usuario": "Ativo",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3. Obter Perfil Atual (`GET /users/me`)
* **Acesso:** Autenticado
* **Response (HTTP 200 OK):**
```json
{
  "sucesso": true,
  "dados": {
    "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
    "nome": "Carlos Silva",
    "email": "carlos@email.com",
    "genero": "Masculino",
    "nota_media": 4.85,
    "total_avaliacoes": 12,
    "raio_busca_km": 5,
    "modalidades_favoritas": ["Futebol", "Basquete"],
    "status_usuario": "Ativo"
  }
}
```

### 2.4. Atualizar Perfil (`PUT /users/me`)
* **Acesso:** Autenticado
* **Request Body:**
```json
{
  "modalidades_favoritas": ["Futebol", "Vôlei"],
  "raio_busca_km": 3
}
```

---

## 3. Endpoints do 2º CRUD (Partidas Esportivas)

### 3.1. Cadastrar Partida (`POST /matches`) — UC03
* **Acesso:** Autenticado (`status_usuario = 'Ativo'`)
* **Request Body:**
```json
{
  "esporte": "Futebol Society",
  "descricao": "Jogo amador 7x7 no CEPEL",
  "data_hora": "2026-08-25T19:30:00Z",
  "max_vagas": 14,
  "filtro_genero": "Misto",
  "filtro_nivel": "Iniciante/Intermediário",
  "endereco_completo": "Avenida Paulo VI, 2727",
  "bairro": "Parque Progresso",
  "cidade": "Franca",
  "lat": -20.538521,
  "lng": -47.400142
}
```
* **Response (HTTP 201 Created):**
```json
{
  "sucesso": true,
  "dados": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "esporte": "Futebol Society",
    "status_partida": "Publicada",
    "max_vagas": 14,
    "vagas_preenchidas": 1
  }
}
```

### 3.2. Consultar Mapa de Partidas (`GET /matches`) — UC02 (com PostGIS)
* **Acesso:** Autenticado
* **Query Params:** `?lat=-20.5385&lng=-47.4001&radius=5000&esporte=Futebol`
* **Response (HTTP 200 OK) — Com ofuscação LGPD (RN02):**
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "esporte": "Futebol Society",
      "descricao": "Jogo amador 7x7 no CEPEL",
      "data_hora": "2026-08-25T19:30:00Z",
      "max_vagas": 14,
      "vagas_disponiveis": 13,
      "bairro": "Parque Progresso",
      "cidade": "Franca",
      "distancia_km": 1.2,
      "organizador": {
        "nome": "Leonardo",
        "nota_media": 4.9
      }
    }
  ]
}
```

### 3.3. Cancelar Partida (`DELETE /matches/:id`) — UC03 (com RN03)
* **Acesso:** Organizador da Partida
* **Comportamento RN03:** Se a partida estiver com `status_partida = 'Lotada'`, a API retorna `HTTP 409 Conflict` com código `RN03_PARTIDA_LOTADA_NAO_CANCELAVEL`.

---

## 4. Endpoints do 3º CRUD (Solicitações de Vagas)

### 4.1. Solicitar Vaga (`POST /matches/:id/requests`) — UC04 (com RN01)
* **Acesso:** Atleta Autenticado
* **Comportamento RN01:** Verifica conflito de horário.
* **Response (HTTP 201 Created):**
```json
{
  "sucesso": true,
  "dados": {
    "solicitacao_id": "c1f2e3d4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "status_solicitacao": "Pendente",
    "mensagem": "Solicitação enviada ao organizador."
  }
}
```

### 4.2. Gerenciar Solicitação (`PATCH /requests/:id`) — UC06
* **Acesso:** Organizador da Partida
* **Request Body:**
```json
{
  "status": "Aprovada"
}
```
* **Response (HTTP 200 OK):**
```json
{
  "sucesso": true,
  "dados": {
    "solicitacao_id": "c1f2e3d4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "status_solicitacao": "Aprovada",
    "vagas_preenchidas": 14,
    "status_partida": "Lotada"
  }
}
```

### 4.3. Desistir / Cancelar Solicitação (`DELETE /requests/:id`) — UC04
* **Acesso:** Dono da Solicitação
* **Response (HTTP 200 OK):**
```json
{
  "sucesso": true,
  "mensagem": "Solicitação cancelada com sucesso."
}
```
