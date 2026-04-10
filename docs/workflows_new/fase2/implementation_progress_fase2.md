# Progress Fase 2

> Updated: 2026-04-10
> Status: 2A concluida; 2C concluida; 2D concluida com correcoes pos-build; 2E concluida em 4 subetapas + ajustes pontuais; proximo foco: 2B

## 1. Resumo executivo

O programa da Fase 2 chegou a um estado estavel em quatro frentes:

- **2A** concluida, com a tela oficial `/gestao-de-chamados` em producao interna;
- **2C** concluida, com os `30` workflows restantes materializados em `workflowTypes_v2` por lotes;
- **2D** concluida, com o motor de `requestAction` / `respondAction` operacional ponta a ponta;
- **2E** concluida, com a superficie administrativa de configuracao, versionamento e publicacao entregue em `4` subetapas e `2` rounds de ajustes pontuais.

Os lotes `4` e `5` da 2C estao prontos para smoke de enablement (mudar `active: true`).

O proximo foco recomendado do roadmap:

1. **2B** Nova tela oficial de abertura de chamado (brainstorm iniciado)

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
- **concluida**

Artefatos de referencia:
- `BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
- `DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md`
- `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`
- `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`
- `DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md`
- `DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md`
- `DEFINE_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md`

#### 2E.1 — Shell e catalogo administrativo

Resultado:
- permissao dedicada `canManageWorkflowsV2` adicionada ao contrato de colaboradores e ao `AuthContext`;
- toggle `"Workflows V2"` exposto em `PermissionsPageContent`;
- item `"Config. de chamados v2"` adicionado ao menu de admin, condicionado exclusivamente a `canManageWorkflowsV2`;
- `WorkflowConfigAdminGuard` criado — redireciona para `/login` ou `/dashboard` conforme estado de autenticacao e permissao;
- rota `/admin/request-config` criada com shell de tabs (`Definicoes` / `Historico Geral`);
- endpoint `GET /api/admin/request-config/catalog` criado — agrega `areas`, `workflowTypes` e `versions` server-side;
- `WorkflowConfigPage.tsx` e `WorkflowConfigDefinitionsTab.tsx` como shell inicial com placeholders;
- `10` arquivos criados, `6` modificados.

#### 2E.2 — Editor de rascunho

Resultado:

**Backend / contratos:**
- `WorkflowConfigArea`, `WorkflowConfigOwnerLookup`, `WorkflowVersionDraftDto` e tipos associados adicionados a `types.ts`;
- `id-generation.ts` criado — gera `workflowTypeId` a partir de `areaId + name` com dedup por sufixo numerico;
- `lookups.ts` criado — `listWorkflowConfigAreas`, `listWorkflowConfigOwners`, `resolveOwnerByUserId`;
- `draft-readiness.ts` criado — `buildAccessPreview`, `evaluatePublishReadiness` com categorias e severidades;
- `draft-repository.ts` criado — `createWorkflowArea`, `createWorkflowTypeWithDraft`, `createOrReuseWorkflowDraft`, `buildDraftDto`, `getWorkflowDraftEditorData`, `saveWorkflowDraft` com `cleanDataForFirestore`;
- `api-client.ts` criado — `fetchWorkflowConfigCatalog`, `fetchWorkflowDraftEditor`, `saveWorkflowDraft`, `createWorkflowArea`, `createWorkflowTypeWithDraft`, `createWorkflowDraft`.

**Rotas HTTP:**
- `POST /api/admin/request-config/areas`
- `POST /api/admin/request-config/workflow-types`
- `POST /api/admin/request-config/workflow-types/[workflowTypeId]/drafts`
- `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`
- `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

**Frontend:**
- `WorkflowConfigDefinitionsTab.tsx` com catalogo por area, CTAs de criar area, criar tipo e editar rascunho;
- `CreateWorkflowAreaDialog.tsx` e `CreateWorkflowTypeDialog.tsx`;
- `WorkflowDraftEditorPage.tsx` com secoes de configuracao geral, acesso, campos, etapas e painel de pendencias;
- `WorkflowDraftGeneralSection.tsx`, `WorkflowDraftAccessSection.tsx`, `WorkflowDraftFieldsSection.tsx`, `WorkflowDraftStepsSection.tsx`, `WorkflowDraftReadinessPanel.tsx`;
- rota dedicada `/(app)/admin/request-config/[workflowTypeId]/versions/[version]/edit/page.tsx`;
- `15` arquivos criados, `12` modificados, `23` testes passando.

#### 2E.3 — Publicacao e ativacao

Resultado:

**Backend:**
- `publishability.ts` criado — `evaluatePublishReadiness` canonico (com categorias `general`, `steps`, `access`), `deriveVersionStatus`, `canActivateVersion`, `getLastVersionTransition`;
- `publication-service.ts` criado — `publishDraftVersion` e `activatePublishedVersion` como transacoes atomicas que atualizam `root + version` no mesmo commit Firestore;
- rotas `POST .../publish` e `POST .../activate` criadas com authz admin e envelope canonico de resposta;
- `catalog.ts` atualizado — cada versao passa a derivar `canPublish`, `canActivate`, `hasBlockingIssues`, `lastTransitionAt`.

**Frontend:**
- `WorkflowConfigDefinitionsTab.tsx` recebe CTAs `Publicar` e `Ativar` com loading e refresh apos mutacao;
- `WorkflowDraftReadinessPanel.tsx` separa bloqueios de warnings e expoe CTA de publicacao;
- `WorkflowDraftEditorPage.tsx` aciona publicacao e exibe badge de status derivado.

**Correcoes pos-build da 2E.3:**
- `hasSufficientWorkflowTypeSnapshot` adicionado a `publishability.ts` — verificacao estrutural de `7` campos do snapshot (`name`, `description`, `icon`, `areaId`, `ownerEmail`, `ownerUserId`, `allowedUserIds.length > 0`) como type predicate; usado por `canActivateVersion` e por `activatePublishedVersion`;
- `hasUnsavedChanges` adicionado ao `WorkflowDraftReadinessPanel` — impede publicacao enquanto ha alteracoes nao salvas;
- `7` arquivos criados, `16` modificados.

#### 2E.4 — Historico geral unificado

Resultado:

**Backend:**
- read model administrativo proprio para historico global de chamados;
- endpoint `GET /api/admin/request-config/history` — unifica `Legado (workflows)` e `V2 (workflows_v2)` em DTO comum;
- endpoint `GET /api/admin/request-config/history/[origin]/[requestKey]` — detalhe somente leitura;
- filtros server-side por `origin`, `areaId`, `workflowTypeId`, `statusCategory`, `ownerUserId` e periodo;
- builder admin read-only para detalhe v2 (sem mutacoes, sem CTAs operacionais).

**Frontend:**
- `WorkflowConfigHistoryTab.tsx` com estado de carregamento, erro e filtros ativos;
- `HistoryFiltersBar.tsx` — filtros por origem, area, tipo, status, owner e periodo;
- `HistoryGrid.tsx` — tabela unificada com colunas comuns `Legado + V2`;
- `HistoryDetailDialog.tsx` — dialog somente leitura roteado por origem;
- `LegacyHistoryDetailView.tsx` e `V2HistoryDetailView.tsx` — visoes de detalhe especializadas por origem.

**Correcao pos-build da 2E.4:**
- builder admin read-only dedicado para detalhe v2 no historico, separado do builder operacional de `/gestao-de-chamados`.

#### Ajustes Pontuais do Configurador 2E — Modal editor, area read-only e approvers canonicos

Entregues em `2` builds sequenciais.

**Build principal (17 arquivos):**

*Contratos:*
- `WorkflowConfigCollaboratorLookup` com `collaboratorDocId: string` (required) adicionado a `types.ts`;
- `WorkflowDraftEditorApprover = { collaboratorDocId, userId, name, email }` adicionado;
- `SaveWorkflowDraftInput` ampliado com `approverCollaboratorDocIds?: string[]` e `unresolvedApproverIds?: string[]`;
- `WorkflowDraftDirtyState = { isDirty: boolean; isReadOnly: boolean }` adicionado a `editor/types.ts`.

*Backend:*
- `listWorkflowConfigCollaborators` adicionado a `lookups.ts`;
- `resolveWorkflowTypeStateForEditor` — tres caminhos: draft → root, published + snapshot → snapshot, fallback → root;
- `hydrateApproverSelections` — separa aprovadores resolvidos de `unresolvedApproverIds`;
- `resolveCollaboratorDocIdsToApproverIds` — resolve `collaboratorDocId → id3a` lendo por `doc.id`, rejeita `422` para doc ausente ou `id3a` vazio;
- `hasUnresolvedApproverSelections` — gate antes de qualquer acesso a DB no save;
- `buildDraftDto` ampliado com `areas[]`, `unresolvedApproverIds` por step e bloqueio `UNRESOLVED_ACTION_APPROVERS` na readiness;
- GET de versao passa a aceitar `draft` e `published` via `loadWorkflowVersion`;
- `canPublish: state === 'draft' && !hasBlockingIssues`; `canActivate: canActivateVersion(workflowType, workflowVersion)`.

*Orquestracao modal:*
- `WorkflowConfigPage.tsx` — estado do editor migrado para search params (`editorWorkflowTypeId` + `editorVersion`), preservando `tab=definitions`; `handleOpenEditor`, `handleCloseEditor`, `handleTabChange` com limpeza cirurgica de params;
- `WorkflowConfigDefinitionsTab.tsx` — `onOpenEditor` prop substitui `useRouter`; botao `"Ver versao"` para published; `CreateWorkflowTypeDialog` recebe `onOpenEditor`;
- `WorkflowVersionEditorDialog.tsx` — shell modal com `dirtyState`, `requestClose` com confirm guard, `onEscapeKeyDown` e `onInteractOutside` com `preventDefault`.

*Editor:*
- `WorkflowDraftEditorPage.tsx` — prop `onDirtyStateChange`, `embedded` para layout modal, save payload sem `areaId`, `approverCollaboratorDocIds + unresolvedApproverIds` no payload;
- `WorkflowDraftGeneralSection.tsx` — icon picker com `Controller/Select/ScrollArea h-72`, owner select com nome e email, area `Input readOnly bg-muted/30`;
- `WorkflowDraftReadinessPanel.tsx` — prop `readOnly` com hierarquia de mensagens contextual;
- `WorkflowDraftStepsSection.tsx` — picker inline de aprovadores com banner ambar para `unresolvedApproverIds`, auto-clear em todo toggle;
- rota fallback `edit/page.tsx` com `WorkflowConfigAdminGuard`.

**Build de completude (7 arquivos):**
- `WorkflowActionApproverPicker.tsx` extraido como componente stateless: filtragem local por nome/email/area, badges de selecionados, banner ambar, deduplicacao por `collaboratorDocId`, auto-clear de `unresolvedApproverIds` em todo toggle (ADR-3);
- `WorkflowDraftStepsSection.tsx` reduzido em `~85` linhas — bloco inline substituido por `<WorkflowActionApproverPicker />`;
- `hydrateApproverSelections` exportado de `draft-repository.ts` para cobertura unitaria;
- `+8` cenarios de teste nos `4` arquivos parciais: `422` path em `resolveCollaboratorDocIds`, hydrate split, GET published read-only, PUT com `approverCollaboratorDocIds`, dialog confirm/close, badge `"Somente leitura"`, propagacao de `onDirtyStateChange`.

**Estado final dos testes:**
- `71/71` testes passando em `18` suites cobrindo todo o dominio `admin-config`;
- `0` erros de typecheck nos arquivos do escopo;
- `0` regressoes de lint (saldo `-1` violacao).

**Invariantes criticos da 2E:**
- `areaId` e imutavel no editor — lido do root, nunca do payload do cliente;
- `collaboratorDocId` e a chave de transporte admin; `id3a` e resolvido server-side antes de persistir;
- `unresolvedApproverIds` bloqueia publicacao (`UNRESOLVED_ACTION_APPROVERS`) e rejeita PUT com `422` se presente;
- versoes publicadas abertas no editor operam em `mode: 'read-only'` — sem save, sem publish, sem dirty confirm;
- dirty-close guard no dialog intercepta ESC e interact-outside; read-only nao dispara confirm;
- `canActivateVersion` e o helper canonico unico — usado pelo catalogo, pelo DTO do editor e pelo `publication-service`.

**Gaps conhecidos pos-2E (nao bloqueantes):**
- `canPublish` de versoes published retorna `false` porque `state !== 'draft'`; cosmetically consistente mas semanticamente redundante com `mode: read-only`;
- smoke manual pendente: persistencia de approvers no Firestore real, banner ambar em draft herdado com approvers nao resolvidos, UX de versao publicada no editor.

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

**Proxima macroetapa**: **2B** — nova tela oficial de abertura de chamado.
- Brainstorm iniciado em `2026-04-10`.
- Diretriz fechada: nova implementacao sobre o backend `workflowTypes_v2` + runtime, desacoplada do legado `/applications`; limpeza do legado fica para hardening posterior.
- Referencia piloto existente: `OpenWorkflowCard` em `/pilot/facilities` (usa `DynamicFieldRenderer`, upload via signed URL, `openRequest` do runtime).
