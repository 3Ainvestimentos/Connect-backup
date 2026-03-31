# DESIGN: FASE1_FACILITIES_ETAPA7

> Generated: 2026-03-31
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 7 - Workflow 3 e consolidacao da UX do piloto
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA7.md`

## 1. Objetivo

Encerrar a Fase 1 evoluindo `/pilot/facilities` para operar tambem `facilities_solicitacao_compras`, consumindo a aba de concluidos ja suportada pelo backend, consolidando a UX multiworkflow do piloto e aplicando o ajuste final de atribuicao em modo leitura apos a primeira atribuicao.

Esta etapa cobre:

- inclusao do terceiro workflow no registry e na mesma rota do piloto;
- consumo de `GET /api/workflows/read/completed` na camada cliente do piloto;
- nova aba `Concluidas`, agrupada por mes;
- suporte ao campo `anexos` opcional do workflow 3 na mesma infraestrutura de upload;
- refinamento do dialog para mostrar responsavel em leitura quando ja houver atribuicao;
- consolidacao da mesma base de frontend para os 3 workflows piloto.

Esta etapa nao cobre:

- frontend oficial definitivo;
- preview de anexos no dialog;
- reatribuicao formal de responsavel;
- novos endpoints backend;
- redesenho do mecanismo de upload.

### Convivencia com producao

O build continua isolado em `/pilot/facilities`, reaproveita somente APIs ja publicadas do motor v2 e nao reintroduz `WorkflowsContext`, `RequestsContext`, `WorkflowSubmissionModal` ou Firestore direto no cliente.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE1_FACILITIES_ETAPA7.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA7.md)
- [DEFINE_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA6.md)
- [DEFINE_FASE1_FACILITIES_ETAPA6_1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA6_1.md)
- [DESIGN_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA6.md)
- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [ROADMAP_ETAPAS_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_ETAPAS_FASE1_FACILITIES.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/implementation_progress_fase1.md)
- [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts)
- [workflow-registry.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-registry.ts)
- [workflow-filters.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-filters.ts)
- [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts)
- [fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA7.md` para escopo e aceite;
2. depois prevalecem os contratos HTTP existentes do motor v2;
3. depois prevalece este documento para guiar o build;
4. depois os roadmaps servem como direcao de sequenciamento.

---

## 3. Decisoes Fechadas da Etapa 7

### 3.1. Mesma rota, agora com 3 workflows

- a rota continua unica em `/pilot/facilities`;
- `FACILITIES_PILOT_WORKFLOWS` passa a registrar 3 workflows suportados;
- o bootstrap pela URL continua usando `?workflow=<workflowTypeId>`;
- o fallback default continua sendo manutencao.

### 3.2. Registry derivado de uma unica fonte

- `resolveFacilitiesPilotWorkflowTypeId()` deixa de duplicar literals de workflows;
- o conjunto suportado passa a derivar diretamente de `FACILITIES_PILOT_WORKFLOWS`;
- `getFacilitiesPilotWorkflowConfig()` continua como lookup opcional sem fallback silencioso.

### 3.3. Aba de concluidos reutiliza backend existente

- a Etapa 7 nao cria novo endpoint;
- a camada cliente do piloto passa a consumir `GET /api/workflows/read/completed`;
- o agrupamento por mes usa `closedMonthKey`, alinhado ao backend ja existente.

### 3.4. Upload opcional em compras

- o workflow 3 usa a mesma serializacao de `OpenWorkflowCard`;
- para `type: 'file'` opcional, o upload so acontece quando houver `File`;
- sem arquivo, o campo nao entra no `formData` com valor vazio artificial.

### 3.5. Atribuicao vira modo leitura apos existir responsavel

- o dialog mostra o responsavel atual como leitura;
- o seletor de atribuicao aparece apenas quando ainda nao existe responsavel;
- a etapa nao cria ainda uma acao explicita de reatribuicao.

### 3.6. Concluidas e minhas solicitacoes coexistem

- `Concluidas` representa historico operacional por participante;
- `Minhas solicitacoes` continua sendo historico por requester, agrupado por mes;
- ambas permanecem na mesma superficie do piloto.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
page.tsx
  |
  +--> resolveFacilitiesPilotWorkflowTypeId(searchParams.workflow)
  v
FacilitiesPilotPage(initialWorkflowTypeId)
  |
  +--> activeWorkflowTypeId
  +--> listScope = all | active
  +--> activeTab = current | assignments | completed | mine
  |
  +--> useFacilitiesPilot(activeWorkflowTypeId, currentFilter, includeCurrent)
  |       |
  |       +--> catalogQuery(active workflow only)
  |       +--> currentQuery(global)
  |       +--> assignmentsQuery(global)
  |       +--> completedQuery(global)
  |       +--> mineQuery(global)
  |
  +--> OpenWorkflowCard
  |       |
  |       +--> scalar fields => normalize
  |       +--> optional file => upload only when File exists
  |       +--> required file => existing validation path
  |       v
  |     openPilotRequest()
  |
  +--> CurrentQueueTab / AssignmentsTab / CompletedTab / MyRequestsTab
  |       |
  |       +--> local filters by workflowTypeId when scope = active
  |
  +--> RequestDetailsDialog
          |
          +--> identity + operational metadata
          +--> assignment form only when no responsible exists
          +--> read-only responsible otherwise
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Registry / routing)
1. Registry passa a suportar 3 workflows
2. URL continua definindo workflow ativo inicial

LAYER 2 (Pilot orchestration)
3. Hook do piloto passa a carregar completedQuery
4. Query keys do piloto passam a incluir completed
5. Selectors locais filtram current, assignments, completed e mine por workflow

LAYER 3 (Open form)
6. OpenWorkflowCard continua dirigindo o submit a partir do catalogo
7. Workflow 3 reaproveita text/textarea/select/file
8. Upload opcional so roda quando houver arquivo

LAYER 4 (Presentation)
9. FacilitiesPilotPage ganha aba Concluidas
10. Dialog reduz a UI de atribuicao apos primeira atribuicao
11. A mesma superficie fecha a Fase 1 para os 3 workflows
```

### 4.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| workflow ativo | `useState` em `FacilitiesPilotPage` | inicializado pela URL e trocado localmente |
| escopo das listas | `useState` local | continua `all` vs `active` |
| aba ativa | `useState` local | passa a incluir `completed` |
| catalogo ativo | React Query | um cache por `workflowTypeId` |
| queries globais read-side | React Query | current, assignments, completed, mine |
| arquivo opcional de compras | React Hook Form | enviado so se existir |
| request selecionado | `useState` local | dialog unico para os 3 workflows |

---

## 5. Architecture Decision Records

### ADR-7.1: Workflow 3 entra na mesma superficie, sem rota paralela

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | A Fase 1 precisa provar reuso real da mesma base, nao uma terceira tela dedicada. |

**Choice:** incluir `facilities_solicitacao_compras` no mesmo selector da rota `/pilot/facilities`.

**Consequences:**

- o piloto valida de fato a superficie multiworkflow;
- o frontend oficial nasce sobre base testada;
- a UX precisa ficar suficientemente clara para 3 workflows.

### ADR-7.2: `read/completed` passa a ser consumido agora, sem novo backend

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | O backend de concluidos ja existe desde a Etapa 2, mas ainda nao e usado pela UI do piloto. |

**Choice:** adicionar `getPilotCompleted()` e `completedQuery` no cliente do piloto.

**Consequences:**

- a Etapa 7 aumenta o valor do piloto sem ampliar o backend;
- a UX final da Fase 1 fica mais proxima da experiencia operacional alvo;
- a mesma semantica de agrupamento mensal e reutilizada.

### ADR-7.3: Atribuicao some da UI apos existir responsavel

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | O piloto ja validou a primeira atribuicao; manter o seletor para sempre cria ambiguidade sobre reatribuicao. |

**Choice:** o dialog mostra o seletor apenas enquanto `responsibleUserId` for nulo.

**Consequences:**

- a UX fica mais coerente com a operacao real;
- o detalhe vira leitura apos atribuicao;
- reatribuicao continua sendo decisao futura explicita.

### ADR-7.4: `file` opcional nao entra no `formData` quando ausente

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-31 |
| Context | O workflow 3 traz `anexos` opcional; enviar string vazia ou placeholder artificial degradaria o contrato atual. |

**Choice:** omitir o campo do `formData` quando nao houver arquivo selecionado.

**Consequences:**

- mantem o payload mais limpo;
- evita semantica artificial para anexos opcionais;
- reutiliza a mesma infraestrutura de upload sem bifurcacao de backend.

---

## 6. File Manifest

| Ordem | Caminho | Acao | Responsabilidade | Skill/Agente sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [workflow-registry.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-registry.ts) | Update | Incluir workflow 3 e derivar `resolveFacilitiesPilotWorkflowTypeId()` da fonte unica | `build` |
| 2 | [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts) | Update | Adicionar tipos de `completed` e ampliar o shape de tabs/estado do piloto | `build` |
| 3 | [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts) | Update | Adicionar `getPilotCompleted()` e normalizacao de grupos de concluidos | `build` |
| 4 | [query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/query-keys.ts) | Update | Incluir chave canonica para `completed` | `build` |
| 5 | [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts) | Update | Carregar `completedQuery` e invalidar junto do restante apos mutacoes | `build` |
| 6 | [workflow-filters.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-filters.ts) | Update | Filtrar concluidos por workflow e manter pureza dos seletores | `build` |
| 7 | [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx) | Update | Adicionar workflow 3 ao selector, nova aba `Concluidas` e consolidar a superficie | `build` |
| 8 | [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx) | Update | Garantir serializacao correta de `file` opcional no workflow 3 | `build` |
| 9 | [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx) | Update | Mostrar atribuição apenas quando ainda nao houver responsavel | `build` |
| 10 | [CompletedTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CompletedTab.tsx) | Create | Renderizar historico de concluidos agrupado por mes na mesma linguagem da rota | `build` |
| 11 | [CurrentQueueTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CurrentQueueTab.tsx) | Reuse | Sem mudanca estrutural alem de receber itens ja filtrados | `build` |
| 12 | [AssignmentsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/AssignmentsTab.tsx) | Reuse | Sem mudanca estrutural alem de receber itens ja filtrados | `build` |
| 13 | [MyRequestsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/MyRequestsTab.tsx) | Reuse | Continua agrupando `mine` por mes | `build` |
| 14 | [OpenWorkflowCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx) | Update | Cobrir workflow 3 com `file` opcional preenchido e vazio | `build` |
| 15 | [RequestDetailsDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx) | Update | Cobrir modo leitura apos atribuicao | `build` |
| 16 | [workflow-registry.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/workflow-registry.test.ts) | Update | Cobrir os 3 workflows e o fallback derivado | `build` |
| 17 | [workflow-filters.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/workflow-filters.test.ts) | Update | Cobrir concluidos filtrados por workflow | `build` |
| 18 | [api-client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/api-client.test.ts) | Update | Cobrir `getPilotCompleted()` e normalizacao do payload agrupado | `build` |
| 19 | [CompletedTab.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/CompletedTab.test.tsx) | Create | Cobrir agrupamento mensal e abertura de item em concluidos | `build` |

### 6.1. Arquivos que NAO devem ser criados

| Arquivo | Razao |
|---------|-------|
| novo endpoint em `src/app/api/workflows/read/*` | `read/completed` ja existe e deve ser reaproveitado |
| nova rota de pagina para compras | a validacao da etapa depende da mesma superficie multiworkflow |
| novo helper de upload especifico para compras | o upload existente ja suporta `file` opcional quando consumido corretamente |

---

## 7. Code Patterns

### Pattern 1: Registry derivado da fonte unica

```ts
export const FACILITIES_PILOT_WORKFLOWS = [
  /* manutencao */
  /* suprimentos */
  /* compras */
] as const;

export type FacilitiesPilotWorkflowTypeId =
  (typeof FACILITIES_PILOT_WORKFLOWS)[number]['workflowTypeId'];

const FACILITIES_PILOT_WORKFLOW_IDS = FACILITIES_PILOT_WORKFLOWS.map(
  (workflow) => workflow.workflowTypeId,
);

export function resolveFacilitiesPilotWorkflowTypeId(
  input?: string | null,
): FacilitiesPilotWorkflowTypeId {
  if (input && FACILITIES_PILOT_WORKFLOW_IDS.includes(input)) {
    return input as FacilitiesPilotWorkflowTypeId;
  }

  return DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID;
}
```

Regra:

- evitar nova duplicacao de literals para o terceiro workflow;
- `getFacilitiesPilotWorkflowConfig()` continua sendo apenas lookup.

### Pattern 2: Filtro de concluidos por workflow em `FacilitiesPilotPage`

```ts
const filteredCompletedGroups = React.useMemo(
  () =>
    filterMonthGroupsByWorkflow(
      pilot.completedQuery.data?.groups ?? [],
      listScope,
      activeWorkflowTypeId,
    ),
  [activeWorkflowTypeId, listScope, pilot.completedQuery.data?.groups],
);
```

Regra:

- `completed` segue o mesmo padrao de `mine`, mas usando `closedMonthKey` vindo pronto do backend;
- `CompletedTab` recebe os grupos ja filtrados, sem recalcular agrupamento na apresentacao.

### Pattern 3: Cliente do piloto para concluidos

```ts
export type PilotCompletedData = {
  items: PilotRequestSummary[];
  groups: PilotMonthGroup[];
};

export async function getPilotCompleted(user: User): Promise<PilotCompletedData> {
  const data = await authenticatedWorkflowFetch<unknown>(user, '/api/workflows/read/completed');
  return normalizeCompletedData(data);
}
```

Regra:

- manter `PilotApiError` e `authenticatedWorkflowFetch()` como fronteira da camada `pilot`;
- reaproveitar `normalizeRequestSummary()` e `normalizeMonthGroup()`.

### Pattern 4: Hook do piloto com `completedQuery`

```ts
const completedQuery = useQuery({
  queryKey: pilotKeys.completed(uid),
  queryFn: () => getPilotCompleted(user!),
  enabled,
});

const invalidateOperationalQueries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: pilotKeys.currentRoot(uid) }),
    queryClient.invalidateQueries({ queryKey: pilotKeys.assignments(uid) }),
    queryClient.invalidateQueries({ queryKey: pilotKeys.completed(uid) }),
    queryClient.invalidateQueries({ queryKey: pilotKeys.mine(uid) }),
  ]);
};
```

Regra:

- `completed` entra como query global, filtrada localmente por workflow;
- nao criar nova invalidacao separada por workflow.

### Pattern 5: Upload opcional no formulario dinamico

```ts
if (field.type === 'file') {
  if (!(rawValue instanceof File)) {
    continue;
  }

  const { fileUrl } = await params.uploadFile({
    workflowTypeId: params.catalog.workflowTypeId,
    fieldId: field.id,
    file: rawValue,
  });

  formData[field.id] = fileUrl;
  continue;
}
```

Regra:

- `file` obrigatorio continua protegido pela validacao do formulario;
- `file` opcional ausente e simplesmente omitido do `formData`.

### Pattern 6: Dialog com atribuicao apenas quando responsavel ainda nao existe

```ts
const canShowAssignForm = presentation.canAssign && !request.hasResponsible;

{canShowAssignForm ? (
  <AssignResponsibleForm ... />
) : null}

<p className="text-muted-foreground">{request.responsibleName || 'Nao atribuido'}</p>
```

Regra:

- a leitura do responsavel continua sempre visivel;
- o seletor deixa de aparecer depois da primeira atribuicao.

### Pattern 7: Aba de concluidos agrupada por mes

```ts
{groups.map((group) => (
  <section key={group.monthKey} className="space-y-3">
    <h3 className="text-sm font-medium text-muted-foreground">{formatMonthKey(group.monthKey)}</h3>
    <RequestSummaryList
      items={group.items}
      actorUserId={actorUserId}
      emptyTitle=""
      emptyDescription=""
      onOpenRequest={onOpenRequest}
    />
  </section>
))}
```

Regra:

- `CompletedTab` reaproveita `RequestSummaryList`;
- o agrupamento continua vindo pronto da API, sem recalculo complexo na UI.

---

## 8. API Contract

### 8.1. Backend

Nenhum endpoint novo.

Superficie consumida nesta etapa:

- `GET /api/workflows/catalog/[workflowTypeId]`
- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/mine`
- `POST /api/workflows/runtime/requests`
- `POST /api/workflows/runtime/requests/{id}/assign`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`
- `POST /api/workflows/runtime/uploads`

### 8.2. Novo contrato local do piloto

```ts
type PilotCompletedData = {
  items: PilotRequestSummary[];
  groups: PilotMonthGroup[];
};
```

### 8.3. Contrato funcional preservado

- `OpenWorkflowCard` continua entregando `OpenPilotRequestInput`;
- `uploadWorkflowFile()` continua retornando `{ fileUrl }`;
- `RequestDetailsDialog` continua limitado a metadados operacionais do read-side.

---

## 9. Estrategia de Build

### 9.1. Sequencia recomendada

1. expandir `workflow-registry.ts` para o terceiro workflow e remover duplicacao do resolver;
2. adicionar `PilotCompletedData`, `getPilotCompleted()` e `pilotKeys.completed(...)`;
3. plugar `completedQuery` em `useFacilitiesPilot`;
4. criar `CompletedTab.tsx` e conectar a nova aba em `FacilitiesPilotPage`;
5. ajustar `OpenWorkflowCard` para o caso de `file` opcional em compras;
6. refinar `RequestDetailsDialog` para modo leitura apos atribuicao;
7. reforcar testes de registry, upload opcional, concluidos e dialog.

### 9.2. Invariantes do build

- nenhum backend novo e criado;
- o upload continua sendo consumido apenas de `src/lib/workflows/upload/*`;
- o dialog nao tenta ler `formData` do read-side;
- `resolveFacilitiesPilotWorkflowTypeId()` deriva da fonte unica de workflows suportados;
- a mesma rota continua operando toda a experiencia do piloto.

---

## 10. Testing Strategy

### 10.1. Unitario

| Componente | Teste |
|-----------|-------|
| `workflow-registry.ts` | resolve os 3 workflows e faz fallback default a partir da fonte unica |
| `api-client.ts` | normaliza `GET /api/workflows/read/completed` para `PilotCompletedData` |
| `workflow-filters.ts` | filtra concluidos por workflow sem mutar os grupos originais |
| `OpenWorkflowCard.tsx` | omite `anexos` quando vazio e faz upload quando houver `File` |
| `RequestDetailsDialog.tsx` | nao mostra seletor de atribuicao quando ja existe responsavel |

### 10.2. Integration / regression

| Fluxo | Teste |
|------|-------|
| workflow 3 no selector | troca de workflow atualiza catalogo ativo e URL |
| aba de concluidos | renderiza grupos mensais e abre item no dialog |
| compras com upload opcional | submit sem arquivo nao chama upload; submit com arquivo chama upload e persiste URL |
| workflows 1 e 2 | continuam operando sem regressao perceptivel |

### 10.3. Validacao manual obrigatoria

1. alternar entre os 3 workflows na mesma rota;
2. abrir `Solicitacao de Compras` sem anexo e confirmar sucesso do request;
3. abrir `Solicitacao de Compras` com anexo real e confirmar persistencia da `fileUrl`;
4. validar a aba `Concluidas` com itens reais agrupados por mes;
5. confirmar que, apos atribuicao, o dialog exibe o responsavel em leitura e nao mostra mais seletor permanente.

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o commit da Etapa 7 | a rota volta ao estado da Etapa 6/6.1 com 2 workflows e sem aba `Concluidas` |
| 2 | Revalidar suites de `workflow-registry`, `OpenWorkflowCard`, `RequestDetailsDialog` e `api-client` | a base multiworkflow de 2 workflows continua verde |
| 3 | Adiar a consolidacao final do piloto para uma nova etapa | evita contaminar o frontend oficial com build parcial da Etapa 7 |

Metodo rapido: `git revert <commit-da-etapa-7>`

---

## 12. Implementation Checklist

### Pre-Build

- [ ] DEFINE da Etapa 7 aprovado
- [ ] catalogo publicado de `facilities_solicitacao_compras` confirmado em `workflowTypes_v2`
- [ ] `GET /api/workflows/read/completed` validado como disponivel no ambiente
- [ ] workflow 3 confirmado como usando apenas primitives ja suportados pelo formulario dinamico

### Post-Build

- [ ] registry local suporta os 3 workflows
- [ ] `completedQuery` esta plugada no piloto
- [ ] aba `Concluidas` aparece e funciona na rota
- [ ] workflow 3 abre request com e sem anexo opcional
- [ ] dialog mostra responsavel em leitura apos atribuicao
- [ ] Fase 1 fica pronta para transicao ao frontend oficial

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-31 | design-agent | Initial design for Etapa 7, adding workflow 3, completed history, and final UX consolidation for the Facilities pilot |
