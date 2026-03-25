# DESIGN: FASE1_FACILITIES_ETAPA2

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 2 - Validacao e gap-fill do read model
> Base document: `DESIGN_FASE1_FACILITIES_ETAPA1e2.md`

## 1. Objetivo

Validar e operacionalizar o backbone de read model da Fase 1 para os workflows reais de Facilities, sem redesenhar o contrato arquitetural ja fechado.

Esta etapa cobre:

- shape desnormalizada do documento `workflows_v2`;
- regras de atualizacao do read model por caso de uso;
- queries basicas do piloto;
- indices compostos;
- read layer inicial pronto para consumo posterior;
- testes de leitura e de coerencia do documento persistido.

Esta etapa parte da premissa de que a Etapa 1 ja definiu e implementou a base write-side do motor.

### Convivência com producao

Na Etapa 2, todo o read model e as queries do piloto devem considerar:

- `workflows_v2`
- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `counters/workflowCounter_v2` quando houver dependencia indireta de numeracao

---

## 2. Fonte de Verdade

Este documento e derivado de:

- [DESIGN_FASE1_FACILITIES_ETAPA1e2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1e2.md)
- [DESIGN_FASE1_FACILITIES_ETAPA1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA0.md` para o contrato do piloto;
2. depois a implementacao/contrato da Etapa 1 para o write-side;
3. depois este documento para o read model da Etapa 2;
4. depois o `DESIGN_FASE1_FACILITIES_ETAPA1e2.md` como consolidado-base.

---

## 3. Decisoes Fechadas do Read Model

- `pendingActionCount` nao faz parte do MVP;
- `closedAt = finalizedAt`;
- `archivedAt` e separado;
- `submittedMonthKey` e `closedMonthKey` usam `YYYY-MM`;
- `waiting_action` continua existindo no shape, mesmo sem ser emitido pelo piloto simples;
- `operationalParticipantIds` inclui ownership operacional e historico do responsavel, nao o solicitante na abertura;
- o solicitante recupera seus chamados por `requesterUserId` em `Minhas solicitacoes`.

---

## 4. Entregas da Etapa 2

Ao final desta etapa devem existir:

- shape oficial do documento `workflows_v2` para consulta;
- regras de projeção/read-model por caso de uso;
- queries basicas do piloto delimitadas;
- indices compostos definidos e provisionados;
- read DTOs e query builders iniciais;
- testes de coerencia do read model.

---

## 5. Shape do Read Model em `workflows_v2`

Na execucao da Fase 1, ler como shape do documento:

- `workflows_v2/{docId}`

Campos obrigatorios:

- `requestId`
- `workflowTypeId`
- `workflowVersion`
- `submittedAt`
- `workflowName`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `requesterUserId`
- `requesterName`
- `responsibleUserId`
- `responsibleName`
- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `formData`
- `stepStates`
- `history`
- `statusCategory`
- `hasResponsible`
- `hasPendingActions`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `operationalParticipantIds`
- `slaDays`
- `expectedCompletionAt`
- `lastUpdatedAt`
- `finalizedAt`
- `closedAt`
- `archivedAt`
- `submittedMonthKey`
- `closedMonthKey`
- `isArchived`

Campos explicitamente fora do MVP:

- `pendingActionCount`

---

## 6. Regras de Projecao do Read Model

### 6.1. `open-request`

- inicializa ownership fields;
- inicializa current step fields a partir da etapa inicial publicada;
- define `hasResponsible = false`;
- define `hasPendingActions = false`;
- define arrays de pending action como vazias;
- inicializa `operationalParticipantIds` com o owner atual;
- persiste `submittedAt`;
- calcula `submittedMonthKey`;
- calcula `expectedCompletionAt`.

Nota de produto:

- `requesterUserId` nao entra em `operationalParticipantIds` na abertura;
- o solicitante continua enxergando historico proprio por `requesterUserId`.

### 6.2. `assign-responsible` / `reassign-responsible`

- atualiza `responsibleUserId`, `responsibleName`, `hasResponsible`;
- adiciona o responsavel a `operationalParticipantIds`;
- se o request ainda estava em `Solicitacao Aberta`, move o estado atual para `Em andamento`;
- se ja estava em `Em andamento`, mantem a etapa.

### 6.3. `advance-step`

- atualiza current step fields;
- mantem `statusCategory = 'in_progress'`.

No piloto simples de Facilities, essa regra existe como capacidade estrutural, mas nao possui happy path positivo.

### 6.4. `finalize-request`

- atualiza current step fields para a etapa final;
- define `statusCategory = 'finalized'`;
- define `finalizedAt` e `closedAt` com o mesmo timestamp;
- define `closedMonthKey`;
- limpa campos helper de pending action.

### 6.5. `archive-request`

- define `isArchived = true`;
- define `statusCategory = 'archived'`;
- define `archivedAt`.

---

## 7. Queries Basicas da Etapa 2

O backbone do piloto deve deixar suportadas as seguintes consultas:

1. `Chamados atuais`
2. `Atribuido a mim`
3. `Acao pendente para mim`
4. `Concluidas`
5. `Minhas solicitacoes`

Nesta etapa, isso ainda e tratado como contrato estrutural e base de indices. A consolidacao completa do consumo na UI fica para a etapa de frontend do piloto.

---

## 8. Indices Compostos Obrigatorios

1. owner current queue
   - `ownerUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
2. owner waiting-assignment filter
   - `ownerUserId asc, isArchived asc, statusCategory asc, hasResponsible asc, lastUpdatedAt desc`
3. owner waiting-action / in-progress filter
   - `ownerUserId asc, isArchived asc, statusCategory asc, hasPendingActions asc, lastUpdatedAt desc`
4. assigned to me
   - `responsibleUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
5. pending action for me
   - `pendingActionRecipientIds array-contains, isArchived asc, statusCategory asc, lastUpdatedAt desc`
6. completed history
   - `operationalParticipantIds array-contains, statusCategory asc, closedAt desc`
7. requester history
   - `requesterUserId asc, submittedAt desc`

Regra:

- esses indices precisam ser provisionados manualmente;
- a Etapa 2 deve atualizar `firestore.indexes.json`;
- os indices devem ser provisionados para as queries sobre `workflows_v2`.

---

## 9. Read Layer Inicial da Etapa 2

Arquivos recomendados:

- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/read/queries.ts`
- `src/app/api/workflows/read/current/route.ts`
- `src/app/api/workflows/read/assignments/route.ts`
- `src/app/api/workflows/read/completed/route.ts`
- `src/app/api/workflows/read/mine/route.ts`

Escopo:

- `types.ts` e `queries.ts` entram como base concreta da Etapa 2;
- read APIs podem entrar minimamente nesta etapa ou ficar prontas para a etapa de frontend consolidado, desde que o contrato de leitura ja esteja fechado.

---

## 10. Testes da Etapa 2

Deve haver cobertura para:

- shape persistida do documento `workflows_v2`;
- coerencia entre write-side e read-model helpers;
- `submittedMonthKey` e `closedMonthKey`;
- `closedAt = finalizedAt`;
- separacao entre `closedAt` e `archivedAt`;
- queries basicas do piloto;
- compatibilidade de `operationalParticipantIds` com a aba `Concluidas`;
- compatibilidade de `requesterUserId` com `Minhas solicitacoes`.

Abordagem:

- reaproveitar a estrategia de mocks da Etapa 1;
- validar query builders e projeções;
- nao depender do frontend para provar o contrato de leitura.

---

## 11. Fora de Escopo da Etapa 2

- `requestAction/respondAction` como fluxo operacional real;
- tela consolidada do piloto pronta;
- migracao completa do legado;
- expansao para outra area;
- redefinicao do modelo do motor.

---

## 12. Pronto para Build

A Etapa 2 fica pronta para build quando:

- o shape do documento `workflows_v2` estiver fechado;
- as regras de projeção por caso de uso estiverem explicitas;
- os indices compostos estiverem definidos;
- `firestore.indexes.json` tiver sido incorporado ao plano de build;
- o read layer minimo nao depender mais de interpretacao adicional.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-25 | codex | Extracted Etapa 2 scope from `DESIGN_FASE1_FACILITIES_ETAPA1e2.md`, renaming the planning language from `5.3` to `Etapa 2` and isolating the read-model/query scope. |
