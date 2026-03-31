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

### 4.1. Diagrama arquitetural

```text
Authenticated Frontend
  |
  | GET /api/workflows/read/*
  v
Next.js Route Handlers
  |
  +--> Auth guard (Firebase Admin ID token)
  +--> Runtime actor resolution (authUid -> id3a)
  |
  v
Read Layer
  |
  +--> src/lib/workflows/read/types.ts
  +--> src/lib/workflows/read/queries.ts
  |
  v
Firestore
  |- workflows_v2
  |- workflowTypes_v2
  |- workflowTypes_v2/{workflowTypeId}/versions/{version}
  |- counters/workflowCounter_v2 (indireto, quando necessario)
```

### 4.2. Fronteira com a Etapa 1

A Etapa 1 ja entregou:

- runtime write-side;
- persistencia do backbone desnormalizado em `workflows_v2`;
- seed dos `workflowTypes_v2` e `versions/1`;
- testes do write-side.

A Etapa 2 nao reimplementa o runtime. Ela:

- valida a shape persistida;
- organiza o contrato de leitura;
- expoe queries e rotas read-side;
- garante indices e testes de coerencia.

### 4.3. Ajustes explicitos para o build da Etapa 2

O build da Etapa 2 deve considerar os seguintes refinamentos ja fechados:

- corrigir fixtures de teste que ainda divergem da shape real persistida pela Etapa 1;
- reaproveitar um helper unico de autenticacao Bearer nas rotas read-side;
- criar `buildAdvanceReadModelUpdate` para manter simetria entre os helpers de projecao;
- substituir testes genericos de `types` por testes objetivos de contrato e coerencia;
- remover `actionRequests` dos mocks atuais da Etapa 1 quando o shape sob teste nao persistir esse campo;
- manter documentado que fluxos futuros com `requestAction/respondAction` voltarao a usar `actionRequests`;
- documentar os indices da Etapa 2 sem assumir que o provisionamento sera feito automaticamente pelo build.

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

Implementacao recomendada:

- criar `buildAdvanceReadModelUpdate` em `src/lib/workflows/runtime/read-model.ts`;
- usar esse helper mesmo sem happy path real no piloto simples, para manter simetria com:
  - `buildOpenReadModel`
  - `buildAssignReadModelUpdate`
  - `buildFinalizeReadModelUpdate`
  - `buildArchiveReadModelUpdate`

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
- a Etapa 2 deve documentar os indices da forma necessaria para provisionamento posterior;
- o provisionamento pode ser feito por:
  - script
  - `firestore.indexes.json`
  - interface do Firestore
- os indices devem existir para as queries sobre `workflows_v2` antes dos smoke tests read-side.

---

## 9. Read Layer Inicial da Etapa 2

Arquivos recomendados:

- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/read/queries.ts`
- `src/lib/workflows/read/__tests__/queries.test.js`
- `src/lib/workflows/read/__tests__/read-model-consistency.test.js`
- `src/lib/workflows/read/__tests__/read-api-contract.test.js`
- `src/app/api/workflows/read/current/route.ts`
- `src/app/api/workflows/read/assignments/route.ts`
- `src/app/api/workflows/read/completed/route.ts`
- `src/app/api/workflows/read/mine/route.ts`

Escopo:

- `types.ts` e `queries.ts` entram como base concreta da Etapa 2;
- read APIs podem entrar minimamente nesta etapa ou ficar prontas para a etapa de frontend consolidado, desde que o contrato de leitura ja esteja fechado.

### 9.1. Estruturacao nas pastas

Estado atual:

- write-side em `src/lib/workflows/runtime`
- rotas write-side em `src/app/api/workflows/runtime`
- ainda nao existe pasta concreta de read-side

Estrutura alvo da Etapa 2:

```text
src/
  lib/
    workflows/
      runtime/
        read-model.ts
      read/
        types.ts
        queries.ts
        __tests__/
          queries.test.js
          types.test.js
  app/
    api/
      workflows/
        runtime/
        read/
          current/route.ts
          assignments/route.ts
          completed/route.ts
          mine/route.ts
firestore.indexes.json
```

### 9.2. File Manifest

Arquivos para criar:

- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/read/queries.ts`
- `src/lib/workflows/read/__tests__/queries.test.js`
- `src/lib/workflows/read/__tests__/read-model-consistency.test.js`
- `src/lib/workflows/read/__tests__/read-api-contract.test.js`
- `src/lib/workflows/runtime/auth-helpers.ts`
- `src/app/api/workflows/read/current/route.ts`
- `src/app/api/workflows/read/assignments/route.ts`
- `src/app/api/workflows/read/completed/route.ts`
- `src/app/api/workflows/read/mine/route.ts`

Arquivos para atualizar:

- `src/lib/workflows/runtime/read-model.ts`
- `src/lib/workflows/runtime/__tests__/repository.test.js`
- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`
- `src/lib/workflows/runtime/__tests__/authz.test.js`

### 9.3. Contrato inicial das read APIs

Formato comum de sucesso:

```ts
type ReadSuccess<T> = {
  ok: true;
  data: T;
};
```

Formato comum de erro:

```ts
type ReadError = {
  ok: false;
  code: string;
  message: string;
};
```

Endpoints iniciais:

- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/mine`

### 9.4. Code Patterns

Builder de query para owner current queue:

```ts
export function buildOwnerCurrentQueueQuery(db: Firestore, ownerUserId: string) {
  return db
    .collection('workflows_v2')
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .orderBy('statusCategory')
    .orderBy('lastUpdatedAt', 'desc');
}
```

Pattern de rota read-side:

```ts
export async function GET(request: Request) {
  const decodedToken = await verifyBearerToken(request);
  const actor = await resolveRuntimeActor(decodedToken);
  const items = await queryAssignments(actor.actorUserId);
  return NextResponse.json({ ok: true, data: items });
}
```

### 9.5. Reaproveitamento de helper de autenticacao

Para evitar duplicacao nas rotas `read/*`, a Etapa 2 deve extrair e reaproveitar um helper de autenticacao Bearer, por exemplo:

- `src/lib/workflows/runtime/auth-helpers.ts`

Responsabilidade desse helper:

- ler `Authorization: Bearer <idToken>`;
- validar presenca do header;
- chamar `verifyIdToken` via Firebase Admin;
- lancar erro consistente para uso nas rotas read-side.

As rotas read-side devem reutilizar esse helper em vez de copiar a validacao inline em cada arquivo.

### 9.6. Limpeza de fixtures e forward-compatibility

Ao revisar os testes existentes da Etapa 1:

- `operationalParticipantIds` deve refletir a shape real do runtime:
  - na abertura, apenas `ownerUserId`;
- `actionRequests` deve ser removido dos mocks atuais se o documento efetivamente testado nao persiste esse campo no runtime atual.

Essa limpeza nao remove o suporte conceitual a action flow.

Deve permanecer documentado que:

- workflows futuros com `requestAction/respondAction` voltarao a usar `actionRequests`;
- `waiting_action` continua parte do modelo;
- `pendingActionRecipientIds` e `pendingActionTypes` continuam parte do backbone do read model.

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

Casos minimos obrigatorios:

- `open-request` projeta todos os campos obrigatorios do read model;
- `assign-responsible` atualiza ownership e etapa atual corretamente;
- `advance-step` usa `buildAdvanceReadModelUpdate` ou prova equivalente de coerencia do update;
- `finalize-request` persiste `closedAt = finalizedAt`;
- `archive-request` nao sobrescreve `closedAt`;
- query de `completed` respeita `operationalParticipantIds`;
- query de `mine` respeita `requesterUserId`;
- query de `assignments` respeita `responsibleUserId`;
- shape do documento continua compativel com `waiting_action`, mesmo sem emissao no piloto simples.

Artefatos de teste objetivos:

- `queries.test.js`
  - valida builders de query, filtros e ordenacoes
- `read-model-consistency.test.js`
  - valida coerencia entre os helpers do runtime e a shape persistida
- `read-api-contract.test.js`
  - valida envelope de resposta, filtros minimos e mapeamento basico de erro nas rotas `read/*`

Regra:

- nao criar teste trivial apenas para cobrir `types.ts`;
- todo arquivo de teste novo deve validar comportamento real, shape real ou contrato real.

---

## 11. Fora de Escopo da Etapa 2

- `requestAction/respondAction` como fluxo operacional real;
- tela consolidada do piloto pronta;
- migracao completa do legado;
- expansao para outra area;
- redefinicao do modelo do motor.

---

## 12. ADRs da Etapa 2

### ADR-ET2-001: A Etapa 2 nao cria um segundo modelo persistido

O read model do piloto continua sendo o proprio documento `workflows_v2`, com campos desnormalizados gravados pelo write-side da Etapa 1.

### ADR-ET2-002: O read-side nasce como camada separada

As regras de consulta e DTOs ficam em `src/lib/workflows/read`, separadas de `src/lib/workflows/runtime`, mesmo reaproveitando o mesmo documento persistido.

### ADR-ET2-003: Read APIs minimas podem entrar antes da UI consolidada

As rotas `read/*` entram como contrato do backend e base de validacao, mesmo que o frontend consolidado do piloto fique para a etapa seguinte.

### ADR-ET2-004: A autenticacao das rotas read-side deve ser reutilizavel

A Etapa 2 extrai um helper de autenticacao Bearer para evitar duplicacao do mesmo bloco de verificacao de token em todas as rotas `read/*`.

### ADR-ET2-005: Fixtures devem refletir a shape real, nao a shape futura

Os testes da Etapa 2 devem usar mocks coerentes com o que a Etapa 1 realmente persiste hoje, preservando a compatibilidade futura por documentacao e nao por campos residuais em fixtures.

---

## 13. Rollback Plan

Se a Etapa 2 falhar:

1. manter o runtime write-side da Etapa 1 intacto;
2. desabilitar o consumo das rotas `read/*` novas;
3. preservar `workflows_v2` como fonte de verdade do piloto;
4. reverter apenas:
   - query builders novos
   - rotas read-side novas
   - documentacao de indices ou `firestore.indexes.json`, se necessario
5. nao tocar nas colecoes legadas nem no seed da Etapa 1.

---

## 14. Pronto para Build

A Etapa 2 fica pronta para build quando:

- o shape do documento `workflows_v2` estiver fechado;
- as regras de projeção por caso de uso estiverem explicitas;
- os indices compostos estiverem definidos;
- a estrategia de provisionamento dos indices estiver documentada;
- o read layer minimo nao depender mais de interpretacao adicional.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-25 | codex | Extracted Etapa 2 scope from `DESIGN_FASE1_FACILITIES_ETAPA1e2.md`, renaming the planning language from `5.3` to `Etapa 2` and isolating the read-model/query scope. |
