# Mapeamento de Estados da UI - Workflows

## 1. Objetivo

Definir como o frontend deve traduzir o read model de `workflows` em:

- labels de situacao operacional;
- badges de status;
- secoes de cada aba;
- CTA principal;
- acoes secundarias.

Este documento evita interpretacao livre durante a implementacao.

Documentos base:

- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/DESIGN_READ_MODEL_WORKFLOWS.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)

### Revision history

| data | impacto | resumo |
| --- | --- | --- |
| `2026-03-23` | `High` | criacao da tabela de mapeamento entre estado operacional, labels, badges e CTA da UI |

---

## 2. Principio Geral

O frontend nao deve montar o label principal do card usando apenas `statusCategory`.

O label de situacao operacional e derivado da combinacao entre:

- `statusCategory`
- `hasResponsible`
- `hasPendingActions`
- `currentStatusKey`
- `isArchived`
- contexto da aba

---

## 3. Campos de Entrada da Derivacao

Para cada item do read model, a UI deve considerar:

- `statusCategory`
- `hasResponsible`
- `responsibleUserId`
- `pendingActionCount`
- `pendingActionRecipientIds`
- `currentStatusKey`
- `currentStepName`
- `isArchived`
- `expectedCompletionAt`
- `closedAt`

---

## 4. Ordem de Precedencia

Ao derivar o estado visual do card, seguir esta ordem:

1. `archived`
2. `finalized`
3. `waiting_action`
4. `open` sem responsavel
5. `open` com responsavel
6. `in_progress`

Essa ordem evita conflitos de interpretacao.

---

## 5. Mapeamento Principal de Situacao Operacional

| condicao | situacaoKey | label principal | badge sugerido | CTA principal |
| --- | --- | --- | --- | --- |
| `statusCategory == 'archived'` | `archived` | `Arquivado` | neutro/outline | `Abrir` |
| `statusCategory == 'finalized'` | `finalized` | `Concluido` | sucesso | `Abrir` |
| `statusCategory == 'waiting_action'` | `waiting_action` | `Aguardando acao` | aviso | `Abrir` |
| `statusCategory == 'open' && hasResponsible == false` | `awaiting_assignment` | `Aguardando atribuicao` | alerta | `Abrir` |
| `statusCategory == 'open' && hasResponsible == true` | `assigned_open` | `Em andamento` | info | `Abrir` |
| `statusCategory == 'in_progress'` | `in_progress` | `Em andamento` | info | `Abrir` |

### Observacao

`currentStepName` deve sempre aparecer no card como informacao separada do label principal.

Exemplo:

- Etapa atual: `Analise do gerente`
- Situacao: `Aguardando atribuicao`

---

## 6. Mapeamento por Aba

## 6.1. Aba `Chamados atuais`

### Regra de leitura

Essa aba mostra a fila do owner.

O label principal deve enfatizar o que depende do owner.

| condicao | label principal | label auxiliar |
| --- | --- | --- |
| `hasResponsible == false` | `Aguardando atribuicao` | `Etapa atual: {currentStepName}` |
| `hasPendingActions == true` | `Aguardando acao` | `Etapa atual: {currentStepName}` |
| `hasResponsible == true && hasPendingActions == false` | `Em andamento` | `Responsavel: {responsibleName}` |

### Acoes secundarias sugeridas

- `Atribuir` quando `hasResponsible == false`
- `Reatribuir` quando `hasResponsible == true`

### CTA proibido na listagem

- `Avancar fluxo`

## 6.2. Aba `Atribuicoes e acoes`

### Regra de leitura

Essa aba precisa distinguir duas situacoes:

- `Atribuido a mim`
- `Acao pendente para mim`

### Secao 1: `Atribuido a mim`

Condicao:

- item veio da query por `responsibleUserId == currentUserId`

Label principal sugerido:

- `Atribuido a mim`

Label auxiliar:

- `Etapa atual: {currentStepName}`

### Secao 2: `Acao pendente para mim`

Condicao:

- item veio da query por `pendingActionRecipientIds array-contains currentUserId`

Label principal sugerido:

- `Acao pendente para mim`

Label auxiliar:

- `Etapa atual: {currentStepName}`

### Observacao

Mesmo que o mesmo chamado apareca nas duas queries, a visualizacao ideal deve manter as secoes distintas.

## 6.3. Aba `Concluidas`

### Regra de leitura

Essa aba representa historico operacional.

| condicao | label principal | label auxiliar |
| --- | --- | --- |
| `statusCategory == 'finalized'` | `Concluido` | `Concluido em {closedAt}` |
| `statusCategory == 'archived'` | `Arquivado` | `Concluido em {closedAt}` |

### Regra

- `Arquivado` nao substitui a informacao de conclusao;
- o agrupamento mensal deve usar `closedAt`.

## 6.4. `Minhas solicitacoes`

### Regra de leitura

Essa secao representa a visao do solicitante.

Labels sugeridos:

- usar a mesma derivacao principal do card, mas com foco informativo e sem acoes operacionais.

CTA:

- `Abrir`

---

## 7. Badge de SLA

O badge de SLA e independente do label principal.

Na primeira iteracao, o backend de leitura pode devolver `slaState`.

| `slaState` | badge sugerido |
| --- | --- |
| `on_time` | neutro |
| `at_risk` | aviso |
| `overdue` | destrutivo |

### Regra

- nao substituir a situacao operacional pelo estado do SLA;
- SLA e uma camada adicional de prioridade.

---

## 8. CTA Principal

Para todas as listas:

- CTA principal oficial: `Abrir`

Variantes aceitas:

- `Ver detalhes`

Variantes nao aceitas como CTA principal:

- `Avancar fluxo`
- `Concluir etapa`
- `Finalizar`

Essas acoes pertencem ao modal.

---

## 9. Acoes Secundarias Permitidas por Contexto

| contexto | acao secundaria permitida |
| --- | --- |
| owner sem responsavel | `Atribuir` |
| owner com responsavel | `Reatribuir` |
| owner assumindo caso | `Assumir` |
| demais cenarios | nenhuma acao direta obrigatoria |

### Observacao

Essas acoes sao opcionais na listagem. O modal continua sendo a unidade principal de operacao.

---

## 10. Campos Minimos no Card

Independentemente da aba, cada card ou linha deve mostrar:

- `requestId`
- `workflowName`
- `requesterName`
- `currentStepName`
- label principal de situacao
- responsavel atual, se houver
- referencia temporal relevante:
  - `lastUpdatedAt` nas filas ativas
  - `closedAt` nas concluidas

Campos recomendados:

- badge de SLA
- tipo de pendencia
- area

---

## 11. Algoritmo de Derivacao Sugerido

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

  return { key: 'in_progress', label: 'Em andamento', tone: 'info' };
}
```

---

## 12. Pontos de Atencao

### 12.1. `currentStatusKey` nao substitui o label principal

`currentStatusKey` serve para:

- consistencia tecnica;
- regras do modal;
- filtros futuros;
- leitura da etapa atual.

Mas o label principal do card continua dependendo do estado operacional combinado.

### 12.2. A aba `Atribuicoes e acoes` precisa de duas secoes

Nao tentar resolver isso com um unico label generico.

O valor do produto esta justamente em separar:

- o que esta comigo como responsavel;
- o que esta comigo como destinatario de acao.

### 12.3. `Concluidas` e historico

A aba `Concluidas` deve ter ritmo visual menos operacional, mas nao pode perder:

- `requestId`
- workflow
- data de conclusao
- label de encerramento

---

## 13. Proximo Passo

Com este documento e o read model fechados, o build do piloto so depende de:

- definicao exata dos workflows que entram na primeira area piloto.
