# Design Tecnico - Read Model de Workflows

## 1. Objetivo

Definir o read model do documento `workflows` para suportar:

- a tela `Gestao de chamados`;
- a aba `Chamados atuais`;
- a aba `Atribuicoes e acoes`;
- a aba `Concluidas`;
- a secao `Minhas solicitacoes`.

Este documento fecha:

- campos desnormalizados;
- filtros por aba;
- ordenacao;
- indices necessarios;
- regra de atualizacao desses campos ao longo do runtime.

Documentos base:

- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-23` | `High` | criacao do design do read model de `workflows` com campos desnormalizados, queries, ordenacao e indices |

---

## 2. Principios

### 2.1. O documento `workflows` precisa ser consultavel sem joins complexos

O frontend nao deve depender de:

- leitura profunda de `actionRequests` para montar inbox;
- lookup da versao para mostrar lista basica;
- recomposicao do historico para entender responsavel atual;
- heuristica textual para montar badges.

### 2.2. Firestore exige desnormalizacao explicita

O Firestore nao permite montar bem a aba `Atribuicoes e acoes` consultando `actionRequests[].recipient.userId` dentro de array de objetos.

Consequencia:

- campos como `pendingActionRecipientIds` sao obrigatorios no documento `workflows`;
- isso nao e otimizacao, e requisito tecnico.

### 2.3. O read model nao substitui o dado completo

O read model complementa o documento com campos de consulta.

Continuam existindo no documento:

- `stepStates`
- `actionRequests`
- `history`

Mas a tela principal nao deve depender deles para filtrar listas.

---

## 3. Estrutura Recomendada do Read Model

### 3.1. Campos base do chamado

| campo | tipo | origem | observacao |
| --- | --- | --- | --- |
| `requestId` | `string` | runtime | id sequencial visivel |
| `workflowTypeId` | `string` | runtime | tipo do workflow |
| `workflowVersion` | `number` | runtime | versao fixa do chamado |
| `workflowName` | `string` | runtime | denormalizado de `workflowTypes.name` |
| `areaId` | `string` | runtime | denormalizado de `workflowTypes.areaId` |
| `submittedAt` | `string` | runtime | data de abertura |
| `lastUpdatedAt` | `string` | runtime | ultima mutacao relevante |
| `finalizedAt` | `string?` | runtime | preenchido ao finalizar |
| `closedAt` | `string?` | runtime | igual a `finalizedAt` |
| `archivedAt` | `string?` | runtime | preenchido ao arquivar |
| `isArchived` | `boolean` | runtime | flag de arquivamento |

### 3.2. Campos de ownership e participacao

| campo | tipo | origem | observacao |
| --- | --- | --- | --- |
| `ownerEmail` | `string` | runtime + sync de owner | owner vigente do tipo |
| `ownerUserId` | `string` | runtime + sync de owner | id do owner vigente |
| `requesterUserId` | `string` | runtime | solicitante |
| `requesterName` | `string` | runtime | nome do solicitante |
| `responsibleUserId` | `string?` | runtime | responsavel atual |
| `responsibleName` | `string?` | runtime | nome do responsavel atual |
| `hasResponsible` | `boolean` | runtime | facilita filtros |
| `operationalParticipantIds` | `string[]` | runtime | owner, responsaveis e destinatarios de acao |

### 3.3. Campos de etapa e estado operacional

| campo | tipo | origem | observacao |
| --- | --- | --- | --- |
| `currentStepId` | `string` | runtime | etapa atual |
| `currentStepName` | `string` | runtime | denormalizado da versao |
| `currentStatusKey` | `string` | runtime | denormalizado da etapa atual |
| `statusCategory` | `string` | runtime | `open`, `in_progress`, `waiting_action`, `finalized`, `archived` |
| `hasPendingActions` | `boolean` | runtime | indica qualquer acao pendente |
| `pendingActionCount` | `number` | runtime | quantidade de acoes pendentes |
| `pendingActionRecipientIds` | `string[]` | runtime | ids com acao pendente |
| `pendingActionTypes` | `string[]` | runtime | `approval`, `acknowledgement`, `execution` |

### 3.4. Campos de SLA e tempo

| campo | tipo | origem | observacao |
| --- | --- | --- | --- |
| `slaDays` | `number` | runtime | snapshot do SLA do chamado |
| `expectedCompletionAt` | `string` | runtime | prazo alvo do chamado |

### 3.5. Campos auxiliares de agrupamento

| campo | tipo | origem | observacao |
| --- | --- | --- | --- |
| `submittedMonthKey` | `string` | runtime | `yyyy-MM` de `submittedAt` |
| `closedMonthKey` | `string?` | runtime | `yyyy-MM` de `closedAt` |

---

## 4. Campos que Nao Devem Ser Usados Como Base de Query

Nao usar como base primaria de filtro da tela:

- `history`
- `stepStates`
- `actionRequests` inteiro
- `responsible` como objeto
- `submittedBy` como objeto

Esses campos continuam existindo como dados de detalhe, mas nao devem ser exigidos para montar as listas.

---

## 5. Read Model Minimo Recomendado

```ts
type WorkflowReadModel = {
  id: string;
  requestId: string;
  workflowTypeId: string;
  workflowVersion: number;
  workflowName: string;
  areaId: string;

  ownerEmail: string;
  ownerUserId: string;

  requesterUserId: string;
  requesterName: string;

  responsibleUserId?: string;
  responsibleName?: string;
  hasResponsible: boolean;

  currentStepId: string;
  currentStepName: string;
  currentStatusKey: string;
  statusCategory: 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';

  hasPendingActions: boolean;
  pendingActionCount: number;
  pendingActionRecipientIds: string[];
  pendingActionTypes: Array<'approval' | 'acknowledgement' | 'execution'>;

  operationalParticipantIds: string[];

  slaDays: number;
  expectedCompletionAt: string;

  submittedAt: string;
  lastUpdatedAt: string;
  finalizedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  submittedMonthKey: string;
  closedMonthKey?: string;

  isArchived: boolean;
};
```

---

## 6. Queries por Tela / Aba

## 6.1. `Chamados atuais`

### Pergunta de negocio

"Quais chamados ativos estao hoje sob o ownership do usuario logado?"

### Query base

- `ownerUserId == currentUserId`
- `isArchived == false`
- `statusCategory in ['open', 'in_progress', 'waiting_action']`
- ordenacao: `lastUpdatedAt desc`

### Filtros internos sugeridos

#### Todos

- apenas query base

#### Aguardando atribuicao

- query base
- `hasResponsible == false`

#### Em andamento

- query base
- `hasResponsible == true`
- `hasPendingActions == false`

#### Aguardando acao

- query base
- `hasPendingActions == true`

#### Com SLA em risco

Como `slaState` sera calculado em leitura na primeira iteracao, este filtro pode ser:

- aplicado em memoria no resultado da query base;
- ou postergado para fase seguinte se o volume for baixo no piloto.

## 6.2. `Atribuicoes e acoes`

### Pergunta de negocio

"Quais itens operacionais dependem do usuario logado neste momento?"

### Decisao tecnica

Esta aba deve ser montada por duas queries separadas:

1. `Atribuido a mim`
2. `Acao pendente para mim`

#### Query A: Atribuido a mim

- `responsibleUserId == currentUserId`
- `isArchived == false`
- `statusCategory in ['open', 'in_progress', 'waiting_action']`
- ordenacao: `lastUpdatedAt desc`

#### Query B: Acao pendente para mim

- `pendingActionRecipientIds array-contains currentUserId`
- `isArchived == false`
- `statusCategory == 'waiting_action'`
- ordenacao: `lastUpdatedAt desc`

### Observacao

Mesmo que o usuario apareca nas duas queries, o frontend pode:

- mostrar em secoes distintas;
- ou aplicar de-duplicacao por `id` se houver decisoes visuais futuras.

## 6.3. `Concluidas`

### Pergunta de negocio

"Quais chamados concluidos fazem parte do meu historico operacional?"

### Query base

- `operationalParticipantIds array-contains currentUserId`
- `statusCategory in ['finalized', 'archived']`
- ordenacao: `closedAt desc`

### Agrupamento

- agrupar por `closedMonthKey`
- do mes mais recente para o mais antigo

### Observacao

`closedAt` representa finalizacao, nao arquivamento.

## 6.4. `Minhas solicitacoes`

### Pergunta de negocio

"Quais chamados eu abri, organizados do mais recente para o mais antigo?"

### Query base

- `requesterUserId == currentUserId`
- ordenacao: `submittedAt desc`

### Agrupamento

- agrupar por `submittedMonthKey`
- do mes mais recente para o mais antigo

---

## 7. Ordenacao Oficial

| contexto | ordenacao |
| --- | --- |
| `Chamados atuais` | `lastUpdatedAt desc` |
| `Atribuido a mim` | `lastUpdatedAt desc` |
| `Acao pendente para mim` | `lastUpdatedAt desc` |
| `Concluidas` | `closedAt desc` |
| `Minhas solicitacoes` | `submittedAt desc` |

---

## 8. Indices Necessarios

Os indices abaixo devem ser previstos para Firestore.

### 8.1. `Chamados atuais`

1. `ownerUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
2. `ownerUserId asc, isArchived asc, statusCategory asc, hasResponsible asc, lastUpdatedAt desc`
3. `ownerUserId asc, isArchived asc, statusCategory asc, hasPendingActions asc, lastUpdatedAt desc`

### 8.2. `Atribuicoes e acoes`

4. `responsibleUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc`
5. `pendingActionRecipientIds array-contains, isArchived asc, statusCategory asc, lastUpdatedAt desc`

### 8.3. `Concluidas`

6. `operationalParticipantIds array-contains, statusCategory asc, closedAt desc`

### 8.4. `Minhas solicitacoes`

7. `requesterUserId asc, submittedAt desc`

### Observacao

O Firestore pode solicitar variacoes adicionais na criacao de indices compostos. O time deve tratar o erro de indice ausente durante a homologacao como parte normal da configuracao inicial.

---

## 9. Regra de Atualizacao do Read Model por Caso de Uso

## 9.1. Abrir chamado

Deve preencher:

- `workflowName`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `requesterUserId`
- `requesterName`
- `responsibleUserId = null`
- `responsibleName = null`
- `hasResponsible = false`
- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory = open`
- `hasPendingActions = false`
- `pendingActionCount = 0`
- `pendingActionRecipientIds = []`
- `pendingActionTypes = []`
- `operationalParticipantIds = [ownerUserId]`
- `slaDays`
- `expectedCompletionAt`
- `submittedMonthKey`

## 9.2. Atribuir / reatribuir responsavel

Deve atualizar:

- `responsibleUserId`
- `responsibleName`
- `hasResponsible`
- `statusCategory`
- `operationalParticipantIds` adicionando o responsavel
- `lastUpdatedAt`

### Regra

- apos atribuir, o chamado passa a ser `in_progress`, salvo se ja houver acao pendente.

## 9.3. Solicitar acao

Deve atualizar:

- `hasPendingActions = true`
- `pendingActionCount`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `statusCategory = waiting_action`
- `operationalParticipantIds` adicionando destinatarios
- `lastUpdatedAt`

## 9.4. Responder acao

Deve recalcular:

- `pendingActionCount`
- `pendingActionRecipientIds`
- `pendingActionTypes`
- `hasPendingActions`
- `statusCategory`
- `lastUpdatedAt`

### Regra

- se ainda houver acao pendente, permanece `waiting_action`;
- se nao houver mais acao pendente e o chamado nao estiver finalizado, volta para `in_progress`.

## 9.5. Avancar etapa

Deve atualizar:

- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory = in_progress`
- `lastUpdatedAt`

## 9.6. Finalizar

Deve atualizar:

- `currentStepId`
- `currentStepName`
- `currentStatusKey`
- `statusCategory = finalized`
- `finalizedAt`
- `closedAt`
- `closedMonthKey`
- `hasPendingActions = false`
- `pendingActionCount = 0`
- `pendingActionRecipientIds = []`
- `pendingActionTypes = []`
- `lastUpdatedAt`

## 9.7. Arquivar

Deve atualizar:

- `isArchived = true`
- `statusCategory = archived`
- `archivedAt`
- `lastUpdatedAt`

### Regra

- `closedAt` nao muda ao arquivar.

## 9.8. Troca de owner do tipo

Quando `workflowTypes.ownerUserId` / `ownerEmail` mudar:

- atualizar chamados ativos daquele `workflowTypeId`;
- atualizar `ownerUserId`;
- atualizar `ownerEmail`;
- manter chamados finalizados e arquivados inalterados.

---

## 10. Read API Contract Sugerido

Mesmo com o read model dentro do documento, a recomendacao e expor uma camada de leitura via API para a tela unificada.

### Endpoints sugeridos

- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/mine`

### Motivo

- centralizar auth;
- concentrar o calculo de `slaState`;
- encapsular filtros por role;
- permitir evolucao do backend sem reescrever o frontend.

---

## 11. Pontos de Atencao

### 11.1. `slaState` ainda nao e campo persistido

Na primeira iteracao:

- calcular no servidor da rota de leitura;
- devolver junto do payload;
- nao usar como campo de query Firestore ainda.

### 11.2. `operationalParticipantIds` e aditivo

Esse campo nao deve ser tratado como "participantes atuais".

Ele representa o historico operacional acumulado do chamado.

### 11.3. `ownerUserId` de chamados ativos acompanha mudanca do tipo

Isso ajuda a fila do owner, mas exige operacao explicita ao trocar owner no admin.

---

## 12. Proximo Passo

O artefato seguinte recomendado e:

- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)

Esse documento deve fechar como o frontend traduz os campos do read model em:

- labels;
- badges;
- secoes;
- CTAs.
