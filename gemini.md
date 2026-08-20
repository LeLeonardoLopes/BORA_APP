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
| **20/08/2026** | Equipe Bora! / Agentes | Implementação completa da infraestrutura (Docker + PostGIS), Clean Architecture, regras RN01/RN02/RN03, frontend MUI e pipeline CI/CD (.github/workflows/ci.yml). |
| **20/08/2026** | leo_dev / Leonardo | Criação do documento oficial de testes em `docs/07-guia-de-testes-e-cobertura.md`. |

---
*Este arquivo será atualizado continuamente a cada nova etapa, decisão ou entrega implementada no projeto.*
