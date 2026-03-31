# DESIGN: FASE1_FACILITIES_ETAPA6

> Generated: 2026-03-30
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 6 - Workflow 2 na mesma UI do piloto
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA6.md`

## 1. Objetivo

Evoluir a rota autenticada `/pilot/facilities` para operar, na mesma superficie, `facilities_manutencao_solicitacoes_gerais` e `facilities_solicitacao_suprimentos`, integrando o campo `file` do workflow 2 por meio da infraestrutura de upload da Etapa 5, ja consumida pela camada cliente generica corrigida na Etapa 5.1.

Esta etapa cobre:

- selecao de workflow na mesma rota do piloto;
- carregamento do catalogo publicado apenas do workflow ativo;
- suporte funcional ao tipo `file` no formulario dinamico;
- consumo da rota `POST /api/workflows/runtime/uploads` por um helper cliente generico;
- coexistencia ergonomica de workflow 1 e workflow 2 em `Chamados atuais`, `Atribuicoes e acoes` e `Minhas solicitacoes`;
- reforco de identidade visual do workflow nas listas e no dialog operacional.

Esta etapa nao cobre:

- `facilities_solicitacao_compras`;
- novos endpoints backend read-side;
- consolidacao final de branding/navegacao da UX do piloto;
- redesign do mecanismo de anexos entregue na Etapa 5;
- promocao completa de toda a camada cliente do piloto para modulo compartilhado.

### Convivencia com producao

O build continua isolado em `/pilot/facilities`, preserva o contrato das rotas do motor v2 e nao reintroduz `WorkflowsContext`, `RequestsContext`, `WorkflowSubmissionModal` ou Firestore direto no cliente.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA6.md)
- [DEFINE_FASE1_FACILITIES_ETAPA5.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA5.md)
- [DESIGN_FASE1_FACILITIES_ETAPA5.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA5.md)
- [DEFINE_FASE1_FACILITIES_ETAPA5_1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA5_1.md)
- [DEFINE_FASE1_FACILITIES_ETAPA4.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA4.md)
- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [ROADMAP_ETAPAS_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_ETAPAS_FASE1_FACILITIES.md)
- [implementation_progress_fase1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/implementation_progress_fase1.md)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/pilot/facilities/page.tsx)
- [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx)
- [DynamicFieldRenderer.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/DynamicFieldRenderer.tsx)
- [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts)
- [query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/query-keys.ts)
- [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/types.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA6.md` para escopo e aceite;
2. depois prevalecem os contratos HTTP ja implementados do motor v2 e do upload da Etapa 5;
3. depois prevalece este documento para guiar o build;
4. depois os roadmaps servem como direcao de sequenciamento.

---

## 3. Decisoes Fechadas da Etapa 6

### 3.1. Rota unica com workflow ativo navegavel

- a rota continua unica em `/pilot/facilities`;
- o workflow ativo sera espelhado em `?workflow=<workflowTypeId>`;
- `page.tsx` lera `searchParams` no Server Component e passara `initialWorkflowTypeId` para `FacilitiesPilotPage`;
- o fallback default continua sendo `facilities_manutencao_solicitacoes_gerais`.

### 3.2. Catalogo por demanda, sem `useQueries`

- a UI nao preloadara catalogos de todos os workflows suportados;
- apenas o catalogo do workflow ativo sera carregado;
- ao trocar de workflow, a mesma query de catalogo muda de chave e faz lazy-load;
- a etapa nao usara `useQueries` para os dois catalogos ao mesmo tempo.

### 3.3. Read-side global, filtro local por workflow

- `current`, `assignments` e `mine` continuam vindo dos mesmos endpoints globais por usuario;
- o filtro por workflow sera local e de apresentacao;
- a UX suportara dois escopos de lista:
  - `all`
  - `active`
- as metricas do topo continuam globais e nao respondem ao filtro `all` vs `active`.

### 3.4. Etapa 6 consome a camada generica de upload ja promovida

Fica fechado que a promocao do helper de upload ja ocorreu na Etapa 5.1 e, nesta etapa:

- o piloto importa `uploadWorkflowFile` de `src/lib/workflows/upload/client`;
- a UI nao reabre discussao de namespace do helper;
- a Etapa 6 apenas consome essa capacidade no submit do formulario.

### 3.5. Integracao do upload acontece no formulario, nao no hook global

- o helper generico de upload sera usado no fluxo de submit do formulario de abertura;
- `FacilitiesPilotPage` ou `OpenWorkflowCard` recebe uma funcao `uploadFile` ja ligada ao `user` autenticado;
- o hook `useFacilitiesPilot` nao vira um contexto global de upload.

### 3.6. Preservacao do workflow 1

- o fluxo do workflow 1 continua funcional na mesma tela;
- a integracao de `file` nao pode introduzir exigencia artificial de upload para campos nao-`file`;
- o card de abertura continua montando `formData` dinamicamente a partir do catalogo ativo.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Server Component page.tsx
  |
  +--> read searchParams.workflow
  +--> resolve supported workflow or fallback
  v
FacilitiesPilotPage(initialWorkflowTypeId)
  |
  +--> local state: activeWorkflowTypeId
  +--> local state: listScope = all | active
  +--> useFacilitiesPilot(activeWorkflowTypeId, currentFilter, includeCurrent)
  |       |
  |       +--> catalog query for active workflow only
  |       +--> current / assignments / mine global queries
  |       +--> local invalidation for runtime mutations
  |
  +--> uploadWorkflowFile(user, { workflowTypeId, fieldId, file })
  |       |
  |       +--> requestWorkflowFileUpload(user, ...)
  |       +--> putFileToSignedUrl(uploadUrl, headers, blob)
  |       v
  |     returns fileUrl
  |
  +--> OpenWorkflowCard(active catalog + uploadFile)
  |       |
  |       +--> resolveFormDataForSubmit()
  |               |
  |               +--> scalar fields => trim/normalize
  |               +--> file fields => uploadWorkflowFile()
  |               v
  |             OpenPilotRequestInput
  |
  +--> POST /api/workflows/runtime/requests
  |
  +--> CurrentQueueTab / AssignmentsTab / MyRequestsTab
          |
          +--> filtered by active workflow locally when scope = active
          +--> RequestDetailsDialog shared across both workflows
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Routing / page state)
1. page.tsx resolve workflow inicial pela URL
2. FacilitiesPilotPage controla workflow ativo e escopo das listas

LAYER 2 (Pilot orchestration)
3. useFacilitiesPilot carrega catalogo do workflow ativo
4. useFacilitiesPilot continua carregando read-side global por usuario
5. selectors locais filtram listas por workflow

LAYER 3 (Shared upload client)
6. requestWorkflowFileUpload() inicializa signed upload
7. putFileToSignedUrl() transfere o blob
8. uploadWorkflowFile() entrega fileUrl ao formulario

LAYER 4 (Open form)
9. OpenWorkflowCard serializa campos dinamicos
10. file fields viram fileUrl antes do open-request

LAYER 5 (Backend existente)
11. catalog / runtime / read / uploads continuam com contratos atuais
```

### 4.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| workflow ativo | `useState` em `FacilitiesPilotPage` | inicializado pela URL e atualizado localmente |
| escopo das listas | `useState` local | default `all`, sem roundtrip backend |
| catalogo ativo | React Query | um cache por `workflowTypeId` com `staleTime` alto |
| queries globais read-side | React Query | por usuario autenticado, sem segmentacao backend por workflow |
| valores do formulario dinamico | React Hook Form | resetados ao trocar o catalogo ativo |
| arquivo selecionado | estado do campo no form | persiste ate submit ou reset |
| upload em andamento | estado local do submit | embutido no submit do card |
| request selecionado | `useState` local | controla o dialog compartilhado |

---

## 5. Architecture Decision Records

### ADR-6.1: Workflow ativo vem de `page.tsx`, nao de `useSearchParams` no client

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | A Etapa 6 precisa de URL navegavel sem criar dependencia desnecessaria de `useSearchParams` no Client Component. |

**Choice:** `page.tsx` le `searchParams` no Server Component e passa `initialWorkflowTypeId` para `FacilitiesPilotPage`.

**Consequences:**

- elimina necessidade de `Suspense` so para ler `searchParams`;
- preserva deep-link e refresh consistente;
- deixa a pagina client focada em estado de tela, nao em bootstrap da rota.

### ADR-6.2: Catalogo do workflow ativo e lazy-loaded

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | Os workflows podem ter politicas de acesso diferentes; preloadar todos os catalogos no mount adiciona `403` desnecessario e complexidade. |

**Choice:** carregar apenas o catalogo do workflow ativo.

**Consequences:**

- evita `useQueries` para catalogos multiplos;
- reduz ruido de rede e complexidade de tratamento de erro;
- mantem a base da Etapa 4 proxima do shape atual.

### ADR-6.3: Upload helper sobe para camada cliente generica, mas o restante do pilot client continua local

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | A Etapa 5.1 ja promoveu o helper de upload para `src/lib/workflows/upload/*`; a Etapa 6 nao deve repetir essa refatoracao. |

**Choice:** consumir diretamente `src/lib/workflows/upload/*` e manter o restante do `api-client` do piloto local a Facilities.

**Consequences:**

- a Etapa 6 fica focada em UI multiworkflow;
- o piloto reaproveita a camada correta sem carregar refatoracao estrutural adicional;
- o restante da camada `pilot` pode ser promovido depois com menos pressa.

### ADR-6.4: Filtro `all` vs `active` afeta listas, nao metricas

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | Com dois workflows coexistindo, a UX precisa de clareza sobre o que e total da fila e o que e filtro operacional local. |

**Choice:** os cards do topo permanecem globais; o escopo `all` vs `active` afeta apenas as listas nas tabs.

**Consequences:**

- reduz ambiguidade de UX;
- evita duplicar calculo de metricas;
- preserva leitura rapida da carga global do usuario/owner.

---

## 6. File Manifest

| Ordem | Caminho | Acao | Responsabilidade | Skill/Agente sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/pilot/facilities/page.tsx) | Update | Ler `searchParams` e passar `initialWorkflowTypeId` para a pagina client | `build` |
| 2 | [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx) | Update | Controlar workflow ativo, escopo local das listas e consumo do helper generico de upload | `build` |
| 3 | [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx) | Update | Suportar `file`, reset por workflow ativo e composicao de `formData` com upload | `build` |
| 4 | [DynamicFieldRenderer.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/DynamicFieldRenderer.tsx) | Update | Render funcional de `input type="file"` e mensagens de estado/erro | `build` |
| 5 | [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx) | Update | Reforcar identidade do workflow na listagem | `build` |
| 6 | [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx) | Update | Exibir identidade do workflow e preparar leitura de campo `file` como URL | `build` |
| 7 | [CurrentQueueTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CurrentQueueTab.tsx) | Update | Receber itens ja filtrados e controle de escopo local | `build` |
| 8 | [AssignmentsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/AssignmentsTab.tsx) | Update | Receber itens ja filtrados e controle de escopo local | `build` |
| 9 | [MyRequestsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/MyRequestsTab.tsx) | Update | Receber grupos filtrados por workflow e manter agrupamento mensal | `build` |
| 10 | [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts) | Update | Operar catalogo do workflow ativo e manter queries globais do read-side | `build` |
| 11 | [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts) | Update | Tipos de workflow ativo, escopo local e `DynamicFormValue` do piloto | `build` |
| 12 | [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts) | Reuse | Manter catalog/runtime/read do piloto sem reintroduzir upload no namespace `pilot` | `build` |
| 13 | [query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/query-keys.ts) | Update | Preservar chaves atuais e manter catalogo por workflowTypeId ativo | `build` |
| 14 | [workflow-registry.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-registry.ts) | Create | Registrar workflows suportados e fallback default da Etapa 6 | `build` |
| 15 | [workflow-filters.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/workflow-filters.ts) | Create | Helpers puros para filtrar arrays e grupos por `workflowTypeId` | `build` |
| 16 | [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts) | Reuse | Consumir `requestWorkflowFileUpload`, `putFileToSignedUrl` e `uploadWorkflowFile` ja promovidos na Etapa 5.1 | `build` |
| 17 | [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/types.ts) | Reuse | Consumir tipos genericos de upload da Etapa 5.1 | `build` |
| 18 | [OpenWorkflowCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx) | Update | Cobrir submit do workflow 2 com `file` e reset por workflow | `build` |
| 19 | [RequestDetailsDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx) | Update | Cobrir identidade visual do workflow e render de URL de arquivo | `build` |
| 20 | [api-client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/api-client.test.ts) | Update | Remover cobertura de upload do namespace `pilot` e manter catalog/runtime/read | `build` |
| 21 | [client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/__tests__/client.test.ts) | Reuse | Cobertura do helper generico de upload ja entregue na Etapa 5.1 | `build` |
| 22 | [workflow-filters.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/workflow-filters.test.ts) | Create | Garantir filtragem local de arrays e grupos por workflow | `build` |

---

## 7. Padrões de Implementacao

### 7.1. Registro central dos workflows suportados

```ts
export const FACILITIES_PILOT_WORKFLOWS = [
  {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    default: true,
  },
  {
    workflowTypeId: 'facilities_solicitacao_suprimentos',
    default: false,
  },
] as const;

export type FacilitiesPilotWorkflowTypeId =
  (typeof FACILITIES_PILOT_WORKFLOWS)[number]['workflowTypeId'];

export function resolveFacilitiesPilotWorkflowTypeId(input?: string): FacilitiesPilotWorkflowTypeId {
  if (
    input === 'facilities_manutencao_solicitacoes_gerais' ||
    input === 'facilities_solicitacao_suprimentos'
  ) {
    return input;
  }

  return 'facilities_manutencao_solicitacoes_gerais';
}
```

Regra:

- a Etapa 6 centraliza os IDs suportados;
- a Etapa 7 adiciona o terceiro workflow no mesmo registro;
- labels amigaveis devem continuar vindo preferencialmente do catalogo.

### 7.2. `page.tsx` resolve o workflow inicial

```tsx
import { FacilitiesPilotPage } from '@/components/pilot/facilities/FacilitiesPilotPage';
import { resolveFacilitiesPilotWorkflowTypeId } from '@/lib/workflows/pilot/workflow-registry';

type PilotFacilitiesPageProps = {
  searchParams?: Promise<{ workflow?: string }>;
};

export default async function PilotFacilitiesPage({ searchParams }: PilotFacilitiesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialWorkflowTypeId = resolveFacilitiesPilotWorkflowTypeId(params?.workflow);

  return <FacilitiesPilotPage initialWorkflowTypeId={initialWorkflowTypeId} />;
}
```

Regra:

- o Client Component nao depende de `useSearchParams` para bootstrap;
- a URL continua sendo a fonte navegavel do workflow ativo.

### 7.3. Consumo do helper de upload client-side generico

```ts
import { uploadWorkflowFile } from '@/lib/workflows/upload/client';
import type {
  WorkflowUploadFileInput,
  WorkflowUploadFileResult,
} from '@/lib/workflows/upload/types';

type UploadFile = (
  input: WorkflowUploadFileInput,
) => Promise<WorkflowUploadFileResult>;

type OpenWorkflowCardProps = {
  uploadFile: UploadFile;
};
```

Regra:

- o modulo ja foi promovido na Etapa 5.1;
- a Etapa 6 apenas o consome;
- a Etapa 6 nao deve reimplementar `requestWorkflowFileUpload`, `putFileToSignedUrl` ou `uploadWorkflowFile`;
- erros de assinatura/auth continuam vindo como `PilotApiError` ou equivalente de envelope, enquanto erro de transferencia do blob fica em erro tipado especifico.

### 7.4. Serializacao do formulario com suporte a `file`

```ts
import type {
  DynamicFormValue,
  PilotWorkflowCatalog,
} from '@/lib/workflows/pilot/types';
import type {
  WorkflowUploadFileInput,
  WorkflowUploadFileResult,
} from '@/lib/workflows/upload/types';

function normalizeScalarValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

async function buildFormDataForCatalog(params: {
  catalog: PilotWorkflowCatalog;
  values: Record<string, DynamicFormValue>;
  uploadFile: (input: WorkflowUploadFileInput) => Promise<WorkflowUploadFileResult>;
}) {
  const formData: Record<string, unknown> = {};

  for (const field of params.catalog.fields) {
    const rawValue = params.values[field.id];

    if (field.type === 'file') {
      const file = rawValue instanceof File ? rawValue : null;

      if (field.required && !file) {
        throw new Error('Campo obrigatorio.');
      }

      if (file) {
        const { fileUrl } = await params.uploadFile({
          workflowTypeId: params.catalog.workflowTypeId,
          fieldId: field.id,
          file,
        });

        formData[field.id] = fileUrl;
      }

      continue;
    }

    const normalized = normalizeScalarValue(rawValue);

    if (normalized !== undefined) {
      formData[field.id] = normalized;
    }
  }

  return formData;
}
```

Regra:

- o upload acontece dentro do submit do card;
- workflow 1 continua sem fluxo de upload porque nao possui campo `file`;
- workflow 2 usa o mesmo builder dinamico sem branch estrutural separada.

### 7.5. Filtro local de listas e grupos

```ts
import type {
  PilotMonthGroup,
  PilotRequestSummary,
  PilotWorkflowScope,
} from '@/lib/workflows/pilot/types';

export function filterRequestsByWorkflow(
  items: PilotRequestSummary[],
  scope: PilotWorkflowScope,
  activeWorkflowTypeId: string,
) {
  if (scope === 'all') {
    return items;
  }

  return items.filter((item) => item.workflowTypeId === activeWorkflowTypeId);
}

export function filterMonthGroupsByWorkflow(
  groups: PilotMonthGroup[],
  scope: PilotWorkflowScope,
  activeWorkflowTypeId: string,
) {
  if (scope === 'all') {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.workflowTypeId === activeWorkflowTypeId),
    }))
    .filter((group) => group.items.length > 0);
}
```

Regra:

- `mine.groups` precisa ser recomposto apos a filtragem;
- o payload do cache nao deve ser mutado.

---

## 8. API / Contract Impact

### 8.1. Backend

Nenhuma rota nova.

Rotas consumidas:

- `GET /api/workflows/catalog/[workflowTypeId]`
- `GET /api/workflows/read/current?filter=...`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/mine`
- `POST /api/workflows/runtime/requests`
- `POST /api/workflows/runtime/requests/{id}/assign`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`
- `POST /api/workflows/runtime/uploads`

### 8.2. Frontend contract change

`OpenWorkflowCard` deixa de assumir apenas `string` como valor util do form e passa a suportar:

```ts
type DynamicFormValue = string | File | null;
```

Sem mudar o contrato final do `onSubmit`, que continua recebendo:

```ts
type OpenPilotRequestInput = {
  workflowTypeId: string;
  requesterName: string;
  formData: Record<string, unknown>;
};
```

---

## 9. Estrategia de Build

### 9.1. Sequencia recomendada

1. criar `workflow-registry.ts` e resolver workflow ativo via `page.tsx`;
2. consumir o helper de upload ja promovido em `src/lib/workflows/upload/*`;
3. adaptar `FacilitiesPilotPage` e `useFacilitiesPilot` para workflow ativo + filtro local;
4. integrar `file` em `DynamicFieldRenderer` e `OpenWorkflowCard`;
5. reforcar identidade de workflow nas listas e no dialog;
6. atualizar testes de upload, filtros e formulario;
7. validar smoke do workflow 2 na mesma rota.

### 9.2. Invariantes do build

- nenhuma rota paralela para suprimentos;
- nenhum novo endpoint read-side;
- nenhuma dependencia de contextos operacionais legados;
- `uploadWorkflowFile` fica fora do namespace `pilot`;
- `current`, `assignments` e `mine` continuam globais por usuario;
- o workflow 1 continua funcional.

---

## 10. Testing Strategy

### 10.1. Unitario

- `workflow-registry`:
  - resolve fallback default;
  - aceita apenas os dois workflow IDs da etapa;
- `workflow-filters`:
  - filtra arrays planos;
  - recompõe grupos de `mine`;
- `upload-client`:
  - assina upload;
  - faz `PUT`;
  - diferencia erro HTTP autenticado de erro de transferencia;
- `OpenWorkflowCard`:
  - reseta ao trocar workflow;
  - exige `file` quando o catalogo marcar obrigatorio;
  - envia `fileUrl`, nao `File`.

### 10.2. Componentes

- `DynamicFieldRenderer`:
  - renderiza `input type="file"`;
  - mostra estado de arquivo selecionado;
- `FacilitiesPilotPage`:
  - respeita `initialWorkflowTypeId`;
  - troca workflow ativo sem recriar rota;
  - preserva metricas globais;
  - aplica filtro `all` vs `active` nas listas.

### 10.3. Regressao

- workflow 1 continua abrindo payload sem `file`;
- `api-client` do piloto continua cobrindo catalog/read/runtime sem upload dentro do namespace `pilot`.

### 10.4. Manual obrigatorio

- owner:
  - alternar entre workflow 1 e workflow 2 na mesma rota;
  - abrir `Solicitacao de Suprimentos` com anexo valido;
  - atribuir, finalizar e arquivar item do workflow 2;
- solicitante:
  - ver workflow 1 e workflow 2 coexistindo em `Minhas solicitacoes`;
- mistura operacional:
  - confirmar coerencia das listas em `Todos os workflows` e `Somente workflow ativo`;
- regressao:
  - abrir e operar workflow 1 na mesma tela apos a integracao do campo `file`.

### 10.5. Comandos de verificacao esperados

- `npm test -- --runInBand src/lib/workflows/upload/__tests__/client.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts src/lib/workflows/pilot/__tests__/workflow-filters.test.ts src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx`
- `npm run typecheck -- --pretty false 2>&1 | rg 'src/(lib/workflows/upload|lib/workflows/pilot|components/pilot/facilities|hooks/use-facilities-pilot|app/\\(app\\)/pilot/facilities)'`

---

## 11. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|------|---------|-----------|
| A integracao de `file` introduzir regressao no workflow 1 | Alto | manter builder dinamico unico e cobrir explicitamente o caminho sem `file` |
| O filtro local esconder incoerencias de lista | Medio | adicionar testes com payload misto e asserts de contagem por workflow |
| O estado do workflow ativo quebrar refresh/deep-link | Medio | resolver bootstrap via `page.tsx` + fallback deterministico |
| O consumo do helper generico de upload na UI ficar acoplado a detalhes demais do formulario | Medio | manter a integracao confinada ao submit do card, sem contexto global de upload |

---

## 12. Rollback Plan

Se a Etapa 6 introduzir regressao relevante:

1. restaurar `/pilot/facilities` para operar apenas `facilities_manutencao_solicitacoes_gerais`;
2. esconder o seletor de workflow e o filtro `all` vs `active`;
3. manter a infraestrutura de upload da Etapa 5 intacta;
4. manter a camada generica de upload da Etapa 5.1 e reverter apenas a integracao da UI, se a regressao estiver no formulario multiworkflow;
5. preservar o backend e os artefatos `_v2` sem migracao de dados.

Rollback nao exige limpeza de uploads ja realizados no prefixo `preopen/`.

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-30 | codex | Criado o design da Etapa 6 para habilitar workflow 2 na mesma UI do piloto, com filtro local por workflow, integracao de `file` no formulario dinamico e promocao do helper de upload para camada cliente generica. |
| 1.1 | 2026-03-30 | codex | Revisado apos a Etapa 5.1 para tratar `src/lib/workflows/upload/*` como dependencia ja entregue e retirar da Etapa 6 a promocao do helper do escopo de build. |
| 1.2 | 2026-03-30 | codex | Corrigidos os padroes da Etapa 6 para consumir `src/lib/workflows/upload/*` sem reimplementacao, e para mover `DynamicFormValue` e `PilotWorkflowScope` para `pilot/types.ts`. |
