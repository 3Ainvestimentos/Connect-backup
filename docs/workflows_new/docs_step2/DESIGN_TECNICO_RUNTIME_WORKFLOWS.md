# Design Tecnico - Runtime de Workflows

## 1. Objetivo

Definir o design tecnico do runtime do novo motor de workflows, cobrindo os casos de uso centrais:

- abrir chamado;
- resolver `latestPublishedVersion`;
- atribuir / reatribuir responsavel;
- solicitar acao;
- responder acao;
- avancar etapa;
- finalizar;
- arquivar.

Este documento traduz a arquitetura versionada em operacoes concretas de runtime, alinhadas com a stack atual do projeto: Next.js + Firestore + Firebase Admin.

Documentos base:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-23` | `High` | criacao do design tecnico do runtime do novo motor de workflows |

---

## 2. Escopo

### Incluido

- operacoes de escrita do runtime;
- validacoes de permissao e consistencia;
- leitura de `workflowTypes` e `versions`;
- regras de mutacao do documento em `workflows`;
- contratos de API para os casos de uso centrais;
- estrategia de testes e rollback.

### Nao incluido

- UX completa do admin de versionamento;
- implementacao detalhada do read model da tela unificada;
- integracao completa de notificacoes Slack;
- migracao em massa de todos os workflows legados.

---

## 3. Problema Atual

Hoje o runtime esta espalhado entre:

- `src/contexts/WorkflowsContext.tsx`
- `src/components/requests/RequestApprovalModal.tsx`
- regras derivadas da definicao carregada no frontend

Problemas principais:

- escrita sensivel de negocio acontece no cliente;
- proxima etapa ainda depende de ordem do array de `statuses`;
- finalizacao depende de heuristica textual;
- solicitacao de acao, resposta, atribuicao e mudanca de status se misturam no mesmo modal;
- nao existe camada de dominio explicita para versionamento e passo atual do fluxo.

---

## 4. Decisao Tecnica

O novo runtime deve sair do frontend e passar para uma camada server-side explicita, acionada via rotas `app/api`.

O frontend deixa de escrever diretamente em `workflows` para operacoes criticas e passa a chamar casos de uso de runtime.

### Motivacao

- centralizar regra de negocio;
- garantir uso correto de `workflowTypeId + workflowVersion`;
- reduzir risco de divergencia entre telas;
- preparar notificacoes e auditoria de forma consistente.

---

## 5. Arquitetura Proposta

```text
Frontend
  |
  | POST /api/workflows/runtime/...
  v
Next.js Route Handlers
  |
  v
Workflow Runtime Service
  |-- repository: workflowTypes / versions / workflows / counters
  |-- engine: regras de etapa e transicao
  |-- authz: owner / responsavel / destinatario de acao
  |-- history builder
  |-- notification dispatcher
  v
Firestore
  |-- workflowTypes/{workflowTypeId}
  |-- workflowTypes/{workflowTypeId}/versions/{version}
  |-- workflows/{docId}
  |-- counters/workflowCounter
```

---

## 6. ADRs de Runtime

### ADR-RT-001: Operacoes de runtime em API server-side

**Decisao**

Casos de uso do motor devem ser executados em `app/api`, usando Firebase Admin no servidor.

**Motivo**

Evitar que a regra fique duplicada em context e modal do frontend.

### ADR-RT-002: Documento `workflows` e a fonte de verdade do estado operacional

**Decisao**

O documento em `workflows` guarda o estado vivo do chamado:

- etapa atual;
- status operacional;
- responsavel;
- acoes pendentes;
- historico;
- arquivamento.

**Motivo**

Permitir consultas simples e runtime consistente sem depender da definicao atual.

### ADR-RT-003: `latestPublishedVersion` e resolvido no momento da abertura

**Decisao**

Ao abrir chamado, o runtime consulta `workflowTypes.latestPublishedVersion` e fixa esse valor no chamado.

**Motivo**

Garantir que o chamado nasce preso a uma versao imutavel.

### ADR-RT-004: Finalizacao e separada de arquivamento

**Decisao**

`finalizar` e uma operacao do fluxo.

`arquivar` e uma operacao administrativa posterior.

**Motivo**

Preservar a semantica ja estabelecida no produto.

### ADR-RT-005: Acao pendente nao avanca fluxo automaticamente

**Decisao**

Responder aprovacao / ciente / execucao nao muda etapa por conta propria.

**Motivo**

O resultado da acao retorna ao responsavel, que continua conduzindo o chamado.

---

## 7. Manifesto de Arquivos Propostos

Arquivos novos sugeridos:

- `src/lib/workflows/runtime/types.ts`
- `src/lib/workflows/runtime/repository.ts`
- `src/lib/workflows/runtime/engine.ts`
- `src/lib/workflows/runtime/history.ts`
- `src/lib/workflows/runtime/notifications.ts`
- `src/lib/workflows/runtime/authz.ts`
- `src/lib/workflows/runtime/use-cases/open-request.ts`
- `src/lib/workflows/runtime/use-cases/assign-responsible.ts`
- `src/lib/workflows/runtime/use-cases/request-action.ts`
- `src/lib/workflows/runtime/use-cases/respond-action.ts`
- `src/lib/workflows/runtime/use-cases/advance-step.ts`
- `src/lib/workflows/runtime/use-cases/finalize-request.ts`
- `src/lib/workflows/runtime/use-cases/archive-request.ts`
- `src/app/api/workflows/runtime/requests/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/assign/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/request-action/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/respond-action/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/advance/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/archive/route.ts`

Arquivos a adaptar depois:

- `src/contexts/WorkflowsContext.tsx`
- `src/components/applications/WorkflowSubmissionModal.tsx`
- `src/components/requests/RequestApprovalModal.tsx`

---

## 8. Modelo Operacional do Documento `workflows`

Campos centrais usados pelo runtime:

- `workflowTypeId`
- `workflowVersion`
- `ownerEmail`
- `currentStepId`
- `statusCategory`
- `responsible`
- `stepStates`
- `actionRequests`
- `history`
- `isArchived`

### Estrutura recomendada de `actionRequests`

Para o runtime inicial, recomenda-se usar array de objetos dentro do proprio documento:

```ts
type WorkflowActionRequest = {
  actionRequestId: string;
  stepId: string;
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  requestedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  recipient: {
    userId: string;
    userName: string;
    userEmail?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'executed';
  requestedAt: string;
  respondedAt?: string;
  responseComment?: string;
  responseAttachmentUrl?: string;
};
```

### Observacao

Se o volume de acoes por chamado crescer muito, esse bloco pode migrar para subcolecao no futuro. Para a primeira iteracao, o array no documento principal simplifica implementacao e leitura.

---

## 9. Regras Gerais de Runtime

### Regra 1

Todo caso de uso deve carregar:

- o usuario autenticado;
- o documento do chamado, quando aplicavel;
- o `workflowType`;
- a `version` correspondente do chamado.

### Regra 2

Nenhuma operacao deve consultar a definicao atual por nome de workflow.

Sempre usar:

- `workflowTypeId`
- `workflowVersion`

### Regra 3

Toda operacao que altera estado deve:

- atualizar `lastUpdatedAt`;
- registrar evento em `history`;
- atualizar `statusCategory`, quando aplicavel;
- validar permissao do ator;
- validar precondicoes do fluxo.

### Regra 4

Notificacoes nao devem decidir regra.

Elas sao efeito colateral da operacao concluida com sucesso.

---

## 10. Caso de Uso: Abrir Chamado

### Endpoint sugerido

`POST /api/workflows/runtime/requests`

### Input

```ts
type OpenWorkflowRequestInput = {
  workflowTypeId: string;
  formData: Record<string, unknown>;
};
```

### Passos

1. autenticar usuario via Firebase ID token;
2. carregar `workflowTypes/{workflowTypeId}`;
3. validar `active === true`;
4. validar `allowedUserIds`;
5. resolver `latestPublishedVersion`;
6. carregar `workflowTypes/{workflowTypeId}/versions/{version}`;
7. gerar `requestId` sequencial em `counters/workflowCounter`;
8. copiar `ownerEmail` vigente de `workflowTypes`;
9. inicializar `stepStates` com base em `stepOrder`;
10. marcar `initialStepId` como etapa atual;
11. criar documento em `workflows`;
12. registrar historico inicial;
13. disparar notificacoes de abertura.

### Escrita sugerida

```ts
{
  requestId,
  workflowTypeId,
  workflowVersion: latestPublishedVersion,
  workflowName: workflowType.name,
  areaId: workflowType.areaId,
  ownerEmail: workflowType.ownerEmail,
  submittedBy,
  submittedAt: now,
  lastUpdatedAt: now,
  formData,
  currentStepId: version.initialStepId,
  statusCategory: 'open',
  responsible: null,
  stepStates: buildInitialStepStates(version),
  actionRequests: [],
  history: [
    request_created,
    entered_step
  ],
  isArchived: false,
  viewedBy: []
}
```

### Regras

- se `latestPublishedVersion` estiver ausente, retornar erro de configuracao;
- `ownerEmailAtPublish` da versao nao governa a abertura;
- o `ownerEmail` do chamado e copiado de `workflowTypes` no momento da abertura.

### Notificacoes

- notificar solicitante confirmando abertura;
- notificar owner atual do tipo, se diferente do solicitante.

---

## 11. Resolver `latestPublishedVersion`

### Fonte autoritativa

`workflowTypes/{workflowTypeId}.latestPublishedVersion`

### Regras

- deve existir e ser numerico;
- o documento da versao deve existir;
- `state` da versao deve ser `published`;
- se qualquer etapa falhar, nao abrir o chamado.

### Helper sugerido

```ts
async function resolvePublishedVersion(workflowTypeId: string) {
  const workflowType = await repo.getWorkflowType(workflowTypeId);
  if (!workflowType?.active) throw new RuntimeError('WORKFLOW_TYPE_INACTIVE');
  if (!workflowType.latestPublishedVersion) throw new RuntimeError('PUBLISHED_VERSION_NOT_FOUND');

  const version = await repo.getWorkflowVersion(workflowTypeId, workflowType.latestPublishedVersion);
  if (!version || version.state !== 'published') {
    throw new RuntimeError('INVALID_PUBLISHED_VERSION');
  }

  return { workflowType, version };
}
```

---

## 12. Caso de Uso: Atribuir / Reatribuir Responsavel

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/assign`

### Input

```ts
type AssignResponsibleInput = {
  responsibleUserId: string;
  comment?: string;
};
```

### Quem pode executar

- owner do chamado;
- ou usuario com permissao operacional equivalente, se o produto autorizar.

### Passos

1. autenticar usuario;
2. carregar chamado;
3. validar que nao esta arquivado;
4. validar que nao esta finalizado;
5. validar destinatario;
6. atualizar `responsible`;
7. registrar historico:
   - `responsible_assigned` ou `responsible_reassigned`
8. manter `currentStepId`;
9. atualizar `statusCategory` para `in_progress`, se necessario;
10. disparar notificacoes.

### Regra funcional

- a primeira atribuicao cria o `responsible`;
- reatribuicoes futuras atualizam o `responsible`;
- se o produto quiser preservar o primeiro responsavel historico no futuro, isso deve ser feito em campo separado, nao travando a mudanca do responsavel atual.

### Notificacoes

- notificar responsavel novo;
- opcionalmente notificar solicitante.

---

## 13. Caso de Uso: Solicitar Acao

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/request-action`

### Input

```ts
type RequestActionInput = {
  recipients: string[];
  actionType: 'approval' | 'acknowledgement' | 'execution';
  comment?: string;
};
```

### Quem pode executar

- responsavel atual do chamado;
- owner, se ainda estiver operando o chamado antes da atribuicao.

### Precondicoes

- chamado ativo;
- etapa atual permite solicitacao de acao;
- nao existir acao pendente duplicada para o mesmo usuario na mesma etapa e no mesmo tipo.

### Passos

1. autenticar usuario;
2. carregar chamado e versao;
3. validar permissao do ator;
4. validar step atual e configuracao da acao;
5. criar `actionRequests` pendentes;
6. atualizar `lastUpdatedAt`;
7. registrar evento `action_requested`;
8. atualizar `statusCategory` para `waiting_action`;
9. disparar notificacoes.

### Efeito no fluxo

- `currentStepId` nao muda;
- `responsible` nao muda;
- chamado entra em espera operacional.

### Notificacoes

- Connect + Slack para cada destinatario de acao;
- opcionalmente notificacao interna para o responsavel confirmando envio.

---

## 14. Caso de Uso: Responder Acao

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/respond-action`

### Input

```ts
type RespondActionInput = {
  actionRequestId: string;
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
  comment?: string;
  attachmentUrl?: string;
};
```

### Quem pode executar

- apenas o destinatario da acao pendente.

### Precondicoes

- acao existe;
- acao esta `pending`;
- usuario autenticado e o destinatario;
- se tipo for `execution` e a configuracao exigir comentario, comentario deve existir.

### Passos

1. autenticar usuario;
2. carregar chamado;
3. localizar `actionRequestId`;
4. validar ownership da acao;
5. atualizar status e timestamps da acao;
6. registrar `action_responded` em `history`;
7. se nao houver mais acoes pendentes na etapa atual, voltar `statusCategory` para `in_progress`;
8. disparar notificacao para o responsavel.

### Regra funcional

- responder acao nao avanca etapa automaticamente;
- a resposta devolve o controle ao responsavel do chamado.

---

## 15. Caso de Uso: Avancar Etapa

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/advance`

### Input

```ts
type AdvanceStepInput = {
  comment?: string;
};
```

### Quem pode executar

- responsavel atual;
- owner, enquanto ainda estiver conduzindo o chamado antes de atribuicao.

### Precondicoes

- chamado ativo;
- existe `currentStepId`;
- nao ha `actionRequests` pendentes para a etapa atual;
- proxima etapa existe;
- proxima etapa nao e `kind: final`.

### Passos

1. autenticar usuario;
2. carregar chamado e versao;
3. localizar indice atual em `stepOrder`;
4. localizar proxima etapa;
5. bloquear se proxima etapa for final;
6. marcar etapa atual como `completed`;
7. marcar proxima etapa como `active`;
8. atualizar `currentStepId`;
9. atualizar `statusCategory` para `in_progress`;
10. registrar eventos:
    - `step_completed`
    - `entered_step`

### Regra funcional

- `advance` so serve para transicoes entre etapas operacionais;
- se o proximo passo for terminal, a UI deve chamar `finalize`, nao `advance`.

---

## 16. Caso de Uso: Finalizar

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/finalize`

### Input

```ts
type FinalizeRequestInput = {
  comment?: string;
};
```

### Quem pode executar

- responsavel atual;
- ou owner autorizado a encerrar o chamado.

### Precondicoes

- chamado ativo;
- nao ha acao pendente na etapa atual;
- existe etapa terminal prevista na versao apos a etapa atual, ou a propria etapa atual e terminal conforme regra do fluxo.

### Passos

1. autenticar usuario;
2. carregar chamado e versao;
3. resolver etapa final aplicavel;
4. marcar etapa atual como concluida, se necessario;
5. marcar etapa final como concluida;
6. definir `currentStepId` para a etapa final;
7. definir `statusCategory = finalized`;
8. registrar `request_finalized` em `history`;
9. disparar notificacoes.

### Resultado

- chamado finalizado continua visivel;
- arquivamento ainda nao aconteceu.

---

## 17. Caso de Uso: Arquivar

### Endpoint sugerido

`POST /api/workflows/runtime/requests/{id}/archive`

### Input

```ts
type ArchiveRequestInput = {
  comment?: string;
};
```

### Quem pode executar

- owner;
- ou perfil administrativo autorizado.

### Precondicoes

- chamado finalizado;
- chamado ainda nao arquivado.

### Passos

1. autenticar usuario;
2. carregar chamado;
3. validar `statusCategory === finalized`;
4. atualizar `isArchived = true`;
5. atualizar `statusCategory = archived`;
6. registrar `request_archived` em `history`.

### Regra funcional

- arquivar nao altera `currentStepId`;
- arquivar e operacao de organizacao, nao de fluxo.

---

## 18. Contratos de API

### Autenticacao

Mesmo padrao ja usado em `src/app/api/billing/route.ts`:

- header `Authorization: Bearer <idToken>`
- validacao via Firebase Admin

### Resposta padrao de sucesso

```ts
type RuntimeSuccess<T> = {
  ok: true;
  data: T;
};
```

### Resposta padrao de erro

```ts
type RuntimeErrorResponse = {
  ok: false;
  code: string;
  message: string;
};
```

### Erros esperados

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

## 19. Padroes de Codigo Recomendados

### Resolver proxima etapa

```ts
function getNextStepId(stepOrder: string[], currentStepId: string): string | null {
  const currentIndex = stepOrder.indexOf(currentStepId);
  if (currentIndex === -1) return null;
  return stepOrder[currentIndex + 1] ?? null;
}
```

### Verificar pendencia de acao na etapa atual

```ts
function hasPendingActionsForCurrentStep(request: WorkflowRequestRuntime): boolean {
  return request.actionRequests.some(
    ar => ar.stepId === request.currentStepId && ar.status === 'pending'
  );
}
```

### Inicializar `stepStates`

```ts
function buildInitialStepStates(version: WorkflowDefinitionVersion, now: string) {
  const states: Record<string, WorkflowStepState> = {};

  version.stepOrder.forEach(stepId => {
    states[stepId] = { state: 'pending' };
  });

  states[version.initialStepId] = {
    state: 'active',
    startedAt: now,
  };

  return states;
}
```

---

## 20. Strategia de Implementacao

### Fase 1

- criar tipos e repositorio de runtime;
- implementar `resolvePublishedVersion`;
- implementar `open-request`;
- implementar `assign-responsible`.

### Fase 2

- implementar `request-action`;
- implementar `respond-action`;
- implementar `advance-step`.

### Fase 3

- implementar `finalize-request`;
- implementar `archive-request`;
- adaptar frontend para consumir APIs.

### Fase 4

- integrar notificacoes Slack alem do Connect;
- endurecer logs, observabilidade e reprocessamento.

---

## 21. Testing Strategy

### Unitarios

- resolver versao publicada;
- montar `stepStates` iniciais;
- calcular proxima etapa;
- bloquear `advance` com acao pendente;
- bloquear `archive` sem finalizacao;
- atualizar `statusCategory` em cada caso de uso.

### Integracao

- abrir chamado cria documento correto em `workflows`;
- atribuicao grava `responsible` e `history`;
- solicitacao de acao cria pendencias e muda `statusCategory`;
- resposta de acao atualiza apenas a acao correta;
- `advance` muda `currentStepId`;
- `finalize` marca etapa final e status finalizado;
- `archive` seta `isArchived`.

### Regressao funcional

Executar fluxo piloto ponta a ponta:

1. solicitante abre chamado;
2. owner recebe;
3. owner atribui responsavel;
4. responsavel solicita acao;
5. terceiro responde;
6. responsavel avanca etapa;
7. responsavel finaliza;
8. owner arquiva.

---

## 22. Rollback Plan

Se a migracao do runtime falhar:

1. manter colecao atual `workflowDefinitions` como referencia durante a transicao;
2. manter telas antigas operando em paralelo por feature flag;
3. desligar as rotas novas de runtime;
4. reverter frontend para mutacoes antigas apenas no escopo piloto;
5. preservar dados novos gravados em `workflows` para analise, sem apagar historico.

---

## 23. Proximo Passo

O proximo artefato derivado deste documento deve ser:

- o design tecnico do read model consumido pela tela `Gestao de chamados`;
- ou a implementacao do piloto da primeira area validada.
