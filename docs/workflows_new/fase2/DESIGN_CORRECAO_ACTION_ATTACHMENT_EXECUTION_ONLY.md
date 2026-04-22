# Design - Correcao de `attachmentRequired` para actions nao `execution`

## 1. Objetivo

Definir o desenho tecnico para restringir a regra de `attachmentRequired` a actions do tipo `execution`, eliminando o contrato invalido hoje aceito entre editor administrativo, persistencia de draft/publicacao e runtime operacional.

Documento de entrada:

- [DEFINE_CORRECAO_ACTION_ATTACHMENT_EXECUTION_ONLY.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/DEFINE_CORRECAO_ACTION_ATTACHMENT_EXECUTION_ONLY.md)

Contexto relacionado:

- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)
- [canonical-step-semantics.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts)
- [publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts)
- [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)
- [respond-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/respond-action.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-04-22` | `Low` | iteracao do design: adicao de teste unitario dedicado para `action-capabilities.ts` |
| `2026-04-22` | `Medium` | iteracao do design: saneamento removido de `canonicalizeVersionSteps()` e cobertura ampliada para read side / helper canonico |
| `2026-04-22` | `Medium` | criacao do design para normalizar `attachmentRequired` em editor, save, publish e runtime |

---

## 2. Escopo

### Incluido

- ocultar `Anexo obrigatorio` quando `step.action.type !== 'execution'`;
- resetar `attachmentRequired` para `false` ao trocar de `execution` para `approval` ou `acknowledgement`;
- normalizar drafts lidos do Firestore antes de hidratar o editor;
- normalizar save de draft para nao persistir `attachmentRequired = true` fora de `execution`;
- normalizar publicacao em passo explicito posterior a `canonicalizeVersionSteps()` para impedir que drafts legados publiquem versoes novas com contrato invalido;
- normalizar leitura do runtime para tratar `attachmentRequired` como `false` fora de `execution`;
- adicionar cobertura automatizada dos pontos de regressao, incluindo o read side consumido pela UI.

### Nao incluido

- migracao retroativa em massa de `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- redesenho do editor `/admin/request-config`;
- alteracao de semantica de `commentRequired`;
- alteracao do fluxo de upload alem da defesa ja existente;
- endurecimento obrigatorio de publish com erro bloqueante para legado ja persistido.

---

## 3. Estado Atual

Hoje a regra de anexo vaza em quatro pontos:

1. o editor preserva `attachmentRequired` ao trocar o tipo da action, porque o `setValue` reconstrui `step.action` reutilizando `currentAction?.attachmentRequired`;
2. o save serializa `attachmentRequired` sem filtrar pelo tipo da action;
3. a publicacao materializa `stepsById` canonicos, mas nao saneia a capability de anexo;
4. o runtime usa `describeCurrentStepAction()` e considera `step.action.attachmentRequired === true` para qualquer tipo de action.

Consequencia: um draft ou uma versao publicada podem carregar `attachmentRequired = true` em `approval`/`acknowledgement`, enquanto a operacao continua sem upload fora de `execution`.

---

## 4. Decisao Tecnica

A regra "anexo so existe em action `execution`" passa a ser uma invariante compartilhada, implementada em um helper puro reutilizavel por admin-config e runtime.

### Regra canonica

```text
Se action.type === execution:
  attachmentRequired = valor booleano configurado
  attachmentPlaceholder = valor atual, se existir

Se action.type === approval ou acknowledgement:
  attachmentRequired = false
  attachmentPlaceholder = ignorado no runtime
```

### Principios

- o editor impede nova configuracao invalida;
- o save elimina lixo semantico antes de persistir;
- o publish saneia drafts legados mesmo sem um save previo;
- o runtime continua defensivo para versoes historicas ja publicadas;
- nao havera migracao de dados neste escopo.

---

## 5. Arquitetura Proposta

```text
Admin Editor
  |
  | action.type change
  v
UI guard in WorkflowDraftStepsSection
  |-- mostra checkbox de anexo so para execution
  |-- reseta attachmentRequired=false ao sair de execution
  v
Draft serialization / hydration
  |-- normalizeActionAttachmentCapability(step.action)
  v
Draft saved in workflowTypes_v2/.../versions/{draft}
  |
  | publish
  v
Publication materialization
  |-- canonicalize step semantics
  |-- normalize attachment capability in explicit publish step
  v
Published version
  |
  | runtime read
  v
describeCurrentStepAction()
  |-- attachmentRequired=false fora de execution
  v
respond-action / operational UI remain coherent
```

---

## 6. ADRs

### ADR-ATT-001: capability de anexo deve viver em helper compartilhado

**Decisao**

Criar um helper puro para normalizar a configuracao de anexo de `StepActionDef` por tipo da action, reutilizado por admin-config e runtime.

**Motivo**

Hoje a mesma regra precisa existir em leitura de draft, save, publish e runtime. Duplicar `action.type === 'execution'` em todos os pontos aumenta risco de nova divergencia.

### ADR-ATT-002: publish deve sanear, nao bloquear

**Decisao**

Drafts legados com `attachmentRequired = true` em `approval`/`acknowledgement` nao devem falhar no publish por esse motivo; o publish deve normalizar `stepsById` em um passo explicito posterior a `canonicalizeVersionSteps()` e anterior ao `tx.update(versionRef, ...)`.

**Motivo**

O problema e de contrato tecnico, nao de decisao de negocio do usuario. Sanear no publish reduz atrito operacional e evita exigir um save manual apenas para limpar um dado legado.

### ADR-ATT-003: runtime defensivo em `action-helpers.ts`

**Decisao**

A defesa principal do runtime fica em `describeCurrentStepAction()`, nao em `respond-action.ts`.

**Motivo**

`action-helpers.ts` ja e a porta de entrada para descrever a action atual. Centralizar ali evita duplicacao entre pre-validacao e validacao dentro da transacao em `respond-action.ts`.

### ADR-ATT-004: `attachmentPlaceholder` nao sera limpo no draft neste escopo

**Decisao**

O design nao exige reset de `attachmentPlaceholder` ao sair de `execution`.

**Motivo**

O `DEFINE` classifica esse ponto como `COULD`. Limpar apenas `attachmentRequired` resolve o contrato invalido com impacto minimo. O placeholder permanecera semanticamente inofensivo porque o runtime o ignora fora de `execution`.

### ADR-ATT-005: `canonicalizeVersionSteps()` permanece estrutural

**Decisao**

`canonicalizeVersionSteps()` continua responsavel apenas por ordem, `statusKey`, `kind`, `stepsById` e demais invariantes estruturais da etapa, sem absorver o saneamento de capability de anexo.

**Motivo**

Essa funcao ja e reutilizada por outras leituras e validacoes de admin-config. Misturar saneamento de contrato operacional com canonicalizacao estrutural aumentaria o acoplamento e esconderia o dado bruto cedo demais para diagnostico, testes e evolucao futura.

---

## 7. Manifesto de Arquivos

### Novos

- `src/lib/workflows/runtime/action-capabilities.ts`
- `src/lib/workflows/runtime/__tests__/action-capabilities.test.ts`

Responsabilidade:

- expor helpers puros como `supportsActionAttachments(actionType)` e `normalizeActionAttachmentCapability(action)`.
- documentar por teste unitario direto o contrato do helper compartilhado e seus edge cases.

### Alterados

- `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx`
- `src/lib/workflows/admin-config/draft-repository.ts`
- `src/lib/workflows/admin-config/publication-service.ts`
- `src/lib/workflows/runtime/action-helpers.ts`
- `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx`
- `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts`
- `src/lib/workflows/admin-config/__tests__/publication-service.test.ts`
- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`
- `src/lib/workflows/read/__tests__/detail.test.js`

### Skills / agentes relevantes

- skill usada neste turno: `design`
- skill indicada para execucao posterior: `build`
- nenhum subagente adicional e necessario para a implementacao

---

## 8. Contrato por Camada

### 8.1 Editor

Arquivo principal: [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)

Comportamento proposto:

- `attachmentRequired` so aparece quando `actionType === 'execution'`;
- ao selecionar `approval` ou `acknowledgement`, o novo objeto `action` ja nasce com `attachmentRequired: false`;
- se a action atual era `execution` com `attachmentRequired: true`, a troca de tipo zera o flag no mesmo `setValue`;
- `commentRequired` continua visivel para todos os tipos suportados.

Observacao: o payload enviado por [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx) nao precisa mudar de shape; a regra sera garantida antes no form state e de forma autoritativa no backend.

### 8.2 Leitura de draft

Arquivo principal: [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)

Comportamento proposto:

- `normalizeRuntimeSteps(version)` passa a aplicar o helper de capability ao clonar `step.action`;
- drafts legados carregados no editor ja chegam com `attachmentRequired = false` fora de `execution`;
- isso evita que o form state esconda um valor `true` legado e o ressuscite ao alternar o tipo.

### 8.3 Save de draft

Arquivo principal: [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)

Comportamento proposto:

- `normalizeSteps(...)` aplica o helper ao montar `action`;
- `attachmentRequired` so pode ser persistido como `true` quando `action.type === 'execution'`;
- o shape externo de `SaveWorkflowDraftInput` permanece igual;
- nenhum schema novo e criado.

### 8.4 Publish

Arquivos principais:

- [publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts)

Comportamento proposto:

- `canonicalizeVersionSteps()` continua cuidando apenas da canonicalizacao estrutural das etapas;
- `publishDraftVersion()` aplica o helper de capability em um passo explicito sobre `canonicalVersion.stepsById` antes de persistir a versao publicada;
- drafts antigos podem ser publicados sem introduzir nova versao publicada inconsistente.

### 8.5 Runtime

Arquivo principal: [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)

Comportamento proposto:

- `describeCurrentStepAction()` aplica o helper antes de expor `attachmentRequired` e `attachmentPlaceholder`;
- para `approval` e `acknowledgement`, o retorno passa a ser sempre `attachmentRequired: false` e `attachmentPlaceholder: null`;
- [respond-action.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/respond-action.ts) permanece com a guarda explicita de upload apenas em `execution`.
- o read side que consome `describeCurrentStepAction()` herda a mesma invariante sem precisar duplicar a regra em [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts).

---

## 9. API / Contrato de Dados

Nao ha endpoint novo e nao ha mudanca de shape publico.

O contrato semantico passa a ser:

- `SaveWorkflowDraftInput.steps[*].action.attachmentRequired` continua aceito no payload;
- no servidor, esse campo so tem efeito quando `action.type === 'execution'`;
- em `WorkflowVersionV2.stepsById[*].action`, valores legados fora de `execution` serao saneados em novos saves/publicacoes;
- no runtime, versoes antigas continuam seguras porque o helper ignora o flag fora de `execution`.

### Invariantes finais

| superficie | regra |
| --- | --- |
| editor | nao renderizar checkbox de anexo fora de `execution` |
| form state | trocar para `approval`/`acknowledgement` implica `attachmentRequired = false` |
| save draft | nunca persistir `attachmentRequired = true` fora de `execution` |
| publish | nunca materializar versao publicada nova com `attachmentRequired = true` fora de `execution` |
| runtime/read side | nunca exigir nem expor capability efetiva de anexo fora de `execution` |

---

## 10. Code Patterns

### Helper compartilhado

```ts
export function supportsActionAttachments(actionType?: string | null): boolean {
  return actionType === 'execution';
}

export function normalizeActionAttachmentCapability<T extends StepActionDef | undefined>(
  action: T,
): T {
  if (!action) return action;
  if (action.type === 'execution') return action;

  return {
    ...action,
    attachmentRequired: false,
  } as T;
}
```

### Uso no editor

```ts
const supportsAttachments = actionType === 'execution';

attachmentRequired: supportsAttachments
  ? currentAction?.attachmentRequired ?? false
  : false
```

### Uso no runtime

```ts
const normalizedAction = normalizeActionAttachmentCapability(step.action);

attachmentRequired: normalizedAction.attachmentRequired === true
attachmentPlaceholder:
  normalizedAction.type === 'execution'
    ? normalizedAction.attachmentPlaceholder?.trim() || null
    : null
```

### Uso no publish

```ts
const canonicalVersion = canonicalizeVersionSteps(version);

const normalizedStepsById = Object.fromEntries(
  Object.entries(canonicalVersion.stepsById).map(([stepId, step]) => [
    stepId,
    {
      ...step,
      action: normalizeActionAttachmentCapability(step.action),
    },
  ]),
);
```

---

## 11. Estrategia de Implementacao

1. criar helper compartilhado de capability;
2. aplicar no editor para renderizacao e reset imediato;
3. aplicar em `normalizeRuntimeSteps()` e `normalizeSteps()` no repositorio de draft;
4. aplicar no `publication-service.ts` em passo explicito posterior a `canonicalizeVersionSteps()` para cobrir publish de legado;
5. aplicar em `describeCurrentStepAction()` para defesa de runtime e read side;
6. adicionar teste unitario direto para `action-capabilities.ts`;
7. adicionar testes de UI, save, publish, read side e runtime.

---

## 12. Testing Strategy

### Helper compartilhado

Arquivo: [action-capabilities.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/__tests__/action-capabilities.test.ts)

Adicionar cenarios para:

- `normalizeActionAttachmentCapability(undefined)` retornar `undefined`;
- `supportsActionAttachments('execution')` retornar `true`;
- `supportsActionAttachments('approval')` e `supportsActionAttachments('acknowledgement')` retornarem `false`;
- `normalizeActionAttachmentCapability()` manter action `execution` inalterada;
- `normalizeActionAttachmentCapability()` forcar `attachmentRequired: false` fora de `execution`;
- comportamento defensivo para tipo invalido ou nulo, tratando a capability de anexo como desabilitada.

### Editor

Arquivo: [WorkflowDraftStepsSection.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx)

Adicionar cenarios para:

- mostrar `Anexo obrigatorio` apenas em `execution`;
- esconder o checkbox em `approval` e `acknowledgement`;
- trocar `execution -> approval` e verificar `attachmentRequired` resetado para `false`;
- criar action a partir de `none` em `approval` e garantir que o flag nasce `false`.

### Persistencia

Arquivo: [draft-repository.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/__tests__/draft-repository.test.ts)

Adicionar cenarios para:

- `saveWorkflowDraft()` gravar `attachmentRequired: false` quando o input trouxer `approval` com flag `true`;
- `getWorkflowDraftEditorData()` hidratar draft legado `approval + attachmentRequired=true` como `false`.

### Publicacao

Arquivo: [publication-service.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/__tests__/publication-service.test.ts)

Adicionar cenario para:

- publicar draft legado com `approval + attachmentRequired=true` e verificar que `stepsById` publicado recebe `attachmentRequired: false`.

### Read side

Arquivo: [detail.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/detail.test.js)

Adicionar cenarios para:

- `buildWorkflowRequestDetail()` expor `attachmentRequired: false` para `approval` legado com `attachmentRequired=true`;
- `buildWorkflowRequestDetail()` expor `attachmentPlaceholder: null` fora de `execution`;
- manter `attachmentRequired` e `attachmentPlaceholder` quando a action for `execution`.

### Runtime

Arquivo: [runtime-use-cases.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js)

Adicionar cenarios para:

- `respondAction()` nao exigir anexo em `approval` legado com `attachmentRequired=true`;
- manter obrigatoriedade de anexo em `execution` quando `attachmentRequired=true`;
- continuar rejeitando upload em action nao `execution`.

---

## 13. Riscos e Mitigacoes

### Risco 1: regra duplicada continuar divergente

Mitigacao:

- helper compartilhado unico;
- testes em quatro camadas.

### Risco 2: draft legado ser publicado sem save e continuar invalido

Mitigacao:

- saneamento explicito em `publication-service.ts` depois da canonicalizacao estrutural.

### Risco 3: regressao em UX ao alternar tipo da action

Mitigacao:

- teste explicito de reset ao trocar `execution -> approval` e `execution -> acknowledgement`.

### Risco 4: comportamento inesperado por limpar placeholder

Mitigacao:

- placeholder de anexo nao sera limpo neste escopo;
- runtime o ignora fora de `execution`.

---

## 14. Rollout Plan

1. implementar helper compartilhado;
2. subir testes unitarios das camadas tocadas;
3. validar manualmente no editor:
   - criar `execution` com anexo obrigatorio;
   - trocar para `approval`;
   - salvar;
   - publicar;
   - responder action operacional;
4. monitorar drafts regravados e novas publicacoes de workflows v2.

---

## 15. Rollback Plan

Se a mudanca causar regressao:

1. reverter o helper compartilhado e os call sites de editor/admin/runtime;
2. manter apenas a guarda existente em `respond-action.ts` de upload exclusivo para `execution`;
3. reexecutar a suite de admin-config e runtime para confirmar retorno ao comportamento anterior.

Como nao ha migracao nem alteracao de schema, o rollback e apenas de codigo.
