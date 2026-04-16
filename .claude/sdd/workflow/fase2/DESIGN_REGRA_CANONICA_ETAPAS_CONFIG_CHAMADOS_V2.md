# DESIGN: Regra canonica de etapas no Config. de Chamados V2

> Generated: 2026-04-16
> Status: Ready for build
> Scope: Fase 2 / correcao de invariantes canonicas do editor, save e publicacao de etapas no Config. de Chamados V2
> Base document: `DEFINE_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md`
> Depends on: `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`, `DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md`

## 1. Objetivo

Fechar a regra canonica de etapas do configurador admin v2 para que `statusKey`, `kind` e `initialStepId` deixem de ser decisao do cliente e passem a ser derivacoes deterministicas por posicao da etapa.

Esta microetapa cobre:

- remover a edicao manual de `statusKey`, `kind` e `initialStepId` da UX do editor;
- normalizar `stepsById`, `stepOrder` e `initialStepId` no backend de save;
- recalcular a mesma derivacao no caminho de publicacao para blindar o contrato administrativo;
- substituir a regra antiga de unicidade de `statusKey` por validacao compativel com varias etapas `work`;
- alinhar catalogo, readiness, historico e adapters que ainda tratam `currentStatusKey` como label humano de etapa;
- expandir a cobertura automatizada de admin-config, publishability e runtime.

Esta microetapa nao cobre:

- reduzir o modelo a exatamente `3` etapas;
- mudar o protocolo funcional de `requestAction` / `respondAction`;
- criar migracao retroativa de todos os drafts legados;
- redesenhar toda a tela do editor alem do necessario para esconder os campos tecnicos;
- criar nova taxonomia de status fora do trio canonico `solicitacao_aberta`, `em_andamento`, `finalizado`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md)
- [DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md)
- [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)
- [publishability.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts)
- [publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts)
- [catalog.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/catalog.ts)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [engine.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/engine.ts)
- [open-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/open-request.ts)
- [assign-responsible.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/assign-responsible.ts)
- [finalize-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts)
- [history-v2.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/history-v2.ts)
- [V2HistoryDetailView.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/V2HistoryDetailView.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` para escopo e aceite;
2. depois prevalecem os designs da `2E.2` e `2E.3` para shell, save permissivo e publicacao atomica;
3. depois prevalece a implementacao real do runtime v2 como restricao operacional;
4. depois prevalece este documento para orientar o build.

---

## 3. Estado Atual e Delta da Correcao

### 3.1. O que o repositorio faz hoje

- o editor ainda envia `steps[].statusKey`, `steps[].kind` e `initialStepId` no payload de save;
- o componente [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx) ainda expoe `Status key`, `Kind` e checkbox de etapa inicial como controles editaveis;
- [saveWorkflowDraft()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts) normaliza `statusKey` e `kind` a partir do proprio payload do cliente e aceita `initialStepId` arbitrario, apenas fazendo fallback para o primeiro step se o id vier invalido;
- [evaluatePublishability()](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts) ainda bloqueia `statusKey` duplicado, o que invalida drafts legitimos com varias etapas intermediarias;
- o runtime operacional ja depende de:
  - `open-request` usar `initialStepId`;
  - `assign-responsible` localizar a primeira etapa `kind='work'`;
  - `advance-step` seguir `stepOrder`;
  - `finalize-request` localizar a etapa `kind='final'`.

### 3.2. Lacunas objetivas em relacao ao DEFINE

- esconder os campos na UI, sozinho, nao fecha a invariavel porque o backend ainda aceita semantica tecnica vinda do payload;
- a regra de publishability atual conflita com a regra nova de repeticao valida de `statusKey='em_andamento'`;
- drafts com menos de `3` etapas nao recebem a taxonomia canonica esperada pelo runtime futuro;
- `currentStatusKey` ainda pode vazar como label humano em superficies que deveriam exibir a etapa operacional por `currentStepName`;
- o comentario e alguns testes do runtime ainda assumem implicitamente "uma unica etapa work", quando o contrato desejado passa a ser "a primeira etapa work".

### 3.3. Resultado esperado ao final da microetapa

- o form do editor passa a trabalhar com ordem, nome da etapa e `action`, nao com semantica tecnica manual;
- salvar draft sempre persiste `stepsById[*].statusKey`, `stepsById[*].kind` e `initialStepId` derivados por posicao;
- publicar draft reaplica a derivacao antes da validacao bloqueante e da promocao do documento;
- `evaluatePublishability()` deixa de exigir unicidade de `statusKey` e passa a exigir o canon `start -> work(s) -> final`, com minimo de `3` etapas;
- o runtime continua intacto em protocolo, mas passa a operar sobre dados administrativamente mais fortes;
- historico/admin-config e requester usam `currentStepName` quando a copy quer dizer "etapa atual", deixando `currentStatusKey` como metadado tecnico.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin user (canManageWorkflowsV2)
  |
  +--> WorkflowDraftEditorPage
  |      |
  |      +--> WorkflowDraftStepsSection
  |      |      |- edita stepName e action
  |      |      \- mostra semantica derivada read-only por posicao
  |      |
  |      \--> PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]
  |                |
  |                v
  |         saveWorkflowDraft()
  |                |
  |                +--> canonical-step-semantics helper
  |                |      |- preserva ordem, stepId e action
  |                |      |- deriva statusKey por posicao
  |                |      |- deriva kind por posicao
  |                |      \- deriva initialStepId = primeiro step
  |                |
  |                +--> evaluatePublishability()
  |                \--> persist draft canonico
  |
  +--> GET catalog / GET editor
  |      |
  |      \--> catalog.ts / getWorkflowDraftEditorData()
  |                \--> evaluatePublishability() com regra canonica
  |
  \--> POST publish
         |
         v
   publishDraftVersion()
         |
         +--> canonical-step-semantics helper
         +--> evaluatePublishability() sobre shape derivado
         \--> tx atualiza version + root

Runtime v2
  |
  +--> open-request => usa initialStepId
  +--> assign-responsible => usa primeira etapa work
  +--> advance-step => segue stepOrder
  \--> finalize-request => usa etapa final

History / requester adapters
  |
  \--> currentStepName como label humano
      currentStatusKey como valor tecnico secundario
```

### 4.2. Fluxo por camadas

```text
LAYER 1 - Editor
1. Usuario cria/remove/reordena etapas e altera apenas stepName + action.
2. A UI calcula badges read-only por indice para explicar "Inicial", "Intermediaria", "Final".
3. A UI deixa de expor inputs para statusKey, kind e etapa inicial.

LAYER 2 - Save permissivo
4. PUT aceita payload novo ou legado, mas nao confia em statusKey/kind/initialStepId enviados.
5. O backend deriva a semantica canonica a partir da ordem final das etapas.
6. O draft e salvo mesmo com 0, 1 ou 2 etapas, mas readiness passa a refletir os bloqueios.

LAYER 3 - Readiness compartilhado
7. GET catalogo e POST publish chamam o mesmo helper de validacao sobre o shape derivado.
8. GET editor nao faz compatibilidade retroativa para drafts legados fora do canon; esses drafts podem ser descartados/recriados manualmente.
9. A validacao deixa de olhar unicidade global de statusKey e passa a olhar apenas erros ainda alcancaveis apos a derivacao.

LAYER 4 - Publicacao
10. POST publish reaplica a derivacao canonica sobre o draft persistido.
11. A publicacao falha se o shape derivado nao produzir pelo menos start + work + final.
12. Se valido, a versao e promovida com os valores canonicos ja materializados.

LAYER 5 - Runtime e labels
13. O runtime continua lendo o mesmo shape persistido, agora com invariantes mais fortes.
14. Superficies de historico e requester usam currentStepName para mostrar a etapa atual.
```

### 4.3. Algoritmo fechado de derivacao canonica

Regra base:

| Posicao na ordem | `statusKey` derivado | `kind` derivado | Papel |
|------------------|----------------------|-----------------|-------|
| primeira | `solicitacao_aberta` | `start` | entrada do chamado |
| intermediarias | `em_andamento` | `work` | execucao operacional |
| ultima | `finalizado` | `final` | encerramento |

Comportamento permissivo durante o save:

| Quantidade de etapas no draft | Resultado derivado | Publishability |
|-------------------------------|--------------------|----------------|
| `0` | nenhum step derivado | bloqueado |
| `1` | unica etapa vira `start` | bloqueado |
| `2` | primeira `start`, ultima `final` | bloqueado |
| `>=3` | primeira `start`, meio `work`, ultima `final` | elegivel se o resto do draft estiver valido |

Regras fechadas:

1. `initialStepId` e sempre `stepOrder[0]` quando existir pelo menos uma etapa.
2. `stepOrder` continua sendo a ordem visual do editor.
3. `stepId` continua estavel quando o step ja existe; novos ids seguem o gerador atual.
4. `action` continua pertencendo ao step pela ordem visual e nao altera a taxonomia canonica.
5. drafts legados fora do novo canon nao recebem compatibilidade retroativa no `GET`; eles podem ser descartados/recriados manualmente.

### 4.4. Invariantes funcionais finais

1. toda versao publicada valida precisa ter pelo menos `3` etapas;
2. a primeira etapa publicada precisa ser `start + solicitacao_aberta`;
3. a ultima etapa publicada precisa ser `final + finalizado`;
4. toda etapa entre a primeira e a ultima precisa ser `work + em_andamento`;
5. a primeira atribuicao sempre resolve a primeira etapa `work` da ordem;
6. `currentStepName` continua sendo o label granular da etapa em execucao;
7. `statusKey` passa a representar apenas categoria canonica e nao mais o nome humano da etapa.

---

## 5. Architecture Decisions

### ADR-CANON-001: A derivacao canonica fica em helper puro compartilhado entre save, publishability e publicacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | Hoje a regra de steps esta espalhada entre editor, `draft-repository` e `publishability`, o que favorece drift. |

**Choice:** criar um helper puro dedicado em `src/lib/workflows/admin-config/canonical-step-semantics.ts` e torna-lo a unica fonte de verdade para:

- derivacao de `statusKey`, `kind` e `initialStepId`;
- resumo visual da semantica de cada etapa;
- checks de forma canonica usados em readiness e publicacao.

**Rationale:**

1. remove duplicacao de regra entre save, catalogo e publicacao;
2. facilita testes unitarios do contrato central;
3. permite o frontend reutilizar o mesmo mapeamento de papeis sem depender do servidor para cada repaint.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| deixar a regra embutida em `saveWorkflowDraft` | nao atende catalogo, publishability e UI sem duplicacao |
| validar apenas no `publishability.ts` | o save continuaria gravando dados nao canonicos |
| resolver tudo no frontend | nao protege chamadas diretas na API |

**Consequences:**

- positivo: uma unica semantica passa a governar todo o admin-config;
- negativo: o helper vira dependencia central e exige boa cobertura de testes.

### ADR-CANON-002: O servidor continua tolerante a payload legado, mas ignora campos tecnicos enviados pelo cliente

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O editor atual e testes existentes ainda carregam `statusKey`, `kind` e `initialStepId` no contrato. |

**Choice:** manter parse backward-compatible no `PUT`, mas tratar `statusKey`, `kind` e `initialStepId` como entradas nao confiaveis e descartaveis.

**Rationale:**

1. reduz risco de quebra abrupta na borda HTTP;
2. permite rollout incremental do frontend;
3. cumpre o DEFINE sem introduzir dependencia de sincronismo estrito entre UI e backend.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| quebrar o contrato HTTP imediatamente | aumenta risco de regressao e retrabalho em testes |
| manter os campos como configuraveis e apenas validar depois | viola a invariavel fechada pelo DEFINE |

**Consequences:**

- positivo: chamadas antigas continuam funcionando;
- positivo: qualquer drift vindo do cliente e neutralizado no servidor;
- negativo: o contrato HTTP fica mais permissivo do que a UI final.

### ADR-CANON-003: A publicacao reaplica a derivacao antes da promocao atomica

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O draft salvo pode ter sido criado antes do build, editado parcialmente ou manipulado fora da UI nova. |

**Choice:** `publishDraftVersion()` passa a rederivar `stepsById`, `stepOrder` e `initialStepId` a partir da ordem persistida antes de chamar `evaluatePublishability()` e antes de promover a versao.

**Rationale:**

1. fecha a regra tambem na ultima barreira operacional;
2. garante que a versao publicada nunca dependa de um save previo "bem comportado";
3. facilita a recuperacao de drafts reaproveitaveis sem criar migracao em massa.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| confiar cegamente no draft salvo | deixa loophole para dados legados ou alterados fora do fluxo novo |
| criar script de migracao para todos os drafts | abre escopo operacional desnecessario |

**Consequences:**

- positivo: publicacao fica idempotente do ponto de vista semantico;
- negativo: a transacao de publish passa a tocar tambem `stepsById`, `stepOrder` e `initialStepId` quando houver drift.

### ADR-CANON-004: A UX do editor mostra a semantica derivada como informacao read-only

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O admin precisa entender o papel de cada etapa sem voltar a editar valores tecnicos sensiveis. |

**Choice:** substituir os controles de `Status key`, `Kind` e `Etapa inicial` por apresentacao read-only baseada em indice, com badges/copy do tipo:

- `Inicial` -> `solicitacao_aberta / start`
- `Intermediaria` -> `em_andamento / work`
- `Final` -> `finalizado / final`

**Rationale:**

1. comunica a regra sem recolocar poder de mutacao no cliente;
2. reduz ruido cognitivo no editor;
3. torna obvio que "mudar a ordem" e a forma de alterar o papel operacional.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| ocultar tudo sem nenhum feedback | reduz compreensao operacional do admin |
| manter os campos desabilitados como inputs tecnicos | continua poluindo a UX com detalhe interno |

**Consequences:**

- positivo: editor fica mais alinhado ao modelo real;
- negativo: exige ajuste de testes de interface e snapshots.

### ADR-CANON-005: `currentStepName` e o label humano padrao; `currentStatusKey` fica tecnico

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | Com varias etapas `work`, `currentStatusKey='em_andamento'` deixa de ser suficiente para expressar a etapa atual para a UI. |

**Choice:** todas as superficies que querem dizer "etapa atual" passam a priorizar `currentStepName`; `currentStatusKey` fica reservado para debug, filtros tecnicos ou metadado secundario.

**Rationale:**

1. preserva granularidade operacional;
2. evita que a UI mostre o mesmo rotulo para etapas intermediarias diferentes;
3. alinha historico/admin-config com o requester.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando `currentStatusKey` como fallback humano | mascara a etapa real em qualquer fluxo com mais de uma etapa work |
| criar novo campo de label humano | redundante; o runtime ja persiste `currentStepName` |

**Consequences:**

- positivo: detalhe, lista e historico mostram etapa real;
- negativo: alguns adapters e mappers precisam ser revistos no mesmo build.

---

## 6. Regras de Dominio

### 6.1. Regras bloqueantes de publicacao

Um draft nao pode ser publicado quando qualquer item abaixo ocorrer:

- `name`, `description`, `icon` ou `areaId` vazios apos trim;
- `ownerUserId` ausente ou nao resolvivel;
- `defaultSlaDays` invalido;
- `fields` com `id` duplicado;
- `fields.select` sem `options`;
- `stepOrder` vazio ou referenciando ids ausentes;
- menos de `3` etapas na ordem derivada;
- `action` com `approverIds` vazios, duplicados ou desconhecidos.

Regra explicitamente removida:

- `statusKey` duplicado deixa de ser erro global;
- repeticao de `em_andamento` entre etapas intermediarias passa a ser o comportamento esperado.
- `MISSING_START_STEP`, `MULTIPLE_START_STEPS` e `MISSING_FINAL_STEP` deixam de participar do contrato visivel de readiness, porque a derivacao por posicao ja garante essa taxonomia no fluxo suportado.

Observacao de dominio:

- checks como `initialStepId` divergente do primeiro step ou shape fora do canon podem continuar existindo internamente como assert defensiva do backend, mas nao entram no contrato visivel de `publishReadiness`, porque deixam de ser estados alcancaveis no fluxo suportado pelo helper canonico.

### 6.2. Regras de save permissivo

- salvar draft com `0`, `1` ou `2` etapas continua permitido;
- o save sempre persiste o resultado ja normalizado pelo helper canonico;
- readiness devolve a explicacao do bloqueio sem impedir o salvamento;
- `stepName` continua totalmente livre e e o valor que aparecera em `currentStepName` no runtime;
- `action` continua opcional e vinculada ao step em que o usuario a configurou.

### 6.3. Regras de runtime preservadas

Contrato que precisa continuar verdadeiro apos o build:

- [open-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/open-request.ts) continua abrindo na primeira etapa, via `initialStepId`;
- [assign-responsible.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/assign-responsible.ts) continua promovendo a primeira atribuicao para a primeira etapa `work`;
- [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts) continua avancando por `stepOrder`;
- [finalize-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts) continua concluindo na etapa `final`.

Inferencia explicitada:

- `findWorkStep()` nao precisa mudar de algoritmo; ele ja retorna o primeiro `work` na ordem.
- o build deve atualizar comentarios/testes para refletir "primeira etapa work" em vez de "etapa work unica".

### 6.4. Regras de labels

- `currentStepName` e o label oficial para "em que etapa esta";
- `currentStatusKey` continua disponivel para debug e metadado tecnico;
- em `history-v2.ts`, `statusLabel` deve priorizar `currentStepName` com fallback humano, nao `currentStatusKey`;
- em views de progresso detalhado, `statusKey` pode aparecer como linha secundaria, nunca como headline da etapa.

---

## 7. API Contract

Nenhum endpoint novo e criado. O delta e semantico sobre endpoints existentes.

### 7.1. `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Contrato HTTP permanece estavel, mas com nova regra de servidor:

```http
PUT /api/admin/request-config/workflow-types/facilities_manutencao/versions/3
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Trecho relevante do body:

```json
{
  "steps": [
    {
      "stepId": "stp_triagem",
      "stepName": "Triagem",
      "statusKey": "qualquer_valor_enviado_sera_ignorado",
      "kind": "final",
      "action": {
        "type": "approval",
        "label": "Aprovar",
        "approverCollaboratorDocIds": ["collab-apr1"]
      }
    }
  ],
  "initialStepId": "qualquer_valor_enviado_sera_ignorado"
}
```

Write rules:

1. parse continua aceitando payload legado;
2. `stepId` e `stepName` continuam relevantes;
3. `statusKey`, `kind` e `initialStepId` sao ignorados para decisao final;
4. o servidor deriva a semantica pela ordem final do array;
5. o response devolve `publishReadiness` ja calculado com a regra canonica nova.

### 7.2. `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Sem novo endpoint, mas o payload do editor passa a refletir os drafts salvos/publicados sob a regra nova:

- `steps[*].statusKey` e `steps[*].kind` voltam do backend ja derivados;
- `initialStepId` volta sempre apontando para a primeira etapa;
- a UI nao deve expor esses campos como editaveis;
- `publishReadiness` passa a usar novos codes relacionados ao canon minimo de `3` etapas.

Limitacao explicitada:

- drafts legados fora do canon nao recebem adaptacao retroativa no `GET`; a estrategia operacional aprovada e descartar/recriar esses rascunhos quando necessario.

### 7.3. `POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish`

Comportamento atualizado:

1. carregar root e version alvo;
2. rederivar `stepsById`, `stepOrder` e `initialStepId` a partir do draft persistido;
3. avaliar publishability sobre o shape derivado;
4. se houver bloqueio, responder `409` com `issues`;
5. se valido, persistir a versao publicada com os valores canonicos materializados, incluindo explicitamente:
   - `stepsById`
   - `stepOrder`
   - `initialStepId`
6. promover snapshot para o root como hoje, sem alterar o protocolo de publicacao da `2E.3`.

### 7.4. `GET /api/admin/request-config/catalog`

Sem alteracao de envelope, mas com nova leitura de readiness:

- drafts com `4`, `5` ou mais etapas intermediarias deixam de aparecer como invalidos por `statusKey` duplicado;
- drafts com menos de `3` etapas passam a aparecer com bloqueio canonico;
- `canPublish` passa a refletir a regra `start -> work(s) -> final`.

### 7.5. Taxonomia sugerida de issues novas/ajustadas

Novo code sugerido para `publishReadiness`:

- `MINIMUM_CANONICAL_STEPS`

Code a remover da regra de steps:

- `DUPLICATE_STATUS_KEY`

---

## 8. Data Contract / Schema

### 8.1. Firestore

Nenhuma nova colecao e nenhum novo campo obrigatorio.

Os documentos existentes continuam com o mesmo shape:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

### 8.2. Mudanca de semantica de campos existentes

| Documento | Campo | Novo significado operacional |
|-----------|-------|------------------------------|
| `versions/{version}` | `initialStepId` | sempre o `stepId` do primeiro item em `stepOrder` |
| `versions/{version}.stepsById[*].statusKey` | `statusKey` | categoria canonica por posicao, nao valor livre do admin |
| `versions/{version}.stepsById[*].kind` | `kind` | papel canonico por posicao, nao valor livre do admin |
| `workflows_v2` | `currentStepName` | label humano da etapa atual |
| `workflows_v2` | `currentStatusKey` | chave tecnica/categorica da etapa atual |

### 8.3. Compatibilidade de dados

- drafts novos passam a ser normalizados no save;
- drafts antigos fora do canon podem ser descartados/recriados manualmente;
- nao existe compatibilidade retroativa obrigatoria no `GET` do editor para esses drafts;
- nao ha migracao bulk prevista nesta etapa.

---

## 9. File Manifest

### 9.1. Ordem sugerida de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Regra central | `src/lib/workflows/admin-config/canonical-step-semantics.ts` | @firebase-specialist |
| 2. Save / publishability | `draft-repository.ts`, `publishability.ts`, `draft-readiness.ts`, `catalog.ts`, `publication-service.ts` | @firebase-specialist |
| 3. API / types | `types.ts`, route de version/publish, api client se necessario | @firebase-specialist |
| 4. Editor UI | `WorkflowDraftEditorPage.tsx`, `WorkflowDraftStepsSection.tsx`, `editor/types.ts`, readiness panel se necessario | @react-frontend-developer |
| 5. Labels humanos | `history-v2.ts`, `V2HistoryDetailView.tsx`, adapters requester | @react-frontend-developer |
| 6. Testes | suites de admin-config, runtime e requester/history | agente do mesmo dominio |

### 9.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/admin-config/canonical-step-semantics.ts` | Create | Fonte unica de verdade para derivacao e checks canonicos de etapas | @firebase-specialist | - |
| 2 | `src/lib/workflows/admin-config/draft-repository.ts` | Modify | Ignorar semantica tecnica do payload e persistir steps canonicos | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/admin-config/publishability.ts` | Modify | Remover regra de `statusKey` unico e validar canon `start -> work(s) -> final` | @firebase-specialist | #1 |
| 4 | `src/lib/workflows/admin-config/draft-readiness.ts` | Modify | Reusar a validacao canonica no readiness local/server | @firebase-specialist | #1, #3 |
| 5 | `src/lib/workflows/admin-config/catalog.ts` | Modify | Refletir readiness nova no catalogo e CTAs de publicar | @firebase-specialist | #3 |
| 6 | `src/lib/workflows/admin-config/publication-service.ts` | Modify | Rederivar steps no publish antes da promocao atomica | @firebase-specialist | #1, #3 |
| 7 | `src/lib/workflows/admin-config/types.ts` | Modify | Ajustar apenas DTOs realmente afetados; `DraftReadinessIssue.code` pode permanecer `string` | @firebase-specialist | #3 |
| 8 | `src/components/workflows/admin-config/editor/types.ts` | Modify | Remover `initialStepId` de `WorkflowDraftFormValues`, mantendo-o apenas no DTO read-only vindo do servidor | @react-frontend-developer | #7 |
| 9 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Modify | Parar de enviar semantica tecnica como decisao do form e refletir payload novo | @react-frontend-developer | #2, #8 |
| 10 | `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Modify | Trocar inputs tecnicos por badges/read-only de papel canonico | @react-frontend-developer | #1, #8 |
| 11 | `src/lib/workflows/admin-config/history-v2.ts` | Verify/Modify | Confirmar que `currentStepName` ja e o label humano do historico e ajustar apenas se houver desvio | @firebase-specialist | - |
| 12 | `src/components/workflows/admin-config/history/V2HistoryDetailView.tsx` | Verify/Modify | Confirmar que `statusKey` fica secundario no progresso e ajustar apenas se houver desvio | @react-frontend-developer | #11 |
| 13 | `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Verify/Modify | Confirmar que o detalhe requester prioriza `currentStepName` e ajustar apenas se houver desvio | @react-frontend-developer | - |
| 14 | `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js` | Modify | Cobrir multiplas etapas `work` sem regressao de assign/advance/finalize | @firebase-specialist | #1 |
| 15 | `src/lib/workflows/admin-config/__tests__/publishability.test.ts` | Modify | Cobrir repeticao valida de `em_andamento` e bloqueio `< 3` etapas | @firebase-specialist | #3 |
| 16 | `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts` | Modify | Garantir que save ignora `statusKey/kind/initialStepId` arbitrarios | @firebase-specialist | #2 |
| 17 | `src/app/api/admin/request-config/__tests__/write-routes.test.ts` | Modify | Verificar contrato HTTP estavel e readiness nova | @firebase-specialist | #2, #6 |
| 18 | `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | Modify | Verificar ausencia de controles editaveis e exibicao da regra derivada | @react-frontend-developer | #9, #10 |

---

## 10. Code Patterns

### 10.1. Helper central de derivacao canonica

```ts
// src/lib/workflows/admin-config/canonical-step-semantics.ts
import type { StepDef, StepKind } from '@/lib/workflows/runtime/types';

type DraftLikeStep = {
  stepId?: string;
  stepName?: string;
  action?: StepDef['action'];
};

type CanonicalRole = 'initial' | 'intermediate' | 'final';

const CANONICAL_BY_ROLE: Record<CanonicalRole, { statusKey: string; kind: StepKind }> = {
  initial: { statusKey: 'solicitacao_aberta', kind: 'start' },
  intermediate: { statusKey: 'em_andamento', kind: 'work' },
  final: { statusKey: 'finalizado', kind: 'final' },
};

export function resolveCanonicalRole(index: number, total: number): CanonicalRole {
  if (index === 0) return 'initial';
  if (index === total - 1) return 'final';
  return 'intermediate';
}

export function deriveCanonicalSteps(params: {
  input: DraftLikeStep[];
  current: StepDef[];
  createStepId: (stepName: string, index: number, existingIds: Set<string>, usedIds: Set<string>) => string;
}) {
  const existingIds = new Set(params.current.map((step) => step.stepId));
  const usedIds = new Set<string>();

  const steps = params.input.map((item, index, all) => {
    const role = resolveCanonicalRole(index, all.length);
    const semantic = CANONICAL_BY_ROLE[role];
    const stepId =
      item.stepId?.trim() && existingIds.has(item.stepId.trim())
        ? item.stepId.trim()
        : params.createStepId(item.stepName?.trim() || `etapa_${index + 1}`, index, existingIds, usedIds);

    usedIds.add(stepId);

    return {
      stepId,
      stepName: item.stepName?.trim() || '',
      statusKey: semantic.statusKey,
      kind: semantic.kind,
      ...(item.action ? { action: item.action } : {}),
    } satisfies StepDef;
  });

  return {
    steps,
    stepOrder: steps.map((step) => step.stepId),
    stepsById: Object.fromEntries(steps.map((step) => [step.stepId, step])),
    initialStepId: steps[0]?.stepId || '',
  };
}
```

### 10.2. Pattern de save que ignora semantica tecnica do payload

```ts
// 1. resolver approverCollaboratorDocIds -> approverIds (async, pode consultar Firestore)
// 2. chamar o helper canonico apenas com actions ja resolvidas (sync, puro)
const normalized = await deriveCanonicalSteps({
  input: parsedInput.steps.map((step) => ({
    stepId: step.stepId,
    stepName: step.stepName,
    action: resolvedActionForStep(step),
  })),
  current: normalizeRuntimeSteps(workflowVersion),
  createStepId,
});

const publishReadiness = evaluatePublishability({
  workflowType,
  version: {
    ...workflowVersion,
    initialStepId: normalized.initialStepId,
    stepOrder: normalized.stepOrder,
    stepsById: normalized.stepsById,
    draftConfig: nextDraftConfig,
  },
  collaborators,
});
```

Boundary explicito:

- resolucao de aprovadores permanece assíncrona e ocorre antes da derivacao canonica;
- `deriveCanonicalSteps()` continua puro/sincrono e nao deve fazer lookup externo;
- isso evita misturar IO com a regra central de semantica das etapas.

### 10.3. Pattern de validacao canonica em publishability

```ts
const steps = cloneDraftSteps(input.version);

if (steps.length < 3) {
  pushIssue(issues, {
    code: 'MINIMUM_CANONICAL_STEPS',
    category: 'steps',
    message: 'O workflow precisa ter pelo menos 3 etapas: inicial, intermediaria e final.',
    path: 'steps',
  });
}

// Divergencias de canon apos a derivacao ficam protegidas pelo helper e,
// se ocorrerem, devem ser tratadas como erro tecnico/invariante do backend,
// nao como issue normal de readiness para o usuario.
```

### 10.4. Pattern de UX read-only para semantica derivada

```tsx
// src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx
const semantic = getCanonicalPresentation(index, fields.length);

<div className="rounded-md border bg-muted/30 p-3 text-sm">
  <p className="font-medium">{semantic.roleLabel}</p>
  <p className="text-muted-foreground">
    {semantic.statusKey} / {semantic.kind}
  </p>
</div>
```

### 10.5. Pattern de label humano em historico e requester

```ts
// history-v2.ts / requester adapters
const statusLabel =
  currentStepName?.trim() ||
  statusCategoryToHumanLabel(readSummary.statusCategory) ||
  '-';

return {
  statusKey: readSummary.currentStatusKey,
  statusLabel,
};
```

---

## 11. Testing Strategy

### 11.1. Unit tests

| Component | Test |
|-----------|------|
| `canonical-step-semantics.ts` | deriva corretamente `0`, `1`, `2`, `3` e `4+` etapas |
| `canonical-step-semantics.ts` | preserva `stepId` existente e gera id novo apenas para etapas novas |
| `publishability.ts` | aceita varias etapas intermediarias com `statusKey='em_andamento'` |
| `publishability.ts` | bloqueia drafts com menos de `3` etapas |
| `history-v2.ts` | gera `statusLabel` por `currentStepName` e nao por `currentStatusKey` |

### 11.2. Integration tests

| Flow | Test |
|------|------|
| save de draft | ignora `statusKey`, `kind` e `initialStepId` arbitrarios enviados pelo cliente |
| get editor | devolve steps canonizados mesmo quando o payload de entrada tentava outra semantica |
| catalogo | `canPublish` continua `true` para workflow com `4` ou `5` etapas e `em_andamento` repetido |
| publish | rederiva o shape e publica com `initialStepId` correto |
| publish | regrava `stepsById`, `stepOrder` e `initialStepId` canônicos no `versionRef` |
| publish | falha com issue estruturada para draft com menos de `3` etapas |

### 11.3. Runtime regression tests

| Flow | Test |
|------|------|
| open request | continua abrindo na primeira etapa |
| assign responsible | em workflow com `start + work + work + final`, escolhe a primeira `work` |
| advance | percorre varias etapas `work` em ordem |
| finalize | continua concluindo apenas via etapa `final` |
| read-model | `currentStepName` preserva granularidade quando a request entra em etapas `work` diferentes |

### 11.4. Frontend tests

| Surface | Test |
|---------|------|
| `WorkflowDraftStepsSection` | nao renderiza input editavel de `statusKey`, select de `kind` nem checkbox de etapa inicial |
| `WorkflowDraftStepsSection` | mostra badges/labels corretos para primeira, intermediaria e ultima etapa |
| `WorkflowDraftEditorPage` | submit continua funcionando sem `initialStepId` editavel |
| requester detail adapter | `statusLabel` usa `currentStepName` como fonte primaria |

### 11.5. Fixture guidance

- a fixture base de `publishability.test.ts` deve passar a representar um caso valido com `3` etapas canonicas (`start`, `work`, `final`);
- evitar fixture base com apenas `2` etapas, para nao contaminar os cenarios felizes com `MINIMUM_CANONICAL_STEPS`;
- suites que quiserem cobrir `< 3` etapas devem criar fixture explicita para esse erro, e nao reaproveitar a fixture happy-path.

### 11.6. Acceptance

```gherkin
GIVEN um draft com 5 etapas chamadas "Abertura", "Triagem", "Execucao", "Validacao" e "Encerramento"
WHEN o admin salva e publica a versao
THEN a primeira etapa persiste como solicitacao_aberta/start
AND as tres etapas do meio persistem como em_andamento/work
AND a ultima etapa persiste como finalizado/final
AND a publicacao e aceita
```

```gherkin
GIVEN um draft com apenas 2 etapas
WHEN o admin tenta publicar
THEN a API responde 409
AND o readiness mostra que faltou a etapa intermediaria work
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o helper central e voltar ao `normalizeSteps()` antigo | save volta a respeitar payload legado |
| 2 | Restaurar os controles editaveis do editor apenas se o rollback do backend tambem ocorrer | editor e backend voltam a concordar |
| 3 | Reverter ajustes de publishability e catalogo | drafts multi-work voltam ao comportamento antigo |
| 4 | Reverter ajustes de label humano em historico/requester se houver regressao visual | telas voltam a exibir o texto anterior |

Metodo rapido:

```bash
git revert <commit-do-build>
```

Observacoes operacionais:

- drafts salvos ja no canon novo nao exigem cleanup para rollback;
- se algum draft ficar visualmente estranho durante rollback parcial, a estrategia segura e reabrir/ressalvar o rascunho apos o revert completo;
- nao existe migracao de banco a desfazer.

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado
- [x] Regra canonica fechada no design
- [x] Ponto unico de derivacao identificado
- [x] Manifesto de arquivos definido
- [x] Estrategia de testes definida

### Post-Build

- [ ] campos editaveis `statusKey`, `kind` e `initialStepId` removidos do editor
- [ ] save ignora semantica tecnica arbitraria do cliente
- [ ] publicacao rederiva e valida o shape canonico
- [ ] catalogo aceita repeticao valida de `em_andamento`
- [ ] drafts com `< 3` etapas bloqueiam publicacao com issue explicita
- [ ] historico/requester usam `currentStepName` como label de etapa atual
- [ ] testes de admin-config e runtime passam

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`design` skill) | Initial design for canonical admin-derived step semantics in Config. de Chamados V2 |
