# 07 — Guia de Testes Automatizados e Cobertura de Regras — Bora! App

Este documento centraliza toda a estratégia de testes, cenários de validação e comandos de execução para o **Bora! App**.

---

## 1. Visão Geral da Pirâmide de Testes

O projeto adota uma esteira focada na integridade das regras inegociáveis de negócio:

1. **Testes Unitários de Domínio:** Validam a máquina de estados, regras de capacidade e moderação automática.
2. **Testes de Casos de Uso (Application):** Validam regras de negócio complexas como o anti-conflito de agenda (RN01) e proteção LGPD (RN02).
3. **Pipeline de CI/CD Automatizado:** GitHub Actions executando verificação de tipos e suíte de testes em cada push/PR.

---

## 2. Cenários e Regras Cobertas

| Regra / Mecanismo | Arquivo de Teste | O que é Validado |
| :--- | :--- | :--- |
| **RN01 (Anti-conflito de Agenda)** | server/tests/unit/RN01AntiConflict.test.ts | • Aprovação permitida quando não há sobreposição de horário.<br>• **Bloqueio estrito** de aprovação caso o atleta já possua partida confirmada no intervalo de ± 2 horas. |
| **RN03 (Trava de Cancelamento)** | server/tests/unit/DomainRules.test.ts | • Cancelamento permitido para partidas com vagas disponíveis.<br>• **Bloqueio estrito** de cancelamento unilateral pelo organizador para partidas com lotação esgotada (max_vagas === vagas_preenchidas). |
| **Moderação e Suspensão Automática** | server/tests/unit/DomainRules.test.ts | • Recálculo aritmético exato da 
ota_media.<br>• Transição automática para status Suspenso quando 	otal_avaliacoes >= 5 e 
ota_media < 2.00. |

---

## 3. Comandos para Execução dos Testes

### 3.1. Executar todos os testes do Backend:
`ash
cd server
npm test
`

### 3.2. Executar testes em modo observador (Watch Mode):
`ash
cd server
npm test -- --watch
`

### 3.3. Gerar relatório de cobertura de código (Coverage):
`ash
cd server
npm test -- --coverage
`

---

## 4. Integração Contínua (CI/CD)

A esteira de integração contínua está configurada em [.github/workflows/ci.yml](file:///C:/Users/Devs-02/Documents/BORA_APP/.github/workflows/ci.yml) e executa automaticamente:
* Checagem de tipos estrita do TypeScript (`tsc --noEmit`) no server e no client.
* Execução dos testes automatizados com Jest.
* Build do pacote frontend com Vite.

---

## 5. Checklist de Homologação Manual E2E (Status Real)

### ✅ Homologado (Etapas A e B):
* [x] **Etapa A: Autenticação, Tema & Perfil:** Login/cadastro com OTP, tema Claro/Escuro dinâmico e gestão do perfil/time (*TIME F.C.*).
* [x] **Etapa B: Explorador & Geolocalização:** Filtro de raio (2 a 25km), chips de modalidades, minimapa de Franca/SP e convites formatados no WhatsApp.

### ⏳ Próxima Sessão (Marco de Retomada):
* [ ] **Etapa C: Gestão de Vagas, Solicitação & Chat:** Solicitação, aprovação de vagas e mensageria em tempo real.
* [ ] **Etapa D: Encerramento & Avaliação 360°:** Finalização de partida e feed de reputação estilo Uber.
* [ ] **Google Maps API:** Configuração da chave `VITE_GOOGLE_MAPS_API_KEY` para substituição do OpenStreetMap.
