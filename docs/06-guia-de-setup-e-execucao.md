# Guia Oficial de Execução e Avaliação do Projeto — Bora! App

Este documento fornece as instruções completas, passo a passo, para rodar, testar e avaliar a aplicação **Bora! App** em qualquer ambiente de desenvolvimento ou homologação.

---

## 1. Visão Geral da Arquitetura

O **Bora! App** é uma solução completa para organização de partidas esportivas e **Amistosos entre Times**, construída sobre os princípios de **Clean Architecture**, **SOLID** e padrões modernos de segurança e usabilidade:

* **Backend:** Node.js (v20+) + TypeScript + Fastify + JWT + Criptografia Bcrypt.
* **Banco de Dados:** PostgreSQL 16 + PostGIS (Porta 5432) com migrations DDL estritas e seeds reais de Franca/SP.
* **Frontend:** React + TypeScript + Vite + Material UI (MUI), desenvolvido com as diretrizes de design intelligence da skill **ui-ux-pro-max**.

---

## 2. Pré-requisitos do Sistema

* **Node.js:** Versão 18 ou superior ([Download Node.js](https://nodejs.org/))
* **Gerenciador de Pacotes:** npm (incluso no Node.js)
* **Banco de Dados (Uma das opções abaixo):**
  * **Opção A (Docker):** Docker Desktop com suporte a Compose.
  * **Opção B (PostgreSQL Local):** PostgreSQL 16 instalado e rodando na porta 5432.

---

## 3. Passo a Passo para Execução

### Passo 1: Subir o Banco de Dados

#### Se estiver usando Docker Desktop:
Na pasta raiz do projeto (BORA APP), execute:
`ash
docker compose up -d
`
> **Credenciais padrão do Docker:**
> * **Host:** localhost | **Porta:** 5432
> * **Usuário:** postgres | **Senha:** 524231
> * **Banco de Dados:** ora_app_db

---

### Passo 2: Iniciar o Servidor Backend (API REST)

1. Abra um terminal e navegue até a pasta server:
`ash
cd server
`

2. Instale as dependências:
`ash
npm install
`

3. Inicie o servidor em modo de desenvolvimento:
`ash
npm run dev
`

> **Resultado Esperado no Terminal:**
> 🚀 Bora! App Backend rodando na porta 3333
> *(A API estará acessível em http://localhost:3333)*.

---

### Passo 3: Iniciar o Frontend Web/Mobile

1. Abra um segundo terminal e navegue até a pasta client:
`ash
cd client
`

2. Instale as dependências:
`ash
npm install
`

3. Inicie o servidor de desenvolvimento do Vite:
`ash
npm run dev
`

4. Abra o navegador no endereço indicado (geralmente http://localhost:5173).

---

## 4. Roteiro de Avaliação e Teste das Funcionalidades

### A. Autenticação e Segurança (UC01)
* **Credenciais de Teste Pré-cadastradas:**
  * **E-mail:** leonardo@boraapp.com.br
  * **Senha:** 123456
* **Cadastro:** Clique em *"Não tem uma conta? Cadastre-se já!"* para criar novos atletas.
* **Trava de Segurança:** O sistema bloqueia tentativas incorretas após **3 erros consecutivos** por 5 minutos.

### B. Gestão de Perfil & Módulo de Times (Amistosos)
1. Navegue até a aba inferior **"Meu Perfil"**.
2. **Upload de Foto Local:** Clique no ícone de câmera sobre o avatar para carregar uma imagem diretamente do seu computador.
3. **Meu Time / Equipe:** Cadastre ou edite seu time de futebol/esportes coletivos com nome, escudo e bairro base em Franca/SP.
4. **Modalidades:** Escolha entre as opções coletivas (*Futebol de Campo 11x11, Futebol de 7 Terrão, Society, Futsal, Basquete, Vôlei, Beach Tennis*).

### C. Exploração de Partidas & Criação de Amistosos (UC02, UC03)
1. Na aba **"Explorar"**, ajuste o seletor de raio (1 km a 5 km) com busca geoespacial.
2. Clique no botão **+** (amarelo) no canto inferior direito para criar uma partida:
   * **Formato:** Escolha entre **Partida Aberta (Atletas Avulsos)** ou **Amistoso (Time vs Time)**.
   * **Tipo de Local:** Selecione entre **Quadra/Campo Público** ou **Arena Privada**.
3. **Privacidade LGPD (RN02):** Observe que o endereço exato e o mapa interativo só são revelados para partidas onde seu time/usuário estiver **confirmado**.

---

## 5. Execução dos Testes Automatizados de Qualidade

Para rodar a suíte de testes unitários do Backend (regras de negócio, anti-conflito de horários RN01 e moderação):

1. No terminal, dentro da pasta server:
`ash
npm test
`

> **Cobertura:** 100% dos testes unitários de regras de negócio aprovados.
