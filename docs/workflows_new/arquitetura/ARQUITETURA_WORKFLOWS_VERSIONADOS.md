# Arquitetura Proposta para Workflows Versionados

## 1. Objetivo

Este documento formaliza a proposta de arquitetura para a refatoracao do sistema de workflows da 3A RIVA Connect, com foco em:

- desacoplar execucao de chamado da definicao mutavel do workflow;
- permitir reordenacao de etapas sem quebrar identidade tecnica;
- garantir que chamados em andamento continuem vivos mesmo quando o workflow for alterado;
- preparar a base do novo motor para responsabilidade, acoes e notificacoes Connect + Slack;
- reduzir risco operacional durante a migracao do modelo atual para o modelo novo.

Este documento cobre principalmente a estrutura de dados e o versionamento de definicoes.

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-16` | `High` | decisao consolidada de `stepId` auto-gerado e nao editavel, remocao de `clientLabel` e obrigatoriedade de nova versao para qualquer alteracao em `stepName` ou no fluxo |

---

## 2. Base de analise

### Arquivos observados

- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/ApplicationsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/WorkflowDefinitionForm.tsx`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/PLANO_PROXIMAS_ETAPAS.md`
- `/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/MATRIZ_VALIDACAO_REGRAS_NEGOCIO_WORKFLOWS.md`

### Fato comprovado no sistema atual

- O workflow atual e definido em `workflowDefinitions`.
- O chamado atual e salvo em `workflows`.
- O status inicial e inferido pelo primeiro item de `statuses`.
- O proximo status e inferido pela posicao seguinte no array `statuses`.
- O motor atual consulta a definicao carregada no frontend para interpretar etapa atual e proxima etapa.
- A criacao do chamado acontece antes da persistencia final do `formData`.
- Ha workflows ativos com `status.id` duplicado e `field.id` duplicado.
- Ha pelo menos um workflow ativo fora do `workflowOrder` da area.

---

## 3. Problema estrutural atual

O problema central do modelo atual nao e apenas a existencia de inconsistencias de cadastro. O problema estrutural e que:

- identidade do workflow;
- ordem das etapas;
- definicao publicada;
- e execucao do chamado

estao acopladas de forma fragil.

Hoje, o sistema trabalha como se uma unica definicao mutavel representasse ao mesmo tempo:

- o tipo do workflow;
- a versao atual do processo;
- e a regra que governa todos os chamados antigos e novos.

Esse desenho cria quatro riscos principais.

### 3.1. Ordem da etapa virou identidade tecnica

Hoje, a primeira etapa do array vira o status inicial, e a proxima etapa e calculada pela posicao do item no array. Isso significa que a ordem da lista nao e apenas visual: ela e parte da regra de negocio do motor.

Consequencia:

- reordenar etapas muda comportamento tecnico;
- excluir uma etapa pode quebrar fluxo em andamento;
- inserir uma etapa no meio altera a progressao de chamados novos e potencialmente antigos;
- a semantica da etapa fica subordinada a posicao.

### 3.2. A definicao viva pode impactar chamados antigos

Como a leitura da definicao acontece no runtime e o sistema atual depende dela para exibir e avancar o fluxo, editar um workflow hoje pode impactar chamados ja abertos.

Consequencia:

- um chamado aberto pode perder referencia correta da etapa;
- o historico pode ficar ambiguo;
- a UI pode nao encontrar mais a etapa esperada;
- o motor pode nao conseguir seguir ate a finalizacao.

### 3.3. IDs de etapa ainda sao frageis para um workflow movel

O formulario administrativo atual ainda trabalha com `statuses` em ordem e sugere IDs genericos como `etapa_N`.

Consequencia:

- o ID pode nascer acoplado a posicao;
- mover etapa fica semanticamente confuso;
- uma etapa pode mudar de lugar e continuar com identidade pouco util;
- o motor fica mais exposto a regressao quando o fluxo evolui.

### 3.4. Chamados em andamento nao estao formalmente presos a uma regra imutavel

Hoje, o chamado guarda `type`, `status` e historico, mas nao guarda uma referencia explicita a uma versao da definicao.

Consequencia:

- o chamado nao sabe formalmente sob qual versao nasceu;
- a continuidade do fluxo depende de uma definicao externa que pode mudar;
- a evolucao do processo fica perigosa do ponto de vista operacional.

---

## 4. Requisitos arquiteturais da solucao

Para suportar a refatoracao do motor, a arquitetura proposta precisa atender aos requisitos abaixo.

### 4.1. Mobilidade de etapas

- a ordem das etapas deve poder mudar;
- a identidade da etapa nao pode depender da posicao;
- a ordenacao deve ser metadado de fluxo, nao identidade tecnica.

### 4.2. IDs de etapa unicos, estaveis e auto-gerados

- cada etapa deve ter `stepId` proprio;
- `stepId` deve ser gerado pelo sistema;
- `stepId` deve ser oculto ou somente leitura no admin;
- `stepId` nao deve depender de indice;
- `stepId` nao deve ser reutilizado;
- `stepId` deve funcionar como identidade tecnica opaca da etapa.

Formatos aceitaveis:

- id numerico interno;
- id alfanumerico curto;
- token tecnico com prefixo, por exemplo `stp_x7a21`.

Formatos a evitar:

- id derivado da posicao da etapa no fluxo;
- id recalculado a cada reorder;
- id editavel manualmente pelo usuario.

### 4.3. Compatibilidade com chamados em andamento

- excluir uma etapa em uma nova edicao nao pode travar chamados antigos;
- novos chamados devem usar a versao mais recente publicada;
- chamados antigos devem continuar usando a versao com que nasceram;
- o chamado deve conseguir seguir ate o fim sem depender da definicao atual.

### 4.4. Politica de alteracao de etapa

- toda etapa tera `stepName` como nome exibido e editavel;
- qualquer alteracao em `stepName` exige nova versao;
- qualquer alteracao em ordem, criacao ou exclusao de etapa exige nova versao;
- versao publicada nao pode sofrer alteracao retroativa de nome ou estrutura.

### 4.5. Base segura para o novo motor

- o motor deve operar por `workflowTypeId`, `workflowVersion` e `currentStepId`;
- a regra deve sair do frontend e migrar para servicos backend;
- notificacoes devem disparar a partir de eventos do motor, nao de heuristicas de tela;
- atribuicao, responsabilidade e acoes devem ser casos de uso do motor.

---

## 5. Decisao arquitetural proposta

### 5.1. Separar tipo, versao e instancia

A arquitetura nova separa explicitamente tres conceitos:

1. `workflowType`
   - identidade estavel do tipo de workflow;
2. `workflowDefinitionVersion`
   - uma definicao publicada ou em rascunho daquele tipo;
3. `workflow`
   - a instancia concreta do chamado.

### 5.2. Versionamento por tipo

Cada tipo de workflow tera um `workflowTypeId` estavel.

Cada nova publicacao gerara uma nova `version`.

Exemplo:

- `workflowTypeId = solicitacao_pagamento`
- versao 1
- versao 2
- versao 3

Regra operacional:

- novos chamados usam a versao publicada mais recente;
- chamados antigos continuam presos a versao com que nasceram;
- versoes publicadas nao podem ser editadas em-place.

### 5.3. Etapa com identidade propria e nome editavel versionado

Cada etapa tera `stepId` proprio e estavel.

Cada etapa tambem tera `stepName` como nome exibido da etapa.

`stepId` sera identidade tecnica auto-gerada pelo sistema.

`stepName` sera dado funcional visivel na operacao.

A ordem de execucao deixa de ser inferida pelo indice do array de status atual e passa a ser representada explicitamente pela definicao versionada.

Qualquer mudanca em `stepName` ou na estrutura do fluxo gera nova versao.

### 5.4. Chamado referenciado por versao

Cada chamado passara a guardar no minimo:

- `workflowTypeId`
- `workflowVersion`
- `currentStepId`

Com isso, o chamado nao depende da definicao viva do admin. Ele depende da versao explicita que o governa.

### 5.5. Estrategia de snapshot

Para este projeto, a recomendacao inicial e:

- nao salvar snapshot completo da definicao inteira dentro do chamado;
- usar a definicao versionada como fonte autoritativa;
- manter no chamado apenas referencias tecnicas e alguns campos denormalizados de exibicao, se necessario.

Esta decisao so e segura se as regras abaixo forem respeitadas:

- versao publicada e imutavel;
- versao antiga nao e apagada;
- o motor sempre resolve a regra pela combinacao `workflowTypeId + workflowVersion`;
- o frontend para de buscar proxima etapa pela definicao atual.

### 5.6. Ordem e identidade devem ser estruturas separadas

Para evitar regressao conceitual, a recomendacao e nao modelar etapas apenas como um array ordenado de objetos.

Em vez disso, a definicao versionada deve separar:

- `stepOrder`
  - array que representa a sequencia do fluxo naquela versao;
- `stepsById`
  - mapa com a identidade e os metadados de cada etapa.

Esse desenho deixa claro que:

- identidade nao depende da ordem;
- ordem pode mudar entre versoes;
- o motor deve operar por `stepId`.

---

## 6. Diagrama da arquitetura proposta

```text
                           +----------------------+
                           |   workflowAreas      |
                           |  (agrupamento atual) |
                           +----------+-----------+
                                      |
                                      |
                    +-----------------v------------------+
                    |           workflowTypes            |
                    | identidade estavel do workflow     |
                    | ex: solicitacao_pagamento          |
                    +-----------------+------------------+
                                      |
                       1 workflowType | N versions
                                      |
                    +-----------------v------------------+
                    |    workflowDefinitionVersions      |
                    | definicao versionada do processo   |
                    | ex: solicitacao_pagamento v3       |
                    +-----------------+------------------+
                                      |
                   1 definitionVersion| N workflow requests
                                      |
                    +-----------------v------------------+
                    |            workflows               |
                    | chamada concreta em execucao       |
                    | guarda typeId + version + stepId   |
                    +------------------------------------+
```

---

## 7. Colecoes propostas

## 7.1. `workflowTypes`

### Responsabilidade

Representar a identidade estavel de cada tipo de workflow, independentemente de quantas versoes esse workflow venha a ter.

### Papel arquitetural

- e a ancora de identidade do processo;
- permite separar o "tipo do workflow" da "versao da definicao";
- evita que a definicao viva seja tratada como identidade permanente.

### Documento sugerido

`workflowTypes/{workflowTypeId}`

### Campos sugeridos

| campo | tipo | obrigatorio | observacao |
| --- | --- | --- | --- |
| `workflowTypeId` | `string` | sim | igual ao id do documento |
| `legacyDefinitionId` | `string` | nao | id legado de `workflowDefinitions`, para migracao |
| `name` | `string` | sim | nome atual de exibicao |
| `subtitle` | `string` | nao | subtitulo atual, se houver |
| `description` | `string` | sim | descricao funcional do workflow |
| `icon` | `string` | sim | icone usado na UI |
| `areaId` | `string` | sim | referencia a `workflowAreas` |
| `status` | `string` | sim | `active` ou `inactive` |
| `latestDraftVersion` | `number` | nao | versao em rascunho, se existir |
| `latestPublishedVersion` | `number` | nao | versao publicada mais recente |
| `createdAt` | `string` | sim | ISO date-time |
| `createdBy` | `string` | nao | id do usuario |
| `updatedAt` | `string` | sim | ISO date-time |
| `updatedBy` | `string` | nao | id do usuario |

### Exemplo

```json
{
  "workflowTypeId": "solicitacao_pagamento",
  "legacyDefinitionId": "OA1RjWNmKby613e6YgQ9",
  "name": "Solicitacao de Pagamentos",
  "subtitle": "Financeiro",
  "description": "Solicitacao operacional de pagamentos.",
  "icon": "CreditCard",
  "areaId": "pZi0P2z6yVSsollt4cFt",
  "status": "active",
  "latestDraftVersion": 4,
  "latestPublishedVersion": 3,
  "createdAt": "2026-03-16T10:00:00Z",
  "createdBy": "BFG2",
  "updatedAt": "2026-03-16T10:00:00Z",
  "updatedBy": "BFG2"
}
```

### Observacoes

- `ownerEmail` nao fica aqui como fonte principal.
- Propriedade operacional deve viver na versao, porque pode mudar entre versoes.

---

## 7.2. `workflowDefinitionVersions`

### Responsabilidade

Representar a definicao versionada do workflow.

### Papel arquitetural

- concentra a regra publicada do processo;
- permite reordenar etapas sem perder identidade;
- preserva historico funcional por versao;
- garante que chamados antigos continuem presos a regra correta.

### Documento sugerido

`workflowDefinitionVersions/{workflowTypeId}__v{version}`

Exemplo:

- `workflowDefinitionVersions/solicitacao_pagamento__v3`

### Regra de mutabilidade

- documento em `draft` pode ser editado;
- documento em `published` passa a ser imutavel;
- documento publicado nao pode ser sobrescrito;
- nova alteracao relevante gera nova versao.

### Campos sugeridos

| campo | tipo | obrigatorio | observacao |
| --- | --- | --- | --- |
| `definitionVersionId` | `string` | sim | igual ao id do documento |
| `workflowTypeId` | `string` | sim | referencia ao tipo |
| `version` | `number` | sim | versao numerica |
| `state` | `string` | sim | `draft`, `published` ou `retired` |
| `publishedAt` | `string` | nao | preenchido quando publicado |
| `publishedBy` | `string` | nao | id do usuario |
| `name` | `string` | sim | nome de exibicao da versao |
| `subtitle` | `string` | nao | subtitulo |
| `description` | `string` | sim | descricao da versao |
| `icon` | `string` | sim | icone da versao |
| `areaId` | `string` | sim | area da versao |
| `ownerEmail` | `string` | sim | owner inicial da fila |
| `allowedUserIds` | `string[]` | sim | controle de acesso de abertura |
| `defaultSlaDays` | `number` | nao | SLA padrao |
| `slaRules` | `array` | nao | regras condicionais de SLA |
| `routingRules` | `array` | nao | regras condicionais de roteamento/notificacao |
| `fields` | `array` | sim | definicao do formulario |
| `flow.initialStepId` | `string` | sim | etapa inicial |
| `flow.finalStepIds` | `string[]` | sim | etapas terminais |
| `flow.stepOrder` | `string[]` | sim | ordem do fluxo na versao |
| `flow.stepsById` | `map` | sim | definicao das etapas por id |
| `createdAt` | `string` | sim | ISO date-time |
| `createdBy` | `string` | nao | id do usuario |
| `notes` | `string` | nao | anotacao de publicacao |

### Estrutura sugerida de `stepsById`

Cada etapa deve conter apenas informacoes que pertencem a propria definicao da etapa.

Campos sugeridos:

| campo | tipo | obrigatorio | observacao |
| --- | --- | --- | --- |
| `stepId` | `string` | sim | id tecnico estavel, auto-gerado pelo sistema |
| `stepName` | `string` | sim | nome exibido da etapa naquela versao |
| `kind` | `string` | sim | `start`, `work`, `action`, `final` |
| `action` | `object` | nao | definicao da acao pedida a terceiros |
| `assignmentMode` | `string` | nao | comportamento esperado de atribuicao |
| `allowComment` | `boolean` | nao | comentario operacional opcional |
| `allowAttachment` | `boolean` | nao | anexo operacional opcional |

### Exemplo

```json
{
  "definitionVersionId": "solicitacao_pagamento__v3",
  "workflowTypeId": "solicitacao_pagamento",
  "version": 3,
  "state": "published",
  "publishedAt": "2026-03-16T12:00:00Z",
  "publishedBy": "BFG2",
  "name": "Solicitacao de Pagamentos",
  "subtitle": "Financeiro",
  "description": "Fluxo canonico de solicitacao de pagamentos.",
  "icon": "CreditCard",
  "areaId": "pZi0P2z6yVSsollt4cFt",
  "ownerEmail": "financeiro@empresa.com.br",
  "allowedUserIds": ["all"],
  "defaultSlaDays": 3,
  "slaRules": [],
  "routingRules": [],
  "fields": [
    {
      "id": "centro_custo",
      "label": "Centro de custo",
      "type": "text",
      "required": true
    },
    {
      "id": "valor_pagamento",
      "label": "Valor",
      "type": "text",
      "required": true
    }
  ],
  "flow": {
    "initialStepId": "stp_a1f0",
    "finalStepIds": ["stp_c9m4"],
    "stepOrder": [
      "stp_a1f0",
      "stp_b7k2",
      "stp_c9m4"
    ],
    "stepsById": {
      "stp_a1f0": {
        "stepId": "stp_a1f0",
        "stepName": "Solicitacao Aberta",
        "kind": "start"
      },
      "stp_b7k2": {
        "stepId": "stp_b7k2",
        "stepName": "Em analise - Financeiro",
        "kind": "work",
        "assignmentMode": "manual_owner_or_responsible",
        "allowComment": true,
        "allowAttachment": true
      },
      "stp_c9m4": {
        "stepId": "stp_c9m4",
        "stepName": "Finalizado",
        "kind": "final"
      }
    }
  },
  "createdAt": "2026-03-16T11:30:00Z",
  "createdBy": "BFG2",
  "notes": "Versao publicada apos validacao funcional."
}
```

### Justificativa do modelo `stepOrder + stepsById`

- evita que o motor trate a posicao do array como identidade;
- permite reorder sem perder referencia tecnica;
- deixa explicito que `stepId` e a chave real do fluxo;
- facilita manter nome exibido e metadados da etapa organizados por identidade.

### Sobre transicoes

Na primeira iteracao do novo motor, a recomendacao e manter o fluxo linear por ordem da versao.

Ou seja:

- a sequencia e determinada por `flow.stepOrder`;
- o motor avanca para o proximo `stepId` da lista daquela versao.

Transicoes explicitas por grafo podem ser adicionadas em fase posterior, caso o produto precise de branching real.

---

## 7.3. `workflows`

### Responsabilidade

Representar o chamado concreto em execucao.

### Papel arquitetural

- concentra estado operacional do chamado;
- referencia a versao que governa o fluxo;
- guarda historico, responsabilidade, acoes pendentes e estado por etapa;
- deixa de depender da definicao atual do workflow.

### Documento sugerido

`workflows/{firestoreDocId}`

`requestId` continua como identificador sequencial visivel ao usuario.

### Campos sugeridos

| campo | tipo | obrigatorio | observacao |
| --- | --- | --- | --- |
| `requestId` | `string` | sim | id sequencial para UI |
| `workflowTypeId` | `string` | sim | tipo do workflow |
| `workflowVersion` | `number` | sim | versao usada pelo chamado |
| `workflowName` | `string` | sim | denormalizacao de exibicao |
| `areaId` | `string` | sim | denormalizacao de exibicao e filtro |
| `ownerEmail` | `string` | sim | owner da versao no momento da abertura |
| `submittedBy` | `object` | sim | usuario solicitante |
| `submittedAt` | `string` | sim | ISO date-time |
| `lastUpdatedAt` | `string` | sim | ISO date-time |
| `formData` | `map` | sim | dados do formulario |
| `currentStepId` | `string` | sim | etapa atual do chamado |
| `statusCategory` | `string` | sim | `open`, `in_progress`, `waiting_action`, `finalized`, `archived` |
| `responsible` | `object` | nao | primeiro atribuido se torna responsavel |
| `actionRequests` | `array` ou `map` | nao | acoes pendentes e respondidas |
| `stepStates` | `map` | sim | estado por etapa |
| `history` | `array` | sim | eventos auditaveis |
| `isArchived` | `boolean` | sim | arquivamento separado da finalizacao |
| `viewedBy` | `string[]` | nao | compatibilidade com inbox |

### Estrutura sugerida de `stepStates`

`stepStates` deve ser indexado por `stepId`.

Campos sugeridos por etapa:

| campo | tipo | obrigatorio | observacao |
| --- | --- | --- | --- |
| `state` | `string` | sim | `pending`, `active`, `completed`, `skipped` |
| `startedAt` | `string` | nao | quando a etapa virou ativa |
| `completedAt` | `string` | nao | quando a etapa foi concluida |
| `completedBy` | `object` | nao | usuario que concluiu a etapa |

### Exemplo

```json
{
  "requestId": "0638",
  "workflowTypeId": "solicitacao_pagamento",
  "workflowVersion": 3,
  "workflowName": "Solicitacao de Pagamentos",
  "areaId": "pZi0P2z6yVSsollt4cFt",
  "ownerEmail": "financeiro@empresa.com.br",
  "submittedBy": {
    "userId": "JCO",
    "userName": "Joao Victor Cavalcante Ottoni",
    "userEmail": "joao.ottoni@3ainvestimentos.com.br"
  },
  "submittedAt": "2026-03-16T13:00:00Z",
  "lastUpdatedAt": "2026-03-16T13:20:00Z",
  "formData": {
    "centro_custo": "Marketing",
    "valor_pagamento": "1500,00"
  },
  "currentStepId": "stp_b7k2",
  "statusCategory": "in_progress",
  "responsible": {
    "userId": "JPU",
    "userName": "Joao Pedro Pompeu Ulhoa"
  },
  "stepStates": {
    "stp_a1f0": {
      "state": "completed",
      "startedAt": "2026-03-16T13:00:00Z",
      "completedAt": "2026-03-16T13:01:00Z",
      "completedBy": {
        "userId": "SYSTEM",
        "userName": "Sistema de Workflows"
      }
    },
    "stp_b7k2": {
      "state": "active",
      "startedAt": "2026-03-16T13:01:00Z"
    },
    "stp_c9m4": {
      "state": "pending"
    }
  },
  "actionRequests": [],
  "history": [
    {
      "eventType": "request_created",
      "timestamp": "2026-03-16T13:00:00Z",
      "stepId": "stp_a1f0",
      "performedBy": {
        "userId": "JCO",
        "userName": "Joao Victor Cavalcante Ottoni"
      },
      "notes": "Solicitacao criada."
    },
    {
      "eventType": "entered_step",
      "timestamp": "2026-03-16T13:01:00Z",
      "stepId": "stp_b7k2",
      "performedBy": {
        "userId": "SYSTEM",
        "userName": "Sistema de Workflows"
      },
      "notes": "Chamado enviado para a fila do owner."
    }
  ],
  "isArchived": false,
  "viewedBy": []
}
```

### Observacoes importantes

- a referencia autoritativa do fluxo e `workflowTypeId + workflowVersion`;
- `workflowName` e `areaId` podem ser denormalizados por conveniencia de consulta e UI;
- `currentStepId` substitui o uso de `status` como string generica e ambigua;
- `stepStates` permite mostrar o historico simplificado de etapas para cliente e executor;
- `isArchived` continua separado de finalizacao.

---

## 8. Contratos TypeScript sugeridos

```ts
export interface WorkflowType {
  workflowTypeId: string;
  legacyDefinitionId?: string;
  name: string;
  subtitle?: string;
  description: string;
  icon: string;
  areaId: string;
  status: 'active' | 'inactive';
  latestDraftVersion?: number;
  latestPublishedVersion?: number;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface WorkflowActionDefinition {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  approverIds?: string[];
  commentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
}

export interface WorkflowStepDefinition {
  stepId: string;
  stepName: string;
  kind: 'start' | 'work' | 'action' | 'final';
  action?: WorkflowActionDefinition;
  assignmentMode?: 'owner_queue' | 'manual_owner_or_responsible';
  allowComment?: boolean;
  allowAttachment?: boolean;
}

export interface WorkflowDefinitionVersion {
  definitionVersionId: string;
  workflowTypeId: string;
  version: number;
  state: 'draft' | 'published' | 'retired';
  publishedAt?: string;
  publishedBy?: string;
  name: string;
  subtitle?: string;
  description: string;
  icon: string;
  areaId: string;
  ownerEmail: string;
  allowedUserIds: string[];
  defaultSlaDays?: number;
  slaRules: Array<{
    field: string;
    value: string;
    days: number;
  }>;
  routingRules: Array<{
    field: string;
    value: string;
    notify: string[];
  }>;
  fields: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  flow: {
    initialStepId: string;
    finalStepIds: string[];
    stepOrder: string[];
    stepsById: Record<string, WorkflowStepDefinition>;
  };
  createdAt: string;
  createdBy?: string;
  notes?: string;
}

export interface WorkflowStepState {
  state: 'pending' | 'active' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  completedBy?: {
    userId: string;
    userName: string;
  };
}

export interface WorkflowEvent {
  eventType:
    | 'request_created'
    | 'entered_step'
    | 'responsible_assigned'
    | 'action_requested'
    | 'action_responded'
    | 'step_completed'
    | 'request_finalized'
    | 'request_archived'
    | 'comment_added';
  timestamp: string;
  stepId?: string;
  performedBy: {
    userId: string;
    userName: string;
  };
  notes?: string;
}

export interface WorkflowRequest {
  id: string;
  requestId: string;
  workflowTypeId: string;
  workflowVersion: number;
  workflowName: string;
  areaId: string;
  ownerEmail: string;
  submittedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  submittedAt: string;
  lastUpdatedAt: string;
  formData: Record<string, unknown>;
  currentStepId: string;
  statusCategory: 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';
  responsible?: {
    userId: string;
    userName: string;
  };
  stepStates: Record<string, WorkflowStepState>;
  actionRequests: unknown[];
  history: WorkflowEvent[];
  isArchived: boolean;
  viewedBy?: string[];
}
```

---

## 9. Regras operacionais derivadas da arquitetura

### 9.1. Publicacao

- um workflow nasce como `workflowType`;
- a definicao em edicao vive como `draft`;
- ao publicar, a versao recebe numero novo e vira imutavel;
- `workflowTypes.latestPublishedVersion` passa a apontar para a versao publicada.
- qualquer alteracao em `stepName` exige nova versao;
- qualquer alteracao em ordem, inclusao ou exclusao de etapa exige nova versao.

### 9.2. Abertura do chamado

- o frontend pede abertura informando `workflowTypeId`;
- o backend resolve `latestPublishedVersion`;
- o chamado nasce com `workflowVersion` fixo;
- o backend inicializa `currentStepId = flow.initialStepId`.

### 9.3. Reordenacao de etapas

- reordenar etapas altera apenas `flow.stepOrder` da nova versao;
- `stepId` permanece o mesmo;
- chamados antigos nao sofrem impacto porque continuam ligados a versao anterior.

### 9.4. Exclusao de etapa

- excluir etapa so afeta a nova versao;
- a etapa continua existindo nas versoes antigas;
- chamados antigos continuam podendo concluir seu fluxo normalmente.

### 9.5. Finalizacao

- finalizacao deve ser definida por `flow.finalStepIds` da versao;
- heuristica textual de label final deve ser removida do motor novo;
- arquivamento continua sendo operacao separada.

---

## 10. Decisoes de arquitetura registradas

### ADR-001: Versionamento por tipo de workflow

**Decisao**

Adotar `workflowTypeId` estavel e `version` incremental por publicacao.

**Motivo**

Separar identidade do workflow da definicao mutavel e proteger chamados em andamento.

### ADR-002: `stepId` auto-gerado e estavel

**Decisao**

Toda etapa deve ter `stepId` proprio, auto-gerado pelo sistema, nao editavel pelo usuario e nao baseado em posicao.

**Motivo**

Permitir workflows moveis sem exigir cadastro manual de id tecnico e sem quebrar identidade da etapa.

### ADR-003: Chamado preso a versao

**Decisao**

Todo chamado deve guardar `workflowTypeId`, `workflowVersion` e `currentStepId`.

**Motivo**

Garantir continuidade do chamado sem dependencia da definicao atual.

### ADR-004: Sem snapshot completo da definicao no chamado na primeira versao

**Decisao**

Nao armazenar snapshot completo da definicao no chamado neste primeiro desenho.

**Motivo**

Reduzir redundancia de dados e manter a definicao versionada como fonte autoritativa, desde que as versoes publicadas sejam imutaveis e preservadas.

### ADR-005: Toda alteracao de `stepName` ou de fluxo gera nova versao

**Decisao**

Qualquer alteracao no nome exibido da etapa ou na estrutura do fluxo exige nova versao publicada.

**Motivo**

Preservar a definicao versionada como fotografia fiel do processo e evitar mutacao retroativa de comportamento ou nomenclatura.

---

## 11. Impactos na migracao do codigo atual

### 11.1. `workflowDefinitions`

O modelo atual de `workflowDefinitions` deixa de ser a fonte final de runtime do motor.

Destino sugerido:

- converter documentos atuais em `workflowTypes` + `workflowDefinitionVersions`;
- manter a colecao antiga apenas durante a fase de transicao;
- substituir gradualmente leituras do frontend pela nova fonte.

### 11.2. `statuses`

`statuses` do modelo atual devem ser migrados para:

- `flow.stepOrder`
- `flow.stepsById`

Mapeamento inicial:

- `status.id` atual -> `stepId`
- `status.label` atual -> `stepName`
- `status.action` atual -> `action`

### 11.3. `workflows`

Chamados existentes devem receber backfill de:

- `workflowTypeId`
- `workflowVersion`
- `currentStepId`

Durante a transicao, pode ser necessario manter tambem:

- `type`
- `status`

como campos de compatibilidade temporaria.

### 11.4. Motor atual do frontend

Trechos que hoje inferem fluxo pela definicao viva precisam ser eliminados.

Principalmente:

- abertura por `statuses[0]`;
- avancos por indice do array;
- deteccao de status final por heuristica textual;
- lookup por `definition.name === request.type`.

---

## 12. Recomendacoes de implementacao

### Prioridade 1

- formalizar `workflowTypeId` para os 33 workflows ativos;
- definir estrategia de geracao automatica de `stepId`;
- gerar versao 1 canonica para cada workflow ativo validado;
- modelar as novas interfaces TypeScript.

### Prioridade 2

- criar camada de publicacao de nova versao;
- adaptar o admin para editar rascunho e publicar versao;
- impedir edicao em-place de versao publicada.

### Prioridade 3

- migrar criacao e transicao do frontend para backend;
- mover atribuicao, acoes e notificacoes para servicos de dominio;
- preparar a unificacao da tela de gestao de chamados.

---

## 13. Riscos e cuidados

- Se o projeto permitir editar versao publicada em-place, toda a arquitetura perde a principal protecao.
- Se o motor continuar consultando a definicao atual por nome de workflow, a versao no chamado vira apenas metadado decorativo.
- Se `stepId` continuar sendo gerado a partir da posicao da etapa, o sistema continuara fragil para workflows moveis.
- Se a migracao de workflows atuais nao corrigir `status.id` duplicado, o novo modelo carregara ambiguidade de origem.

---

## 14. Conclusao

O modelo recomendado para este projeto e:

- `workflowTypes` para identidade estavel;
- `workflowDefinitionVersions` para definicao versionada e imutavel apos publicacao;
- `workflows` para chamadas concretas presas a uma versao.

Essa arquitetura resolve o problema principal do sistema atual:

- o chamado deixa de depender da definicao viva;
- a ordem deixa de ser identidade;
- etapas podem ser reordenadas entre versoes;
- etapas podem ser removidas em versoes futuras sem travar chamados antigos;
- o novo motor passa a operar sobre regra explicita e auditavel.

Este documento deve ser tratado como base da proxima etapa de design tecnico do motor.
