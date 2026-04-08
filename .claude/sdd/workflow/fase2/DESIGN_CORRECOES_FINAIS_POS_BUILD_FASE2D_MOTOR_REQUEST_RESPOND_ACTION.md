# DESIGN: Correcoes Finais Pos-Build da Fase 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-08
> Status: Ready for build
> Source: `DEFINE_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Base design: `DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
> Parent design: `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

## 1. Requirements Summary

### Problem

A revisao final da `2D` encontrou um ultimo desalinhamento entre backend e read-side: o detalhe oficial ja trata `completed` como somente leitura, mas o runtime de `requestAction` ainda bloqueia apenas batch pendente, permitindo bypass por chamada direta. Em paralelo, os helpers criticos de `upload-storage.ts` ainda nao possuem cobertura unitara direta, e o namespace neutro precisa permanecer explicitamente canonico sem qualquer retorno silencioso ao prefixo legado.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Bloqueio server-side de reabertura | `requestAction` falha quando a etapa atual ja possui qualquer batch historico, pendente ou encerrado |
| Regra canonica unica | backend e read-side usam o mesmo predicado de batch para a etapa atual |
| Cobertura direta dos helpers de upload | `upload-storage.test.ts` cobre `assertAllowedWorkflowUploadPath`, `assertAttachmentUrlMatchesStoragePath` e `assertUploadIdMatchesFileName` |
| Namespace neutro preservado | testes continuam provando que uploads novos nao usam `Facilities e Suprimentos` |
| Contrato existente preservado | `completed` continua visivel no detalhe, sem reabrir batch nem alterar endpoint/schema |

### Constraints

- nenhuma mudanca de schema em Firestore;
- nenhum endpoint novo ou alterado;
- `waiting_action` continua governado apenas por batch pendente;
- `completed` continua sendo estado somente leitura para a etapa atual;
- uploads legados sob o prefixo antigo nao sao migrados, copiados nem regravados;
- o codigo de erro deve ser reaproveitado se o catalogo atual ja cobrir a reabertura indevida.

---

## 2. Fonte de Verdade e Estado Atual

Este design deriva de:

- [DEFINE_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [request-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/request-action.ts)
- [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [upload-storage.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/upload-storage.ts)
- [upload-storage.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/__tests__/upload-storage.test.ts)
- [runtime-use-cases.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js)

Estado real do repositorio nesta data:

- `requestAction` ainda bloqueia apenas `getPendingActionEntriesForCurrentStep(currentRequest).length > 0`;
- `detail.ts` ja trata qualquer batch da etapa atual como impeditivo para `canRequestAction`, mas ainda faz o guard redundante `sem pendente && sem batch algum`;
- `hasAnyActionBatchForCurrentStep(request)` ja existe em [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts), mas ainda nao e a fonte declarada de verdade para o bloqueio de reabertura;
- `upload-storage.ts` ja usa `Workflows/workflows_v2/uploads/...` como namespace canonico e ainda aceita o prefixo legado por compatibilidade;
- os helpers estruturais de upload estao implementados, mas so exercitados indiretamente pelos testes de `respondAction`.

Implicacao pratica:

- a UI oficial e o read-side ja respeitam `completed` como somente leitura;
- o backend ainda precisa fechar o mesmo contrato para impedir bypass por chamada direta;
- a microetapa final e de consistencia e cobertura, nao de reabertura arquitetural.

---

## 3. Architecture

### System Diagram

```text
request detail / management UI
  |
  +--> GET read request detail
  |       |
  |       +--> buildDetailPermissions()
  |               |
  |               +--> hasAnyActionBatchForCurrentStep(request)
  |                       |- false -> canRequestAction pode ser true
  |                       `- true  -> canRequestAction = false
  |
  +--> POST requestAction
          |
          +--> requestAction()
                  |
                  +--> assertCurrentStepActionConfigured()
                  +--> hasAnyActionBatchForCurrentStep(currentRequest)
                          |- false -> abre novo batch
                          `- true  -> ACTION_REQUEST_ALREADY_OPEN

upload helpers contract
  |
  +--> upload-storage.ts
          |- namespace neutro oficial
          |- compatibilidade com prefixo legado
          `- helpers estruturais testados diretamente
```

### Data Flow

```text
LAYER 1 - Runtime gate:
1. request-action.ts carrega request e versao publicada.
2. dentro da mutacao atomica, valida autorizacao e action configurada.
3. usa o predicado canonico da etapa atual para decidir se pode abrir novo batch.
4. se a etapa ja teve qualquer batch, falha com o erro de conflito existente.

LAYER 2 - Read-side permission:
5. detail.ts calcula canRequestAction a partir do mesmo predicado canonico.
6. o card continua podendo exibir batch pendente ou batch completed, mas sem reabrir.

LAYER 3 - Upload helper coverage:
7. upload-storage.test.ts valida namespace permitido, coerencia fileUrl/storagePath e coerencia uploadId/fileName.
8. os testes existentes de createSignedWorkflowUpload continuam provando que uploads novos nao usam o prefixo legado.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `current step action gate` | derivado de `currentStepId + actionRequests[]` | avaliado em runtime e read-side a cada leitura/mutacao |
| `action.state = completed` | read-side/management detail | permanece visivel apos fechamento do batch, sem reabrir a etapa |
| `upload namespace contract` | `upload-storage.ts` + testes unitarios | permanente; novos uploads nascem no namespace neutro e legado fica apenas como compatibilidade |

---

## 4. Architecture Decisions

### ADR-2D-FINAL-001: `hasAnyActionBatchForCurrentStep` vira o predicado canonico de bloqueio

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O read-side ja sabe que `completed` e somente leitura, mas o runtime de `requestAction` ainda bloqueia apenas batch pendente. Isso cria risco de bypass funcional. |

**Choice:** backend e read-side passam a usar o mesmo predicado canonico: se a etapa atual tiver qualquer `actionRequest`, nao se abre novo batch.

**Rationale:**
1. A regra funcional aprovada e simples: `completed` nao reabre batch na mesma etapa.
2. O helper ja existe no runtime e elimina drift entre permissao de leitura e regra server-side.
3. O predicado unico remove a redundancia atual de `detail.ts` e deixa a regra auditavel.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Manter backend bloqueando so pendente | Permite bypass por chamada direta e contradiz o contrato de `completed` |
| Criar novo helper exclusivo para backend | Duplica a semantica sem necessidade; o helper atual ja representa o dominio correto |
| Permitir reabrir batch encerrado na mesma etapa | Fora do escopo e contraria a decisao funcional ja aprovada |

**Consequences:**
- Positivo: uma unica fonte logica governa runtime e read-side.
- Positivo: `canRequestAction` fica mais legivel e o backend fecha a ultima brecha funcional.
- Negativo: `requestAction` passa a rejeitar tambem historico encerrado, exigindo ajuste de testes.

### ADR-2D-FINAL-002: o runtime reaproveita `ACTION_REQUEST_ALREADY_OPEN`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O DEFINE recomenda reaproveitar o codigo de erro atual se ele cobrir o caso de reabertura indevida. |

**Choice:** manter `RuntimeErrorCode.ACTION_REQUEST_ALREADY_OPEN` para batch pendente e batch historico da etapa atual, ajustando apenas a mensagem para refletir o bloqueio mais amplo.

**Rationale:**
1. O comportamento continua sendo um conflito de abertura de action na etapa atual.
2. Evita inflar o catalogo de erros sem ganho funcional.
3. Preserva compatibilidade para consumidores que ja tratam esse conflito.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Criar novo erro para batch encerrado | Complexidade desnecessaria para um caso de mesmo dominio |
| Manter a mensagem antiga sem ajuste | Fica tecnicamente incompleta quando o bloqueio ocorre por batch ja encerrado |

**Consequences:**
- Positivo: sem delta de contrato de erro.
- Negativo: testes precisarao validar a semantica mais ampla do mesmo codigo.

### ADR-2D-FINAL-003: helper estrutural precisa de teste unitario direto

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | Os helpers de `upload-storage.ts` hoje so sao validados indiretamente pelo fluxo de `respondAction`, o que dificulta isolar regressao estrutural de path/url/uploadId. |

**Choice:** adicionar testes unitarios diretos em [upload-storage.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/__tests__/upload-storage.test.ts) para os tres helpers criticos e manter os testes de fluxo como complemento.

**Rationale:**
1. Separa regra estrutural de upload da regra de negocio de `respondAction`.
2. Reduz custo de diagnostico quando falhar um helper auxiliar.
3. Fecha o gap de cobertura sem criar nova suite artificial.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Continuar cobrindo helpers so via `respondAction` | Cobertura pouco localizada e mais fragil para diagnostico |
| Criar nova suite dedicada apenas a asserts | Nao agrega valor suficiente sobre estender a suite existente |

**Consequences:**
- Positivo: regressao de namespace/path/url/uploadId fica mais facil de detectar.
- Negativo: a suite de upload-storage fica um pouco maior.

### ADR-2D-FINAL-004: namespace neutro segue canonico e prefixo legado segue sem migracao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O namespace neutro ja foi implementado, mas a microetapa final precisa cristalizar que nenhum upload novo pode regredir ao prefixo legado e que objetos antigos nao entram em migracao. |

**Choice:** manter `Workflows/workflows_v2/uploads/...` como namespace oficial, aceitar o prefixo legado apenas por compatibilidade de leitura/validacao historica e nao executar qualquer migracao de Storage.

**Rationale:**
1. O contrato ja esta correto no build atual e precisa apenas de reforco documental e de testes.
2. Migracao de Storage foge do escopo e nao e necessaria para o objetivo funcional.
3. A protecao real desta microetapa e impedir regressao silenciosa de novos uploads.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Reabrir migracao de objetos antigos | Alto custo e fora do escopo |
| Remover compatibilidade com prefixo legado agora | Risco desnecessario para leituras historicas |

**Consequences:**
- Positivo: contrato de uploads novos fica claro e auditavel.
- Negativo: o codigo continua carregando compatibilidade com o prefixo antigo ate uma futura limpeza planejada.

---

## 5. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Runtime predicate | `src/lib/workflows/runtime/action-helpers.ts`, `src/lib/workflows/runtime/use-cases/request-action.ts` | `@firebase-specialist` |
| 2. Read-side alignment | `src/lib/workflows/read/detail.ts` | `@firebase-specialist` |
| 3. Contract verification | `src/lib/workflows/read/types.ts`, `src/lib/workflows/management/types.ts`, `src/lib/workflows/management/api-client.ts`, `src/lib/workflows/runtime/upload-storage.ts` | `@firebase-specialist` |
| 4. Tests | `src/lib/workflows/runtime/__tests__/upload-storage.test.ts`, `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`, `src/lib/workflows/read/__tests__/detail.test.js` | `@firebase-specialist` |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/runtime/action-helpers.ts` | Modify | marcar `hasAnyActionBatchForCurrentStep` como predicado canonico da etapa atual; opcionalmente adicionar comentario/JSDoc curto para evitar drift semantico | `@firebase-specialist` | - |
| 2 | `src/lib/workflows/runtime/use-cases/request-action.ts` | Modify | trocar o gate de "sem batch pendente" por "sem batch algum na etapa atual" e reaproveitar `ACTION_REQUEST_ALREADY_OPEN` | `@firebase-specialist` | #1 |
| 3 | `src/lib/workflows/read/detail.ts` | Modify | simplificar `canRequestAction` para um criterio unico baseado no predicado canonico, sem dupla checagem redundante | `@firebase-specialist` | #1 |
| 4 | `src/lib/workflows/runtime/upload-storage.ts` | Verify no change expected | permanecer como fonte de verdade do namespace neutro e dos helpers estruturais; so muda se surgir ajuste minimo de comentario/export | `@firebase-specialist` | - |
| 5 | `src/lib/workflows/read/types.ts` | Verify no change expected | confirmar que o shape `idle | pending | completed` segue fechado e sem delta nesta microetapa | `@firebase-specialist` | - |
| 6 | `src/lib/workflows/management/types.ts` | Verify no change expected | confirmar espelhamento do contrato de `completed`, `batchId` e `completedAt` | `@firebase-specialist` | #5 |
| 7 | `src/lib/workflows/management/api-client.ts` | Verify no change expected | confirmar que `completed` continua normalizado sem fallback indevido | `@firebase-specialist` | #6 |
| 8 | `src/lib/workflows/runtime/__tests__/upload-storage.test.ts` | Modify | adicionar cobertura direta para `assertAllowedWorkflowUploadPath`, `assertAttachmentUrlMatchesStoragePath` e `assertUploadIdMatchesFileName`, mantendo o teste de namespace neutro | `@firebase-specialist` | #4 |
| 9 | `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js` | Modify | adicionar regressao para `requestAction` falhando quando existe batch historico encerrado na etapa atual | `@firebase-specialist` | #2 |
| 10 | `src/lib/workflows/read/__tests__/detail.test.js` | Modify | ajustar ou reforcar expectativa de `canRequestAction = false` quando a etapa atual ja possui batch encerrado | `@firebase-specialist` | #3 |

Arquivos explicitamente fora do delta esperado:

- `respond-action.ts`: sem mudanca funcional prevista nesta microetapa;
- `RequestActionCard.tsx` e `RequestDetailDialog.tsx`: sem delta de UX previsto;
- qualquer artefato de schema, migracao ou endpoint: fora do escopo.

---

## 6. Code Patterns

### Pattern 1: Gate server-side canonico em `requestAction`

```ts
import {
  assertCurrentStepActionConfigured,
  hasAnyActionBatchForCurrentStep,
} from '../action-helpers';

// ...

const actionDescription = assertCurrentStepActionConfigured(version, currentRequest);

if (hasAnyActionBatchForCurrentStep(currentRequest)) {
  throw new RuntimeError(
    RuntimeErrorCode.ACTION_REQUEST_ALREADY_OPEN,
    'A etapa atual ja possui uma action aberta ou encerrada e nao pode ser reaberta.',
    409,
  );
}
```

Notas:

- a checagem deve continuar dentro de `mutateWorkflowRequestAtomically(...)`;
- o predicado deve ser aplicado depois da validacao de permissao e da configuracao da etapa;
- nao muda `waiting_action`: o read model segue derivado de pendencias abertas.

### Pattern 2: Permissao simplificada em `detail.ts`

```ts
const canRequestAction =
  request.statusCategory === 'in_progress' &&
  isResponsible &&
  actionDescription.available &&
  !actionDescription.configurationError &&
  !hasAnyActionBatchForCurrentStep(request);
```

Notas:

- remover a combinacao redundante com `getCurrentPendingActionBatchEntries(request).length === 0`;
- a UI continua derivada; a fonte final de bloqueio segue sendo o backend.

### Pattern 3: Teste direto dos helpers estruturais de upload

```ts
import {
  assertAllowedWorkflowUploadPath,
  assertAttachmentUrlMatchesStoragePath,
  assertUploadIdMatchesFileName,
} from '@/lib/workflows/runtime/upload-storage';
import { RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

it('aceita path no namespace neutro oficial', () => {
  expect(
    assertAllowedWorkflowUploadPath(
      'Workflows/workflows_v2/uploads/action_response/financeiro/request_10/step_1/2026-04/upl_1-file.pdf',
    ),
  ).toBe(
    'Workflows/workflows_v2/uploads/action_response/financeiro/request_10/step_1/2026-04/upl_1-file.pdf',
  );
});

it('rejeita fileUrl inconsistente com storagePath', () => {
  expect(() =>
    assertAttachmentUrlMatchesStoragePath(
      'https://firebasestorage.googleapis.com/v0/b/app/o/Workflows%2Fworkflows_v2%2Fuploads%2Fform_field%2Fwf%2Ffield%2F2026-04%2Fupl_1-ok.pdf?alt=media',
      'Workflows/workflows_v2/uploads/form_field/wf/field/2026-04/upl_2-ok.pdf',
    ),
  ).toThrow(
    expect.objectContaining({ code: RuntimeErrorCode.ACTION_RESPONSE_INVALID }),
  );
});

it('rejeita uploadId que nao bate com o nome do arquivo', () => {
  expect(() =>
    assertUploadIdMatchesFileName(
      'upl_outro',
      'Workflows/workflows_v2/uploads/form_field/wf/field/2026-04/upl_1-ok.pdf',
    ),
  ).toThrow(
    expect.objectContaining({ code: RuntimeErrorCode.ACTION_RESPONSE_INVALID }),
  );
});
```

### Pattern 4: Regressao de batch encerrado em `requestAction`

```js
it('rejeita requestAction quando a etapa atual ja possui batch historico encerrado', async () => {
  repo.getWorkflowRequestByRequestId.mockResolvedValue({
    docId: 'doc-action-completed',
    data: buildRequest({
      requestId: 77,
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsavel',
      statusCategory: 'in_progress',
      currentStepId: 'stp_work',
      currentStepName: 'Em andamento',
      currentStatusKey: 'em_andamento',
      hasResponsible: true,
      actionRequests: [
        {
          actionRequestId: 'act_req_1',
          actionBatchId: 'act_batch_closed',
          stepId: 'stp_work',
          stepName: 'Em andamento',
          statusKey: 'em_andamento',
          type: 'approval',
          label: 'Aprovar etapa',
          recipientUserId: 'APR1',
          requestedByUserId: 'RESP1',
          requestedByName: 'Responsavel',
          requestedAt: { seconds: 1, nanoseconds: 0 },
          respondedAt: { seconds: 2, nanoseconds: 0 },
          respondedByUserId: 'APR1',
          respondedByName: 'Aprovador',
          status: 'approved',
        },
      ],
    }),
  });
  repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

  await expect(
    requestAction({
      requestId: 77,
      actorUserId: 'RESP1',
      actorName: 'Responsavel',
    }),
  ).rejects.toEqual(
    expect.objectContaining({
      code: RuntimeErrorCode.ACTION_REQUEST_ALREADY_OPEN,
    }),
  );
});
```

---

## 7. API Contract

Nenhum endpoint novo ou alterado.

Contrato funcional ajustado:

- `POST /api/workflows/runtime/requests/{requestId}/request-action`
  - continua respondendo conflito com `ACTION_REQUEST_ALREADY_OPEN`;
  - o conflito passa a cobrir:
    - batch pendente na etapa atual;
    - batch historico encerrado na etapa atual.

Exemplo de erro esperado:

```json
{
  "ok": false,
  "code": "ACTION_REQUEST_ALREADY_OPEN",
  "message": "A etapa atual ja possui uma action aberta ou encerrada e nao pode ser reaberta."
}
```

Nenhuma mudanca de payload para leitura, management ou respondAction.

---

## 8. Database Schema

Nenhuma mudanca no schema.

Firestore:

- nenhuma colecao nova;
- nenhum novo campo persistido;
- nenhum backfill.

Storage:

- nenhum rename;
- nenhuma migracao de objetos antigos;
- nenhum cleanup retroativo do prefixo legado.

Anotacao explicita desta microetapa:

- objetos sob `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...` permanecem onde estao;
- novos uploads continuam obrigatoriamente sob `Workflows/workflows_v2/uploads/...`;
- a correcao final protege contra regressao de novos uploads, nao contra a existencia de legado.

---

## 9. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `upload-storage.ts` | provar path neutro aceito, path fora do namespace rejeitado, `fileUrl` inconsistente rejeitado e `uploadId` incoerente rejeitado |
| `action-helpers.ts` via consumidores | provar que o predicado canonico bloqueia read-side e runtime da mesma forma |
| `detail.ts` | provar que `canRequestAction` fica `false` quando a etapa ja tem batch encerrado |

### Integration Tests

| Flow | Test |
|------|------|
| `requestAction` com batch pendente | continua falhando com `ACTION_REQUEST_ALREADY_OPEN` |
| `requestAction` com batch historico encerrado | novo teste de regressao para mesma resposta de conflito |
| `createSignedWorkflowUpload` | continua emitindo namespace neutro e nunca `Facilities e Suprimentos` |

### Acceptance Tests

```gherkin
GIVEN um chamado em andamento na etapa atual
AND a etapa ja teve um batch de action concluido
WHEN o responsavel chama requestAction novamente
THEN o backend responde ACTION_REQUEST_ALREADY_OPEN
AND nenhum novo batch e criado
```

```gherkin
GIVEN o detalhe oficial de um chamado com batch encerrado
WHEN o responsavel abre o card de action
THEN o batch encerrado continua visivel
AND canRequestAction permanece falso
```

```gherkin
GIVEN a suite de upload storage
WHEN um novo path de upload e gerado
THEN ele usa Workflows/workflows_v2/uploads
AND nao contem Facilities e Suprimentos
```

### Suggested Validation Command

```bash
npm test -- --runInBand \
  src/lib/workflows/runtime/__tests__/upload-storage.test.ts \
  src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js \
  src/lib/workflows/read/__tests__/detail.test.js
```

Se o build tocar mais suites por dependencia indireta, reaproveitar o comando expandido da microetapa anterior.

---

## 10. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter as mudancas em `request-action.ts`, `detail.ts` e testes desta microetapa | `requestAction` volta a aceitar reabertura apenas quando nao ha pendente; comportamento conhecido anterior restaurado |
| 2 | Confirmar que `upload-storage.ts` nao sofreu delta funcional inesperado | suites de upload continuam batendo com o namespace neutro implementado antes |
| 3 | Reexecutar as suites alvo da microetapa | testes de runtime/read-side retornam ao baseline anterior |

**Metodo rapido:** `git revert <commit-hash>`

Como esta microetapa nao altera schema nem dados, rollback e apenas de codigo.

---

## 11. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado para design
- [x] decisao de bloqueio server-side documentada
- [x] manifesto diferencia arquivos com delta e arquivos apenas validados
- [x] estrategia de testes diretos para helpers de upload definida
- [x] regra de nao migrar prefixo legado anotada explicitamente

### Post-Build

- [ ] `requestAction` usa o predicado canonico de batch para a etapa atual
- [ ] `detail.ts` removeu o guard redundante de `canRequestAction`
- [ ] `upload-storage.test.ts` cobre os tres helpers criticos diretamente
- [ ] existe teste de regressao para batch historico encerrado no backend
- [ ] uploads novos continuam sem `Facilities e Suprimentos`
- [ ] nenhum contrato de `completed` foi regredido em read/management

---

## 12. Specialist Instructions

### For `@firebase-specialist`

```markdown
Files to modify:
- src/lib/workflows/runtime/action-helpers.ts
- src/lib/workflows/runtime/use-cases/request-action.ts
- src/lib/workflows/read/detail.ts
- src/lib/workflows/runtime/__tests__/upload-storage.test.ts
- src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js
- src/lib/workflows/read/__tests__/detail.test.js

Files to verify with no change expected:
- src/lib/workflows/runtime/upload-storage.ts
- src/lib/workflows/read/types.ts
- src/lib/workflows/management/types.ts
- src/lib/workflows/management/api-client.ts

Key requirements:
- usar `hasAnyActionBatchForCurrentStep` como predicado canonico;
- manter `ACTION_REQUEST_ALREADY_OPEN` como codigo de conflito;
- nao alterar schema, endpoint nem semantica de `waiting_action`;
- nao reabrir discussao sobre migracao de Storage;
- reforcar que uploads novos continuam apenas no namespace neutro.
```

### Skill Handoff

```markdown
Next skill:
- `build` para implementar exatamente os deltas deste documento.

Use `iterate` apenas se, durante o build, surgir necessidade real de mudar:
- o codigo de erro escolhido;
- o contrato de tipos ja fechado para `completed`;
- a lista de arquivos com no-change expected.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | codex | Initial design for final post-build corrections of Fase 2D, covering server-side completed guard, canonical batch predicate, direct upload helper coverage and neutral namespace regression protection |
