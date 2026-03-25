# DESIGN: FASE1_FACILITIES_ETAPA1

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 1 - Validacao e gap-fill da fundacao tecnica
> Base document: `DESIGN_FASE1_FACILITIES_ETAPA1e2.md`

## 1. Objetivo

Operacionalizar a fundacao tecnica do novo motor de workflows para o piloto de Facilities, sem redesenhar a arquitetura ja fechada no pre-build.

Esta etapa cobre:

- tipos centrais do motor;
- `workflowTypes_v2` e `versions`;
- geracao de `stepId`;
- contrato operacional do documento `workflows_v2`;
- runtime write-side;
- bootstrap inicial do piloto;
- contratos de API write-side;
- estrategia de testes do runtime.

Esta etapa nao cobre a consolidacao do read layer como superficie de produto. Isso fica para a Etapa 2.

### Convivência com producao

Na Etapa 1, a implementacao deve usar colecoes paralelas do piloto:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflows_v2`
- `counters/workflowCounter_v2`

Isso significa que todo manifesto de arquivos, seed e runtime write-side desta etapa deve apontar para essas colecoes, e nao para as colecoes legadas.

---

## 2. Fonte de Verdade

Este documento e derivado de:

- [DESIGN_FASE1_FACILITIES_ETAPA1e2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1e2.md)
- [DEFINE_FASE1_FACILITIES_ETAPA0.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA0.md)
- [WORKFLOWS_PRE_BUILD_OFICIAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/WORKFLOWS_PRE_BUILD_OFICIAL.md)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA0.md` para decisoes fechadas do piloto;
2. depois este documento para a execucao da Etapa 1;
3. depois o `DESIGN_FASE1_FACILITIES_ETAPA1e2.md` como consolidado-base.

---

## 3. Decisoes Fechadas do Piloto

- workflows piloto:
  - `facilities_manutencao_solicitacoes_gerais`
  - `facilities_solicitacao_suprimentos`
  - `facilities_solicitacao_compras`
- owner:
  - `stefania.otoni@3ainvestimentos.com.br`
- `ownerUserId` fechado para o piloto:
  - `3gEXjlKgxJFl0q6udVMu`
- SLA padrao:
  - `5`
- fluxo canonico:
  - `Solicitacao Aberta`
  - `Em andamento`
  - `Finalizado`
- `statusKey` canonicos:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- `stepId`:
  - auto-gerado pelo sistema
- `field.id`:
  - mantido do modelo atual
  - com normalizacao explicita de `centrodecusto` para `centro_custo` quando aplicavel
- `requestAction/respondAction`:
  - fora do escopo desta etapa
  - mas a arquitetura deve continuar preparada para essas features

---

## 4. Entregas da Etapa 1

Ao final desta etapa devem existir:

- modelagem tecnica de `workflowTypes_v2/{workflowTypeId}`;
- modelagem tecnica de `workflowTypes_v2/{workflowTypeId}/versions/1`;
- estrategia de geracao de `stepId`;
- contrato operacional de `workflows_v2/{docId}`;
- runtime write-side server-side;
- bootstrap/manual seed dos 3 workflows do piloto;
- testes do runtime write-side;
- manifest de arquivos a implementar.

---

## 5. Modelo Tecnico Obrigatorio

### 5.1. `workflowTypes_v2/{workflowTypeId}`

Na execucao da Fase 1, ler como:

- `workflowTypes_v2/{workflowTypeId}`

Campos obrigatorios da Etapa 1:

- `workflowTypeId`
- `name`
- `description`
- `icon`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `allowedUserIds`
- `active`
- `latestPublishedVersion`
- `createdAt`
- `updatedAt`

Regras:

- `ownerUserId` deve ser resolvido a partir do email do owner;
- para o piloto de Facilities, o `ownerUserId` ja esta fechado como `3gEXjlKgxJFl0q6udVMu`;
- o seed/bootstrap pode usar esse valor diretamente sem nova inferencia em tempo de execucao;
- se o colaborador correspondente nao existir ou divergir desse ID na base real, a materializacao falha;
- `latestPublishedVersion = 1` no piloto.

### 5.2. `workflowTypes_v2/{workflowTypeId}/versions/1`

Na execucao da Fase 1, ler como:

- `workflowTypes_v2/{workflowTypeId}/versions/1`

Campos obrigatorios:

- `workflowTypeId`
- `version = 1`
- `state = 'published'`
- `ownerEmailAtPublish`
- `defaultSlaDays`
- `fields`
- `initialStepId`
- `stepOrder`
- `stepsById`
- `publishedAt`

### 5.3. `stepsById` e `stepOrder`

Regras:

- `stepOrder` e a unica estrutura ordenada;
- `stepsById` e o mapa de identidade;
- runtime navega por `currentStepId` dentro de `stepOrder`;
- nada deve depender de indice legado de `statuses`.

### 5.4. `stepId`

Regras:

- gerado pelo sistema no publish/materializacao;
- nunca derivado de `stepName`;
- nunca derivado da posicao;
- formato recomendado:
  - `stp_${shortId}`

### 5.5. `workflows_v2/{docId}` como documento operacional

Na execucao da Fase 1, ler como:

- `workflows_v2/{docId}`

Campos operacionais minimos exigidos na Etapa 1:

- `requestId`
- `workflowTypeId`
- `workflowVersion`
- `formData`
- `stepStates`
- `history`
- `submittedAt`

Regras:

- `formData` e persistido apenas com chaves canonicas;
- `stepStates` e a fonte de verdade para `pending / active / completed / skipped`;
- `history` e append-only;
- `submittedAt` nasce na abertura.

### Nota importante sobre o read model

Embora a Etapa 2 seja a etapa de validacao e consolidacao do read layer, a Etapa 1 ja deve persistir no documento `workflows_v2` o backbone desnormalizado necessario para leitura.

Isso inclui os campos de read model definidos em [DESIGN_FASE1_FACILITIES_ETAPA2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA2.md), especialmente:

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

Regra de fronteira entre as etapas:

- a Etapa 1 escreve esses campos desde a abertura e nas mutacoes do runtime;
- a Etapa 2 confirma, testa e organiza o read layer de consumo sobre esse backbone ja persistido.

---

## 6. Runtime Write-Side da Etapa 1

### 6.1. Casos de uso obrigatorios

- `resolvePublishedVersion`
- `open-request`
- `assign-responsible`
- `advance-step`
- `finalize-request`
- `archive-request`

### 6.2. Regras obrigatorias

- `open-request` deve ser transacional:
  - leitura/atualizacao do contador
  - geracao de `requestId`
  - criacao do documento `workflows_v2`
- `currentStepName` e `currentStatusKey` vem da etapa inicial publicada;
- primeira atribuicao materializa a entrada em `Em andamento`;
- `advance-step` nao pode mover para a etapa final;
- no piloto simples, `advance-step` nao tem happy path real, mas permanece como capacidade estrutural;
- `finalize-request` e a unica operacao que move para a etapa final;
- `finalize-request` e permitido quando o chamado ja estiver em `Em andamento`;
- o responsavel atual pode finalizar;
- o owner pode finalizar como excecao operacional;
- `closedAt = finalizedAt`;
- `archivedAt` e separado;
- `assign-responsible` deve rejeitar `waiting_action` defensivamente na Etapa 1;
- notificacoes so apos persistencia bem-sucedida.
- `open-request`, `assign-responsible`, `finalize-request` e `archive-request` ja devem manter sincronizados os campos desnormalizados do backbone de read model.

### 6.3. Normalizacao de input

Esta etapa ja deve incluir uma camada de normalizacao de payload para:

- `centrodecusto -> centro_custo`

Regras:

- se chegar so `centrodecusto`, normalizar;
- se chegarem `centrodecusto` e `centro_custo` juntos, falhar com erro de validacao;
- `formData` persistido deve sempre usar a chave canonica.

---

## 7. API Write-Side

Rotas obrigatorias:

- `POST /api/workflows/runtime/requests`
- `POST /api/workflows/runtime/requests/{id}/assign`
- `POST /api/workflows/runtime/requests/{id}/advance`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`

Padrao de autenticacao:

- `Authorization: Bearer <idToken>`
- validacao server-side com Firebase Admin

Padrao de resposta:

```ts
type RuntimeSuccess<T> = {
  ok: true;
  data: T;
};

type RuntimeErrorResponse = {
  ok: false;
  code: string;
  message: string;
};
```

Erros minimos:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `WORKFLOW_TYPE_INACTIVE`
- `PUBLISHED_VERSION_NOT_FOUND`
- `INVALID_PUBLISHED_VERSION`
- `INVALID_FORM_DATA`
- `REQUEST_NOT_FOUND`
- `REQUEST_ALREADY_ARCHIVED`
- `REQUEST_ALREADY_FINALIZED`
- `FINALIZATION_NOT_ALLOWED`
- `INVALID_RESPONSIBLE`
- `INVALID_STEP_TRANSITION`

---

## 8. Manifesto de Arquivos da Etapa 1

Arquivos centrais:

- `src/lib/workflows/runtime/types.ts`
- `src/lib/workflows/runtime/errors.ts`
- `src/lib/workflows/runtime/repository.ts`
- `src/lib/workflows/runtime/engine.ts`
- `src/lib/workflows/runtime/authz.ts`
- `src/lib/workflows/runtime/history.ts`
- `src/lib/workflows/runtime/read-model.ts`
- `src/lib/workflows/runtime/input-normalization.ts`
- `src/lib/workflows/runtime/use-cases/resolve-published-version.ts`
- `src/lib/workflows/runtime/use-cases/open-request.ts`
- `src/lib/workflows/runtime/use-cases/assign-responsible.ts`
- `src/lib/workflows/runtime/use-cases/advance-step.ts`
- `src/lib/workflows/runtime/use-cases/finalize-request.ts`
- `src/lib/workflows/runtime/use-cases/archive-request.ts`
- `src/app/api/workflows/runtime/requests/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/assign/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/advance/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/archive/route.ts`

Bootstrap:

- `src/lib/workflows/bootstrap/fase1-facilities-v1.ts`
- `src/lib/workflows/bootstrap/step-id.ts`

Regra de bootstrap:

- `fase1-facilities-v1.ts` e um builder de payload;
- a gravacao em Firestore deve acontecer via script manual de seed;
- a Etapa 1 nao deve expor isso por rota publica.
- o seed deve gravar em `workflowTypes_v2`, `workflowTypes_v2/{workflowTypeId}/versions/{version}` e `workflows_v2`;
- o contador do piloto deve usar `counters/workflowCounter_v2`.

---

## 9. Testes da Etapa 1

Unitarios:

- resolucao de versao publicada;
- geracao de `stepId`;
- guard de `advance-step`;
- guard de `archive-request`;
- normalizacao de payload;
- projeção operacional minima.

Integracao:

- abertura transacional com `requestId`;
- atribuicao movendo para `Em andamento`;
- `finalize-request` como unico caminho para etapa final;
- `archive-request` apenas apos finalizacao.

Abordagem preferida:

- usar mocks manuais de `firebase-admin/firestore` com Jest;
- emulator fica como opcional posterior.

---

## 10. Fora de Escopo da Etapa 1

- `requestAction`
- `respondAction`
- propagacao de troca de owner para chamados ativos
- frontend consolidado do piloto
- migracao completa do legado
- consolidacao do read layer como superficie de produto

---

## 11. Pronto para Build

A Etapa 1 fica pronta para build quando:

- o runtime write-side estiver completamente delimitado;
- o bootstrap dos 3 workflows estiver definido;
- o contrato operacional de `workflows_v2` estiver fechado;
- os testes write-side estiverem definidos;
- nenhuma regra do piloto depender mais da ordem ou semantica do legado.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-25 | codex | Extracted Etapa 1 scope from `DESIGN_FASE1_FACILITIES_ETAPA1e2.md`, renaming the planning language from `5.2` to `Etapa 1` and keeping only the technical-foundation scope. |
