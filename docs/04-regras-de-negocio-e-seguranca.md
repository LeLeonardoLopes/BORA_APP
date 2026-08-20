# 04 — Regras de Negócio e Segurança — Bora! App

## 1. Especificação das Regras de Negócio (RN)

### RN01 — Prevenção de Conflito de Agenda
* **Definição:** Um usuário não pode solicitar entrada nem ser aprovado em duas partidas que ocorram no mesmo horário ou com sobreposição de janela temporal (duração estimada de 2 horas por padrão).
* **Implementação Técnica:**
  ```typescript
  // Trecho de validação no SolicitarParticipacaoUseCase
  const conflito = await solicitacaoRepo.hasScheduleConflict(userId, dataHoraPartida, 2 /* horas */);
  if (conflito) {
    throw new BusinessRuleError('RN01', 'Você já possui uma partida confirmada neste mesmo horário.');
  }
  ```

### RN02 — Privacidade e Proteção de Dados Espaciais (LGPD / RNF02)
* **Definição:** As coordenadas geográficas exatas e o endereço completo de uma partida não devem ser expostos na listagem pública do mapa para usuários não aprovados.
* **Implementação Técnica:**
  * No endpoint `GET /matches` (público/autenticado), a API retorna apenas `bairro`, `cidade`, `distancia_km` e coordenadas com *jitter* aleatório (~200m).
  * O endereço exato (`endereco_completo`, `lat`, `lng`) só é exposto via `GET /matches/:id/location` para o `organizador_id` ou usuários com registro em `solicitacao` onde `status_solicitacao === 'Aprovada'`.

### RN03 — Proteção Contra Cancelamento Abrupto de Partidas Lotadas
* **Definição:** O Organizador é impedido de cancelar diretamente uma partida que esteja no estado `Lotada`.
* **Implementação Técnica:**
  ```typescript
  // Trecho de validação no CancelarPartidaUseCase
  if (partida.status === StatusPartida.LOTADA) {
    throw new BusinessRuleError('RN03', 'Partidas lotadas não podem ser canceladas diretamente. Solicite suporte.');
  }
  ```

### RN04 — Precificação de Espaços Públicos vs Privados & Taxa de Arbitragem
* **Definição:**
  1. **Locais Públicos (Campos/Quadras):** São 100% gratuitos quanto ao uso do espaço (`taxaCampo = 0`). A regra de cobrança de aluguel/locação do campo não se aplica a espaços públicos, tanto para partidas avulsas quanto para amistosos entre times.
  2. **Locais Privados/Particulares:** Aplica-se a regra de cobrança/aluguel de quadra (`taxaCampo > 0`), cujo rateio pode ser feito entre as equipes (em amistosos) ou dividido entre os atletas por vaga (em partidas avulsas).
  3. **Taxa de Juiz / Arbitragem:** Aplica-se **exclusivamente a Amistosos** (`formatoJogo === 'Amistoso_Times'`). Em partidas abertas/avulsas não há cobrança de taxa de juiz (`taxaJuiz = 0`). Em amistosos públicos, pode haver taxa de juiz rateada em 50% para cada equipe.
* **Implementação Técnica:**
  ```typescript
  // Trecho de validação na Entidade Partida
  if (props.tipoLocal === 'Publica' && (props.taxaCampo || 0) > 0) {
    throw new Error('Regra RN04: Campos e quadras públicas são 100% gratuitos. A taxa de campo não se aplica.');
  }
  if (props.formatoJogo === 'Avulso' && (props.taxaJuiz || 0) > 0) {
    throw new Error('Regra RN04: A taxa de arbitragem/juiz aplica-se exclusivamente a amistosos entre equipes.');
  }
  ```

---

## 2. Moderação Automática e Sistema de Reputação (UC05)

* **Intervalo de Avaliações:** Notas inteiras de 1 a 5 estrelas concedidas por participantes após a conclusão da partida.
* **Cálculo da Média Ponderada:**
  $$\text{nota\_media} = \frac{\sum \text{notas}}{\text{total\_avaliacoes}}$$
* **Gatilho de Suspensão Automática:**
  * Se $\text{total\_avaliacoes} \ge 5$ e $\text{nota\_media} < 2.00$:
  * O sistema altera automaticamente o `status_usuario` para `Suspenso`.
  * Usuários no estado `Suspenso` têm bloqueio imediato para criação de partidas e solicitações de novas vagas.

---

## 3. Segurança em Camadas (Defense in Depth)

1. **Proteção Anti-IDOR:**
   * Qualquer operação de mutação (aceitar vaga, editar partida) valida se o ID do usuário autenticado no token JWT corresponde ao proprietário do recurso.
2. **Criptografia com Salt:**
   * Senhas armazenadas com hash `bcrypt` (12 rounds) ou `argon2id`.
3. **Proteção de Dados em Trânsito:**
   * Comunicação estritamente via HTTPS / TLS 1.3.
4. **Rate Limiting:**
   * 5 tentativas de login por IP/minuto.
   * 100 requisições/minuto nas rotas de mapa para evitar scraping massivo de dados.
