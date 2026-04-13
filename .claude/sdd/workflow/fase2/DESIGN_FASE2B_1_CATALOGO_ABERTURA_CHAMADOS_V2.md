# DESIGN: Fase 2B.1 - Catalogo e abertura de chamados v2

> Generated: 2026-04-10
> Status: Ready for build
> Scope: Fase 2 / 2B.1 - rota oficial do solicitante com catalogo por area, selecao de workflow e abertura de chamado no runtime v2
> Base document: `DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md`

## 1. Objetivo

Entregar a primeira superficie oficial do solicitante para o motor v2, separada de `/applications`, cobrindo:

- nova rota autenticada para o usuario final;
- catalogo por `workflowAreas`;
- clique por area com selecao quando houver mais de um workflow;
- modal de submissao com campos dinamicos da versao publicada;
- upload de anexos via fluxo assinado existente;
- abertura efetiva via `POST /api/workflows/runtime/requests`;
- feedback de sucesso com `requestId`.

Esta subfase nao cobre:

- secao `Minhas Solicitacoes`;
- tabela de acompanhamento;
- dialog read-only com detalhe do request;
- qualquer CTA operacional de gestao;
- alteracoes em `/applications`.

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md)
- [DESIGN_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/route.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/uploads/route.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/catalog/[workflowTypeId]/route.ts)
- [published-metadata.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/catalog/published-metadata.ts)
- [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts)
- [DynamicFieldRenderer.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/DynamicFieldRenderer.tsx)
- [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE` para escopo e aceite;
2. este design especializa apenas o build 2B.1;
3. o design macro da 2B continua valendo para direcao geral da feature;
4. o codigo real das rotas e tipos existentes e a referencia final de integracao.

## 3. Lacuna que a 2B.1 Fecha

Hoje o usuario final so consegue abrir solicitacoes pela superficie legada `/applications`, que depende de `ApplicationsContext` e `WorkflowsContext` e nao opera sobre `workflowTypes_v2`.

Ao final da 2B.1:

- `/solicitacoes` passa a existir dentro de `(app)`;
- apenas workflows ativos, publicados e permitidos ao usuario aparecem;
- o formulario usa a versao publicada real do workflow;
- anexos sao enviados com signed URL, sem upload direto inseguro;
- o chamado e criado no runtime v2 e passa a existir em `workflows_v2`.

## 4. Arquitetura

### 4.1. Diagrama

```text
Authenticated User
  |
  v
src/app/(app)/solicitacoes/page.tsx
  |
  v
RequestsV2Page
  |
  +--> useRequesterCatalog()
  |      |
  |      +--> GET /api/workflows/requester/catalog
  |              |
  |              +--> authenticateRuntimeActor()
  |              +--> buildRequesterCatalog(actor.actorUserId)
  |                      |
  |                      +--> workflowAreas
  |                      +--> workflowTypes_v2 (active + published)
  |
  +--> WorkflowAreaGrid
  |      |
  |      +--> WorkflowAreaCard x N
  |
  +--> WorkflowSelectionModal
  |
  \--> WorkflowSubmissionModal
         |
         +--> GET /api/workflows/catalog/[workflowTypeId]
         +--> uploadWorkflowFile(user, ...)
         +--> POST /api/workflows/runtime/requests
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Routing)
1. Criar src/app/(app)/solicitacoes/page.tsx como shell autenticado.

LAYER 2 (Client UI)
2. RequestsV2Page carrega o catalogo e controla os modais.
3. WorkflowAreaGrid renderiza cards por area.
4. WorkflowSelectionModal resolve o caso multi-workflow.
5. WorkflowSubmissionModal carrega metadata publicada, renderiza campos e abre o request.

LAYER 3 (Client Data)
6. api-client requester encapsula GET catalog, GET metadata publicada e POST openRequest.
7. uploadWorkflowFile e reutilizado de src/lib/workflows/upload/client.ts.
8. hook requester expoe query de catalogo, query de metadata e mutation de abertura.

LAYER 4 (Server)
9. GET /api/workflows/requester/catalog autentica e filtra por allowedUserIds.
10. Rotas existentes de catalog, uploads e runtime requests permanecem sem mudanca.
```

### 4.3. Estado de frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| catalogo por area | TanStack Query | fetch no mount; `staleTime` 5 min |
| area selecionada | `useState` local | abre/fecha modal de selecao |
| workflow selecionado | `useState` local | abre/fecha modal de submissao |
| metadata publicada | TanStack Query | lazy ao abrir submissao |
| valores do formulario | `react-hook-form` | reset ao trocar workflow ou fechar modal |
| upload em progresso por campo | `useState` local | efemero durante submit |
| abertura em andamento | mutation state | desabilita submit e fechamento perigoso |

## 5. Architecture Decisions

### ADR-2B1-001: Rota final `/solicitacoes`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | A rota precisa coexistir com `/applications` sem parecer interna ou tecnica. |

**Choice:** usar `/solicitacoes` dentro de `src/app/(app)/`.

**Rationale:**

1. separa claramente legado e v2;
2. nome aderente ao vocabulario do usuario final;
3. reutiliza o gate de autenticacao do layout `(app)`.

### ADR-2B1-002: Novo endpoint agregado de catalogo, sem `fields` inline

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O cliente precisa montar um grid completo por area; o endpoint existente retorna um workflow por vez. |

**Choice:** criar `GET /api/workflows/requester/catalog` com payload leve e carregar `fields` depois via endpoint existente.

**Rationale:**

1. elimina N+1 chamadas para desenhar a tela;
2. evita serializar dezenas de formularios que o usuario nao abrira;
3. alinha com o contrato ja existente em [published-metadata.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/catalog/published-metadata.ts).

### ADR-2B1-003: `allowedUserIds: []` bloqueia todos, e areas vazias sao ocultadas

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O define deixou em aberto o comportamento de workflows sem usuarios permitidos e de areas sem workflows visiveis. |

**Choice:** manter coerencia com `assertCanOpen`: array vazio significa sem acesso; areas sem workflows acessiveis nao aparecem.

**Rationale:**

1. o frontend nao deve divergir do gate server-side;
2. area vazia gera ruido e nao ajuda o solicitante;
3. falhas de configuracao continuam seguras por default.

### ADR-2B1-004: Reaproveitar `uploadWorkflowFile`, nao criar pipeline paralelo

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | Ja existe um cliente de upload v2 pronto e testado em [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts). |

**Choice:** `WorkflowSubmissionModal` deve chamar `uploadWorkflowFile(user, { workflowTypeId, fieldId, file })`.

**Rationale:**

1. reduz codigo novo;
2. reaproveita tratamento de erro de signed URL e transferencia;
3. evita duplicar contratos de upload no requester client.

### ADR-2B1-005: Dynamic renderer proprio para requester v2

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O renderer do piloto nao cobre `date` e `date-range` e usa tipos de outro dominio. |

**Choice:** criar `DynamicFieldRendererV2` em `src/components/workflows/requester/`.

**Rationale:**

1. suporta todos os `VersionFieldType` do runtime v2;
2. evita acoplamento com o piloto;
3. permite UX de modal oficial sem herdar limites do experimento.

### ADR-2B1-006: `date-range` serializado como objeto no `formData`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-10 |
| Context | O runtime aceita `Record<string, unknown>` e nao ha contrato canonico fechado para `date-range` na abertura do solicitante. |

**Choice:** serializar `date-range` como `{ startDate: string, endDate: string }`.

**Rationale:**

1. e semanticamente superior a concatenar string com delimitador;
2. evita parsing fragil em leituras futuras;
3. continua compativel com `normalizeFormData` e persistencia livre do runtime.

## 6. File Manifest

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/lib/workflows/requester/catalog-types.ts` | Create | DTOs do catalogo da tela do solicitante |
| 2 | `src/lib/workflows/requester/build-catalog.ts` | Create | agregacao server-side de areas e workflows acessiveis |
| 3 | `src/app/api/workflows/requester/catalog/route.ts` | Create | endpoint autenticado do catalogo |
| 4 | `src/lib/workflows/requester/api-client.ts` | Create | cliente autenticado para catalogo, metadata e openRequest |
| 5 | `src/hooks/use-requester-workflows.ts` | Create | hooks TanStack Query do requester |
| 6 | `src/app/(app)/solicitacoes/page.tsx` | Create | rota oficial do solicitante |
| 7 | `src/components/workflows/requester/RequestsV2Page.tsx` | Create | shell client da pagina |
| 8 | `src/components/workflows/requester/WorkflowAreaGrid.tsx` | Create | grid de areas |
| 9 | `src/components/workflows/requester/WorkflowAreaCard.tsx` | Create | card clicavel por area |
| 10 | `src/components/workflows/requester/WorkflowSelectionModal.tsx` | Create | modal para areas com varios workflows |
| 11 | `src/components/workflows/requester/DynamicFieldRendererV2.tsx` | Create | renderer de campos v2 |
| 12 | `src/components/workflows/requester/WorkflowSubmissionModal.tsx` | Create | modal de submissao com upload e abertura |

Arquivos explicitamente fora deste build:

- `MyRequestsV2Section.tsx`
- `MyRequestDetailDialog.tsx`
- qualquer integracao com `GET /api/workflows/read/mine`
- qualquer integracao com `GET /api/workflows/read/requests/[requestId]`

## 7. Code Patterns

### 7.1. Catalog types

```ts
export type RequesterCatalogWorkflow = {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
};

export type RequesterCatalogArea = {
  areaId: string;
  areaName: string;
  areaIcon?: string;
  workflows: RequesterCatalogWorkflow[];
};
```

### 7.2. Catalog builder

```ts
export async function buildRequesterCatalog(actorUserId: string): Promise<RequesterCatalogArea[]> {
  const db = getFirestore(getFirebaseAdminApp());

  const [areasSnap, typesSnap] = await Promise.all([
    db.collection('workflowAreas').get(),
    db
      .collection('workflowTypes_v2')
      .where('active', '==', true)
      .where('latestPublishedVersion', '!=', null)
      .get(),
  ]);

  const areasById = new Map(areasSnap.docs.map((doc) => [doc.id, doc.data()]));

  const visibleTypes = typesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((item) => {
      const allowed = Array.isArray(item.allowedUserIds) ? item.allowedUserIds : [];
      return allowed.includes('all') || allowed.includes(actorUserId);
    });

  const grouped = new Map<string, RequesterCatalogWorkflow[]>();

  visibleTypes.forEach((item) => {
    const areaId = typeof item.areaId === 'string' ? item.areaId : '';
    if (!areaId) return;
    if (!grouped.has(areaId)) grouped.set(areaId, []);
    grouped.get(areaId)!.push({
      workflowTypeId: typeof item.workflowTypeId === 'string' ? item.workflowTypeId : item.id,
      name: typeof item.name === 'string' ? item.name : item.id,
      description: typeof item.description === 'string' ? item.description : '',
      icon: typeof item.icon === 'string' ? item.icon : 'FolderOpen',
    });
  });

  return Array.from(grouped.entries())
    .map(([areaId, workflows]) => {
      const area = areasById.get(areaId) as { name?: string; icon?: string } | undefined;
      return {
        areaId,
        areaName: area?.name?.trim() || areaId,
        areaIcon: area?.icon?.trim() || undefined,
        workflows: workflows.sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.areaName.localeCompare(b.areaName));
}
```

### 7.3. API client autenticado

Seguir o mesmo padrao de [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts): funcoes recebem `user: User`, geram `Bearer token` com `user.getIdToken()` e lancam erro tipado quando `ok !== true`.

Escopo do requester client:

- `fetchRequesterCatalog(user)`
- `fetchPublishedWorkflow(user, workflowTypeId)`
- `openRequesterWorkflow(user, payload)`

Uploads continuam em [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts).

### 7.4. Submission modal

Seguir a composicao de [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx), mas em formato de modal:

- `react-hook-form` com `Controller` por campo dinamico;
- validacao por campo obrigatorio;
- `buildFormData` assincrono para executar uploads antes do `POST`;
- erro de upload e erro de abertura exibidos no corpo do modal;
- reset ao fechar ou ao concluir com sucesso.

### 7.5. Normalizacao de `formData`

| Field type | Payload final |
|-----------|---------------|
| `text` | `string` trimada |
| `textarea` | `string` trimada |
| `select` | `string` |
| `date` | `YYYY-MM-DD` |
| `date-range` | `{ startDate, endDate }` |
| `file` | `{ fileUrl, storagePath, uploadId, fileName, contentType }` |

Observacao: para `file`, o design recomenda persistir o objeto completo retornado pelo cliente de upload. O runtime aceita `unknown` e isso preserva contexto para leituras futuras; se o build optar por persistir apenas `fileUrl`, isso deve ser tratado como simplificacao consciente e documentada no build.

## 8. API Contract

### 8.1. GET `/api/workflows/requester/catalog`

```http
GET /api/workflows/requester/catalog
Authorization: Bearer {firebase-id-token}
```

```json
{
  "ok": true,
  "data": [
    {
      "areaId": "facilities",
      "areaName": "Facilities",
      "areaIcon": "Building2",
      "workflows": [
        {
          "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
          "name": "Manutencao - Solicitacoes Gerais",
          "description": "Abertura de manutencoes gerais.",
          "icon": "Wrench"
        }
      ]
    }
  ]
}
```

Filtros obrigatorios server-side:

- `active === true`
- `latestPublishedVersion !== null`
- `allowedUserIds` contem `'all'` ou `actor.actorUserId`
- areas sem nenhum workflow visivel sao omitidas

### 8.2. GET `/api/workflows/catalog/[workflowTypeId]`

Sem mudanca de contrato. Retorna `WorkflowPublishedMetadata` com:

- `workflowName`
- `description`
- `version`
- `fields`
- `steps`
- `defaultSlaDays`

### 8.3. POST `/api/workflows/runtime/requests`

Request body esperado no requester:

```json
{
  "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
  "requesterName": "Lucas Nogueira",
  "formData": {
    "titulo": "Troca de luminaria",
    "periodo": {
      "startDate": "2026-04-11",
      "endDate": "2026-04-12"
    },
    "anexo": {
      "fileUrl": "https://...",
      "storagePath": "Workflows/workflows_v2/uploads/...",
      "uploadId": "upl_123",
      "fileName": "foto.png",
      "contentType": "image/png"
    }
  }
}
```

Success:

```json
{
  "ok": true,
  "data": {
    "requestId": 42,
    "docId": "abc123"
  }
}
```

## 9. Testing Strategy

### 9.1. Unit

| Target | Test |
|--------|------|
| `build-catalog.ts` | filtra `active`, `latestPublishedVersion`, `allowedUserIds`; omite areas vazias; ordena alfabeticamente |
| `DynamicFieldRendererV2` | renderiza `text`, `textarea`, `select`, `date`, `date-range`, `file`; mostra erro; limpa file input ao reset |
| `WorkflowSubmissionModal` helpers | constroi `formData`; trim de strings; bloqueia obrigatorios; serializa `date-range`; mapeia upload |

### 9.2. Integration

| Flow | Test |
|------|------|
| `GET /api/workflows/requester/catalog` | exige auth; retorna apenas workflows acessiveis |
| submit end-to-end do modal | metadata lazy -> upload -> openRequest -> toast de sucesso |

### 9.3. Acceptance

```gherkin
GIVEN um usuario autenticado com acesso a 3 workflows v2
WHEN acessa /solicitacoes
THEN ve cards apenas das areas que contem workflows acessiveis

GIVEN uma area com 1 workflow visivel
WHEN clica no card
THEN o modal de submissao abre diretamente

GIVEN uma area com 2 workflows visiveis
WHEN clica no card
THEN um modal de selecao e exibido antes da submissao

GIVEN um formulario com campo file obrigatorio
WHEN seleciona arquivo e envia
THEN o cliente executa signed upload e persiste a referencia no formData

GIVEN um submit valido
WHEN a API responde sucesso
THEN a UI exibe o requestId gerado
AND fecha o modal
```

## 10. Rollback Plan

Como o build e aditivo e isolado, rollback e simples:

1. remover `src/app/(app)/solicitacoes/page.tsx`;
2. remover `src/components/workflows/requester/`;
3. remover `src/lib/workflows/requester/`;
4. remover `src/hooks/use-requester-workflows.ts`;
5. remover `src/app/api/workflows/requester/catalog/`.

Verificacao de rollback:

- `/applications` continua intacta;
- endpoints existentes de runtime e upload continuam sem alteracao;
- nenhuma mudanca de schema precisa ser revertida.

## 11. Checklist de Build

- [x] rota final definida como `/solicitacoes`
- [x] contrato do catalogo fechado
- [x] comportamento de `allowedUserIds: []` fechado
- [x] areas vazias definidas como ocultas
- [x] uploads alinhados ao cliente existente
- [x] escopo de 2B.2 removido deste artefato
- [ ] implementar manifest completo do build
- [ ] validar smoke manual com workflow publicado e ativo
