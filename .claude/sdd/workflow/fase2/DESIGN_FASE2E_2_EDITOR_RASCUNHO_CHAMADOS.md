# DESIGN: Fase 2E.2 - Criacao de area, workflow type e editor de rascunho

> Generated: 2026-04-08
> Status: Ready for build
> Scope: Fase 2 / 2E.2 - criacao de area, criacao de workflow type, abertura de novas versoes draft e editor dedicado com salvamento permissivo
> Base document: `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`
> Depends on: `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`

## 1. Objetivo

Entregar a primeira superficie de escrita do configurador admin v2, preservando o runtime publicado e permitindo que admins com `canManageWorkflowsV2`:

- criem novas areas em `workflowAreas` sem editar `storageFolderPath` manualmente;
- criem novos workflow types com `workflowTypeId` gerado automaticamente;
- abram `v1 draft` de forma atomica junto ao documento raiz do tipo;
- criem novos drafts derivados da ultima versao publicada de um tipo existente;
- editem configuracao geral, campos e etapas em um editor dedicado;
- salvem rascunhos incompletos sem publicar e sem alterar o comportamento do runtime ativo.

Esta subetapa nao cobre:

- publicacao de versao;
- ativacao/desativacao operacional de versao publicada;
- retrocompatibilizacao da tela legada `/admin/workflows`;
- implementacao funcional do `Historico Geral`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md)
- [DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md)
- [BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md)
- [AuthContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/AuthContext.tsx)
- [CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx)
- [WorkflowAreasContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowAreasContext.tsx)
- [WorkflowDefinitionForm.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/WorkflowDefinitionForm.tsx)
- [ManageWorkflowAreas.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/ManageWorkflowAreas.tsx)
- [RecipientSelectionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/RecipientSelectionModal.tsx)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [resolve-published-version.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/resolve-published-version.ts)
- [payload-builder.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts)
- [field-normalization.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/field-normalization.ts)
- [status-normalization.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md` para escopo e aceite;
2. depois prevalece o design da `2E.1` para rota, permissao e shell base;
3. depois prevalece este design para orientar o build;
4. o runtime publicado continua sendo a restricao final: drafts nao podem quebrar `assertCanOpen` nem `resolvePublishedVersion`.

---

## 3. Estado Atual e Lacuna que a 2E.2 Fecha

### 3.1. O que o repositorio ja oferece

- o runtime v2 ja consome `workflowTypes_v2/{workflowTypeId}` e `versions/{version}`;
- a leitura operacional depende do documento raiz para `allowedUserIds`, `ownerUserId`, `active` e `latestPublishedVersion`;
- o bootstrap da `2E.1` ja separou a nova superficie admin em `/admin/request-config` com gate proprio;
- o legado ja possui formularios ricos para areas, campos e selecao de destinatarios, que podem servir de referencia de UX;
- o bootstrap de seeds da `2C` mostra como normalizar campos e steps para o contrato publicado.

### 3.2. Problema real no codigo atual

- `WorkflowTypeV2.latestPublishedVersion` e tratado como numero obrigatorio, mas tipos draft-only precisam existir sem versao publicada;
- `WorkflowVersionV2.publishedAt` e tipado como `Timestamp`, mas drafts ainda nao publicados precisam de `null`;
- `allowedUserIds`, `ownerUserId`, `name`, `description`, `icon` e `areaId` vivem hoje no documento raiz, o que impediria editar um draft de tipo ja publicado sem afetar o runtime ativo;
- `ManageWorkflowAreas` expoe `storageFolderPath` como input manual, o que viola o define desta subetapa;
- nao existe fluxo transacional para criar raiz + `v1 draft` nem para abrir novo draft sequencial.

### 3.3. Resultado esperado ao final da 2E.2

- a shell de `/admin/request-config` passa a ter CTAs funcionais para `Nova area`, `Novo tipo` e `Editar rascunho`;
- a criacao de area persiste `storageFolderPath` automaticamente no servidor, oculto da UI;
- a criacao de workflow type gera `workflowTypeId`, cria documento raiz inativo e cria `versions/1` em `draft`;
- cada tipo passa a ter no maximo um draft aberto por vez;
- a edicao de draft passa a operar sobre um snapshot proprio da versao draft, sem mutar o documento raiz de tipos ja publicados;
- `Salvar rascunho` persiste configuracao incompleta e devolve pendencias informativas para futura publicacao.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config
  |      |
  |      +--> Definitions tab
  |             |
  |             +--> CreateAreaDialog
  |             +--> CreateWorkflowTypeDialog
  |             \--> Catalog tree
  |                      |
  |                      +--> "Editar rascunho" -> existing draft
  |                      \--> "Nova versao draft" -> POST draft clone
  |
  \--> /admin/request-config/[workflowTypeId]/versions/[version]/edit
          |
          +--> WorkflowDraftEditorPage
                  |
                  +--> GeneralSettingsSection
                  +--> AccessSection
                  +--> FieldsSection
                  +--> StepsSection
                  +--> PublishReadinessPanel
                  \--> SaveDraftAction

Client API
  |
  +--> POST /api/admin/request-config/areas
  +--> POST /api/admin/request-config/workflow-types
  +--> POST /api/admin/request-config/workflow-types/[workflowTypeId]/drafts
  +--> GET  /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]
  \--> PUT  /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]

Server services
  |
  +--> verifyBearerToken + resolve admin collaborator + canManageWorkflowsV2
  +--> firestore transaction for create area / type / draft clone
  +--> id builders (areaId, workflowTypeId)
  +--> draft validation (warnings only)
  \--> catalog/editor presenters

Firestore
  |
  +--> workflowAreas/{areaId}
  +--> workflowTypes_v2/{workflowTypeId}
  \--> workflowTypes_v2/{workflowTypeId}/versions/{version}
         |- published versions: runtime shape
         \- draft versions: runtime shape + draftConfig snapshot + editedAt metadata
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Shell actions)
1. Usuario abre /admin/request-config.
2. A tab Definicoes mostra CTAs de escrita alem do catalogo read-only da 2E.1.

LAYER 2 (Create flows)
3. Nova area abre modal leve com name + icon.
4. Novo tipo abre modal com area, nome, descricao, owner e allowedUserIds.
5. Nova versao draft e acionada a partir de um tipo publicado ou draft-only sem draft aberto.

LAYER 3 (Server commands)
6. Server gera areaId, storageFolderPath e workflowTypeId.
7. Transacoes garantem unicidade e criacao atomica.
8. Para tipos existentes, o novo draft clona a ultima publicada e guarda snapshot editavel no proprio version doc.

LAYER 4 (Editor)
9. O editor carrega um DTO consolidado do draft.
10. O usuario edita configuracao geral, acesso, campos e etapas.
11. IDs internos de field/step sao sempre derivados pelo app.
12. Salvar rascunho persiste mesmo com pendencias nao bloqueantes.

LAYER 5 (Runtime safety)
13. Tipos publicados mantem documento raiz intacto ate a futura 2E.3.
14. Tipos novos permanecem active=false e latestPublishedVersion=null.
15. Runtime continua lendo apenas a versao publicada do documento raiz.
```

### 4.3. Rotas finais

- shell admin: `/admin/request-config`
- editor dedicado: `/admin/request-config/[workflowTypeId]/versions/[version]/edit`

Justificativa:

- reusa o slug raiz da `2E.1`;
- explicita que a rota edita uma versao especifica, nao o tipo abstrato;
- preserva espaco para `/history` ou `/publish` sem reestruturar navegação.

### 4.4. Superficie de estado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| catalogo admin | React Query | compartilhado com a shell da `2E.1` |
| modal `Nova area` | `useState` + `react-hook-form` | efemero |
| modal `Novo tipo` | `useState` + `react-hook-form` | efemero |
| editor draft | React Query + `react-hook-form` | por rota |
| `allowedUserIds` mode (`all` vs `specific`) | campo derivado do form | salvo no submit |
| pendencias de publicacao | calculadas pelo servidor e exibidas no cliente | refresh a cada load/save |
| dirty state | form local | usado para avisar sobre navegacao |

---

## 5. Architecture Decisions

### ADR-2E2-001: Draft de tipo publicado usa snapshot proprio no version doc

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O runtime le `allowedUserIds`, `ownerUserId`, `active`, `name`, `description`, `icon` e `areaId` do documento raiz. Mutar esses campos durante a edicao de um draft alteraria o comportamento publicado antes da hora. |

**Choice:** drafts passam a persistir um `draftConfig.workflowType` dentro do documento `versions/{version}`. O documento raiz permanece imutavel para tipos ja publicados ate a fase de publicacao. Excecao explicita: quando o tipo ainda for draft-only (`latestPublishedVersion = null`), os metadados do documento raiz devem espelhar o snapshot corrente do draft para manter o catalogo da `2E.1` sincronizado.

**Rationale:**

1. isola o draft do runtime ativo;
2. evita colecao paralela so para authoring;
3. permite ao editor tratar configuracao geral e definicao da versao no mesmo payload.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| editar o documento raiz imediatamente | vazaria alteracoes de owner/acesso para a versao publicada |
| criar colecao separada `workflowDrafts` | adiciona mais indexacao, leitura e reconciliacao sem necessidade |
| bloquear edicao de metadados em tipos publicados | viola o escopo do editor de rascunho |

**Consequences:**

- positivo: runtime continua estavel durante authoring;
- positivo: `2E.3` podera publicar promovendo snapshot draft para o documento raiz;
- positivo: tipos ainda sem publicada continuam aparecendo no catalogo com metadados atualizados mesmo antes da `2E.3`;
- negativo: o version doc passa a ter shape mais rico quando `state=draft`.

### ADR-2E2-002: Existe no maximo um draft aberto por workflow type

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | Versoes draft paralelas aumentariam ambiguidade de merge, numeracao e UX sem serem exigidas pelo define. |

**Choice:** o comando de criar draft procura draft existente. Se encontrar, retorna esse draft e a UI navega para ele em vez de criar outro.

**Rationale:**

1. simplifica sequenciamento de versoes;
2. evita duas pessoas abrirem rascunhos concorrentes com expectativas diferentes;
3. reduz complexidade da `2E.3` ao publicar.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| permitir varios drafts por tipo | exige politicas de merge ou descarte nao definidas |
| bloquear e pedir limpeza manual sem abrir o existente | piora UX e adiciona atrito desnecessario |

**Consequences:**

- positivo: catalogo consegue exibir CTA `Editar rascunho` de forma deterministica;
- negativo: nao ha branch paralela de configuracao por tipo.

### ADR-2E2-003: `storageFolderPath` novo sera derivado automaticamente do `areaId`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define exige ocultar `storageFolderPath` da UI, mas o campo continua obrigatorio para uploads. O codigo atual so tem input manual. |

**Choice:** ao criar area, o servidor gera `areaId` por slug e persiste `storageFolderPath = areaId` sanitizado.

**Rationale:**

1. cumpre o requisito de ocultar o campo;
2. mantem o path estavel e previsivel para novas areas;
3. reusa as protecoes de `sanitizeStoragePath` e `isValidStorageFolderPath`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| pedir `storageFolderPath` ao usuario em campo avancado | viola o define |
| gerar path aleatorio | dificulta operacao e rastreabilidade |
| derivar path a cada upload sem persistir no documento | contraria o modelo atual consumido por upload |

**Consequences:**

- positivo: criacao de area fica simples;
- negativo: customizacao manual de path fica fora desta UI.
- inferencia explicita: para novas areas, `storageFolderPath = areaId` atende o requisito e nao conflita com regra existente observada no codigo.

### ADR-2E2-004: `workflowTypeId` e `stepId`/`field.id` novos sao sempre gerados pela aplicacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define proibe edicao manual de IDs internos e o bootstrap da `2C` ja trata IDs como canon tecnico. |

**Choice:** `workflowTypeId` e derivado de `areaId + slug(name)`; novos `field.id` e `stepId` nascem por geradores/helpers da camada admin. A UI nunca expoe esses IDs como inputs livres.

**Rationale:**

1. reduz erro humano;
2. preserva padrao de IDs consumidos pelo runtime;
3. facilita clonagem e ordenacao de campos/steps.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| deixar usuario digitar IDs | aumenta colisao e inconsistencias |
| derivar `stepId` do label/ordem | quebra estabilidade quando nome/ordem mudam |

**Consequences:**

- positivo: payloads ficam mais confiaveis;
- negativo: debugging precisa mostrar IDs como metadado somente leitura quando necessario.

### ADR-2E2-005: O comando de salvar draft retorna pendencias estruturadas, mas bloqueia apenas corrupcao minima

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define exige salvar configuracao incompleta, mas ainda quer sinalizacao clara do que impede publicacao futura. |

**Choice:** separar `save invariants` de `publish readiness`. O backend valida apenas integridade minima no `PUT draft`; regras de publicacao viram warnings estruturados.

**Rationale:**

1. atende salvamento permissivo;
2. concentra validacao futura em uma funcao reaproveitavel pela `2E.3`;
3. evita que o cliente replique regras de consistencia complexas.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| validar tudo no frontend | diverge do servidor e deixa brechas por API |
| bloquear save sempre que houver pendencia | viola o define |

**Consequences:**

- positivo: UX de draft fica fluida;
- positivo: mesma engine podera servir ao botao `Publicar` depois;
- negativo: payload de resposta fica mais rico.

---

## 6. Contrato de Dados e UI

### 6.1. Ajuste de contrato persistido

#### Documento raiz `workflowTypes_v2/{workflowTypeId}`

```ts
type WorkflowTypeV2 = {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
  areaId: string;
  ownerEmail: string;
  ownerUserId: string;
  allowedUserIds: string[];
  active: boolean;
  latestPublishedVersion: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Regra:

- para tipos nunca publicados, `active = false` e `latestPublishedVersion = null`;
- para tipos nunca publicados, o documento raiz espelha os metadados correntes do draft para manter o catalogo administrativo consistente;
- para tipos ja publicados, os campos acima seguem representando a versao operacional ativa, nao o draft em edicao.

#### Documento `workflowTypes_v2/{workflowTypeId}/versions/{version}`

```ts
type WorkflowVersionDraftConfig = {
  workflowType: {
    name: string;
    description: string;
    icon: string;
    areaId: string;
    ownerEmail: string;
    ownerUserId: string;
    allowedUserIds: string[];
    active: boolean;
  };
};

type WorkflowVersionV2 = {
  workflowTypeId: string;
  version: number;
  state: 'draft' | 'published';
  ownerEmailAtPublish: string;
  defaultSlaDays: number;
  fields: VersionFieldDef[];
  initialStepId: string;
  stepOrder: string[];
  stepsById: Record<string, StepDef>;
  publishedAt: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  draftConfig?: WorkflowVersionDraftConfig | null;
};
```

Regra:

- versoes `published` podem manter `draftConfig = null | undefined`;
- versoes `draft` devem persistir `draftConfig.workflowType`;
- `ownerEmailAtPublish` em drafts guarda o owner corrente do snapshot e sera sobrescrito de novo na publicacao futura.

### 6.2. DTO do editor

`GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Campos obrigatorios para o frontend:

- `workflowTypeId`
- `version`
- `state`
- `isNewWorkflowType`
- `general.name`
- `general.description`
- `general.icon`
- `general.areaId`
- `general.ownerEmail`
- `general.ownerUserId`
- `general.defaultSlaDays`
- `general.activeOnPublish`
- `access.mode`
- `access.allowedUserIds`
- `fields[]`
- `steps[]`
- `publishReadiness[]`
- `meta.createdAt`
- `meta.updatedAt`
- `meta.latestPublishedVersion`

Nao expor:

- `storageFolderPath`
- qualquer token de auth
- campos internos de colaborador alem do necessario para seletores

### 6.3. UX de `allowedUserIds`

Representacao de UI:

| Modo UI | Persistencia |
|--------|--------------|
| `Todos` | `["all"]` |
| `Lista especifica` | array de `id3a` ordenado e sem duplicidade |

Comportamentos:

- o toggle entre `Todos` e `Lista especifica` fica no editor e no modal de criacao;
- ao mudar para `Todos`, a lista especifica e descartada no payload;
- o preview textual reutiliza a logica do `RecipientSelectionModal`, sem abrir UX mais pesada por padrao;
- a selecao detalhada de colaboradores reaproveita um modal/combobox baseado nos componentes administrativos existentes.

### 6.4. Estrutura do editor de rascunho

Seções da pagina:

1. header com breadcrumb, badge `Rascunho`, botao `Salvar rascunho` e link de voltar ao catalogo;
2. `Configuracao geral`
3. `Acesso`
4. `Campos do formulario`
5. `Etapas`
6. `Pendencias para publicar`

Comportamentos obrigatorios:

- o editor mostra `workflowTypeId` e `version` como metadado somente leitura;
- `Salvar rascunho` fica sempre habilitado enquanto o form nao estiver enviando;
- warnings de publicacao nao bloqueiam o save;
- novas fields e novos steps recebem IDs automaticamente;
- reorder de fields/steps regrava `order` e `stepOrder`;
- remocao do step atual inicial recalcula `initialStepId` para o primeiro item remanescente.

### 6.5. Regras de pendencias de publicacao

Categorias previstas:

- `general`
- `access`
- `fields`
- `steps`
- `actions`

Exemplos:

- `name` vazio;
- `areaId` ausente;
- `ownerUserId` ausente ou owner nao resolvido;
- `allowedUserIds` vazio quando modo especifico;
- nenhum campo configurado quando o fluxo precisa de input;
- `stepOrder` vazio;
- `initialStepId` nao pertence a `stepsById`;
- step final ausente;
- action de aprovacao sem `approverIds`.

Formato:

```ts
type DraftReadinessIssue = {
  code: string;
  category: 'general' | 'access' | 'fields' | 'steps' | 'actions';
  severity: 'warning';
  message: string;
  path?: string;
};
```

Inferencia explicita:

- nesta fase todas as pendencias retornam como `warning`;
- a `2E.3` podera promover algumas delas a bloqueios de publicacao sem alterar o contrato base.

---

## 7. API Contract

### 7.1. `POST /api/admin/request-config/areas`

```http
POST /api/admin/request-config/areas
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

```json
{
  "name": "Facilities",
  "icon": "Building2"
}
```

Auth:

1. validar Bearer token;
2. resolver colaborador autenticado com fallback `authUid -> email normalizado`;
3. rejeitar com `403` quando `canManageWorkflowsV2 !== true`.

Write rules:

1. gerar `areaId` por slug de `name`;
2. se houver colisao, aplicar suffix `-2`, `-3`, ...;
3. gerar `storageFolderPath = areaId`;
4. validar com `sanitizeStoragePath`;
5. persistir `name`, `icon`, `storageFolderPath`, `workflowOrder=[]`.

Response `201`:

```json
{
  "ok": true,
  "data": {
    "areaId": "facilities",
    "name": "Facilities",
    "icon": "Building2"
  }
}
```

### 7.2. `POST /api/admin/request-config/workflow-types`

Cria documento raiz + `versions/1` em `draft` na mesma transacao.

```json
{
  "areaId": "facilities",
  "name": "Manutencao Predial",
  "description": "Chamados de manutencao predial.",
  "icon": "Wrench",
  "ownerUserId": "SMO2",
  "allowedUserIds": ["all"],
  "defaultSlaDays": 5
}
```

Write rules:

1. resolver `ownerEmail` a partir de `ownerUserId`;
2. gerar `workflowTypeId = <areaId>_<slug(name)>` com suffix em caso de colisao;
3. criar raiz com:
   - `active = false`
   - `latestPublishedVersion = null`
   - metadados iguais ao snapshot inicial
4. criar `versions/1` com:
   - `state = "draft"`
   - `publishedAt = null`
   - `draftConfig.workflowType` espelhando os metadados do tipo
   - `fields = []`
   - `stepsById = {}`
   - `stepOrder = []`
   - `initialStepId = ""`
5. retornar rota do editor.

Response `201`:

```json
{
  "ok": true,
  "data": {
    "workflowTypeId": "facilities_manutencao_predial",
    "version": 1,
    "editorPath": "/admin/request-config/facilities_manutencao_predial/versions/1/edit"
  }
}
```

### 7.3. `POST /api/admin/request-config/workflow-types/[workflowTypeId]/drafts`

Abre nova versao draft a partir da ultima publicada.

Regras:

1. se existir draft aberto, responder `200` com esse draft;
2. se `latestPublishedVersion` for nulo/invalido e nao houver draft, responder `409`;
3. criar `version = max(existing versions) + 1` em transacao;
4. clonar `fields`, `stepOrder`, `stepsById`, `initialStepId`, `defaultSlaDays`;
5. gerar `draftConfig.workflowType` a partir do documento raiz atual;
6. persistir `publishedAt = null`.

Response `201` ou `200`:

```json
{
  "ok": true,
  "data": {
    "workflowTypeId": "facilities_manutencao_predial",
    "version": 3,
    "reusedExistingDraft": false,
    "editorPath": "/admin/request-config/facilities_manutencao_predial/versions/3/edit"
  }
}
```

### 7.4. `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Retorna bootstrap do editor.

```json
{
  "ok": true,
  "data": {
    "draft": {
      "workflowTypeId": "facilities_manutencao_predial",
      "version": 1,
      "state": "draft",
      "isNewWorkflowType": true,
      "general": {
        "name": "Manutencao Predial",
        "description": "Chamados de manutencao predial.",
        "icon": "Wrench",
        "areaId": "facilities",
        "ownerEmail": "owner@3ariva.com.br",
        "ownerUserId": "SMO2",
        "defaultSlaDays": 5,
        "activeOnPublish": true
      },
      "access": {
        "mode": "all",
        "allowedUserIds": ["all"],
        "preview": "Acesso publico para todos os colaboradores"
      },
      "fields": [],
      "steps": [],
      "publishReadiness": [
        {
          "code": "MISSING_STEPS",
          "category": "steps",
          "severity": "warning",
          "message": "Defina ao menos uma etapa antes de publicar."
        }
      ],
      "meta": {
        "createdAt": "2026-04-08T18:00:00.000Z",
        "updatedAt": "2026-04-08T18:00:00.000Z",
        "latestPublishedVersion": null
      }
    },
    "lookups": {
      "areas": [
        { "areaId": "facilities", "name": "Facilities", "icon": "Building2" }
      ],
      "owners": [
        { "userId": "SMO2", "name": "Owner Name", "email": "owner@3ariva.com.br" }
      ]
    }
  }
}
```

### 7.5. `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Salva rascunho.

Request:

```json
{
  "general": {
    "name": "Manutencao Predial",
    "description": "Fluxo em revisao",
    "icon": "Wrench",
    "areaId": "facilities",
    "ownerUserId": "SMO2",
    "defaultSlaDays": 7,
    "activeOnPublish": true
  },
  "access": {
    "mode": "specific",
    "allowedUserIds": ["SMO2", "DLE"]
  },
  "fields": [
    {
      "id": "titulo_resumo",
      "label": "Titulo",
      "type": "text",
      "required": true,
      "order": 1,
      "placeholder": "Insira Titulo"
    }
  ],
  "steps": [
    {
      "stepId": "stp_abc12345",
      "stepName": "Solicitacao Aberta",
      "statusKey": "solicitacao_aberta",
      "kind": "start"
    }
  ],
  "initialStepId": "stp_abc12345"
}
```

Save invariants:

1. rota so aceita `state = draft`;
2. `workflowTypeId` e `version` da URL prevalecem sobre body;
3. arrays e mapas precisam ser serializaveis;
4. `allowedUserIds` e normalizado para `["all"]` ou lista deduplicada;
5. `field.id` e `stepId` enviados para itens existentes precisam ja existir no draft atual;
6. para itens novos, o servidor gera IDs canonicos quando o payload vier sem ID ou com ID temporario de cliente;
7. quando `latestPublishedVersion = null`, o save do draft tambem sincroniza os metadados do documento raiz para manter o catalogo da `2E.1` atualizado;
8. nenhuma readiness warning bloqueia o save.

Response `200`:

```json
{
  "ok": true,
  "data": {
    "savedAt": "2026-04-08T18:30:00.000Z",
    "publishReadiness": [
      {
        "code": "MISSING_FINAL_STEP",
        "category": "steps",
        "severity": "warning",
        "message": "Defina uma etapa final antes de publicar."
      }
    ]
  }
}
```

### 7.6. Erros padrao

`401`:

```json
{
  "ok": false,
  "code": "UNAUTHORIZED",
  "message": "Token nao fornecido."
}
```

`403`:

```json
{
  "ok": false,
  "code": "FORBIDDEN",
  "message": "Usuario sem permissao para configurar workflows v2."
}
```

`409`:

```json
{
  "ok": false,
  "code": "DRAFT_CONFLICT",
  "message": "O tipo ja possui um draft aberto."
}
```

`422`:

```json
{
  "ok": false,
  "code": "INVALID_DRAFT_PAYLOAD",
  "message": "Payload do rascunho invalido."
}
```

---

## 8. Database / Auth Contract

### 8.1. Firestore

Colecoes tocadas:

- `workflowAreas`
- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

Sem novas colecoes.

Novos campos opcionais:

- `workflowTypes_v2.latestPublishedVersion: number | null`
- `versions/{version}.draftConfig`
- `versions/{version}.createdAt`
- `versions/{version}.updatedAt`
- `versions/{version}.publishedAt: Timestamp | null`

### 8.2. Compatibilidade com runtime publicado

Regras obrigatorias:

- `resolvePublishedVersion` deve continuar lendo apenas `latestPublishedVersion > 0`;
- `assertCanOpen` continua dependendo do documento raiz publicado;
- published versions antigas sem `draftConfig`, `createdAt` ou `updatedAt` seguem validas;
- tipos antigos com `latestPublishedVersion` numerico seguem validos sem migracao massiva;
- tipos novos draft-only nao devem ser visiveis como abriveis no runtime porque `active=false` e `latestPublishedVersion=null`.

### 8.3. Contrato de permissao do colaborador

Herdado da `2E.1`:

```ts
canManageWorkflowsV2: boolean;
```

Todas as operacoes desta subetapa exigem essa permissao no servidor.

### 8.4. Resolucao de owner

`ownerUserId` e sempre `id3a`.

Regra:

1. request recebe `ownerUserId`;
2. servidor resolve colaborador unico por `id3a`;
3. `ownerEmail` e preenchido do colaborador normalizado;
4. se nao houver owner resolvivel, a criacao falha com `422`.

### 8.5. Security rules

Nenhuma alteracao obrigatoria em `firestore.rules`.

Motivo:

- toda escrita admin desta fase acontece por rotas server-side com `firebase-admin`;
- o gate de permissao vive na camada app/server e nao em leitura direta do cliente.

---

## 9. File Manifest

### 9.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared contracts | `src/lib/workflows/runtime/types.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/CollaboratorsContext.tsx` | @firebase-specialist + @react-frontend-developer |
| 2. Admin server write layer | `src/lib/workflows/admin-config/*`, `src/app/api/admin/request-config/**` | @firebase-specialist |
| 3. Shell write CTAs | `src/components/workflows/admin-config/*`, `src/app/(app)/admin/request-config/page.tsx` | @react-frontend-developer |
| 4. Editor route | `src/app/(app)/admin/request-config/[workflowTypeId]/versions/[version]/edit/page.tsx`, `src/components/workflows/admin-config/editor/*` | @react-frontend-developer |
| 5. Tests | `src/lib/workflows/admin-config/__tests__/*`, `src/app/api/admin/request-config/__tests__/*`, `src/components/workflows/admin-config/__tests__/*` | @firebase-specialist + @react-frontend-developer |

### 9.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/runtime/types.ts` | Modify | suportar `latestPublishedVersion: number | null`, `publishedAt: Timestamp | null`, `draftConfig`, `createdAt`, `updatedAt` | @firebase-specialist | - |
| 2 | `src/lib/workflows/admin-config/types.ts` | Create | DTOs de create area/type/draft editor/readiness | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/admin-config/auth.ts` | Create | authz server-side baseado em `canManageWorkflowsV2` | @firebase-specialist | - |
| 4 | `src/lib/workflows/admin-config/id-generation.ts` | Create | geradores de `areaId`, `workflowTypeId` e helpers de colisao | @firebase-specialist | - |
| 5 | `src/lib/workflows/admin-config/lookups.ts` | Create | resolucao de owner e colecao de areas/owners | @firebase-specialist | #3 |
| 6 | `src/lib/workflows/admin-config/draft-readiness.ts` | Create | warnings estruturados para futura publicacao | @firebase-specialist | #1, #2 |
| 7 | `src/lib/workflows/admin-config/draft-repository.ts` | Create | leitura/escrita transacional de area/tipo/draft | @firebase-specialist | #1, #4, #5, #6 |
| 8 | `src/app/api/admin/request-config/areas/route.ts` | Create | comando de criar area | @firebase-specialist | #3, #7 |
| 9 | `src/app/api/admin/request-config/workflow-types/route.ts` | Create | comando de criar tipo + `v1 draft` | @firebase-specialist | #3, #7 |
| 10 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/drafts/route.ts` | Create | comando de criar/reusar draft subsequente | @firebase-specialist | #3, #7 |
| 11 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route.ts` | Create | `GET` bootstrap do editor e `PUT` save draft | @firebase-specialist | #3, #6, #7 |
| 12 | `src/lib/workflows/admin-config/api-client.ts` | Create | cliente autenticado para shell e editor | @react-frontend-developer | #2, #8, #9, #10, #11 |
| 13 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | adicionar CTAs reais, abrir dialogs e refresh de catalogo | @react-frontend-developer | #12 |
| 14 | `src/components/workflows/admin-config/CreateWorkflowAreaDialog.tsx` | Create | modal de criacao de area sem `storageFolderPath` | @react-frontend-developer | #12 |
| 15 | `src/components/workflows/admin-config/CreateWorkflowTypeDialog.tsx` | Create | modal de criacao de tipo com owner e allowedUserIds | @react-frontend-developer | #12 |
| 16 | `src/app/(app)/admin/request-config/[workflowTypeId]/versions/[version]/edit/page.tsx` | Create | entrypoint do editor | @react-frontend-developer | #11, #12 |
| 17 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Create | container principal do editor | @react-frontend-developer | #12, #16 |
| 18 | `src/components/workflows/admin-config/editor/WorkflowDraftGeneralSection.tsx` | Create | configuracao geral | @react-frontend-developer | #17 |
| 19 | `src/components/workflows/admin-config/editor/WorkflowDraftAccessSection.tsx` | Create | UX de `allowedUserIds` | @react-frontend-developer | #15, #17 |
| 20 | `src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx` | Create | CRUD/reorder de campos | @react-frontend-developer | #17 |
| 21 | `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Create | CRUD/reorder de etapas e actions | @react-frontend-developer | #17 |
| 22 | `src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx` | Create | painel de warnings | @react-frontend-developer | #17 |
| 23 | `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts` | Create | transacoes de create/reuse/save | @firebase-specialist | #7 |
| 24 | `src/lib/workflows/admin-config/__tests__/draft-readiness.test.ts` | Create | warnings e regras de permissividade | @firebase-specialist | #6 |
| 25 | `src/app/api/admin/request-config/__tests__/write-routes.test.ts` | Create | contratos HTTP 401/403/409/422/200/201 | @firebase-specialist | #8, #9, #10, #11 |
| 26 | `src/components/workflows/admin-config/__tests__/CreateWorkflowTypeDialog.test.tsx` | Create | create type + allowedUserIds | @react-frontend-developer | #15 |
| 27 | `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | Create | load/save/warnings/dirty-state | @react-frontend-developer | #17-#22 |

---

## 10. Code Patterns

### 10.1. Pattern de geracao deterministica de IDs

```ts
function slugifySegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function buildWorkflowTypeId(areaId: string, name: string): string {
  return `${slugifySegment(areaId)}_${slugifySegment(name)}`;
}
```

### 10.2. Pattern de criacao atomica de tipo + `v1 draft`

```ts
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function createWorkflowTypeWithInitialDraft(input: CreateWorkflowTypeInput) {
  const db = getFirestore(getFirebaseAdminApp());
  const now = Timestamp.now();

  return db.runTransaction(async (tx) => {
    const workflowTypeId = await reserveWorkflowTypeId(tx, input.areaId, input.name);
    const typeRef = db.collection('workflowTypes_v2').doc(workflowTypeId);
    const versionRef = typeRef.collection('versions').doc('1');

    tx.create(typeRef, {
      workflowTypeId,
      name: input.name.trim(),
      description: input.description.trim(),
      icon: input.icon,
      areaId: input.areaId,
      ownerEmail: input.ownerEmail,
      ownerUserId: input.ownerUserId,
      allowedUserIds: normalizeAllowedUserIds(input.allowedUserIds),
      active: false,
      latestPublishedVersion: null,
      createdAt: now,
      updatedAt: now,
    });

    tx.create(versionRef, {
      workflowTypeId,
      version: 1,
      state: 'draft',
      ownerEmailAtPublish: input.ownerEmail,
      defaultSlaDays: input.defaultSlaDays ?? 0,
      fields: [],
      initialStepId: '',
      stepOrder: [],
      stepsById: {},
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      draftConfig: {
        workflowType: {
          name: input.name.trim(),
          description: input.description.trim(),
          icon: input.icon,
          areaId: input.areaId,
          ownerEmail: input.ownerEmail,
          ownerUserId: input.ownerUserId,
          allowedUserIds: normalizeAllowedUserIds(input.allowedUserIds),
          active: true,
        },
      },
    });

    return { workflowTypeId, version: 1 };
  });
}
```

### 10.3. Pattern de clone de versao publicada para draft

```ts
export async function createNextDraftVersion(workflowTypeId: string) {
  const db = getFirestore(getFirebaseAdminApp());
  const now = Timestamp.now();

  return db.runTransaction(async (tx) => {
    const typeRef = db.collection('workflowTypes_v2').doc(workflowTypeId);
    const typeSnap = await tx.get(typeRef);
    const typeData = typeSnap.data() as WorkflowTypeV2 | undefined;

    if (!typeData) throw new Error('Workflow type not found.');

    const versionsRef = typeRef.collection('versions');
    const versionSnaps = await tx.get(versionsRef);
    const existingDraft = versionSnaps.docs.find((doc) => doc.data().state === 'draft');

    if (existingDraft) {
      return { workflowTypeId, version: Number(existingDraft.id), reusedExistingDraft: true };
    }

    const publishedVersion = Number(typeData.latestPublishedVersion);
    if (!publishedVersion || publishedVersion < 1) {
      throw new Error('Workflow type has no published version to clone.');
    }

    const publishedRef = versionsRef.doc(String(publishedVersion));
    const publishedSnap = await tx.get(publishedRef);
    const publishedData = publishedSnap.data() as WorkflowVersionV2 | undefined;

    if (!publishedData || publishedData.state !== 'published') {
      throw new Error('Published source version is invalid.');
    }

    const nextVersion = Math.max(...versionSnaps.docs.map((doc) => Number(doc.id))) + 1;
    const nextRef = versionsRef.doc(String(nextVersion));

    tx.create(nextRef, {
      ...publishedData,
      version: nextVersion,
      state: 'draft',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      draftConfig: {
        workflowType: {
          name: typeData.name,
          description: typeData.description,
          icon: typeData.icon,
          areaId: typeData.areaId,
          ownerEmail: typeData.ownerEmail,
          ownerUserId: typeData.ownerUserId,
          allowedUserIds: [...typeData.allowedUserIds],
          active: typeData.active,
        },
      },
    });

    return { workflowTypeId, version: nextVersion, reusedExistingDraft: false };
  });
}
```

### 10.4. Pattern de save permissivo com readiness

```ts
export async function saveDraft(input: SaveDraftInput): Promise<SaveDraftResult> {
  const normalized = normalizeDraftPayload(input);
  const readiness = evaluateDraftReadiness(normalized);

  await updateDraftVersion(normalized.workflowTypeId, normalized.version, {
    ownerEmailAtPublish: normalized.general.ownerEmail,
    defaultSlaDays: normalized.general.defaultSlaDays,
    fields: normalized.fields,
    initialStepId: normalized.initialStepId,
    stepOrder: normalized.steps.map((step) => step.stepId),
    stepsById: Object.fromEntries(normalized.steps.map((step) => [step.stepId, step])),
    updatedAt: Timestamp.now(),
    draftConfig: {
      workflowType: {
        name: normalized.general.name,
        description: normalized.general.description,
        icon: normalized.general.icon,
        areaId: normalized.general.areaId,
        ownerEmail: normalized.general.ownerEmail,
        ownerUserId: normalized.general.ownerUserId,
        allowedUserIds: normalized.access.allowedUserIds,
        active: normalized.general.activeOnPublish,
      },
    },
  });

  if (normalized.meta.latestPublishedVersion == null) {
    await updateWorkflowTypeRoot(normalized.workflowTypeId, {
      name: normalized.general.name,
      description: normalized.general.description,
      icon: normalized.general.icon,
      areaId: normalized.general.areaId,
      ownerEmail: normalized.general.ownerEmail,
      ownerUserId: normalized.general.ownerUserId,
      allowedUserIds: normalized.access.allowedUserIds,
      updatedAt: Timestamp.now(),
    });
  }

  return {
    savedAt: new Date().toISOString(),
    publishReadiness: readiness,
  };
}
```

### 10.5. Pattern de form para `allowedUserIds`

```tsx
const accessMode = watch('access.mode');

<RadioGroup
  value={accessMode}
  onValueChange={(value) => {
    if (value === 'all') {
      setValue('access.mode', 'all');
      setValue('access.allowedUserIds', ['all']);
      return;
    }

    setValue('access.mode', 'specific');
    setValue('access.allowedUserIds', []);
  }}
>
  <RadioGroupItem value="all" id="access-all" />
  <Label htmlFor="access-all">Todos</Label>
  <RadioGroupItem value="specific" id="access-specific" />
  <Label htmlFor="access-specific">Lista especifica</Label>
</RadioGroup>
```

---

## 11. Testing Strategy

### 11.1. Unit

- geracao de `areaId` e `workflowTypeId` com slug, trimming e colisao;
- normalizacao de `allowedUserIds`;
- avaliacao de `publishReadiness`;
- compatibilidade de draft com `publishedAt=null` e `latestPublishedVersion=null`.

### 11.2. Integration

- criacao atomica de area;
- criacao atomica de tipo + `v1 draft`;
- reutilizacao de draft existente em vez de abrir segundo draft;
- criacao de nova versao por clonagem da ultima publicada;
- save de draft incompleto retornando warnings e sem erro;
- leitura do editor fundindo `draftConfig` com o contrato de versao.

### 11.3. API contract

Seguir o padrao de [read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js):

- `401` sem token;
- `403` sem `canManageWorkflowsV2`;
- `409` quando a operacao encontra conflito de draft/publicada;
- `422` para payload invalido;
- `200`/`201` com envelope canonico `{ ok, data }`.

### 11.4. Component tests

- `CreateWorkflowAreaDialog` nao mostra `storageFolderPath`;
- `CreateWorkflowTypeDialog` alterna corretamente `Todos` e `Lista especifica`;
- `WorkflowDraftEditorPage` renderiza warnings sem bloquear `Salvar rascunho`;
- reorder/remocao de fields e steps atualiza o form corretamente;
- dirty-state avisa antes de sair sem salvar, se o projeto ja tiver padrao para isso.

### 11.5. Regressao funcional obrigatoria

- tipo publicado continua abrivel pelo runtime depois da abertura de um novo draft;
- `assertCanOpen` continua usando somente `allowedUserIds` do documento raiz;
- catalogo da `2E.1` continua classificando draft-only como `Rascunho inicial / sem publicada`.

---

## 12. Rollback Plan

### 12.1. Rollback de codigo

1. remover rotas de escrita admin;
2. remover editor dedicado;
3. manter shell read-only da `2E.1`;
4. preservar contrato de permissao `canManageWorkflowsV2` se a `2E.1` ja estiver em producao.

### 12.2. Rollback de dados

Como nao ha migracao obrigatoria em massa, rollback e pontual:

- drafts criados e nao usados podem ser removidos manualmente de `versions/{version}` se necessario;
- tipos nunca publicados criados por engano podem ser removidos manualmente junto do documento raiz correspondente;
- campos novos opcionais (`draftConfig`, `createdAt`, `updatedAt`) podem permanecer sem quebrar o runtime.

### 12.3. Risco conhecido no rollback

- se a `2E.3` ainda nao existir, drafts persistidos ficarao apenas como artefatos administrativos sem caminho de publicacao;
- por isso o rollout deve ser acompanhado de comunicacao clara de que esta fase entrega authoring, nao publicacao.

---

## 13. Checklist de Build

- [ ] ampliar tipos compartilhados para aceitar draft-only sem publicada;
- [ ] implementar authz server-side para escrita admin;
- [ ] implementar criacao de area com `storageFolderPath` automatico;
- [ ] implementar criacao atomica de tipo + `v1 draft`;
- [ ] implementar criacao/reuso de draft subsequente;
- [ ] implementar bootstrap e save do editor;
- [ ] adicionar CTAs na shell da `2E.1`;
- [ ] criar rota do editor dedicado;
- [ ] cobrir contratos HTTP e cenarios de regressao do runtime.

---

## 14. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Design tecnico da 2E.2 cobrindo create area/type, draft clone, editor dedicado e isolamento do runtime publicado |
