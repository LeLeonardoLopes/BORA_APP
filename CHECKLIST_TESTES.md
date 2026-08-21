# Checklist de Testes de Homologação — Bora! App

Este documento registra o status dos testes manuais e automatizados de todos os módulos do sistema.

---

## 🟢 Módulo 1: Autenticação, Cadastro e Segurança (CONCLUÍDO & APROVADO)

- [x] **1.1. Cadastro com Trava Dupla (E-mail + CPF Únicos):**
  - [x] Validação matemática de CPF (Módulo 11) impedindo dígitos inválidos e sequências repetidas.
  - [x] Máscara dinâmica `000.000.000-00` no formulário.
  - [x] Rejeição no banco (`UNIQUE`) e regra de negócio para CPFs duplicados.
  - [x] Rejeição no banco (`UNIQUE`) e regra de negócio para e-mails duplicados.
- [x] **1.2. Força de Senha no Backend e Frontend:**
  - [x] Mínimo de 6 caracteres.
  - [x] Pelo menos 1 número.
  - [x] Pelo menos 1 caractere especial (`@, #, $, !`, etc.).
  - [x] Checklist visual em tempo real na tela.
  - [x] Hashing seguro com Bcrypt (10 salt rounds).
- [x] **1.3. Confirmação de E-mail por Código OTP de 6 Dígitos:**
  - [x] Geração segura com `crypto.randomInt` e validade de 10 minutos.
  - [x] Tela de confirmação com 6 dígitos de verificação.
  - [x] Alerta e logging no terminal para ambiente de desenvolvimento.
- [x] **1.4. Login Social Interativo (Google e Apple):**
  - [x] Modal de consentimento e seleção de conta no padrão Google Identity e Apple ID.
  - [x] Autenticação e cadastro com os dados reais informados pelo usuário.
- [x] **1.5. Sessão e Logout Limpo:**
  - [x] App inicia obrigatoriamente na tela de Login para usuários não autenticados.
  - [x] Limpeza completa de `localStorage` (`@bora:token` e `@bora:user`) e cache do React Query ao sair.
  - [x] Contas novas iniciam sem herança de mocks ou dados de outros usuários.
- [x] **1.6. Testes Automatizados:**
  - [x] 45 testes unitários de backend aprovados (**100% PASS**).

---

## 🟡 Módulo 2: Feed e Criação de Partidas (Aguardando Testes)

- [ ] **2.1. Criação de Partida por Modalidade:**
  - [ ] Futebol Society, Futsal, Campo, Vôlei, Basquete, Beach Tennis, Handebol, Futevôlei.
- [ ] **2.2. Precificação e Regra RN04 (Campos Públicos vs Privados):**
  - [ ] Partida em local público: 100% gratuita para taxa de campo.
  - [ ] Partida em local privado: Taxa de campo rateada.
  - [ ] Taxa de arbitragem permitida exclusivamente para amistosos de times.
- [ ] **2.3. Validação de Vagas e Formato de Jogo (Avulso vs Amistoso).**
- [ ] **2.4. Feed em Tempo Real com WebSocket.**

---

## 🟡 Módulo 3: Solicitações, Aprovações e Regra RN01 (Aguardando Testes)

- [ ] **3.1. Solicitação de Vaga pelo Atleta.**
- [ ] **3.2. Regra Anti-Conflito de Horário (RN01 - Intervalo de +/- 2 Horas).**
- [ ] **3.3. Painel do Organizador:** Aceitar e recusar atletas.
- [ ] **3.4. Auto-Rejeição de Pendentes ao Atingir Lotação Máxima (RN02).**

---

## 🟡 Módulo 4: Chat da Partida em Tempo Real (Aguardando Testes)

- [ ] **4.1. Conexão WebSocket na Sala da Partida.**
- [ ] **4.2. Envio e Recebimento Instantâneo de Mensagens.**
- [ ] **4.3. Restrição de Acesso:** Apenas atletas aprovados e organizador.

---

## 🟡 Módulo 5: Finalização, Avaliação e Auditoria (Aguardando Testes)

- [ ] **5.1. Finalização Manual e Automática por Scheduler Worker.**
- [ ] **5.2. Regra RN03:** Bloqueio de cancelamento direto em partidas lotadas.
- [ ] **5.3. Avaliação Mútua de Atletas (1 a 5 estrelas) com Recálculo de Média.**
- [ ] **5.4. Moderação Automática:** Suspensão de atletas com nota média < 2.0 (>= 5 avaliações).
- [ ] **5.5. Soft Delete e Trilha de Auditoria (LGPD).**
