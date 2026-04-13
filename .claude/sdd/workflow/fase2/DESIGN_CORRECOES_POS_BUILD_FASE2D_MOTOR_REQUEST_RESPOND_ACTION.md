# DESIGN: Correcoes Pos-Build da Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-08
> Status: Ready for build
> Scope: Fase 2 / 2D - fechamento das correcoes de integridade de anexo, namespace de upload e visibilidade do batch encerrado
> Base document: `DEFINE_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Parent design: `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

## 1. Objetivo

Corrigir o build ja entregue da `2D` sem reabrir a arquitetura macro do motor de actions, fechando de forma implementavel:

- validacao forte do anexo de `execution` em `respondAction`;
- namespace neutro de uploads para workflows v2;
- persistencia read-side do ultimo batch encerrado da etapa atual no detalhe oficial;
- atualizacao dos contratos tipados da gestao oficial para o novo estado de batch fechado;
- cobertura automatizada para as tres correcoes.

Esta microetapa cobre:

- escolher e justificar a estrategia oficial de protecao do anexo entre validacao por formato de path e validacao por Storage API;
- explicitar o shape de `action.state` para batch encerrado;
- atualizar o manifesto de arquivos para os pontos reais do delta;
- declarar o comportamento legado dos objetos ja existentes sob o prefixo antigo.

Esta microetapa nao cobre:

- migracao ou copia de objetos ja gravados no Storage;
- nova colecao de uploads ou ledger transacional de upload em Firestore;
- mudanca de quorum, permissao ou gatilho de `requestAction`;
- redesign da UX de actions fora do necessario para exibir batch encerrado;
- reabertura da `2D` como uma nova fase funcional.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [BUILD_REPORT_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/reports/BUILD_REPORT_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [respond-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/respond-action.ts)
- [init-file-upload.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/init-file-upload.ts)
- [upload-storage.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/upload-storage.ts)
- [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)

Em caso de divergencia:

1. prevalece o DEFINE desta microetapa para escopo, aceite e ressalvas aprovadas;
2. depois prevalece o design pai da `2D` para arquitetura macro;
3. depois prevalece o contrato real hoje implementado no repositorio;
4. depois prevalece este design para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo faz hoje

- `respondAction` apenas normaliza `attachment.fileName`, `contentType`, `fileUrl`, `storagePath` e `uploadId`, mas nao consulta o objeto no Storage nem prova que o anexo veio do upload assinado oficial;
- `createSignedWorkflowUpload()` ja grava metadados ricos no objeto:
  - `target`
  - `workflowtypeid`
  - `actoruserid`
  - `requestid`
  - `stepid`
  - `uploadid`
- `upload-storage.ts` ainda usa o prefixo fixo `Workflows/Facilities e Suprimentos/workflows_v2/preopen`;
- `detail.ts` monta o bloco `action` apenas a partir de `getCurrentPendingActionBatchEntries(request)`;
- quando o ultimo destinatario responde, o request volta para `in_progress` e o detalhe cai para `action.state = 'idle'`, escondendo o batch encerrado;
- `read/types.ts`, `management/types.ts` e `management/api-client.ts` ainda tipam `action.state` apenas como `idle | pending`.

### 3.2. Lacunas objetivas em relacao ao DEFINE aprovado

- falta uma estrategia explicita e defensavel para P1:
  - confiar apenas no formato do `storagePath`
  - ou consultar o objeto real no Storage
- o shape de estado para batch encerrado ainda nao existe no contrato do detalhe;
- o namespace de upload segue nominalmente acoplado a `Facilities e Suprimentos`;
- o documento atual de design da `2D` ainda nao anota que arquivos sob o prefixo antigo nao serao migrados;
- o manifesto de arquivos do design pai nao lista explicitamente todos os pontos agora obrigatorios nesta correcao:
  - `read/types.ts`
  - `management/types.ts`
  - `management/api-client.ts`
  - `action-helpers.ts`

### 3.3. Limites nao negociaveis desta microetapa

- `workflows_v2/{docId}` continua sendo a unica fonte de verdade operacional;
- nenhuma nova colecao de uploads sera criada;
- `requestAction` e `respondAction` preservam os endpoints e a semantica existentes;
- `approval = rejected` continua devolvendo para finalizacao manual;
- o batch encerrado passa a ficar visivel no detalhe, mas nao volta a governar `statusCategory`;
- arquivos sob o prefixo antigo nao sao migrados, copiados nem regravados;
- somente uploads novos passarao a nascer no namespace neutro.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
request-detail UI
  |
  +--> GET /api/workflows/read/requests/{requestId}
          |
          +--> buildDetailAction()
                 |
                 +--> current step action entries
                        |- if pending batch exists -> show pending batch
                        |- else if latest closed batch exists -> show completed batch
                        |- else -> idle

respond execution with attachment
  |
  +--> POST /api/workflows/runtime/uploads
  |       |
  |       +--> createSignedWorkflowUpload()
  |               |- writes object metadata
  |               |- returns storagePath + uploadId + fileUrl
  |
  +--> POST /api/workflows/runtime/requests/{id}/respond-action
          |
          +--> respondAction()
                 |- normalize payload
                 |- fail fast on malformed path/url/uploadId
                 |- read object metadata from Storage API
                 |- validate target/request/step/actor/uploadId/workflowType
                 |- persist responseAttachment
                 |- recalculate read-model helpers

Storage namespace after fix
  |- Workflows/workflows_v2/uploads/form_field/{workflowTypeId}/{fieldId}/{yyyy-mm}/{uploadId}-{file}
  |- Workflows/workflows_v2/uploads/action_response/{workflowTypeId}/request_{requestId}/{stepId}/{yyyy-mm}/{uploadId}-{file}

Legacy namespace
  |- Workflows/Facilities e Suprimentos/workflows_v2/preopen/...
  |- remains readable
  |- is not migrated
  |- no new uploads are emitted there
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 - Upload init
1. init-file-upload valida request, step atual e actor como hoje.
2. upload-storage passa a gerar prefixo neutro para form_field e action_response.
3. metadados do objeto continuam sendo emitidos no signed upload.

LAYER 2 - RespondAction hardening
4. payload com attachment exige uploadId nao vazio para writes novos.
5. respondAction rejeita cedo payloads malformados.
6. respondAction consulta o objeto no Storage API.
7. respondAction valida metadata + name + contentType + storagePath.

LAYER 3 - Read-side completed batch
8. action-helpers passa a selecionar o batch relevante da etapa atual:
   - batch pendente se existir
   - senao ultimo batch encerrado
9. detail.ts usa esse batch para preencher o card de action.
10. read/types e management/types passam a suportar state = completed.

LAYER 4 - UI oficial
11. RequestActionCard continua exibindo recipients/status.
12. quando state = completed, a UI mostra o ultimo batch encerrado e nao um estado vazio.
13. `state = completed` e somente leitura: o CTA de request nao reaparece para a mesma etapa.
```

### 4.3. Shape fechado para batch encerrado

Nao ha novo schema persistido em Firestore para isso. O delta e no contrato read-side/management do detalhe.

Shape oficial do detalhe:

```ts
type WorkflowRequestActionState = 'idle' | 'pending' | 'completed';

type WorkflowRequestActionDetail = {
  available: boolean;
  state: WorkflowRequestActionState;
  batchId: string | null;
  type: 'approval' | 'acknowledgement' | 'execution' | null;
  label: string | null;
  commentRequired: boolean;
  attachmentRequired: boolean;
  commentPlaceholder: string | null;
  attachmentPlaceholder: string | null;
  canRequest: boolean;
  canRespond: boolean;
  requestedAt: TimestampLike;
  completedAt: TimestampLike;
  requestedByUserId: string | null;
  requestedByName: string | null;
  recipients: WorkflowRequestActionRecipientDetail[];
  configurationError?: string | null;
};
```

Semantica de `state`:

| `state` | Criterio | Batch exibido |
|---------|----------|---------------|
| `idle` | a etapa atual tem action configurada, mas nunca abriu batch para `currentStepId` | nenhum |
| `pending` | existe ao menos uma entry `status === 'pending'` no batch atual da etapa | batch pendente atual |
| `completed` | nao existe entry pendente na etapa atual, mas existe ao menos um batch historico para `currentStepId` | ultimo batch encerrado da etapa |

Regras fechadas:

- `batchId` e `completedAt` ficam `null` em `idle`;
- `completedAt` fica `null` em `pending`;
- `completedAt` em `completed` e `max(respondedAt)` do batch exibido;
- `canRespond` continua `true` somente quando `state === 'pending'` e o ator possui linha pendente;
- `canRequest` exige:
  - permissao do responsavel atual
  - `statusCategory === 'in_progress'`
  - ausencia de batch pendente
  - ausencia de batch historico ja encerrado para `currentStepId`
- portanto `state === 'completed'` implica `canRequest === false` nesta microetapa;
- reabrir batch manual na mesma etapa continua fora do escopo desta correcao.

Algoritmo canonico para escolher o batch da etapa atual:

1. coletar todas as `actionRequests` com `stepId === currentStepId`;
2. se houver entradas pendentes, selecionar o `actionBatchId` pendente atual;
3. senao, percorrer `actionRequests` de tras para frente e capturar o ultimo `actionBatchId` da etapa atual;
4. retornar todas as linhas desse batch para renderizacao do detalhe.

Esta escolha evita depender de ordenacao temporal externa e respeita o fato de que `requestAction` sempre faz append das novas linhas no fim do array.

---

## 5. Architecture Decisions

### ADR-2D-FIX-001: P1 usa Storage API como fonte autoritativa de validacao do anexo

| Attribute | Value |
|-----------|-------|
| Context | O payload atual de `respondAction` pode forjar `fileUrl`, `storagePath` e `uploadId` sem prova de que o objeto veio do signed upload oficial. |
| Choice | Usar leitura do objeto real via Storage API (`bucket.file(storagePath).getMetadata()`) como validacao autoritativa. O formato de path fica apenas como precheck barato para falha rapida. |
| Rationale | Validacao so por path e insuficiente para provar autoria, target e request corretos. A metadata ja existe hoje no objeto e permite conferir `target`, `workflowtypeid`, `actoruserid`, `requestid`, `stepid` e `uploadid` sem criar novo registro em Firestore. |
| Alternatives | Validacao apenas por prefixo/path; rejeitada por menor completude de protecao. Criar ledger novo em Firestore; rejeitada por custo e escopo desnecessarios para esta correcao. |
| Consequences | Cada `respondAction` com anexo passa a fazer 1 leitura adicional no Storage. O custo de latencia e limitado ao caso `execution` com attachment e e aceitavel diante do ganho de integridade. |

Nota explicita de latencia vs completude:

- `path-only` teria menor latencia, mas protege mal contra reuso de objeto existente no mesmo namespace;
- `Storage API` adiciona uma leitura remota, porem fecha a protecao sobre existencia real do objeto e coerencia dos metadados;
- a decisao desta microetapa prioriza completude da protecao sobre micro-otimizacao de latencia.

### ADR-2D-FIX-002: o detalhe oficial passa a expor `completed` para batch encerrado

| Attribute | Value |
|-----------|-------|
| Context | O card atual some assim que o ultimo destinatario responde, apagando do detalhe oficial exatamente o contexto que o DEFINE exige manter visivel. |
| Choice | Expandir `action.state` para `idle | pending | completed` e usar o ultimo batch encerrado da etapa atual como fonte do detalhe quando nao houver batch pendente, sem reabrir manualmente batch na mesma etapa. |
| Rationale | Mantem a UX e o payload simples, preserva a leitura consolidada por batch e evita empurrar a responsabilidade para a timeline ou para um novo endpoint. |
| Alternatives | Continuar caindo em `idle`; rejeitada porque perde contexto operacional. Mover tudo para timeline; rejeitada porque piora leitura e nao atende o contrato do card. Reabrir batch automaticamente ou por novo CTA na mesma etapa; rejeitada porque contradiz a decisao original da `2D` de manter reabertura fora de escopo. |
| Consequences | `read/types.ts`, `management/types.ts` e `management/api-client.ts` passam a carregar um novo estado e a UI precisa tratar `completed` explicitamente. |

### ADR-2D-FIX-003: o namespace de uploads vira neutro e objetos legados nao sao migrados

| Attribute | Value |
|-----------|-------|
| Context | O prefixo atual referencia `Facilities e Suprimentos`, o que conflita com workflows multi-area ja suportados pela `2D`. |
| Choice | Adotar o prefixo neutro `Workflows/workflows_v2/uploads/...` para novos uploads e manter objetos legados onde ja estao. |
| Rationale | Remove o acoplamento nominal ao dominio legado sem abrir um projeto de migracao de Storage. A metadata continua sendo suficiente para governanca e validacao. |
| Alternatives | Manter prefixo antigo; rejeitada por regressao de governanca. Migrar/copiar todos os objetos antigos; rejeitada por custo, risco e falta de necessidade funcional imediata. |
| Consequences | Testes e docs precisam refletir o novo prefixo. Leituras historicas continuam usando `fileUrl`/`storagePath` ja persistidos. Nenhum backfill de Storage faz parte do build. |

---

## 6. Contratos Tecnicos Fechados

### 6.1. Validacao oficial do anexo em `respondAction`

Quando `attachment` estiver presente em `respondAction`:

1. validar localmente:
   - `fileName`, `contentType`, `fileUrl`, `storagePath` e `uploadId` nao vazios;
   - action atual e `execution`;
   - `storagePath` comeca por um namespace permitido:
     - novo prefixo neutro
     - ou prefixo legado apenas para compatibilidade de leitura/assinaturas ja emitidas
   - nome do arquivo no path comeca por `${uploadId}-`;
   - `fileUrl` aponta para o bucket configurado e referencia o mesmo `storagePath`.
2. buscar `getMetadata()` do objeto em `storagePath`;
3. rejeitar com `ACTION_RESPONSE_INVALID` se:
   - o objeto nao existir;
   - `objectMetadata.metadata.target !== 'action_response'`;
   - `objectMetadata.metadata.workflowtypeid !== request.workflowTypeId`;
   - `objectMetadata.metadata.requestid !== String(input.requestId)`;
   - `objectMetadata.metadata.stepid !== currentRequest.currentStepId`;
   - `objectMetadata.metadata.actoruserid !== input.actorUserId`;
   - `objectMetadata.metadata.uploadid !== attachment.uploadId`;
   - `objectMetadata.contentType` nao bater com `attachment.contentType`;
   - `objectMetadata.name` nao bater com `attachment.storagePath`;
4. persistir o attachment somente depois da validacao autoritativa.

Separacao obrigatoria de fontes de validacao:

- custom metadata do signed upload vive em `objectMetadata.metadata`;
- propriedades nativas do objeto vivem no topo do retorno de `getMetadata()`, especialmente:
  - `objectMetadata.name`
  - `objectMetadata.contentType`

Placement obrigatorio:

- `assertValidActionResponseAttachment(...)` deve rodar **antes** de `mutateWorkflowRequestAtomically(...)`;
- a transacao Firestore continua restrita a releitura do request, validacoes de estado/autorizacao e persistencia final;
- nenhuma chamada remota ao Storage deve ficar dentro do callback transacional.

Contrato de escrita:

- `attachment.uploadId` passa a ser obrigatorio para writes novos;
- `WorkflowActionResponseAttachment.uploadId` pode permanecer opcional no tipo persistido apenas para compatibilidade historica, mas o builder desta correcao deve sempre gravar o campo;
- `respondAction` nao confia apenas em `fileUrl`; o valor e tratado como dado espelhado, nao como prova de origem.

### 6.2. Namespace neutro de upload

Prefixo oficial apos o build:

```text
Workflows/workflows_v2/uploads/form_field/{workflowTypeId}/{fieldId}/{yyyy-mm}/{uploadId}-{sanitizedFileName}
Workflows/workflows_v2/uploads/action_response/{workflowTypeId}/request_{requestId}/{stepId}/{yyyy-mm}/{uploadId}-{sanitizedFileName}
```

Regras:

- `workflowTypeId` permanece no path para governanca por workflow;
- `target` entra explicitamente no path para separar `form_field` de `action_response`;
- `requestId` e `stepId` continuam presentes no ramo de `action_response`;
- o prefixo antigo nao recebe novos objetos apos o build.

Anotacao obrigatoria desta microetapa:

- arquivos ja existentes sob `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...` nao sao migrados;
- nao havera rename, copy nem cleanup retroativo como parte desta entrega;
- leituras historicas continuam aceitando os `fileUrl` ja persistidos;
- a validacao de compatibilidade do `respondAction` pode aceitar o prefixo antigo somente quando o objeto e autentico e os metadados batem.

### 6.3. Manifesto de tipos correspondente ao batch encerrado

Arquivos que obrigatoriamente precisam refletir o novo estado:

- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
  - adicionar `WorkflowRequestActionState = 'idle' | 'pending' | 'completed'`;
  - expandir `WorkflowRequestActionDetail.state`;
  - adicionar `batchId` e `completedAt`.
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
  - espelhar `completed`;
  - adicionar `batchId` e `completedAt` no detalhe da action.
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
  - normalizar `state === 'completed'`;
  - normalizar `batchId` e `completedAt`.

Sem esses tres pontos, o build do read-side e da gestao ficaria incoerente com o state fechado neste design.

---

## 7. Manifesto de Arquivos

### 7.1. Runtime e Storage

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/runtime/action-helpers.ts` | Modify | introduzir helper canonico para selecionar o batch relevante da etapa atual e reaproveitar a logica de batch pendente vs batch encerrado |
| `src/lib/workflows/runtime/types.ts` | Modify | anotar contrato de `WorkflowActionResponseAttachment` para writes novos com `uploadId`; manter compatibilidade historica e documentar o shape persistido real |
| `src/lib/workflows/runtime/upload-storage.ts` | Modify | trocar prefixo fixo por namespace neutro, expor helper de leitura de metadata do objeto e concentrar helpers de validacao estrutural de path/url/uploadId |
| `src/lib/workflows/runtime/use-cases/init-file-upload.ts` | Modify | continuar autorizando upload oficial, agora emitindo storagePath no namespace neutro |
| `src/lib/workflows/runtime/use-cases/respond-action.ts` | Modify | endurecer validacao do attachment usando precheck estrutural + Storage API metadata lookup antes da transacao Firestore |

Co-changes obrigatorios:

- `upload-storage.ts` e `respond-action.ts` devem mudar no mesmo change set, porque a validacao autoritativa depende do contrato de metadata emitido pelo signed upload;
- `action-helpers.ts` deve mudar junto com `detail.ts`, porque o novo batch exibido no detalhe passa a depender desse helper.

Distribuicao fechada dos helpers auxiliares:

- `assertAllowedWorkflowUploadPath`
- `assertAttachmentUrlMatchesStoragePath`
- `assertUploadIdMatchesFileName`
- `readWorkflowUploadObjectMetadata`

ficam em `src/lib/workflows/runtime/upload-storage.ts`, porque pertencem ao contrato de storage/upload e precisam ser mockados de forma isolada nos testes de `respondAction`.

### 7.2. Read-side e gestao oficial

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/read/types.ts` | Modify | fechar o novo shape de `action.state`, `batchId` e `completedAt` |
| `src/lib/workflows/read/detail.ts` | Modify | exibir batch pendente ou ultimo batch encerrado da etapa atual |
| `src/lib/workflows/management/types.ts` | Modify | espelhar o contrato atualizado do detalhe |
| `src/lib/workflows/management/api-client.ts` | Modify | aceitar e normalizar `completed` sem fallback indevido para `idle` |
| `src/components/workflows/management/RequestActionCard.tsx` | Modify | renderizar estado encerrado explicitamente e manter recipients/comentario/anexo visiveis |
| `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | preservar o card operacional no detalhe mesmo apos o fechamento do batch |

### 7.3. Testes

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js` | Modify | cobrir tentativa de forjar attachment, reuso de objeto indevido e persistencia do resultado valido |
| `src/lib/workflows/runtime/__tests__/upload-storage.test.ts` | Modify | validar o namespace neutro novo e os metadados emitidos |
| `src/lib/workflows/runtime/__tests__/init-file-upload.test.ts` | Modify | refletir o novo path e garantir que `action_response` continua autorizado apenas para execution pendente |
| `src/lib/workflows/read/__tests__/detail.test.js` | Modify | validar `state = completed`, `batchId`, `completedAt` e visibilidade do ultimo batch encerrado |
| `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | validar exibicao do card com batch encerrado e anexo visivel para owner/responsavel |
| `src/lib/workflows/management/__tests__/api-client.test.ts` | Create/Modify | validar normalizacao de `completed`, `batchId` e `completedAt` |

### 7.4. Skills e ownership recomendados para o build

- skill `build`: implementacao direta a partir deste design;
- skill `iterate`: somente se o shape acordado nesta microetapa mudar durante o build;
- worker `runtime-storage`: ownership em `src/lib/workflows/runtime/**`;
- worker `read-management`: ownership em `src/lib/workflows/read/**`, `src/lib/workflows/management/**` e componentes oficiais de detalhe.

---

## 8. Code Patterns Copy-Paste

### 8.1. Helper de selecao do batch exibido no detalhe

```ts
export function getDisplayActionBatchEntriesForCurrentStep(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
): WorkflowActionRequest[] {
  const pendingEntries = getPendingActionEntriesForCurrentStep(request);

  if (pendingEntries.length > 0) {
    const pendingBatchId = pendingEntries[0].actionBatchId;
    return (request.actionRequests ?? []).filter(
      (entry) =>
        entry.stepId === request.currentStepId &&
        entry.actionBatchId === pendingBatchId,
    );
  }

  const actionRequests = request.actionRequests ?? [];
  for (let index = actionRequests.length - 1; index >= 0; index -= 1) {
    const entry = actionRequests[index];
    if (entry.stepId !== request.currentStepId) {
      continue;
    }

    return actionRequests.filter(
      (candidate) =>
        candidate.stepId === request.currentStepId &&
        candidate.actionBatchId === entry.actionBatchId,
    );
  }

  return [];
}
```

### 8.2. Validacao autoritativa do anexo com Storage API

```ts
type ValidatedActionAttachment = {
  fileName: string;
  contentType: string;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
};

async function assertValidActionResponseAttachment(params: {
  request: WorkflowRequestV2;
  actorUserId: string;
  requestId: number;
  attachment: ValidatedActionAttachment;
}) {
  assertAllowedWorkflowUploadPath(params.attachment.storagePath);
  assertAttachmentUrlMatchesStoragePath(params.attachment.fileUrl, params.attachment.storagePath);
  assertUploadIdMatchesFileName(params.attachment.uploadId, params.attachment.storagePath);

  const objectMetadata = await readWorkflowUploadObjectMetadata(params.attachment.storagePath);
  const metadata = objectMetadata.metadata ?? {};

  if (
    metadata.target !== 'action_response' ||
    metadata.workflowtypeid !== params.request.workflowTypeId ||
    metadata.requestid !== String(params.requestId) ||
    metadata.stepid !== params.request.currentStepId ||
    metadata.actoruserid !== params.actorUserId ||
    metadata.uploadid !== params.attachment.uploadId ||
    objectMetadata.contentType !== params.attachment.contentType ||
    objectMetadata.name !== params.attachment.storagePath
  ) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action nao corresponde ao upload assinado desta request.',
      400,
    );
  }
}
```

### 8.3. Montagem do detalhe com `completed`

```ts
const batchEntries = getDisplayActionBatchEntriesForCurrentStep(request);
const requestedEntry = batchEntries[0] ?? null;
const hasPending = batchEntries.some((entry) => entry.status === 'pending');
const hasHistory = batchEntries.length > 0;
const completedAt =
  !hasPending && hasHistory
    ? batchEntries.reduce<TimestampLike>((latest, entry) => {
        if (!entry.respondedAt) {
          return latest;
        }
        if (!latest) {
          return entry.respondedAt;
        }
        const entryTime = normalizeReadTimestamp(entry.respondedAt)?.getTime() ?? 0;
        const latestTime = normalizeReadTimestamp(latest)?.getTime() ?? 0;
        return entryTime > latestTime ? entry.respondedAt : latest;
      }, null)
    : null;

return {
  available: true,
  state: hasPending ? 'pending' : hasHistory ? 'completed' : 'idle',
  batchId: requestedEntry?.actionBatchId ?? null,
  requestedAt: requestedEntry?.requestedAt ?? null,
  completedAt,
  recipients: buildActionRecipients(batchEntries, actorUserId, request),
  // demais campos mantidos
};
```

---

## 9. API Contract

### 9.1. `POST /api/workflows/runtime/requests/{id}/respond-action`

Body relevante para `execution`:

```json
{
  "actorName": "Nome opcional",
  "response": "executed",
  "comment": "Comentario opcional",
  "attachment": {
    "fileName": "comprovante.pdf",
    "contentType": "application/pdf",
    "fileUrl": "https://firebasestorage.googleapis.com/...",
    "storagePath": "Workflows/workflows_v2/uploads/action_response/financeiro/request_812/execucao/2026-04/upl_123-comprovante.pdf",
    "uploadId": "upl_123"
  }
}
```

Escolhas fechadas:

- o shape HTTP permanece o mesmo;
- `uploadId` passa a ser obrigatorio quando `attachment` estiver presente;
- o erro de mismatch continua sendo `400 ACTION_RESPONSE_INVALID`;
- o endpoint nao introduz payload extra de batch fechado; isso segue no read-side.

### 9.2. `GET /api/workflows/read/requests/{requestId}`

Delta do bloco `action`:

```ts
type ActionState = 'idle' | 'pending' | 'completed';

type ActionDetail = {
  state: ActionState;
  batchId: string | null;
  requestedAt: TimestampLike;
  completedAt: TimestampLike;
  recipients: Array<{
    actionRequestId: string;
    recipientUserId: string;
    status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'executed';
    respondedAt: TimestampLike;
    respondedByUserId: string | null;
    respondedByName: string | null;
    responseComment?: string;
    responseAttachmentUrl?: string;
  }>;
};
```

Politica de visibilidade:

- destinatario continua respondendo apenas quando tem linha pendente;
- owner e responsavel continuam vendo comentario e `responseAttachmentUrl` do batch encerrado;
- o batch encerrado nao reabre `waiting_action`.

---

## 10. Testing Strategy

### 10.1. Runtime attachment hardening

Cobrir em `respondAction`:

- aceita attachment autentico com metadata correta;
- rejeita `storagePath` fora do namespace permitido;
- rejeita `uploadId` ausente quando `attachment` existir;
- rejeita objeto inexistente no Storage;
- rejeita metadata com `target !== action_response`;
- rejeita metadata com `requestid`, `stepid`, `actoruserid` ou `workflowtypeid` divergentes;
- rejeita reuso de objeto de outro ator ou de outra request;
- mantem comportamento sem attachment para `approval` e `acknowledgement`.
- `readWorkflowUploadObjectMetadata` deve ser exportado e mockado nos testes unitarios de `respondAction`, sem I/O real contra Storage.

### 10.2. Namespace neutro

- `upload-storage.test.ts` valida os dois ramos do novo path:
  - `form_field`
  - `action_response`
- `init-file-upload.test.ts` e `upload-route-contract.test.ts` refletem o prefixo neutro;
- incluir assertion explicita de que nenhum novo path gerado contem `Facilities e Suprimentos`.

### 10.3. Read-side e tipos

- `detail.test.js` cobre:
  - `idle` sem historico;
  - `pending` com batch aberto;
  - `completed` com batch encerrado;
  - `completedAt` igual ao maior `respondedAt` do batch;
  - ocultacao de `responseAttachmentUrl` para ator sem permissao;
  - `completed` permanece somente leitura, sem reabrir CTA de `requestAction` na mesma etapa;
- `api-client.test.ts` cobre a normalizacao do novo shape sem fallback silencioso para `idle`.

### 10.4. UI oficial

- `RequestDetailDialog.test.tsx` cobre:
  - card continua visivel em `completed`;
  - recipients e status finais continuam visiveis;
  - comentario e anexo do batch encerrado continuam visiveis para owner/responsavel;
  - CTA de responder some em `completed`;
  - CTA de solicitar continua respeitando `canRequest`.

---

## 11. Rollback Plan

### 11.1. Rollback de codigo

Se o build corretivo precisar ser revertido:

1. restaurar o comportamento anterior de `detail.ts` e dos tipos de gestao/read-side;
2. restaurar o prefixo antigo em `upload-storage.ts`;
3. remover a validacao autoritativa de attachment em `respond-action.ts`.

Risco conhecido desse rollback:

- o sistema volta a aceitar apenas validacao fraca do attachment;
- o card de action volta a sumir apos o fechamento do batch.

### 11.2. Rollback de dados

Nao ha migracao de Firestore para desfazer.

Para Storage:

- objetos novos criados no prefixo neutro permanecem onde foram gravados;
- objetos antigos no prefixo legado permanecem intactos;
- como esta microetapa nao migra nada, rollback tambem nao exige rollback de objetos.

### 11.3. Condicao de seguranca para deploy

O build so deve ser considerado pronto quando:

- o teste de mismatch por metadata falhar como esperado;
- o teste do novo prefixo passar;
- o teste do detalhe com `state = completed` passar;
- a UI oficial nao perder o card do ultimo batch encerrado.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | Codex (`design` skill) | Initial corrective design for post-build fixes of Fase 2D action engine, closing attachment validation strategy, neutral upload namespace and completed batch visibility |
