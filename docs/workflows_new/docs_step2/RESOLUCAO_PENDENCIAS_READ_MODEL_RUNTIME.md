# Resolucao de Pendencias - Read Model e Runtime

## 1. Objetivo

Consolidar as pendencias que estavam em aberto entre arquitetura, runtime e frontend e que ja foram decididas durante a definicao do novo sistema de workflows.

Este documento serve como complemento aos artefatos principais:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)

### Nota de execucao da Fase 1

No piloto executado no mesmo banco do legado, ler as superficies fisicas operacionais como:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflows_v2`
- `counters/workflowCounter_v2`

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-25` | `Medium` | normalizacao das referencias operacionais da Fase 1 para colecoes `_v2` |
| `2026-03-23` | `High` | consolidacao das decisoes pendentes sobre owner, `closedAt`, SLA e `operationalParticipantIds` |

---

## 2. Contexto

Durante a analise de readiness para iniciar a implementacao, quatro pendencias foram identificadas como relevantes para fechar o read model de `workflows`:

1. `ownerUserId` no chamado deve ficar congelado ou acompanhar mudancas do owner do tipo?
2. `closedAt` deve representar finalizacao ou arquivamento?
3. `slaState` deve ser persistido ou calculado em leitura?
4. `operationalParticipantIds` deve incluir quais perfis?

As decisoes abaixo passam a ser o entendimento oficial para a primeira iteracao do novo runtime.

---

## 3. Decisoes Fechadas

### 3.1. `ownerUserId` do chamado acompanha mudanca de owner do tipo

**Decisao**

`ownerUserId` e `ownerEmail` gravados em `workflows` podem mudar se o owner do tipo de workflow mudar.

Na Fase 1, a superficie fisica desse documento e `workflows_v2`.

**Fonte de verdade**

- `workflowTypes.ownerEmail`
- `workflowTypes.ownerUserId`

Na Fase 1, essa origem fisica e `workflowTypes_v2`.

**Regra operacional**

- quando o owner de um `workflowType` mudar, os chamados ativos daquele tipo devem ser atualizados;
- chamados finalizados nao precisam ser alterados;
- chamados arquivados nao precisam ser alterados.

**Objetivo**

Garantir que a fila atual do owner reflita a configuracao vigente do tipo de workflow, sem exigir nova versao so por troca de owner.

**Impacto no read model**

Campos mantidos em `workflows_v2` na Fase 1:

- `ownerEmail`
- `ownerUserId`

Esses campos existem para consulta eficiente no frontend, mas sua fonte continua sendo `workflowTypes`.

Na Fase 1, essa fonte fisica e `workflowTypes_v2`.

**Observacao**

O historico do chamado deve preservar eventos antigos mesmo quando o owner atual mudar.

---

### 3.2. `closedAt` representa a data de finalizacao

**Decisao**

`closedAt` deve ser igual a data de finalizacao do chamado.

**Regra**

- `finalizedAt` = timestamp da finalizacao;
- `closedAt` = mesmo valor de `finalizedAt`;
- `archivedAt` = timestamp independente, usado apenas para arquivamento.

**Objetivo**

Evitar que a aba `Concluidas` mude de agrupamento ou ordenacao apenas porque alguem arquivou o chamado em data posterior.

**Impacto no frontend**

- agrupamento mensal da aba `Concluidas` deve usar `closedAt`;
- badges de `Concluido` e `Arquivado` continuam separados;
- `Arquivado` nao redefine o momento de encerramento operacional.

---

### 3.3. SLA e do chamado como um todo, nao por etapa

**Decisao**

O SLA deve ser tratado no nivel do chamado completo, nao por etapa.

**Regra base atual**

- SLA padrao: `5 dias`

**Campos recomendados no chamado**

- `slaDays`
- `expectedCompletionAt`

**Objetivo**

Permitir que o chamado carregue sua expectativa de conclusao de forma explicita, sem depender de recalculo estrutural do fluxo.

**Observacao**

`expectedCompletionAt` deve ser definido no momento da abertura do chamado.

Exemplo conceitual:

- `submittedAt = 2026-03-20T11:15:00Z`
- `slaDays = 5`
- `expectedCompletionAt = submittedAt + 5 dias`

---

### 3.4. `slaState` sera calculado em read time na primeira iteracao

**Decisao**

`slaState` nao sera persistido no documento na primeira versao do runtime.

Ele sera calculado no momento da leitura.

**Motivo**

Mesmo sem mutacao no chamado, o estado do SLA muda com o tempo.

Se `slaState` fosse persistido, seria necessario um job agendado para alterar o valor quando o prazo fosse se aproximando ou vencendo.

**Estados sugeridos**

- `on_time`
- `at_risk`
- `overdue`

**Campos usados no calculo**

- `submittedAt`
- `expectedCompletionAt`
- `statusCategory`

**Regra**

- chamados `finalized` ou `archived` nao precisam ser considerados `overdue` na leitura operacional;
- a definicao exata de quando vira `at_risk` pode ser fechada em artefato posterior.

---

### 3.5. `operationalParticipantIds` inclui owner, responsavel e destinatarios de acao

**Decisao**

`operationalParticipantIds` deve incluir:

- owner do chamado;
- responsavel atual e responsaveis anteriores;
- destinatarios de acoes solicitadas.

**Objetivo**

Viabilizar consultas para a aba `Concluidas` e para historico operacional do usuario sem depender de leitura profunda de `history` ou `actionRequests`.

**Regra**

Esse campo deve ser tratado como conjunto acumulativo.

Ou seja:

- ids entram quando a pessoa participa operacionalmente do chamado;
- ids nao precisam ser removidos depois.

**Impacto**

- permite query de concluidos por participacao operacional;
- simplifica filtros do frontend;
- reduz dependencia de recompor historico para montar a aba.

---

## 4. Implicacoes no Read Model

Com as decisoes acima, o read model recomendado do documento operacional do chamado passa a considerar como campos importantes:

- `ownerEmail`
- `ownerUserId`
- `responsibleUserId`
- `responsibleName`
- `hasResponsible`
- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory`
- `hasPendingActions`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `operationalParticipantIds`
- `slaDays`
- `expectedCompletionAt`
- `submittedAt`
- `lastUpdatedAt`
- `finalizedAt`
- `closedAt`
- `archivedAt`
- `isArchived`

---

## 5. Implicacoes nas Abas do Frontend

### `Chamados atuais`

Consulta principal baseada em:

- `ownerUserId`
- `statusCategory`
- `hasResponsible`
- `hasPendingActions`

### `Atribuicoes e acoes`

Consulta principal baseada em:

- `responsibleUserId`
- `pendingActionRecipientIds`
- `statusCategory`

### `Concluidas`

Consulta principal baseada em:

- `operationalParticipantIds`
- `closedAt`
- `statusCategory`

---

## 6. O que continua em aberto

Estas pendencias foram resolvidas, mas ainda restam artefatos derivados a produzir:

1. design completo do read model com queries por aba;
2. tabela de mapeamento entre estado operacional e labels/badges da UI;
3. definicao exata da regra de `slaState`, especialmente o limiar de `at_risk`;
4. estrategia de propagacao de owner para chamados ativos quando `workflowTypes.ownerUserId` mudar.

---

## 7. Proximo Passo Recomendado

O proximo documento a ser produzido a partir desta resolucao e:

- um design detalhado do read model de `workflows`, cobrindo:
  - campos desnormalizados;
  - filtros por aba;
  - ordenacao;
  - indices necessarios.
