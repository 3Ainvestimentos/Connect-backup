# DESIGN: Correcoes Pos-Build da Regra canonica de etapas no Config. de Chamados V2

> Generated: 2026-04-16
> Status: Ready for build
> Scope: Fase 2 / microetapa corretiva para fechar integridade, contrato e cobertura apos o build da regra canonica de etapas no Config. de Chamados V2
> Base document: `DEFINE_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`
> Parent design: `DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`

## 1. Objetivo

Fechar os achados remanescentes da regra canonica sem reabrir a arquitetura macro da feature, preservando o modelo `start -> work(s) -> final` e eliminando os pontos onde o repositorio ainda:

- corrige drafts malformados silenciosamente durante `canonicalizeVersionSteps()`;
- expone no `publishReadiness` erros de steps que o fluxo suportado nao permite mais produzir;
- mantem `initialStepId` como parte do contrato editavel do form, apesar de ele ja ser derivado no backend;
- depende apenas de cobertura indireta para o helper central de semantica canonica.

Esta microetapa cobre:

- preservacao explicita de `stepOrder` inconsistente ate a validacao bloqueante;
- simplificacao da taxonomia visivel de issues de `steps` em `publishReadiness`;
- limpeza do contrato do editor e do payload de save para remover `initialStepId` da borda editavel;
- criacao de suite unitaria dedicada para `canonical-step-semantics.ts`;
- alinhamento dos testes existentes com o contrato final.

Esta microetapa nao cobre:

- qualquer mudanca nova na regra principal `start -> work(s) -> final`;
- mudancas de UX alem da remocao do estado tecnico morto;
- alteracao de endpoints, colecoes ou schema persistido;
- migracao retroativa de drafts antigos;
- refatoracao do runtime alem do necessario para continuar lendo os campos canonicos publicados.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md)
- [DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md)
- [canonical-step-semantics.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts)
- [publishability.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts)
- [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)
- [publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/api-client.ts)
- [editor/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/types.ts)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [publishability.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/__tests__/publishability.test.ts)
- [draft-repository.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/__tests__/draft-repository.test.ts)
- [WorkflowDraftEditorPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` para escopo e aceite;
2. depois prevalece o design pai da regra canonica;
3. depois prevalece a implementacao real do admin-config/runtime ja entregue;
4. depois prevalece este documento para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo ja faz corretamente

- o editor ja trata `statusKey` e `kind` como semantica derivada read-only em [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx);
- o save de draft ja usa [canonicalizeSteps()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts) para recalcular `statusKey`, `kind` e `initialStepId` a partir da ordem visual enviada;
- a publicacao ja reaplica [canonicalizeVersionSteps()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts) antes de promover a versao;
- o runtime continua operando sobre `initialStepId`, `kind` e `statusKey` canonicos sem exigir nova mudanca de protocolo.

### 3.2. Lacunas objetivas observadas no codigo atual

- [canonicalizeVersionSteps()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts) faz `map(stepOrder -> stepsById[stepId]).filter(Boolean)`, o que elimina referencias ausentes antes da validacao e encurta `stepOrder` silenciosamente;
- [evaluatePublishability()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts) roda sobre a versao ja canonicalizada, entao `STEP_ORDER_REFERENCES_UNKNOWN_STEP` deixa de ser observavel nos casos em que a ordem foi "curada";
- o mesmo `publishability.ts` ainda expoe checks herdados da taxonomia antiga de steps (`MISSING_START_STEP`, `MULTIPLE_START_STEPS`, `MISSING_FINAL_STEP`, `MISSING_WORK_STEP`, `INVALID_START_STEP`, `INVALID_FINAL_STEP`, `INVALID_INTERMEDIATE_STEP`, `INVALID_INITIAL_STEP`) que viraram irrelevantes ou redundantes no fluxo suportado;
- [WorkflowDraftFormValues](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/types.ts) ainda carrega `initialStepId`, e [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx) continua resetando e reenviando esse valor no payload de save;
- [SaveWorkflowDraftInput](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/types.ts) ainda trata `initialStepId` como campo de entrada do cliente;
- nao existe suite dedicada para provar diretamente os invariantes do helper em `0`, `1`, `2`, `3` e `4+` etapas.

### 3.3. Invariantes que esta microetapa precisa preservar

- `canonicalizeSteps()` continua sendo o caminho do save quando a origem e o array de steps do editor;
- a versao publicada valida continua materializando `initialStepId = primeiro step da ordem`, `statusKey` e `kind` canonicos;
- o backend continua sendo a fonte de verdade para bloquear drafts estruturais invalidos;
- o DTO de leitura do editor pode continuar expondo `draft.initialStepId` como metadado derivado, mas ele nao volta a ser decisao do cliente;
- nenhuma nova compatibilidade retroativa sera adicionada para drafts malformados.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin user
  |
  +--> WorkflowDraftEditorPage
  |      |
  |      +--> form values = general + access + fields + steps
  |      |      \- sem initialStepId editavel
  |      |
  |      \--> PUT saveWorkflowDraft
  |              |
  |              \--> draft-repository.normalizeSteps()
  |                       \--> canonicalizeSteps(steps[])
  |                              |- deriva statusKey/kind por indice
  |                              \- deriva initialStepId = primeiro step
  |
  +--> GET editor / GET catalog
  |      |
  |      \--> evaluatePublishability(version)
  |              |
  |              +--> inspectVersionStepOrder(version)
  |              |      |- detecta ids ausentes na ordem
  |              |      |- detecta duplicidade na ordem
  |              |      \- decide se a estrutura pode ser canonicalizada
  |              |
  |              \--> canonicalizeVersionSteps(version)
  |                     |- preserva stepOrder bruto quando ha erro estrutural
  |                     \- canonicaliza apenas quando a ordem e consistente
  |
  \--> POST publishDraftVersion
         |
         +--> evaluatePublishability(version bruto)
         |      \- falha explicitamente se houver erro estrutural
         |
         \--> canonicalizeVersionSteps(version valido)
                \- persiste shape canonico na promocao

Runtime v2
  |
  +--> open-request => usa initialStepId persistido
  +--> assign-responsible => usa primeira etapa work
  +--> advance-step => segue stepOrder persistido
  \--> finalize-request => usa etapa final
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 - Editor
1. O form continua editando apenas general, access, fields e steps.
2. initialStepId deixa de existir em WorkflowDraftFormValues.
3. O submit envia apenas steps e action; o servidor continua derivando o resto.

LAYER 2 - Save permissivo
4. normalizeSteps() continua recebendo o array ordenado do editor.
5. canonicalizeSteps() continua gerando stepsById, stepOrder e initialStepId canonicos.
6. O save permanece tolerante a payload legado, mas ignora/removera initialStepId da borda oficial.

LAYER 3 - Readiness
7. evaluatePublishability() primeiro inspeciona a integridade estrutural da ordem bruta.
8. Se stepOrder tiver ids ausentes ou duplicados, os issues sao emitidos sem "healing".
9. So depois de uma ordem estruturalmente valida a versao e canonicalizada para checks restantes.
10. Os checks visiveis de steps ficam restritos ao que o usuario ainda pode produzir no fluxo suportado.

LAYER 4 - Publicacao
11. publishDraftVersion() avalia readiness usando o draft bruto carregado do Firestore.
12. Se houver bloqueio estrutural, a publicacao falha sem reescrever stepOrder.
13. Apenas drafts validos passam por canonicalizeVersionSteps() e sao promovidos com campos canonicos.

LAYER 5 - Testes
14. canonical-step-semantics ganha suite propria.
15. publishability deixa de testar ausencia/presenca de checks mortos.
16. editor e draft-repository passam a provar que initialStepId saiu do contrato de save, mas segue derivado no servidor.
```

### 4.3. Estrategia exata para preservar `stepOrder` inconsistente sem healing silencioso

O helper de semantica canonica passa a separar duas responsabilidades:

1. inspecao estrutural da ordem;
2. canonicalizacao dos campos tecnicos.

Proposta fechada:

- adicionar em [canonical-step-semantics.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/canonical-step-semantics.ts) um helper puro de inspecao, por exemplo `inspectVersionStepOrder(version)`, retornando:
  - `stepOrder`
  - `orderedExistingSteps`
  - `missingStepIds`
  - `duplicateStepIds`
  - `isStructurallyValid`
- `canonicalizeVersionSteps()` passa a usar essa inspecao:
  - se `isStructurallyValid === false`, retorna uma copia defensiva do shape bruto, preservando `stepOrder` e `stepsById` sem filtrar ids ausentes nem recalcular `initialStepId`;
  - se `isStructurallyValid === true`, canonicaliza os steps existentes pela ordem e persiste `initialStepId = stepOrder[0]`.

Consequencia desejada:

- o helper deixa de "encurtar" drafts malformados;
- `evaluatePublishability()` e `publishDraftVersion()` passam a enxergar exatamente o erro estrutural produzido pelo draft;
- a canonicalizacao continua sendo a fonte de verdade para drafts validos.

### 4.4. Taxonomia final de `publishReadiness` para steps

`publishReadiness` deixa de expor issues de steps dependentes de `kind/statusKey` manual, porque esses campos nao fazem mais parte do fluxo editavel suportado.

Codes visiveis de `steps` apos a correcao:

| Code | Quando aparece | Mantem |
|------|----------------|--------|
| `MISSING_STEPS` | `stepOrder` vazio ou `stepsById` vazio | sim |
| `DUPLICATE_STEP_ORDER` | ids repetidos em `stepOrder` | sim |
| `STEP_ORDER_REFERENCES_UNKNOWN_STEP` | `stepOrder` aponta para id ausente em `stepsById` | sim |
| `INSUFFICIENT_STEPS` | quantidade de etapas menor que `3` | sim |

Codes removidos do contrato visivel:

| Code | Motivo da remocao |
|------|-------------------|
| `INVALID_INITIAL_STEP` | virou detalhe derivado/interno, nao decisao de UX |
| `MISSING_START_STEP` | redundante com canonicalizacao e `INSUFFICIENT_STEPS` |
| `MULTIPLE_START_STEPS` | impossivel no fluxo canonico derivado |
| `MISSING_FINAL_STEP` | redundante com canonicalizacao e `INSUFFICIENT_STEPS` |
| `MISSING_WORK_STEP` | redundante quando o canon exige `3+` etapas |
| `INVALID_START_STEP` | morto apos canonicalizacao dos drafts validos |
| `INVALID_FINAL_STEP` | morto apos canonicalizacao dos drafts validos |
| `INVALID_INTERMEDIATE_STEP` | morto apos canonicalizacao dos drafts validos |

Checks de `actions` permanecem:

- `ACTION_WITHOUT_APPROVERS`
- `DUPLICATE_ACTION_APPROVER`
- `UNKNOWN_ACTION_APPROVER`
- `UNRESOLVED_ACTION_APPROVERS` continua sendo issue complementar no DTO do editor

### 4.5. Regra de ordem de validacao

Para evitar ruido e redundancia, a validacao passa a seguir esta ordem:

1. validar metadados gerais e fields como hoje;
2. validar estrutura bruta de steps:
   - existe ao menos uma etapa?
   - `stepOrder` tem ids duplicados?
   - `stepOrder` referencia ids ausentes?
   - existem ao menos `3` etapas?
3. somente se a estrutura de steps estiver consistente:
   - canonicalizar a versao;
   - validar `actions` contra colaboradores;
   - reutilizar o shape canonicalizado para publicacao.

Isso impede que um draft com `stepOrder` malformado receba erros derivados de um estado que o sistema acabou de "corrigir" por baixo dos panos.

---

## 5. Architecture Decisions

### ADR-CANON-FIX-001: integridade estrutural da ordem antecede canonicalizacao de versao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O helper atual remove ids ausentes de `stepOrder` antes da validacao, o que mascara drafts malformados. |

**Choice:** introduzir uma inspecao estrutural explicita e fazer `canonicalizeVersionSteps()` preservar o shape bruto quando a ordem estiver inconsistente.

**Rationale:**

1. impede efeito corretivo silencioso na publicacao;
2. torna `STEP_ORDER_REFERENCES_UNKNOWN_STEP` novamente observavel;
3. mantem a canonicalizacao como etapa posterior, nao como mutacao corretiva precoce.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter `filter(Boolean)` e confiar so em testes | perpetua o problema central do DEFINE |
| mover todo o bloqueio apenas para `publishDraftVersion()` | deixaria catalogo/editor mostrando readiness enganoso |
| reconstruir automaticamente `stepOrder` a partir de `stepsById` | seria healing silencioso do mesmo jeito |

### ADR-CANON-FIX-002: `publishReadiness` exibe apenas erros de steps ainda alcancaveis pela UX suportada

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O readiness ainda mostra taxonomia herdada de um modelo onde `kind`, `statusKey` e `initialStepId` podiam ser configurados manualmente. |

**Choice:** reduzir o contrato visivel de `steps` para ordem vazia, ids duplicados, ids ausentes e quantidade insuficiente.

**Rationale:**

1. reduz ruido cognitivo;
2. alinha o readiness ao que o editor realmente permite produzir;
3. separa checks de UX de asserts tecnicas internas.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter todos os codes antigos por "defesa" | mistura estado morto com erro real e torna o painel menos confiavel |
| remover tambem `DUPLICATE_STEP_ORDER` | ainda e um erro estrutural legitimo em drafts malformados/importados |

### ADR-CANON-FIX-003: `initialStepId` sai do contrato editavel, mas permanece no DTO de leitura e no persistido

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O editor nao exibe mais a escolha manual, mas o form ainda transporta `initialStepId` e o reenvia no save. |

**Choice:** remover `initialStepId` de `WorkflowDraftFormValues` e `SaveWorkflowDraftInput`, mantendo `draft.initialStepId` apenas como metadado derivado do backend.

**Rationale:**

1. elimina estado tecnico morto;
2. evita sugerir que o cliente decide a etapa inicial;
3. preserva compatibilidade do DTO de leitura com runtime/catalogo existentes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| remover `initialStepId` de todos os DTOs imediatamente | cria delta desnecessario em leitura, sem ganho funcional proporcional |
| manter `initialStepId` no save como campo ignorado | perpetua ambiguidade de contrato e testes frouxos |

---

## 6. File Manifest

| File | Papel na microetapa | Agente/skill recomendado | Acao |
|------|----------------------|--------------------------|------|
| `src/lib/workflows/admin-config/canonical-step-semantics.ts` | separar inspecao estrutural da canonicalizacao e impedir healing silencioso | `build` | modify |
| `src/lib/workflows/admin-config/draft-repository.ts` | refletir no parser/repositorio que `initialStepId` saiu do contrato de save do cliente | `build` | modify |
| `src/lib/workflows/admin-config/publishability.ts` | simplificar taxonomia de `steps` e mudar a ordem de validacao | `build` | modify |
| `src/lib/workflows/admin-config/publication-service.ts` | garantir publicacao em cima do draft bruto validado e canonicalizacao apenas apos readiness passar | `build` | modify |
| `src/lib/workflows/admin-config/types.ts` | remover `initialStepId` de `SaveWorkflowDraftInput` e manter DTO read-only coerente | `build` | modify |
| `src/components/workflows/admin-config/editor/types.ts` | remover `initialStepId` de `WorkflowDraftFormValues` | `build` | modify |
| `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | parar de resetar e reenviar `initialStepId` no form/payload | `build` | modify |
| `src/lib/workflows/admin-config/api-client.ts` | refletir o novo contrato de save sem `initialStepId` | `build` | modify |
| `src/lib/workflows/admin-config/__tests__/canonical-step-semantics.test.ts` | cobrir helper central diretamente | `build` | add |
| `src/lib/workflows/admin-config/__tests__/publishability.test.ts` | alinhar asserts ao readiness final | `build` | modify |
| `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts` | provar derivacao de `initialStepId` sem entrada do cliente | `build` | modify |
| `src/lib/workflows/admin-config/__tests__/publication-service.test.ts` | provar que o ultimo gate de publish bloqueia `stepOrder` malformado sem healing silencioso | `build` | add |
| `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | provar payload de save sem `initialStepId` | `build` | modify |

Arquivos usados apenas como referencia:

- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [draft-readiness.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-readiness.ts)

---

## 7. Contratos e Patterns

### 7.1. Contrato HTTP final do save de draft

Endpoint:

- `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Request body apos a correcao:

```ts
type SaveWorkflowDraftInput = {
  general: {
    name: string;
    description: string;
    icon: string;
    ownerUserId: string;
    defaultSlaDays: number;
    activeOnPublish: boolean;
  };
  access: {
    mode: 'all' | 'specific';
    allowedUserIds: string[];
  };
  fields: Array<Partial<VersionFieldDef>>;
  steps: Array<{
    stepId?: string;
    stepName?: string;
    action?: {
      type?: 'approval' | 'acknowledgement' | 'execution';
      label?: string;
      approverCollaboratorDocIds?: string[];
      unresolvedApproverIds?: string[];
      commentRequired?: boolean;
      attachmentRequired?: boolean;
      commentPlaceholder?: string;
      attachmentPlaceholder?: string;
    };
  }>;
};
```

Resposta:

- sem mudanca funcional;
- `publishReadiness` continua retornando os bloqueios calculados no backend.

Leitura do editor:

- `GET` do editor continua podendo devolver `draft.initialStepId` como valor derivado/read-only;
- o form nao o inclui mais em `defaultValues`, `reset()` nem submit.

### 7.2. Pattern do helper estrutural

```ts
type StepOrderInspection = {
  stepOrder: string[];
  orderedExistingSteps: StepDef[];
  missingStepIds: string[];
  duplicateStepIds: string[];
  isStructurallyValid: boolean;
};

export function inspectVersionStepOrder(version: Pick<WorkflowVersionV2, 'stepOrder' | 'stepsById'>): StepOrderInspection {
  const stepOrder = Array.isArray(version.stepOrder) ? [...version.stepOrder] : [];
  const stepsById = version.stepsById || {};
  const seen = new Set<string>();
  const duplicateStepIds: string[] = [];
  const missingStepIds: string[] = [];
  const orderedExistingSteps: StepDef[] = [];

  stepOrder.forEach((stepId) => {
    if (seen.has(stepId)) {
      duplicateStepIds.push(stepId);
      return;
    }

    seen.add(stepId);
    const step = stepsById[stepId];
    if (!step) {
      missingStepIds.push(stepId);
      return;
    }

    orderedExistingSteps.push(cloneStep(step));
  });

  return {
    stepOrder,
    orderedExistingSteps,
    missingStepIds,
    duplicateStepIds,
    isStructurallyValid: duplicateStepIds.length === 0 && missingStepIds.length === 0,
  };
}
```

### 7.3. Pattern da canonicalizacao sem healing

```ts
export function canonicalizeVersionSteps(version: TVersion): TVersion {
  const inspection = inspectVersionStepOrder(version);

  if (!inspection.isStructurallyValid) {
    return {
      ...version,
      stepOrder: [...inspection.stepOrder],
      stepsById: cloneStepsById(version.stepsById || {}),
      initialStepId: typeof version.initialStepId === 'string' ? version.initialStepId : '',
    };
  }

  const canonical = canonicalizeSteps(
    inspection.orderedExistingSteps.map((step) => ({
      stepId: step.stepId,
      stepName: step.stepName,
      action: cloneAction(step.action),
    })),
  );

  return {
    ...version,
    stepOrder: [...canonical.stepOrder],
    stepsById: canonical.stepsById,
    initialStepId: canonical.initialStepId,
  };
}
```

### 7.4. Pattern do readiness com short-circuit estrutural

```ts
const inspection = inspectVersionStepOrder(input.version);

if (Object.keys(input.version.stepsById || {}).length === 0 || inspection.stepOrder.length === 0) {
  pushIssue(issues, { code: 'MISSING_STEPS', category: 'steps', path: 'steps', message: 'Defina ao menos uma etapa antes de publicar.' });
}

if (inspection.duplicateStepIds.length > 0) {
  pushIssue(issues, { code: 'DUPLICATE_STEP_ORDER', category: 'steps', path: 'steps', message: 'A ordem das etapas contem ids duplicados.' });
}

if (inspection.missingStepIds.length > 0) {
  pushIssue(issues, { code: 'STEP_ORDER_REFERENCES_UNKNOWN_STEP', category: 'steps', path: 'steps', message: 'A ordem das etapas referencia ids ausentes.' });
}

if (inspection.stepOrder.length > 0 && inspection.stepOrder.length < 3) {
  pushIssue(issues, { code: 'INSUFFICIENT_STEPS', category: 'steps', path: 'steps', message: 'Defina ao menos 3 etapas para publicar: inicial, intermediaria e final.' });
}

if (!hasBlockingStepStructureIssues(issues)) {
  const canonicalVersion = canonicalizeVersionSteps(input.version);
  validateActionRules(canonicalVersion.stepsById, canonicalVersion.stepOrder, collaborators, issues);
}
```

### 7.5. Pattern do editor sem `initialStepId`

```ts
function buildDefaultValues(): WorkflowDraftFormValues {
  return {
    general: { ... },
    access: { ... },
    fields: [],
    steps: [],
  };
}

form.reset({
  general: draft.general,
  access: draft.access,
  fields: draft.fields,
  steps: draft.steps,
});

const payload: SaveWorkflowDraftInput = {
  general: { ...values.general },
  access: { ...values.access },
  fields: values.fields,
  steps: values.steps.map(serializeStep),
};
```

---

## 8. Testing Strategy

### 8.1. Nova suite unitaria de `canonical-step-semantics`

Criar [canonical-step-semantics.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/__tests__/canonical-step-semantics.test.ts) cobrindo no minimo:

1. `deriveCanonicalSemantics()` para:
   - `0/1` step
   - `2` steps
   - `3` steps
   - `4+` steps
2. `canonicalizeSteps()` preservando:
   - `stepId`
   - `stepName`
   - `action`
   - ordem original
3. `canonicalizeVersionSteps()` quando:
   - a ordem e valida e deve materializar `initialStepId` canonico;
   - `stepOrder` contem id ausente e nao pode ser encurtado;
   - `stepOrder` contem duplicidade e deve ser preservado para validacao posterior.

### 8.2. Ajustes em `publishability.test.ts`

Cobrir explicitamente:

- draft com `stepOrder` apontando para id ausente retorna `STEP_ORDER_REFERENCES_UNKNOWN_STEP`;
- draft com `stepOrder` duplicado retorna `DUPLICATE_STEP_ORDER`;
- draft com menos de `3` etapas continua retornando `INSUFFICIENT_STEPS`;
- drafts canonicos com `3` ou `4` etapas nao dependem mais de asserts sobre `INVALID_INTERMEDIATE_STEP`, `MISSING_WORK_STEP` ou outros codes mortos;
- validacoes de `action` permanecem ativas.

### 8.3. Ajustes em `draft-repository.test.ts`

Cobrir:

- `saveWorkflowDraft()` continua derivando `initialStepId` pelo primeiro step salvo;
- o teste nao envia mais `initialStepId` no input;
- a persistencia continua gravando `initialStepId`, `stepOrder` e `stepsById` canonicos;
- regressao opcional: draft salvo com steps validos e depois adulterado manualmente no Firestore segue sendo bloqueado no publish.

### 8.4. Ajustes em `publication-service.test.ts`

Adicionar suite dedicada para provar o ultimo gate de publicacao:

- `publishDraftVersion()` falha explicitamente quando `stepOrder` aponta para `stepId` ausente;
- o publish nao encurta `stepOrder` nem materializa uma versao "curada" silenciosamente;
- drafts validos continuam publicando com `stepsById`, `stepOrder` e `initialStepId` canonicos.

### 8.5. Ajustes em `WorkflowDraftEditorPage.test.tsx`

Cobrir:

- `form.reset()` nao depende de `draft.initialStepId`;
- `mutateAsync` recebe payload sem `initialStepId`;
- shell do editor segue renderizando readiness e CTA de save/publicacao sem regressao.

### 8.6. Suite minima para rodar no build

- `src/lib/workflows/admin-config/__tests__/canonical-step-semantics.test.ts`
- `src/lib/workflows/admin-config/__tests__/publishability.test.ts`
- `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts`
- `src/lib/workflows/admin-config/__tests__/publication-service.test.ts`
- `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx`

---

## 9. Rollout e Rollback

### 9.1. Rollout

Ordem recomendada de implementacao:

1. ajustar helper e publishability;
2. ajustar tipos e editor;
3. atualizar testes;
4. validar suites do admin-config.

Nao ha dependencia de feature flag nem mudanca de dados persistidos.

### 9.2. Rollback

Se a correcao gerar regressao inesperada:

1. restaurar `canonical-step-semantics.ts`, `publishability.ts` e o contrato de save anterior no mesmo deploy;
2. manter os dados ja persistidos, porque nao ha migracao nem mutacao destrutiva de schema;
3. reabrir apenas se a regressao estiver em compatibilidade de payload legado, nao na regra canonica principal.

Risco residual principal do rollback:

- voltar a aceitar healing silencioso de drafts malformados e recuperar o ruido antigo do readiness.

---

## 10. Aceite de Build

O build desta microetapa sera considerado completo quando:

1. `canonicalizeVersionSteps()` nao remover mais referencias ausentes ou duplicadas de `stepOrder`;
2. um draft com `stepOrder` inconsistente falhar explicitamente no readiness e no publish;
3. `publishReadiness` de `steps` ficar reduzido ao contrato final descrito neste documento;
4. `WorkflowDraftFormValues` e `SaveWorkflowDraftInput` deixarem de carregar `initialStepId`;
5. o editor parar de reenviar `initialStepId` no save;
6. existir suite dedicada cobrindo `canonical-step-semantics.ts`;
7. os testes de publishability e editor forem atualizados para o contrato final sem asserts vacuos.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex | Initial design for the post-build corrections of canonical step semantics, covering structural validation, readiness simplification, editor contract cleanup and direct helper coverage |
| 1.1 | 2026-04-16 | Codex | Added `draft-repository.ts` to the file manifest to match the save-contract cleanup and expanded the testing strategy with a dedicated publish-path suite for malformed `stepOrder` blocking |
