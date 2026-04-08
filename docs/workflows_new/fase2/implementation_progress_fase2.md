# Progress Fase 2

> Updated: 2026-04-08
> Status: 2A concluida; 2C concluida; 2D concluida com correcoes pos-build; proximo foco recomendado: 2B ou 2E

## 1. Resumo executivo

O programa da Fase 2 chegou a um estado estavel em tres frentes:

- **2A** concluida, com a tela oficial `/gestao-de-chamados` em producao interna;
- **2C** concluida, com os `30` workflows restantes materializados em `workflowTypes_v2` por lotes;
- **2D** concluida, com o motor de `requestAction` / `respondAction` operacional ponta a ponta.

Os lotes `4` e `5` da 2C estao prontos para smoke de enablement (mudar `active: true`).

O proximo foco recomendado do roadmap passa a ser:

1. **Smoke de enablement dos lotes 4 e 5** (nao e macroetapa, e uma acao operacional)
2. **2B** Nova tela oficial de abertura de chamado
3. **2E** Configuracao, versionamento e publicacao

## 2. Estado por macroetapa

### 2A. Front oficial da tela integrada

Status:
- **concluida**

Resultado:
- rota `/gestao-de-chamados` entregue;
- dropdown do usuario consolidado como ponto de entrada da operacao;
- bootstrap, listas, filtros, URL state, detalhe rico, modal e polimento visual entregues;
- legado mantido em convivencia controlada durante a transicao.

### 2B. Nova tela oficial de abertura de chamado

Status:
- **nao iniciada**

Diretriz ja fechada:
- a nova tela pode ser visualmente identica a legada no primeiro momento;
- a implementacao deve ser nova e conectada ao backend novo.

### 2C. Cadastro e habilitacao dos workflows restantes

Status:
- **concluida**

Resultado:
- `30` workflows restantes materializados em `workflowTypes_v2` e `versions/1`;
- execucao concluida em `5` lotes:
  - lote `1` Governanca + Financeiro
  - lote `2` Marketing
  - lote `3` TI
  - lote `4` Gente / servicos e atendimento
  - lote `5` Gente / ciclo de vida e movimentacoes

Decisoes consolidadas da 2C:
- workflows diretos aprovados passaram a usar `canonical_3_steps`;
- o canon de `3` etapas foi alinhado a Facilities:
  - `Solicitação Aberta`
  - `Em andamento`
  - `Finalizado`
- a semantica funcional desses workflows tambem foi alinhada a Facilities:
  - `Solicitação Aberta` = owner designa responsavel
  - `Em andamento` = chamado atribuido e em execucao
  - `Finalizado` = encerramento operacional
- a classificacao ficou explicita por workflow via `stepStrategy`:
  - `canonical_3_steps`
  - `preserve_legacy`
- workflows com `action` ou checkpoints semanticos relevantes permaneceram em `preserve_legacy`;
- `canonical_3_steps` ficou proibido com:
  - `statuses[*].action`
  - `statusIdOverrides`
- lotes `1` e `2` foram removidos manualmente e reseedados apos a correcao do canon;
- lotes `4` e `5` foram publicados com `active: false`, aguardando a `2D`.

Estado operacional final da 2C:
- lotes `1`, `2` e `3`: `active: true`
- lotes `4` e `5`: `active: false` — prontos para enablement apos smoke com motor 2D

### 2D. Motor operacional de `requestAction` / `respondAction`

Status:
- **concluida**

Artefatos de referencia:
- `BRAINSTORM_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `DEFINE_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `DESIGN_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

Resultado:

**Runtime core:**
- `WorkflowActionRequest`, `WorkflowActionRequestStatus`, `WorkflowActionResponseAttachment` adicionados a `types.ts`
- `actionRequests?: WorkflowActionRequest[]` adicionado a `WorkflowRequestV2`
- `attachmentRequired?: boolean` adicionado a `StepActionDef`
- 5 novos `HistoryAction`: `action_requested`, `action_approved`, `action_rejected`, `action_acknowledged`, `action_executed`
- 6 novos `RuntimeErrorCode` com mapeamento HTTP correto (409 para `ACTION_REQUEST_ALREADY_OPEN` e `ACTION_RESPONSE_ALREADY_RECORDED`)
- `assertCanRequestAction` e `assertCanRespondAction` adicionados a `authz.ts`
- `mutateWorkflowRequestAtomically<T>` adicionado a `repository.ts` — lê snapshot dentro da transacao, protege 409 contra race condition
- `buildActionReadModelUpdate` e `getPendingActionEntriesForCurrentStep` adicionados a `read-model.ts`
- `action-helpers.ts` criado com `describeCurrentStepAction`, `assertCurrentStepActionConfigured`, `findPendingActionForActor`, `getCurrentPendingActionBatchEntries`, `mapActionResponseToStatus`

**Use cases:**
- `request-action.ts` criado — abre batch para todos os `approverIds`, entra em `waiting_action`
- `respond-action.ts` criado — fecha linha do destinatario, retorna a `in_progress` ao fechar ultima pendencia
- `advance-step.ts` atualizado — guard direto em `actionRequests` antes do guard de `statusCategory`

**Rotas HTTP:**
- `POST /api/workflows/runtime/requests/[id]/request-action`
- `POST /api/workflows/runtime/requests/[id]/respond-action`
- `POST /api/workflows/runtime/uploads` — extensao com `target: 'action_response'`
- `GET /api/workflows/read/requests/[requestId]` — detalhe enriquecido com bloco `action`

**Read side:**
- `WorkflowRequestActionDetail` e `WorkflowRequestActionRecipientDetail` adicionados a `read/types.ts`
- `canRequestAction`, `canRespondAction` adicionados a `WorkflowRequestDetailPermissions`
- `buildDetailAction`, `buildActionRecipients` adicionados a `detail.ts`
- `TIMELINE_LABELS` atualizado com os 5 novos eventos
- `responseAttachmentUrl` visivel apenas para owner e responsavel

**Gestao oficial:**
- `requestManagementAction`, `respondManagementAction` adicionados ao `api-client.ts`
- `requestActionMutation`, `respondActionMutation` adicionados ao `use-workflow-management.ts`
- `RequestDetailDialog.tsx` enriquecido com card operacional de action
- `WorkflowManagementPage.tsx` integrado com mutations e toasts de action

**Correcoes pos-build consolidadas:**
- uploads de `action_response` validados via Storage API antes da transacao, incluindo:
  - namespace permitido;
  - consistencia entre `storagePath`, `fileUrl`, `uploadId`, metadata custom e propriedades top-level do objeto;
- namespace neutro consolidado para uploads novos:
  - `Workflows/workflows_v2/uploads/...`
- bloco `action` do detalhe enriquecido para preservar visibilidade do ultimo batch encerrado da etapa atual;
- `state = completed` consolidado como estado somente leitura no read-side;
- regra de `completed = somente leitura` tambem promovida ao backend:
  - `requestAction` agora bloqueia reabertura da mesma etapa mesmo quando o batch historico ja estiver encerrado;
- `hasAnyActionBatchForCurrentStep` consolidado como gate canonico entre runtime e detalhe;
- cobertura direta adicionada para helpers de upload em `upload-storage.test.ts`;
- regressao adicionada para tentativa de `requestAction` com batch historico encerrado.

**Invariantes criticos preservados:**
- `requestAction` e CTA explicito — nunca automatico
- quorum = ALL: todos os `approverIds` devem responder antes de sair de `waiting_action`
- `approval = rejected` registra `action_rejected` na timeline, devolve controle ao responsavel, nao bloqueia o chamado
- batch duplicado retorna `409 ACTION_REQUEST_ALREADY_OPEN`
- `respondAction` nao avanca etapa — apenas fecha pendencia
- batch encerrado torna a etapa atual somente leitura para nova abertura de action

**Testes:**
- build principal da `2D` validado com a suite-alvo da entrega;
- correcoes finais validadas com:
  - `3` suites passando
  - `41` testes passando
  - foco em `runtime-use-cases`, `upload-storage` e `detail`

**Artefatos complementares das correcoes:**
- `DEFINE_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `DESIGN_CORRECOES_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `DEFINE_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `DESIGN_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`
- `BUILD_CORRECOES_FINAIS_POS_BUILD_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

### 2E. Configuracao, versionamento e publicacao

Status:
- **nao iniciada**

## 3. Decisoes de continuidade

- nao reabrir a `2C` para redesenho funcional da `v1`;
- checkpoints hoje preservados em `preserve_legacy` podem virar `action` em futuras `v2`, depois da entrega da `2D` e da superficie administrativa;
- qualquer evolucao estrutural dos workflows seedados deve acontecer por versionamento futuro, nao por nova seed da `v1`;
- a `2D` nao cobre reabertura manual de batches, quorum parcial, expiracao ou delegacao — essas capacidades ficam para `2D+` se houver demanda.

## 4. Gaps conhecidos para evoluçao futura (nao bloqueantes)

- `getPendingActionEntriesForCurrentStep` duplicada em `read-model.ts` e `action-helpers.ts` — unificar em refatoracao futura;
- cenarios ainda desejaveis nos testes: rejection, acknowledgement, execution com attachment, quorum parcial, duplicata de resposta;
- `assertCanRespondAction` em `authz.ts` definida mas nao consumida pelo use case — remover ou integrar;
- politica de visibilidade de `responseComment` (atualmente publica para todos os destinatarios) nao foi explicitada no DESIGN.

## 5. Proximo passo recomendado

**Acao operacional imediata**: smoke de enablement dos lotes `4` e `5` da `2C`:
- selecionar um workflow action-driven de cada lote;
- executar `requestAction` + `respondAction` no ambiente de test;
- apos validacao, mudar `active: true` nos documentos dos lotes `4` e `5`.

**Proxima macroetapa**: abrir **2B** (nova tela oficial de abertura de chamado) ou **2E** (configuracao e versionamento).
