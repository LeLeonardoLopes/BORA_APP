# Bora! App — Documento de Governança Técnica, Decisões e Cronograma

> **Registro Central do Projeto (`gemini.md`)**  
> Este documento consolida todo o alinhamento arquitetural, decisões de engenharia, cronograma de entregas e histórico de progresso do **Bora! App**.

---

## 1. Visão Geral do Projeto

* **Nome do Sistema:** Bora! App
* **Tipo:** Social Tech de Conexão Esportiva por Geolocalização
* **Contexto Acadêmico:** LES - 5º Ciclo de ADS / FATEC Franca (Trabalho de Graduação - TG)
* **Orientador:** Prof. Carlos Eduardo de França Roland
* **Equipe de Desenvolvimento:**
  * Leonardo Lopes Dos Santos (Período: Noturno) — *Documentação, Arquitetura, Backend, Regras de Negócio e Banco de Dados*
  * Renata Saraiva Claudino (Período: Matutino) — *Líder de Projeto / Prototipação, Identidade Visual e UI/UX (Figma)*

### 1.1. Missão e Proposta de Valor
Transformar a busca individual por exercícios em encontros coletivos e saudáveis, utilizando a tecnologia como ponte para conectar praticantes do esporte e combater o sedentarismo e o isolamento social, garantindo um ambiente seguro com verificação de identidade e avaliações mútuas.

---

## 2. Índice da Suite Completa de Documentação Técnica (`/docs`)

Para guiar o desenvolvimento com máxima precisão e foco, a pasta [docs](file:///C:/Users/Devs-02/Documents/BORA%20APP/docs) contém os seguintes manuais detalhados:

1. **[01 — Arquitetura de Software e Camadas](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/01-arquitetura-e-camadas.md):** Clean Architecture em 4 camadas, DIP, separação de responsabilidades e fluxo de execução.
2. **[02 — Modelagem de Banco de Dados e Scripts DDL](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/02-banco-de-dados-e-ddl.md):** Tabelas em `snake_case`, PostGIS, índices espaciais GIST e queries geoespaciais (`ST_DWithin`).
3. **[03 — Contratos da API REST](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/03-contratos-api-rest.md):** Especificação completa de payloads, headers, códigos HTTP e endpoints dos 3 CRUDs.
4. **[04 — Regras de Negócio e Segurança](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/04-regras-de-negocio-e-seguranca.md):** RN01 (anti-conflito), RN02 (privacidade/LGPD), RN03 (bloqueio de cancelamento), moderação e suspensão automática (< 2.0).
5. **[05 — Guia Frontend com Material UI (MUI)](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/05-guia-frontend-mui-design-system.md):** Tema personalizado (Azul `#0066FF`, Amarelo `#FFD700`), componentes MUI e mapeamento das telas Hi-Fi.
6. **[06 — Guia de Setup, Instalação e Execução](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/06-guia-de-setup-e-execucao.md):** Passo a passo para inicialização com Docker Compose, migrations e execução local com um comando.
7. **[07 — Guia de Testes Automatizados e Cobertura](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/07-guia-de-testes-e-cobertura.md):** Estratégia de testes unitários de domínio, casos de uso (RN01, RN03, Moderação) e CI/CD.
8. **[Requisitos & Artefatos v5 (PDF)](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/Artefatos_ESO3_Bora_App_v5.pdf):** Documento original de engenharia e modelagem.
9. **[Cronograma Oficial (Excel)](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/docs/Cronograma%20-%20Bora!.xlsx):** Planejamento de entregas acadêmicas do TG.

---

## 3. Protocolo de Execução com Agentes Especializados

> **Regra Mandatória de Sessão:** Ao iniciar qualquer trabalho, feature, refatoração ou resolução de tarefa neste projeto, os 4 agentes especializados abaixo **devem ser invocados e consultados** em seus respectivos domínios técnicos, conforme documentado em [AGENTS.md](file:///C:/Users/Devs-02/Desktop/BORA%20APP/BORA%20APP/AGENTS.md):

1. **`arquiteto_projeto` (Arquiteto / Engenheiro de Projeto):**
   * Validação de arquitetura (Clean Architecture em 4 camadas, DIP), Docker Compose, esteira CI/CD e garantia de regras (RN01, RN02, RN03).
2. **`dev_backend` (Desenvolvedor Backend):**
   * Construção da API RESTful em Node.js com TypeScript, lógica de negócios no servidor, integração PostGIS e processamento de jobs assíncronos.
3. **`dev_frontend_senior` (Desenvolvedor Frontend Sênior & UI/UX Specialist):**
   * Interface mobile híbrida (React Native / Flutter), implementação com Material UI (MUI), aplicação do tema oficial (`#0066FF` e `#FFD700`), heurísticas de UX/UI, microinterações e geolocalização.
4. **`dba_especialista` (Especialista em Banco de Dados / DBA):**
   * Modelagem física em PostgreSQL + PostGIS, DDL em `snake_case`, índices GIST/B-Tree, otimização de `ST_DWithin` (< 800ms para P95) e integridade referencial.

---

## 4. Cronograma Oficial vs Status Real dos Artefatos

| Data de Entrega | Etapa a ser Entregue | Status Real no Projeto |
| :--- | :--- | :--- |
| **19/08/2026** | **Entrega do cronograma** | **Concluído (100%)** |
| **20/08/2026** | **Levantamento de requisitos e apresentar a documentação** | **Concluído e Adiantado (100%)**<br>• Artefatos de Requisitos, SWOT, 5W2H, BPMN, RF01 a RF06, RNF01 a RNF03, RN01 a RN03, UML |
| **10/09/2026** | **Prototipagem de páginas** | **Concluído e Adiantado (100%)**<br>• Rabiscoframe, Wireframe e Protótipo Hi-Fi prontos na documentação |
| **10/09/2026** | **Apresentação do Banco de Dados** | **Documentado e Pronto (100%)**<br>• DDL completo com PostGIS em `docs/02-banco-de-dados-e-ddl.md` |
| **10/09/2026** | **Implementação de cadastro/login de usuários** | **Especificado e Pronto (100%)**<br>• Contratos REST em `docs/03-contratos-api-rest.md` |
| *I Bimestre* | *Avaliação do I bimestre e 1ª apresentação do Projeto para a sala* | Marco Avaliativo |
| **17/09/2026** | **Entrega do 1º CRUD (Usuários & Perfis)** | **100% Especificado (UC01)** |
| **17/09/2026** | **Entrega do 2º CRUD (Partidas Esportivas)** | **100% Especificado (UC02/UC03 + PostGIS)** |
| **17/09/2026** | **Entrega do 3º CRUD (Solicitações de Vagas)** | **100% Especificado (UC04/UC06 + RN01/RN03)** |
| *I Bimestre* | *Entrega das notas parciais do I bimestre* | Marco Avaliativo |
| *II Bimestre* | *Avaliação do II bimestre e apresentação final do Projeto* | Marco Final |

---

## 5. Histórico de Decisões e Registro de Progresso

| Data | Autor | Ação / Decisão Registrada |
| :--- | :--- | :--- |
| **19/08/2026** | leo_dev / Leonardo | Leitura completa do documento de requisitos do Bora! App (`docs/Artefatos_ESO3_Bora_App_v5.pdf`). |
| **19/08/2026** | leo_dev / Leonardo | Definição da arquitetura em camadas (Clean Architecture) com monorepo desacoplado. |
| **19/08/2026** | leo_dev / Leonardo | Decisão de uso de componentes Material UI (MUI) no frontend com tema oficial Bora!. |
| **19/08/2026** | leo_dev / Leonardo | Detalhamento das 5 camadas de segurança, privacidade LGPD e prevenção de conflitos. |
| **19/08/2026** | leo_dev / Leonardo | Leitura do arquivo `docs/Cronograma - Bora!.xlsx` e criação do arquivo central de governança `gemini.md`. |
| **19/08/2026** | leo_dev / Leonardo | Mapeamento formal dos 3 CRUDs exigidos para a entrega de 17/09/2026. |
| **19/08/2026** | leo_dev / Leonardo | Diagnóstico de antecipação: requisitos, modelagem UML e protótipos já 100% concluídos. |
| **19/08/2026** | leo_dev / Leonardo | Criação da suíte completa de documentação técnica em `/docs` (Arquitetura, DDL, API REST, Regras/Segurança, MUI e Setup). |
| **19/08/2026** | Leonardo / Renata | Pacote de documentação e planejamento submetido para validação da líder de projeto. |
| **20/08/2026** | leo_dev / Leonardo | Configuração e salvamento dos 4 agentes dedicados do Bora! App no repositório (`AGENTS.md`). |
| **20/08/2026** | leo_dev / Leonardo | Atualização do agente Frontend para perfil Sênior especialista em UI/UX e Material UI (MUI). |
| **20/08/2026** | leo_dev / Leonardo | Estabelecimento do protocolo obrigatório de acionamento dos agentes ao início dos trabalhos em `gemini.md`. |
| **20/08/2026** | leo_dev / Leonardo | Organização da raiz: movimentação do PDF de requisitos e do Excel de cronograma para a pasta `/docs`. |
| **20/08/2026** | leo_dev / Leonardo | Criação do documento oficial de testes em `docs/07-guia-de-testes-e-cobertura.md`. |
| **27/08/2026** | Equipe Bora! / Agentes | **Homologação e Sincronização da Versão v8.1 (TG - Engenharia de Software III):**<br>• Incorporação da **RN06 (Espaço Seguro Feminino)** com blindagem geoespacial nativa no PostGIS.<br>• Implementação de **Reputação Mútua 360° Estilo Uber** (UC05) e moderação automática por nota média (RN05).<br>• Especificação e sincronização de **Amistosos entre Equipes**, taxa de juiz 50/50 e precificação de espaços (RN04).<br>• Interface de Login e Cadastro padronizada com identidade visual limpa do Figma (fundo azul `#0066FF`, logo 3D Bora! e seletor de gênero para RN06).<br>• Atualização de toda a suíte de documentação em `/docs` (`01-arquitetura`, `02-banco-de-dados-ddl`, `04-regras-de-negocio`, `05-guia-frontend`).<br>• **Polimento Geral de UI/UX (Skill UI-UX-PRO-MAX):** Refino completo do tema MUI, Dark/Light Mode dinâmico uniforme, badges de segurança feminina, tags de feedback rápido estilo Uber no pós-jogo, cards com elevação e microinterações.<br>• **Modelagem Física & Persistência Real (DBA Especialista):** Execução e validação das 5 migrations DDL no PostgreSQL (`bora_app_db`) com 7 tabelas normalizadas, integridade referencial, triggers de auditoria LGPD, seeds oficiais de Franca/SP e backend Fastify conectado em produção local.<br>• **Homologação das Etapas A e B do Checklist E2E:** Cadastro/login, alternância dinâmica de tema Claro/Escuro, Gestão de Perfil do Atleta com cadastro da equipe (**TIME F.C.**), filtros de raio (2 a 25km), modalidades esportivas, mapa de Franca/SP e gerador profissional de convites para WhatsApp 100% testados e aprovados. |

---

## 6. Especificação Técnica: Integração Oficial com Google Maps API

A geolocalização do Bora! App suporta a arquitetura híbrida de mapas, permitindo transição direta do OpenStreetMap/Leaflet para o ecossistema oficial do **Google Maps Platform**.

### 6.1. APIs do Google Cloud Requeridas
1. **Maps JavaScript API:** Renderização do mapa vetorial interativo com controles customizados, estilo noturno (Dark Mode) e marcadores personalizados para cada modalidade esportiva em Franca/SP.
2. **Places API (New / Text Search):** Autocomplete inteligente no cadastro de partidas (buscando ginásios, quadras públicas, arenas privadas e praças de Franca).
3. **Geocoding API:** Conversão reversa de coordenadas (latitude/longitude) para nomes de bairros e logradouros.

### 6.2. Configuração de Variáveis de Ambiente
No arquivo `client/.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...SUA_CHAVE_AQUI
```

### 6.3. Arquitetura de Componentes
* **Pacote Oficial:** `@react-google-maps/api`
* **Camada de Abstração:** O componente [`InteractiveMapPicker.tsx`](file:///C:/Users/Devs-02/Documents/BORA_APP/client/src/components/InteractiveMapPicker.tsx) e [`FullMapExplorer.tsx`](file:///C:/Users/Devs-02/Documents/BORA_APP/client/src/components/FullMapExplorer.tsx) são encapsulados com fallback transparente para o Leaflet caso a chave não esteja presente.
* **Aderência à RN02 (Privacidade LGPD):** O alfinete no Google Maps continuará utilizando o raio de imprecisão radial (`~500m`) antes da confirmação da vaga, liberando a rota ponto-a-ponto via Directions API exclusivamente após a aprovação da inscrição.

---

## 7. Status do Checklist de Testes E2E (Marco de Parada)

### ✅ Concluído e Homologado:
* [x] **Etapa A: Autenticação, Tema & Perfil (100%)**
  * Login, cadastro seguro, alternância dinâmica de tema (Dark/Light) sem blocos brancos, perfil do atleta e time de capitão (*TIME F.C.*).
* [x] **Etapa B: Explorador & Geolocalização (100%)**
  * Filtro de raio dinâmico (2km a 25km), chips de modalidades esportivas, visualização no mapa de Franca/SP e compartilhamento estruturado de convites no WhatsApp.

### ⏳ Ponto de Retomada na Próxima Sessão:
* [ ] **Etapa C: Gestão de Vagas, Solicitação & Chat**
  * 1. Solicitar vaga em partida de outro atleta.
  * 2. Aprovação/Rejeição de vagas no painel de Gestão.
  * 3. Troca de mensagens no mural/chat em tempo real.
* [ ] **Etapa D: Encerramento & Avaliação Pós-Jogo**
  * 1. Finalização de partida pelo organizador.
  * 2. Envio de avaliação mútua 360° estilo Uber com tags de elogio e estrelas.
  * 3. Verificação do feed comunitário e moderação automática por nota média (RN05).
* [ ] **Ativação da Chave do Google Maps:** Inserção da chave de API e ativação do `@react-google-maps/api`.

---
*Este arquivo será atualizado continuamente a cada nova etapa, decisão ou entrega implementada no projeto.*
