# Workflows - Documento Oficial Pre-Build

## 1. Objetivo

Este documento consolida, em uma unica referencia oficial pre-build, as decisoes de arquitetura, runtime, read model e frontend do novo sistema de workflows.

Este artefato deve ser tratado como a base oficial para o inicio da implementacao do piloto.

Se houver conflito entre este documento e artefatos individuais anteriores, este documento prevalece.

### Artefatos de referencia

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/DESIGN_READ_MODEL_WORKFLOWS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-23` | `High` | correcoes de build: transacao atomica na abertura, semantica de finalize, `ownerUserId` no schema, remocao de `pendingActionCount`, label `Atribuido` e nota de provisionamento de indices |
| `2026-03-23` | `High` | incorporacao de governanca, contratos de API, regras de atualizacao do read model, requisitos de UX e pendencias residuais |
| `2026-03-23` | `High` | consolidacao oficial pre-build dos artefatos de workflows |

---

## 2. Estrategia de Produto e Entrega

### 2.1. Direcao principal

A estrategia oficial e:

- construir um novo sistema de workflow do zero;
- nao remendar incrementalmente o motor atual;
- operar o novo runtime em paralelo ao legado durante o piloto;
- substituir o caminho antigo pelo novo quando o piloto estiver validado.

### 2.2. O que sera reaproveitado

O projeto nao precisa reescrever tudo do zero.

Pode reaproveitar:

- stack atual de Next.js;
- Firebase / Firestore;
- padrao de autenticacao;
- componentes visuais que continuarem uteis;
- tela de abertura do chamado, com ajustes localizados.

### 2.3. O que e novo

- modelo de dados versionado;
- runtime server-side;
- read model de `workflows`;
- tela unificada `Gestao de chamados`;
- modal unificado de detalhes.

---

## 3. Problema Atual

O sistema atual possui problemas estruturais:

- a definicao viva do workflow influencia chamados em andamento;
- a ordem do array de `statuses` virou parte da regra de negocio;
- o runtime esta espalhado no frontend;
- atribuicao, pedidos de acao e mudancas de etapa se misturam no modal atual;
- finalizacao depende de heuristica textual;
- a gestao operacional esta fragmentada entre paginas distintas.

Consequencia:

- alto risco de regressao operacional;
- dificuldade para evoluir o motor;
- baixo isolamento entre definicao, runtime e experiencia de uso.

---

## 4. Principios Canonicos

### 4.1. Workflow versionado por tipo

Cada tipo de workflow possui:

- identidade estavel via `workflowTypeId`;
- varias versoes de definicao;
- chamados presos a uma versao especifica.

### 4.2. Etapa com identidade propria

Cada etapa possui:

- `stepId` auto-gerado pelo sistema;
- `stepName` editavel;
- `statusKey` operacional;
- ordem separada da identidade.

### 4.3. Mudanca em etapa gera nova versao

Qualquer alteracao em:

- `stepName`
- ordem do fluxo
- inclusao de etapa
- exclusao de etapa

gera nova versao.

### 4.4. Finalizacao e arquivamento sao separados

- finalizar e parte do fluxo;
- arquivar e operacao administrativa posterior.

### 4.5. Resposta de acao nao avanca fluxo automaticamente

Pedidos de:

- aprovacao;
- ciente;
- execucao

retornam ao responsavel do chamado. O responsavel continua conduzindo o fluxo.

---

## 5. Modelo de Dados Canonico

## 5.1. `workflowTypes/{workflowTypeId}`

Representa a identidade estavel do tipo de workflow.

Campos oficiais:

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
- `latestDraftVersion`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

### Regras

- `ownerEmail` pode mudar sem gerar nova versao;
- `ownerUserId` acompanha o owner atual do tipo;
- `active` controla se o tipo aceita novas aberturas;
- novos chamados sempre resolvem `latestPublishedVersion`.

## 5.2. `workflowTypes/{workflowTypeId}/versions/{version}`

Representa a definicao versionada do workflow.

Campos oficiais:

- `workflowTypeId`
- `version`
- `state`
- `ownerEmailAtPublish`
- `defaultSlaDays`
- `fields`
- `initialStepId`
- `stepOrder`
- `stepsById`
- `publishedAt`
- `publishedBy`

### Estrutura de `stepsById`

Cada etapa deve conter:

- `stepId`
- `stepName`
- `statusKey`
- `kind`
- `action`, quando aplicavel
- `assignmentMode`, quando aplicavel
- `allowComment`, quando aplicavel
- `allowAttachment`, quando aplicavel

### Observacao

`ownerEmailAtPublish` existe para auditoria da publicacao. O owner vigente do runtime continua vindo de `workflowTypes.ownerEmail` e `workflowTypes.ownerUserId`.

## 5.3. `workflows/{docId}`

Representa o chamado concreto em execucao.

O documento contem:

- estado operacional completo;
- historico;
- acoes pendentes;
- read model necessario para as telas.

## 5.4. Governanca de versoes

### Regra de mutabilidade

- `draft` pode ser editado;
- `published` e imutavel;
- toda alteracao relevante gera nova versao;
- published nao pode ser sobrescrito em-place.

### Regra de publicacao

- novos chamados usam sempre `latestPublishedVersion`;
- `latestDraftVersion` representa edicao em andamento, quando existir;
- mudar owner do tipo nao exige nova versao;
- mudar etapa ou fluxo exige nova versao.

## 5.5. Estrategia de snapshot

Na primeira iteracao, a definicao completa do workflow nao sera copiada integralmente para dentro do chamado.

Regras que sustentam essa decisao:

- versao publicada e imutavel;
- versoes antigas nao sao apagadas;
- o runtime sempre usa `workflowTypeId + workflowVersion`;
- o read model do chamado carrega apenas os campos necessarios para consulta e operacao.

## 5.6. Riscos arquiteturais e cuidados

Riscos que devem ser tratados como guardrails do build:

- editar versao publicada em-place invalida o modelo inteiro;
- continuar buscando definicao viva por nome no frontend invalida o versionamento;
- manter `stepId` acoplado a posicao reintroduz fragilidade estrutural;
- nao corrigir duplicidade de status herdada do legado pode carregar ambiguidade para o novo runtime.

## 5.7. Impacto de migracao do legado

Direcao oficial da transicao:

- `workflowDefinitions` deixa de ser fonte final do runtime;
- documentos atuais devem ser convertidos em `workflowTypes` + `versions`;
- chamados antigos precisam de backfill minimo de:
  - `workflowTypeId`
  - `workflowVersion`
  - `currentStepId`
- campos antigos como `type` e `status` podem coexistir temporariamente como compatibilidade.

---

## 6. Runtime Oficial

O runtime oficial deixa de rodar no frontend e passa para uma camada server-side explicita.

### Arquitetura de runtime

```text
Frontend
  -> app/api/workflows/runtime/*
     -> workflow runtime service
        -> repository
        -> engine
        -> authz
        -> history builder
        -> notifications
        -> Firestore
```

### Casos de uso oficiais

- abrir chamado
- atribuir / reatribuir responsavel
- solicitar acao
- responder acao
- avancar etapa
- finalizar
- arquivar

### Regras obrigatorias de runtime

- toda operacao carrega `workflowTypeId + workflowVersion`;
- nenhuma operacao consulta a definicao atual por nome;
- toda mutacao atualiza `lastUpdatedAt`;
- toda mutacao registra `history`;
- notificacoes sao efeito colateral, nao regra de negocio.

### Manifesto tecnico recomendado

Arquivos alvo recomendados:

- `src/lib/workflows/runtime/types.ts`
- `src/lib/workflows/runtime/repository.ts`
- `src/lib/workflows/runtime/engine.ts`
- `src/lib/workflows/runtime/history.ts`
- `src/lib/workflows/runtime/notifications.ts`
- `src/lib/workflows/runtime/authz.ts`
- `src/lib/workflows/runtime/use-cases/*`
- `src/app/api/workflows/runtime/*`

### Autenticacao oficial

O runtime deve seguir o padrao ja usado em `app/api`:

- `Authorization: Bearer <idToken>`
- verificacao via Firebase Admin
- erro `401` se token faltar ou for invalido

### Contratos oficiais de API

Resposta padrao de sucesso:

```ts
type RuntimeSuccess<T> = {
  ok: true;
  data: T;
};
```

Resposta padrao de erro:

```ts
type RuntimeErrorResponse = {
  ok: false;
  code: string;
  message: string;
};
```

### Catalogo minimo de erros

- `UNAUTHORIZED`
- `FORBIDDEN`
- `WORKFLOW_TYPE_INACTIVE`
- `PUBLISHED_VERSION_NOT_FOUND`
- `INVALID_PUBLISHED_VERSION`
- `REQUEST_NOT_FOUND`
- `REQUEST_ALREADY_ARCHIVED`
- `REQUEST_ALREADY_FINALIZED`
- `PENDING_ACTIONS_BLOCK_ADVANCE`
- `FINALIZATION_NOT_ALLOWED`
- `ACTION_REQUEST_NOT_FOUND`
- `ACTION_ALREADY_RESPONDED`
- `INVALID_RESPONDER`
- `INVALID_RESPONSIBLE`

---

## 7. Comportamento dos Casos de Uso

## 7.1. Abrir chamado

Passos oficiais:

1. autenticar usuario;
2. carregar `workflowType`;
3. validar `active`;
4. validar `allowedUserIds`;
5. resolver `latestPublishedVersion`;
6. carregar `version`;
7. resolver etapa inicial em `version.stepsById[version.initialStepId]`;
8. gerar `requestId` sequencial;
9. copiar `ownerEmail` vigente de `workflowTypes`;
10. copiar `ownerUserId` vigente de `workflowTypes`;
11. inicializar `stepStates`;
12. criar documento em `workflows`;
13. preencher `currentStepName` e `currentStatusKey` a partir da etapa inicial resolvida;
14. registrar eventos iniciais;
15. disparar notificacoes.

### Regra transacional critica

`counter` + geracao de `requestId` + criacao do documento em `workflows` devem acontecer dentro da mesma `runTransaction` do Firestore.

Notificacoes devem rodar apenas apos commit bem sucedido da transacao.

### Resultado esperado

- chamado nasce preso a uma versao;
- `currentStepId = initialStepId`;
- `statusCategory = open`.

## 7.2. Atribuir / reatribuir responsavel

Regras:

- primeira atribuicao define `responsible`;
- reatribuicao atualiza `responsible`;
- atualiza `hasResponsible`;
- adiciona participante em `operationalParticipantIds`;
- pode mover `statusCategory` para `in_progress`.

## 7.3. Solicitar acao

Regras:

- so responsavel atual ou owner que esteja conduzindo o chamado pode solicitar;
- nao muda `currentStepId`;
- cria itens pendentes em `actionRequests`;
- atualiza:
  - `hasPendingActions`
  - `pendingActionRecipientIds`
  - `pendingActionTypes`
  - `statusCategory = waiting_action`

## 7.4. Responder acao

Regras:

- apenas o destinatario da acao responde;
- resposta nao avanca etapa;
- recalcula campos de pending action;
- se nao houver mais pendencia, volta para `in_progress`.

## 7.5. Avancar etapa

Regras:

- exige chamado ativo;
- bloqueia se houver acao pendente na etapa atual;
- bloqueia se a proxima etapa da versao for `kind = final`;
- conclui etapa atual;
- ativa proxima etapa;
- atualiza:
  - `currentStepId`
  - `currentStepName`
  - `currentStatusKey`
  - `statusCategory = in_progress`

## 7.6. Finalizar

Regras:

- e operacao distinta de `advance`;
- so pode ser chamada quando a proxima etapa valida for `kind = final`;
- move o chamado para a etapa final da versao;
- define:
  - `statusCategory = finalized`
  - `finalizedAt`
  - `closedAt`
  - `closedMonthKey`

## 7.7. Arquivar

Regras:

- so ocorre apos finalizacao;
- define:
  - `isArchived = true`
  - `statusCategory = archived`
  - `archivedAt`
- `closedAt` nao muda.

## 7.8. Estrategia de implementacao do runtime

Fases recomendadas:

1. runtime base:
   - `resolvePublishedVersion`
   - `open-request`
   - `assign-responsible`
2. fluxo operacional:
   - `request-action`
   - `respond-action`
   - `advance-step`
3. encerramento:
   - `finalize-request`
   - `archive-request`
4. integracao:
   - adaptacao do frontend
   - notificacoes Slack

## 7.9. Testing strategy obrigatoria

### Unitarios

- resolver versao publicada;
- montar `stepStates` iniciais;
- calcular proxima etapa;
- bloquear `advance` com acao pendente;
- bloquear `archive` sem finalizacao.

### Integracao

- abrir chamado cria documento correto;
- atribuicao atualiza responsavel e historico;
- solicitacao de acao atualiza read model;
- resposta de acao recalcula pendencias;
- finalize preenche `closedAt`;
- archive nao altera `closedAt`.

### Regressao funcional

Fluxo piloto ponta a ponta:

1. solicitante abre chamado;
2. owner recebe;
3. owner atribui responsavel;
4. responsavel solicita acao;
5. terceiro responde;
6. responsavel avanca;
7. responsavel finaliza;
8. owner arquiva.

## 7.10. Rollback plan

Se o runtime novo falhar durante o piloto:

1. desligar rotas novas por feature flag;
2. manter telas antigas operando no escopo legado;
3. preservar dados novos para analise;
4. reverter frontend para mutacoes antigas apenas no escopo necessario;
5. nao apagar dados gravados pelo novo runtime.

---

## 8. Read Model Oficial de `workflows`

## 8.1. Principio

O documento `workflows` deve ser consultavel sem joins complexos e sem leitura profunda de arrays para montar as filas principais.

### Consequencia tecnica

Campos desnormalizados nao sao otimizacao opcional. Eles sao requisito tecnico para Firestore.

## 8.2. Campos oficiais do read model

Campos minimos que devem existir no documento `workflows`:

- `requestId`
- `workflowTypeId`
- `workflowVersion`
- `workflowName`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `requesterUserId`
- `requesterName`
- `responsibleUserId`
- `responsibleName`
- `hasResponsible`
- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory`
- `hasPendingActions`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `operationalParticipantIds`
- `slaDays`
- `expectedCompletionAt`
- `submittedAt`
- `lastUpdatedAt`
- `finalizedAt`
- `closedAt`
- `archivedAt`
- `submittedMonthKey`
- `closedMonthKey`
- `isArchived`

## 8.3. Decisoes fechadas do read model

### Owner do chamado

- a arquitetura preve troca futura de owner do tipo com propagacao para chamados ativos elegiveis;
- isso nao faz parte do MVP / piloto inicial;
- a implementacao futura devera atualizar apenas chamados ativos;
- chamados finalizados ou arquivados nao entram nessa propagacao;
- a propagacao futura nao deve alterar:
  - `responsible`
  - `currentStepId`
  - `actionRequests`

### Fechamento

- `closedAt` representa a data de finalizacao;
- `archivedAt` e separado;
- agrupamento da aba `Concluidas` usa `closedAt`.

### SLA

- SLA e do chamado como um todo;
- padrao atual: `5 dias`;
- persistir:
  - `slaDays`
  - `expectedCompletionAt`
- `slaState` sera calculado em read time na primeira iteracao.

### Participantes operacionais

`operationalParticipantIds` inclui:

- owner;
- responsavel atual e anteriores;
- destinatarios de acao.

Esse campo e acumulativo.

## 8.4. Campos que nao devem ser usados como base de query

Nao usar como base primaria de filtro:

- `history`
- `stepStates`
- `actionRequests` inteiro
- `responsible` como objeto
- `submittedBy` como objeto

Esses dados continuam existindo para detalhe, mas nao devem governar a listagem.

## 8.5. Regra de atualizacao do read model

### Abrir chamado

Deve preencher:

- ownership atual;
- `currentStepId`, `currentStepName`, `currentStatusKey`;
- `hasResponsible = false`;
- `hasPendingActions = false`;
- `pendingActionRecipientIds = []`;
- `pendingActionTypes = []`;
- `operationalParticipantIds` com owner atual;
- `slaDays`;
- `expectedCompletionAt`;
- `submittedMonthKey`.

### Atribuir / reatribuir

Deve atualizar:

- `responsibleUserId`
- `responsibleName`
- `hasResponsible`
- `operationalParticipantIds`
- `statusCategory`, se necessario

### Solicitar acao

Deve atualizar:

- `hasPendingActions = true`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `statusCategory = waiting_action`
- `operationalParticipantIds`

### Responder acao

Deve recalcular:

- `pendingActionRecipientIds`
- `pendingActionTypes`
- `hasPendingActions`
- `statusCategory`

### Avancar

Deve atualizar:

- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory = in_progress`

### Finalizar

Deve atualizar:

- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory = finalized`
- `finalizedAt`
- `closedAt`
- `closedMonthKey`
- limpar campos de pendencia de acao

### Arquivar

Deve atualizar:

- `isArchived = true`
- `statusCategory = archived`
- `archivedAt`

### Troca de owner do tipo

Capacidade prevista para implementacao futura, fora do MVP / piloto inicial.

Quando implementada, deve atualizar chamados ativos elegiveis daquele `workflowTypeId`:

- `ownerEmail`
- `ownerUserId`

Sem alterar:

- `responsible`
- `currentStepId`
- `actionRequests`

## 8.6. Read APIs recomendadas

Mesmo com o read model dentro do documento, a recomendacao oficial e expor camadas de leitura server-side:

- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/mine`

Motivos:

- concentrar auth;
- encapsular filtros por role;
- calcular `slaState` no servidor;
- permitir evolucao do backend sem reescrever o frontend.

## 8.7. Pendencias residuais do read model

Ainda restam duas definicoes finas:

- limiar exato para `slaState = at_risk`;
- estrategia operacional exata de propagacao da troca de owner para chamados ativos.

---

## 9. Queries Oficiais por Tela

## 9.1. Aba `Chamados atuais`

Pergunta de negocio:

"Quais chamados ativos estao sob o ownership do usuario logado?"

Query base:

- `ownerUserId == currentUserId`
- `isArchived == false`
- `statusCategory in ['open', 'in_progress', 'waiting_action']`
- ordenacao `lastUpdatedAt desc`

Filtros internos:

- `Aguardando atribuicao` -> `hasResponsible == false`
- `Em andamento` -> `hasResponsible == true && hasPendingActions == false`
- `Aguardando acao` -> `hasPendingActions == true`

## 9.2. Aba `Atribuicoes e acoes`

Esta aba deve usar duas queries separadas.

### Query A: `Atribuido a mim`

- `responsibleUserId == currentUserId`
- `isArchived == false`
- `statusCategory in ['open', 'in_progress', 'waiting_action']`
- ordenacao `lastUpdatedAt desc`

### Query B: `Acao pendente para mim`

- `pendingActionRecipientIds array-contains currentUserId`
- `isArchived == false`
- `statusCategory == waiting_action`
- ordenacao `lastUpdatedAt desc`

## 9.3. Aba `Concluidas`

Query base:

- `operationalParticipantIds array-contains currentUserId`
- `statusCategory in ['finalized', 'archived']`
- ordenacao `closedAt desc`

Agrupamento:

- por `closedMonthKey`
- do mais recente para o mais antigo

## 9.4. `Minhas solicitacoes`

Query base:

- `requesterUserId == currentUserId`
- ordenacao `submittedAt desc`

Agrupamento:

- por `submittedMonthKey`
- do mais recente para o mais antigo

---

## 10. Indices Oficiais Esperados

Indices compostos previstos:

1. `ownerUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
2. `ownerUserId asc, isArchived asc, statusCategory asc, hasResponsible asc, lastUpdatedAt desc`
3. `ownerUserId asc, isArchived asc, statusCategory asc, hasPendingActions asc, lastUpdatedAt desc`
4. `responsibleUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
5. `pendingActionRecipientIds array-contains, isArchived asc, statusCategory asc, lastUpdatedAt desc`
6. `operationalParticipantIds array-contains, statusCategory asc, closedAt desc`
7. `requesterUserId asc, submittedAt desc`

### Provisionamento

Indices compostos do Firestore nao nascem automaticamente.

Eles devem ser provisionados explicitamente via:

- `firestore.indexes.json`; ou
- console do Firebase / Firestore.

---

## 11. Mapeamento Oficial de Estado para UI

O frontend nao deve derivar o label principal usando apenas `statusCategory`.

O estado visual depende da combinacao entre:

- `statusCategory`
- `hasResponsible`
- `hasPendingActions`
- `currentStatusKey`
- `isArchived`
- contexto da aba

### Ordem de precedencia

1. `archived`
2. `finalized`
3. `waiting_action`
4. `open` sem responsavel
5. `open` com responsavel
6. `in_progress`

### Tabela oficial

| condicao | label principal | badge sugerido | CTA principal |
| --- | --- | --- | --- |
| `statusCategory == archived` | `Arquivado` | neutro | `Abrir` |
| `statusCategory == finalized` | `Concluido` | sucesso | `Abrir` |
| `statusCategory == waiting_action` | `Aguardando acao` | aviso | `Abrir` |
| `statusCategory == open && hasResponsible == false` | `Aguardando atribuicao` | alerta | `Abrir` |
| `statusCategory == open && hasResponsible == true` | `Atribuido` | info | `Abrir` |
| `statusCategory == in_progress` | `Em andamento` | info | `Abrir` |

### Badge de SLA

O badge de SLA e camada separada do label principal.

Tabela sugerida:

| `slaState` | badge |
| --- | --- |
| `on_time` | neutro |
| `at_risk` | aviso |
| `overdue` | destrutivo |

### Regra obrigatoria

`currentStepName` deve aparecer separado do label principal.

Exemplo:

- Etapa atual: `Analise do gerente`
- Situacao: `Aguardando atribuicao`

### CTA principal oficial

- `Abrir`

Nao usar como CTA principal de listagem:

- `Avancar fluxo`
- `Concluir etapa`
- `Finalizar`

Essas operacoes pertencem ao modal.

### Acoes secundarias permitidas

| contexto | acao secundaria |
| --- | --- |
| owner sem responsavel | `Atribuir` |
| owner com responsavel | `Reatribuir` |
| owner assumindo caso | `Assumir` |

### Algoritmo de derivacao recomendado

```ts
function deriveUiState(item: WorkflowReadModel) {
  if (item.statusCategory === 'archived') {
    return { key: 'archived', label: 'Arquivado', tone: 'neutral' };
  }

  if (item.statusCategory === 'finalized') {
    return { key: 'finalized', label: 'Concluido', tone: 'success' };
  }

  if (item.statusCategory === 'waiting_action') {
    return { key: 'waiting_action', label: 'Aguardando acao', tone: 'warning' };
  }

  if (item.statusCategory === 'open' && !item.hasResponsible) {
    return { key: 'awaiting_assignment', label: 'Aguardando atribuicao', tone: 'attention' };
  }

  if (item.statusCategory === 'open' && item.hasResponsible) {
    return { key: 'assigned', label: 'Atribuido', tone: 'info' };
  }

  return { key: 'in_progress', label: 'Em andamento', tone: 'info' };
}
```

---

## 12. Frontend Oficial

### Objetivos operacionais de UX

- owner identifica chamados aguardando atribuicao em ate 5 segundos;
- executor identifica rapidamente itens atribuidos e acoes pendentes;
- nenhuma operacao relevante depende de trocar entre paginas separadas;
- `Concluidas` funciona como historico, nao como fila ativa.

### Perfis e dores principais

- owner: precisa triagem, ownership e acompanhamento claro;
- executor: precisa distinguir tarefa atribuida de acao pendente;
- solicitante: precisa leitura consistente do chamado sem ver operacao interna.

### Auth requirements

- `Chamados atuais`: apenas owners;
- `Atribuicoes e acoes`: usuarios com participacao operacional;
- `Concluidas`: usuarios com acesso a pelo menos uma das filas operacionais relevantes.

## 12.1. Tela unificada `Gestao de chamados`

A tela oficial deve manter 3 abas:

- `Chamados atuais`
- `Atribuicoes e acoes`
- `Concluidas`

### Regras

- `Chamados atuais` = fila do owner;
- `Atribuicoes e acoes` = fila operacional do usuario logado;
- `Concluidas` = historico operacional;
- experiencia unificada, sem preservar a identidade antiga de paginas separadas.

### Busca e filtros

Busca global sugerida:

- `requestId`
- workflow
- solicitante

Filtros recomendados:

- workflow
- area
- situacao operacional
- SLA
- periodo

## 12.2. Informacoes minimas por item

Cada card ou linha deve mostrar:

- `requestId`
- `workflowName`
- `requesterName`
- `currentStepName`
- label principal de situacao
- responsavel atual, quando houver
- referencia temporal relevante
- SLA, quando aplicavel

Campos recomendados adicionais:

- badge de tipo de pendencia
- area
- contexto de ownership quando fizer sentido

## 12.3. Modal unificado de detalhes

O modal deve ser a unidade principal de operacao.

### Estrutura base

1. cabecalho;
2. metadados principais;
3. `Dados da solicitacao`;
4. `Etapas do chamado`;
5. `Historico`;
6. `Operacao`, apenas para perfis operacionais;
7. rodape com `Fechar`.

### Regras

- cliente e responsavel usam a mesma base visual;
- cliente nao ve controles operacionais;
- responsavel ve secao `Operacao`;
- comentario operacional deve aparecer com campo ja aberto;
- `Ultima atualizacao` deve aparecer antes de `Tempo de conclusao previsto`;
- acoes do modal devem ser contextuais:
  - `Atribuir`
  - `Reatribuir`
  - `Solicitar acao`
  - `Responder acao`
  - `Concluir etapa`
  - `Finalizar chamado`

### Regra critica

Chamado finalizado nao deve exibir botoes operacionais de sequencia.

### Regra de rodape

O rodape do modal deve ficar com:

- `Fechar`

As demais acoes operacionais devem ficar concentradas na secao `Operacao`.

## 12.4. Tela de abertura do chamado

A tela de abertura pode permanecer proxima da experiencia atual.

Mudanca aprovada:

- `Minhas solicitacoes` deve ser agrupada por mes;
- do mais recente para o mais antigo;
- usando `submittedAt` como referencia.

### Estados de UI obrigatorios

- loading com skeletons coerentes;
- empty state especifico por aba;
- error state com retry;
- comportamento legivel para alto volume.

### Linguagem oficial

Nomes preferenciais:

- `Gestao de chamados`
- `Chamados atuais`
- `Atribuicoes e acoes`
- `Concluidas`

Evitar como identidade principal:

- `Gestao de Solicitacoes`
- `Gestao de Tarefas`

---

## 13. Itens Nao Bloqueantes para o Piloto

Nao bloqueiam o inicio da implementacao do piloto:

- UX completa do admin de versionamento;
- plano completo de migracao dos 33 workflows;
- integracao Slack completa, desde que o runtime ja tenha ponto de extensao para notificacao.

### Pendencias residuais nao bloqueantes

- definir limiar exato de `slaState = at_risk`;
- implementar a troca de owner do tipo com propagacao para chamados ativos elegiveis;
- aprofundar UX completa do admin de versionamento;
- fechar estrategia completa de cutover dos 33 workflows.

---

## 14. Bloqueante Manual Restante Antes do Build

Depois da consolidacao desta documentacao, o unico bloqueante manual restante para iniciar a implementacao do piloto e:

- definir quais workflows entram na primeira area piloto.

Essa definicao deve fechar:

- quais tipos de workflow entram;
- qual versao inicial sera publicada para eles;
- `stepId` e `statusKey` canonicos;
- criterio de aceite ponta a ponta.

---

## 15. Ordem Recomendada de Implementacao

1. runtime server-side dos casos de uso centrais;
2. read APIs para listas e detalhe;
3. tela `Gestao de chamados`;
4. modal unificado;
5. ajuste da tela de abertura / `Minhas solicitacoes`;
6. admin de versionamento;
7. migracao e corte.

---

## 16. Conclusao

O projeto esta oficialmente pronto para iniciar o build do piloto assim que o escopo da primeira area for fechado.

O entendimento oficial consolidado e:

- motor novo, nao remendo no legado;
- workflow versionado por tipo;
- runtime server-side;
- read model desnormalizado em `workflows`;
- UI unificada para operacao;
- transicao progressiva com piloto em paralelo ao legado.
