# DEFINE: CORRECAO_WAITING_ACTION_ETAPA4_FASE1_FACILITIES

> Generated: 2026-03-27
> Status: Ready for design/build
> Source: revisao da implementacao da Etapa 4 + DESIGN_FASE1_FACILITIES_ETAPA4.md
> Clarity Score: 15/15

## 1. Problem Statement

A implementacao da Etapa 4 manteve a semantica antiga de `waiting_action` na camada de apresentacao do piloto, escondendo o CTA de finalizacao em um estado no qual o backend permite `finalize` para owner ou responsavel.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Owner da area | Pode perder a acao de finalizar em estados ativos futuros se a UI esconder o CTA incorretamente | Eventual nesta etapa, recorrente nas etapas futuras |
| Responsavel operacional | Pode ver a interface mais restritiva que o backend, criando inconsistencia de operacao | Eventual nesta etapa, recorrente nas etapas futuras |
| Time tecnico da Fase 1 | Precisa fechar a Etapa 4 sem carregar semantica errada para as Etapas 5 e 6 | Pontual |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Alinhar `waiting_action` com a regra do backend | `derivePilotRequestPresentation()` retorna `canFinalize: true` para owner ou responsavel em `waiting_action` |
| M2 | Cobrir a semantica corrigida em teste | Existe teste explicito para `waiting_action` em `presentation.test.ts` |
| M3 | Manter o escopo da correcao estritamente local | A correcao toca apenas a camada de apresentacao do piloto e a suite de testes correspondente |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Melhorar a legibilidade da funcao de apresentacao | A implementacao pode extrair `isResponsible` como variavel local se isso reduzir chance de regressao |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Registrar a correcao no build report da etapa | O relatorio pode citar que o hardening de `waiting_action` foi aplicado apos revisao |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Alterar regras de authz do backend | O backend ja esta correto; a correcao e apenas de apresentacao |
| W2 | Expandir `waiting_action` para o workflow 1 | O workflow 1 continua sem emitir esse estado; a correcao existe para consistencia arquitetural |
| W3 | Refatorar a UX do dialog ou das tabs | Fora do escopo; a correcao e semantica, nao visual |

## 4. Success Criteria

- o estado `waiting_action` deixa de bloquear `Finalizar` para owner ou responsavel;
- a camada de apresentacao do piloto fica coerente com a permissao do backend para estados ativos;
- a suite de testes passa a falhar se essa semantica voltar a regredir;
- nenhuma outra regra de CTA (`assign`, `archive`, `in_progress`, `finalized`, `archived`) muda nesta correcao.

## 5. Technical Scope

### Frontend

- ajustar `src/lib/workflows/pilot/presentation.ts`;
- atualizar `src/lib/workflows/pilot/__tests__/presentation.test.ts`.

### Backend

- fora do escopo.

### Database

- fora do escopo.

## 6. Auth Requirements

- nenhuma mudanca de autenticacao;
- nenhuma mudanca de autorizacao server-side;
- a fonte de verdade da permissao continua sendo o backend, e a camada de apresentacao apenas deixa de ser mais restritiva que ele neste estado.

## 7. Out of Scope

- qualquer mudanca em `runtime/*`, `read/*` ou `catalog/*`;
- novas mutations ou novos endpoints;
- suporte funcional a `requestAction` / `respondAction`;
- qualquer ampliacao do workflow 1 para emitir `waiting_action`.

## 8. Criterio de Aceite

A correcao sera considerada concluida quando `waiting_action` permitir `Finalizar` para owner ou responsavel na camada de apresentacao do piloto, com teste automatizado dedicado cobrindo esse comportamento.

## 9. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-27` | `Low` | define criado para a correcao pontual da semantica de `waiting_action` na Etapa 4 e sua cobertura de teste |
