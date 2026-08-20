# 🏆 Bora! App — Conexão Esportiva & Amistosos por Geolocalização

> **Social Tech de Conexão Esportiva e Gestão de Partidas/Amistosos**  
> Desenvolvido para a região de Franca/SP e expansível para todo o Brasil.

---

## 📌 1. Sobre o Projeto

O **Bora! App** é uma plataforma que conecta pessoas e equipes esportivas através de geolocalização. O sistema combate o sedentarismo e o isolamento social, facilitando o encontro de praticantes de diversas modalidades, tanto para **partidas abertas com vagas avulsas** quanto para **amistosos organizados entre times/equipes**.

### 👥 Equipe & Governança
* **Leonardo Lopes Dos Santos** — *Arquitetura, Backend, Regras de Negócio e Banco de Dados*
* **Renata Saraiva Claudino** — *Líder de Projeto, Prototipação, Identidade Visual e UI/UX (Figma)*
* **Orientação:** Prof. Carlos Eduardo de França Roland (FATEC Franca)

---

## 🚀 2. Principais Funcionalidades

1. **🤝 Amistosos entre Times / Equipes:**
   * Cadastro e gerenciamento de times (Nome, Escudo/Logo, Bairro e Modalidade).
   * Desafios diretos: um time mandante abre o confronto e outro time pode solicitar/aceitar o duelo.

2. **⚽ Partidas Abertas & Gestão de Vagas:**
   * Organização de partidas com controle de vagas em tempo real.
   * Filtro de quadras e campos: **Públicas** (Praças, CEPEL, Terrão) vs **Privadas** (Arenas, Clubes).

3. **📍 Busca por Proximidade (PostGIS):**
   * Raio de busca customizável pelo usuário (1 km a 30 km).
   * Consultas espaciais ultrarrápidas com indexação GIST (ST_DWithin).

4. **🔒 Segurança & Privacidade LGPD (RN02):**
   * O endereço exato e mapa com rotas GPS só são liberados após o usuário ter sua vaga ou amistoso confirmado pelo organizador.

5. **⭐ Avaliação e Reputação Mútua (UC05):**
   * Sistema pós-jogo de avaliação de conduta e pontualidade, calculando automaticamente a média dos atletas.

6. **📸 Upload de Fotos do Próprio Computador:**
   * Upload nativo de fotos para avatar de perfil e escudo do time (FileReader).

---

## 🏅 Modalidades Suportadas

* ⚽ Futebol de Campo (11 vs 11 - Grama)
* ⚽ Futebol de 7 (Terrão)
* ⚽ Futebol Society (Grama Sintética)
* ⚽ Futsal (Quadra)
* 🏀 Basquete & Basquete 3x3
* 🏐 Vôlei de Quadra & Vôlei de Areia / Futevôlei
* 🎾 Beach Tennis & Tênis
* 🤾 Handebol

---

## 🛠️ 3. Stack Tecnológica & Arquitetura

O projeto segue os princípios de **Clean Architecture**, **SOLID** e tipagem estrita de ponta a ponta:

* **Backend:** Node.js (v20+) + TypeScript + Fastify + JWT + Bcrypt.
* **Banco de Dados:** PostgreSQL 16 + PostGIS (consultas geoespaciais e índices GIST).
* **Frontend:** React + TypeScript + Vite + Material UI (MUI), estruturado com boas práticas de UI/UX e tema oficial (#0066FF e #FFD700).
* **Infraestrutura:** Docker & Docker Compose para orquestração do banco de dados.

---

## 🤖 4. Ecossistema de IA, Agentes Especializados & Skills

Para manter a consistência arquitetural, a qualidade de código e o padrão visual em qualquer ambiente de desenvolvimento, este projeto conta com **agentes especializados** e **skills de inteligência artificial** versionados no repositório:

### 🎭 4.1. Agentes Especializados do Projeto (AGENTS.md)
1. **rquiteto_projeto (Arquiteto / Engenheiro de Projeto):**
   * Guardião da Clean Architecture (4 camadas) e DIP.
   * Validação mandatória das regras de negócio: Prevenção de conflito de agenda (RN01), Privacidade e LGPD na geolocalização (RN02) e Restrição de cancelamento direto em partidas lotadas (RN03).
2. **dev_backend (Desenvolvedor Backend Pleno/Sênior):**
   * Construção da API RESTful em Node.js com TypeScript e Fastify.
   * Regras de negócio no servidor, consultas geoespaciais PostGIS e processamento de jobs assíncronos.
3. **dev_frontend_senior (Engenheiro Frontend Sênior & UI/UX Specialist):**
   * Desenvolvimento da interface gráfica mobile com Material UI (MUI).
   * Aplicação da paleta oficial do Bora! (Azul Principal #0066FF e Amarelo Destaque #FFD700), acessibilidade (WCAG), microinterações e tratamento de estados (*loading, skeletons, empty states*).
4. **dba_especialista (DBA & Arquiteto de Dados):**
   * Modelagem física em PostgreSQL + PostGIS, DDL estrito em snake_case.
   * Criação de índices espaciais GIST e B-Tree, otimizando consultas ST_DWithin para resposta inferior a 800ms (RNF03).

---

### 🧰 4.2. Ferramentas & Skills de IA Versionadas (.agents/skills/)
* **ui-ux-pro-max:** Inteligência avançada de design contendo 79 estilos visuais, 192 perfis de cores/produtos, 74 combinações tipográficas, 119 diretrizes de UX e boas práticas para React e Material UI.
* **design-system:** Arquitetura de design tokens (primitivos, semânticos e componentes), tipografia, paleta e espaçamentos padronizados.
* **design:** Governança de identidade visual, psicologia de cores para esportes e ativos gráficos.
* **ui-styling:** Criação e estilização de interfaces acessíveis e responsivas.
* **rand & slides:** Diretrizes de tom de voz da marca Bora! e geração de apresentações técnicas de progresso.

---

## ⚙️ 5. Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [Docker Desktop](https://www.docker.com/) (ou PostgreSQL 16 instalado localmente)

---

### Passo 1: Subir o Banco de Dados (Docker)
Na raiz do projeto:
`ash
docker compose up -d
`

---

### Passo 2: Executar o Backend (API REST)
`ash
cd server
npm install
npm run dev
`
> Servidor iniciado em http://localhost:3333

---

### Passo 3: Executar o Frontend (Client)
Em outro terminal:
`ash
cd client
npm install
npm run dev
`
> Aplicação acessível no navegador em http://localhost:5173

---

## 📂 6. Documentação Técnica Completa

A pasta [/docs](./docs) contém os manuais detalhados do sistema:
* [01 — Arquitetura de Software e Camadas](./docs/01-arquitetura-e-camadas.md)
* [02 — Banco de Dados e DDL (PostGIS)](./docs/02-banco-de-dados-e-ddl.md)
* [03 — Contratos da API REST](./docs/03-contratos-api-rest.md)
* [04 — Regras de Negócio e Segurança](./docs/04-regras-de-negocio-e-seguranca.md)
* [05 — Guia Frontend MUI & Design System](./docs/05-guia-frontend-mui-design-system.md)
* [06 — Guia Oficial de Setup e Execução](./docs/06-guia-de-setup-e-execucao.md)
* [07 — Guia de Testes Automatizados](./docs/07-guia-de-testes-e-cobertura.md)
