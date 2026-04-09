# DESIGN: Ajustes pontuais do configurador 2E - modal de editor, area contextual e approvers canonicos

> Generated: 2026-04-09
> Status: Ready for build
> Scope: Fase 2 / refinamento do configurador admin v2 apos a 2E.3 e antes da 2E.4
> Base document: `DEFINE_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md`
> Depends on: `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`, `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`, `DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md`

## 1. Objetivo

Entregar um refinamento de UX e contrato administrativo sobre a trilha 2E ja implementada, sem alterar a semantica operacional introduzida nas etapas `2E.2` e `2E.3`.

Esta iteracao cobre:

- abrir o editor de versao a partir de `/admin/request-config` em modal, preservando a tab `Definicoes` como contexto primario;
- reutilizar o mesmo container modal para `draft` editavel e `published` em modo read-only;
- tornar `areaId` um dado contextual visivel e imutavel dentro do editor;
- substituir a edicao textual de `approverIds` por selecao direta de colaboradores legiveis;
- trafegar `collaboratorDocId` apenas no contrato administrativo da UI e resolver `id3a` no backend antes de persistir;
- reabrir drafts existentes com nomes/emails de aprovadores reconstruidos a partir dos `approverIds` ja persistidos.

Esta iteracao nao cobre:

- redesenho da tab `Historico Geral` da `2E.4`;
- alteracao de `VersionState`, `publish`, `activate` ou do runtime de requests;
- criacao de nova entidade persistida para colaboradores de workflow;
- busca avancada, arvore organizacional ou politica de aprovacao em cascata.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md)
- [DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md)
- [DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md)
- [WorkflowConfigPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigPage.tsx)
- [WorkflowConfigDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftGeneralSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftGeneralSection.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [RecipientSelectionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/RecipientSelectionModal.tsx)
- [draft-repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/draft-repository.ts)
- [lookups.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/lookups.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/types.ts)
- [publishability.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publishability.ts)
- [publication-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/publication-service.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md` para escopo e aceite;
2. depois prevalecem os designs da `2E.1`, `2E.2` e `2E.3` para rota, guard, versionamento e invariantes;
3. depois prevalece este design para orientar o build;
4. o runtime publicado continua sendo a restricao final: `StepActionDef.approverIds` permanece canonico em `id3a`.

---

## 3. Estado Atual e Lacuna que esta iteracao Fecha

### 3.1. O que o repositorio ja oferece

- `/admin/request-config` ja existe com tab `Definicoes` e catalogo administrativo carregado via React Query;
- o catalogo ja lista versoes `draft` e `published`, com CTAs de `Editar rascunho`, `Publicar` e `Ativar`;
- o editor atual ja tem formulario completo para `general`, `access`, `fields`, `steps` e `publishReadiness`;
- `publish` e `activate` ja sao atomicos e persistem `workflowTypeSnapshot` nas versoes publicadas;
- a base de colaboradores ja expone no cliente e no servidor `id3a`, nome, email e o `doc.id` da collection `collaborators`;
- o projeto ja possui padroes de dialogo grande com scroll interno controlado.

### 3.2. Problema real no codigo atual

- `WorkflowConfigDefinitionsTab` ainda faz `router.push()` para a rota dedicada `/admin/request-config/[workflowTypeId]/versions/[version]/edit`;
- `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]` hoje rejeita qualquer versao que nao seja `draft`;
- `WorkflowDraftGeneralSection` ainda renderiza `general.areaId` com `Select` editavel;
- `WorkflowDraftStepsSection` ainda usa input textual de `approverIds` separados por virgula;
- `lookups.ts` hoje retorna apenas `userId=id3a`, sem chave administrativa estavel para round-trip por `doc.id`;
- `saveWorkflowDraft()` ainda aceita `general.areaId` como dado mutavel do payload.

### 3.3. Resultado esperado ao final desta iteracao

- abrir qualquer versao a partir do catalogo passa a manter o usuario em `/admin/request-config`, apenas acrescentando estado de modal;
- drafts continuam editaveis, mas published passam a abrir no mesmo shell em modo somente leitura;
- `areaId` deixa de ser um campo de escrita no contrato do editor e vira dado contextual herdado do tipo;
- o contrato administrativo do editor passa a usar `collaboratorDocId` para selecao de aprovadores;
- o backend resolve `collaboratorDocId -> id3a` no save e persiste somente `approverIds`;
- reabertura de drafts existentes reconstrui os aprovadores selecionados com nome/email quando possivel, sem expor IDs crus como UX principal.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config?tab=definitions&editorWorkflowTypeId=<id>&editorVersion=<n>
  |      |
  |      +--> WorkflowConfigPage
  |      |      |
  |      |      +--> WorkflowConfigDefinitionsTab
  |      |      |      |- abrir draft editavel
  |      |      |      \- abrir versao published read-only
  |      |      |
  |      |      \--> WorkflowVersionEditorDialog
  |      |             |- header + dirty guard
  |      |             |- GeneralSection (area read-only)
  |      |             |- AccessSection
  |      |             |- FieldsSection
  |      |             |- StepsSection (approvers por colaborador)
  |      |             \- Readiness / Version metadata
  |      |
  |      \--> query params controlam abrir/fechar, back/forward e deep-link
  |
  +--> GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]
  |      \--> loadWorkflowVersionEditorData()
  |             |- carrega draft ou published
  |             |- hidrata area contextual
  |             |- hidrata selecoes de approvers a partir de approverIds
  |             \- devolve mode=edit/read-only
  |
  +--> PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]
  |      \--> saveWorkflowDraft()
  |             |- aceita apenas draft
  |             |- ignora area mutavel
  |             |- resolve collaboratorDocId -> id3a
  |             \- persiste StepActionDef.approverIds canonicos
  |
  +--> POST /publish
  +--> POST /activate
  |      \--> contratos 2E.3 reaproveitados sem mudanca semantica
  |
  \--> Firestore
         |- workflowTypes_v2/{workflowTypeId}
         |- workflowTypes_v2/{workflowTypeId}/versions/{version}
         \- collaborators/{collaboratorDocId}
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Catalogo)
1. Usuario abre /admin/request-config.
2. A tab Definicoes lista tipos e versoes como hoje.
3. Clicar em "Editar rascunho" ou "Ver versao" apenas atualiza search params.

LAYER 2 (Modal shell)
4. WorkflowConfigPage observa editorWorkflowTypeId + editorVersion.
5. O dialogo abre sobre o catalogo e preserva a tab ativa.
6. Fechar o dialogo limpa os search params; back do navegador fecha o modal.

LAYER 3 (Server read model)
7. GET da versao aceita tanto draft quanto published.
8. O servidor monta um DTO neutro por versao com mode=edit ou read-only.
9. O servidor hidrata approvers legiveis a partir dos approverIds persistidos.

LAYER 4 (Server write model)
10. PUT continua aceitando apenas draft.
11. O payload administrativo envia approvers por collaboratorDocId.
12. O backend resolve cada collaboratorDocId para id3a, deduplica e persiste approverIds.
13. Area do tipo permanece autoritativa e nao depende do payload.

LAYER 5 (Versionamento)
14. Publicar e ativar continuam usando os endpoints da 2E.3.
15. Publicar continua promovendo snapshot para o root na mesma transacao.
16. Nenhum documento runtime passa a depender de collaboratorDocId.
```

### 4.3. Estado de navegacao do modal

O estado primario do modal sera representado em search params da propria rota `/admin/request-config`:

- `tab=definitions`
- `editorWorkflowTypeId=<workflowTypeId>`
- `editorVersion=<version>`

Comportamentos obrigatorios:

- a ausencia de `editorWorkflowTypeId` ou `editorVersion` significa modal fechado;
- abrir modal deve usar `router.push()` para que o botao voltar do browser feche o modal;
- fechar modal deve remover somente os params do editor, preservando a tab atual;
- links profundos com estes params abrem diretamente o modal sobre a shell;
- a rota dedicada `/admin/request-config/[workflowTypeId]/versions/[version]/edit` deixa de ser fluxo primario, mas permanece como wrapper/fallback reutilizando o mesmo componente de conteudo em layout full-page.

### 4.4. Estrategia de composicao do editor

O editor atual sera quebrado em duas responsabilidades:

- `WorkflowVersionEditorPanel`: conteudo reutilizavel, independente de pagina/modal;
- `WorkflowVersionEditorDialog`: shell modal que hospeda o panel dentro do catalogo.

O wrapper dedicado existente passa a usar o mesmo `WorkflowVersionEditorPanel` sem dialogo, apenas para compatibilidade e rollback simples.

---

## 5. Architecture Decisions

### ADR-AJUSTES-001: O fluxo primario do editor sera modal com estado em search params

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-09 |
| Context | O editor dedicado atual quebra o contexto da tab `Definicoes`, mas o projeto ja opera a shell administrativa de forma client-side com tabs e React Query. |

**Choice:** representar a abertura do editor em search params de `/admin/request-config`, usando `Dialog` com scroll interno e preservando o catalogo abaixo.

**Rationale:**

1. preserva contexto visual e cognitivo do catalogo;
2. permite back/forward do browser sem complexidade de parallel routes;
3. reduz diff arquitetural sobre a 2E.1, que ja e fortemente client-side.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter navegacao dedicada como fluxo primario | preserva o problema central do define |
| usar somente estado local React sem URL | perde deep-link e navegacao nativa |
| migrar para parallel/intercepting routes do App Router | custo desproporcional ao refinamento pedido |

**Consequences:**

- positivo: o catalogo nao desmonta ao abrir/fechar o editor;
- positivo: o build pode reaproveitar o componente atual do editor;
- negativo: `WorkflowConfigPage` passa a carregar coordenacao extra de search params e dirty close.

### ADR-AJUSTES-002: `areaId` deixa de ser um campo de escrita do editor

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-09 |
| Context | A area ja e definida no momento de criar o workflow type e nao deve mudar em edicoes posteriores. Manter o campo editavel abre risco de drift entre catalogo, root e snapshot do draft. |

**Choice:** `general.areaId` sai do contrato mutavel de `PUT` e passa a ser DTO read-only derivado do `workflowType`.

**Rationale:**

1. reforca a origem contextual da area;
2. elimina uma classe de inconsistencias administrativas;
3. simplifica o save de draft e o publish posterior.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter `Select` editavel e validar no save | preserva atrito de UX e ancora risco de drift |
| permitir mudanca apenas no `v1` | adiciona regra especial desnecessaria e aumenta custo mental |

**Consequences:**

- positivo: o catalogo e o draft-only root permanecem coerentes desde a criacao do tipo;
- positivo: a UI pode explicar explicitamente que a area foi herdada do contexto;
- negativo: qualquer mudanca real de area futura exigira fluxo proprio fora desta iteracao.

### ADR-AJUSTES-003: `collaboratorDocId` sera a chave administrativa; `id3a` continua sendo a chave runtime

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-09 |
| Context | O admin precisa selecionar pessoas por nome/email, mas o runtime exige `approverIds` canonicos em `id3a`. O cliente tambem precisa de uma chave estavel e unica para round-trip sem depender de email ou nome. |

**Choice:** o contrato administrativo do editor envia `collaboratorDocId` para a API; o backend resolve para `id3a` antes de persistir em `StepActionDef.approverIds`.

**Rationale:**

1. `doc.id` da collection `collaborators` e unico e naturalmente estavel para a superficie admin;
2. evita expor `id3a` como experiencia principal de configuracao;
3. preserva a compatibilidade total do runtime e das rotinas de publish/activate.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar enviando `id3a` da UI | mantem a UX tecnica que o define quer remover |
| usar email como chave | email pode mudar e nao e o identificador operacional do runtime |
| persistir collaboratorDocId em `versions/{version}` | violaria o contrato canonico do runtime |

**Consequences:**

- positivo: o runtime continua lendo apenas `approverIds`;
- positivo: o editor pode reconstruir aprovacoes com labels amigaveis;
- negativo: o backend precisa de uma camada de hidratação e resolucao adicional.

### ADR-AJUSTES-004: A rota dedicada atual permanece como fallback reaproveitando o mesmo panel

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-09 |
| Context | O repositorio ja possui testes, links e artefatos 2E.2/2E.3 apontando para a rota dedicada. Remove-la neste refinamento aumentaria o risco de regressao sem necessidade funcional. |

**Choice:** manter a rota dedicada como wrapper de compatibilidade, mas parar de usa-la como CTA principal do catalogo.

**Consequences:**

- positivo: rollback fica barato;
- positivo: deep links antigos continuam validos;
- negativo: existe uma superficie secundaria a mais para manter nos testes.

---

## 6. Contratos de Dados e API

### 6.1. DTO neutro do editor por versao

Substituir o contrato mental de `draft editor` por um contrato neutro de `version editor`.

```ts
type WorkflowConfigCollaboratorLookup = {
  collaboratorDocId: string;
  userId: string; // id3a
  name: string;
  email: string;
  area?: string;
  position?: string;
};

type WorkflowVersionEditorApprover = {
  collaboratorDocId: string;
  userId: string; // id3a resolvido
  name: string;
  email: string;
};

type WorkflowVersionEditorAction = {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  approvers: WorkflowVersionEditorApprover[];
  unresolvedApproverIds?: string[];
  commentRequired?: boolean;
  attachmentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
};

type WorkflowVersionEditorStep = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: 'start' | 'work' | 'final';
  action?: WorkflowVersionEditorAction;
};

type WorkflowVersionEditorData = {
  version: {
    workflowTypeId: string;
    version: number;
    state: 'draft' | 'published';
    editorMode: 'edit' | 'read-only';
    derivedStatus: 'Rascunho' | 'Publicada' | 'Inativa';
    canPublish: boolean;
    canActivate: boolean;
    isNewWorkflowType: boolean;
    general: {
      name: string;
      description: string;
      icon: string;
      area: {
        areaId: string;
        name: string;
        icon: string;
        source: 'workflowType';
      };
      ownerEmail: string;
      ownerUserId: string;
      defaultSlaDays: number;
      activeOnPublish: boolean;
    };
    access: {
      mode: 'all' | 'specific';
      allowedUserIds: string[];
      preview: string;
    };
    fields: VersionFieldDef[];
    steps: WorkflowVersionEditorStep[];
    initialStepId: string;
    publishReadiness: DraftReadinessIssue[];
    meta: {
      createdAt: string | null;
      updatedAt: string | null;
      publishedAt: string | null;
      activatedAt: string | null;
      latestPublishedVersion: number | null;
      lastTransitionAt: string | null;
    };
  };
  lookups: {
    owners: WorkflowConfigCollaboratorLookup[];
    collaborators: WorkflowConfigCollaboratorLookup[];
  };
};
```

### 6.2. GET `/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Passa a aceitar `draft` e `published`.

Regras:

1. autenticar e validar `canManageWorkflowsV2` como hoje;
2. carregar root + version;
3. se `version.state === 'draft'`, retornar `editorMode='edit'`;
4. se `version.state === 'published'`, retornar `editorMode='read-only'`;
5. hidratar `general.area` a partir do root e do lookup de area;
6. hidratar `steps[].action.approvers` resolvendo `approverIds` contra `collaborators`;
7. manter `unresolvedApproverIds` quando algum `approverId` nao puder ser reidratado;
8. em `published`, esconder qualquer affordance de mutacao pelo proprio DTO, incluindo `Ativar` dentro do modal;

Response exemplo:

```json
{
  "ok": true,
  "data": {
    "version": {
      "workflowTypeId": "facilities_manutencao_predial",
      "version": 3,
      "state": "draft",
      "editorMode": "edit",
      "derivedStatus": "Rascunho",
      "canPublish": true,
      "canActivate": false,
      "isNewWorkflowType": false,
      "general": {
        "name": "Manutencao Predial",
        "description": "Fluxo administrativo",
        "icon": "Wrench",
        "area": {
          "areaId": "facilities",
          "name": "Facilities",
          "icon": "Building2",
          "source": "workflowType"
        },
        "ownerEmail": "owner@3ariva.com.br",
        "ownerUserId": "SMO2",
        "defaultSlaDays": 5,
        "activeOnPublish": true
      },
      "steps": [
        {
          "stepId": "stp_validacao",
          "stepName": "Validacao",
          "statusKey": "validacao",
          "kind": "work",
          "action": {
            "type": "approval",
            "label": "Aprovar",
            "approvers": [
              {
                "collaboratorDocId": "collab-doc-1",
                "userId": "APR1",
                "name": "Ana Paula",
                "email": "ana.paula@3ariva.com.br"
              }
            ]
          }
        }
      ]
    },
    "lookups": {
      "owners": [
        {
          "collaboratorDocId": "collab-doc-owner",
          "userId": "SMO2",
          "name": "Owner",
          "email": "owner@3ariva.com.br"
        }
      ],
      "collaborators": [
        {
          "collaboratorDocId": "collab-doc-1",
          "userId": "APR1",
          "name": "Ana Paula",
          "email": "ana.paula@3ariva.com.br",
          "area": "Facilities",
          "position": "Coordenadora"
        }
      ]
    }
  }
}
```

### 6.3. PUT `/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Permanece exclusivo para `draft`, mas o payload muda para remover `areaId` como campo mutavel e trocar `approverIds` por selecao administrativa.

```ts
type SaveWorkflowDraftInput = {
  general: {
    name: string;
    description: string;
    icon: string;
    ownerUserId: string;
    defaultSlaDays: number;
    activeOnPublish: boolean;
  };
  access: {
    mode: 'all' | 'specific';
    allowedUserIds: string[];
  };
  fields: Array<Partial<VersionFieldDef>>;
  steps: Array<{
    stepId?: string;
    stepName?: string;
    statusKey?: string;
    kind?: 'start' | 'work' | 'final';
    action?: {
      type: 'approval' | 'acknowledgement' | 'execution';
      label: string;
      approvers: Array<{ collaboratorDocId: string }>;
      commentRequired?: boolean;
      attachmentRequired?: boolean;
      commentPlaceholder?: string;
      attachmentPlaceholder?: string;
    };
  }>;
  initialStepId: string;
};
```

Invariantes:

1. `workflowTypeId` e `version` da URL continuam prevalecendo;
2. `areaId` nao e aceito como fonte de verdade do payload;
3. se clientes antigos ainda enviarem `general.areaId`, o backend deve ignorar quando coincidir com o root e rejeitar quando divergir;
4. `approvers` chega como lista de `collaboratorDocId`, nao como `id3a`;
5. o backend resolve cada item para `id3a`, deduplica preservando ordem e persiste em `action.approverIds`;
6. qualquer colaborador inexistente, ambiguo, sem `id3a` ou duplicado invalida o save com `422`;
7. se existir qualquer `unresolvedApproverIds` em uma etapa `action`, o save deve ser bloqueado com `422` ate saneamento explicito da selecao;
8. `publishReadiness` continua sendo calculado sobre `approverIds` canonicos, nao sobre o DTO administrativo.

### 6.4. Contrato do campo de area contextual

Leitura:

- `general.area.areaId`
- `general.area.name`
- `general.area.icon`
- `general.area.source = "workflowType"`

Escrita:

- nao existe campo editavel de area no payload canonico;
- a UI apenas exibe a area e o texto "Herdada do tipo de workflow";
- o save usa sempre o `workflowType.areaId` atual como valor autoritativo.

### 6.5. Contrato de resolucao administrativa de approvers

Novas funcoes server-side esperadas:

```ts
async function listWorkflowConfigCollaborators(): Promise<WorkflowConfigCollaboratorLookup[]>;

async function resolveCollaboratorSelections(
  selections: Array<{ collaboratorDocId: string }>,
): Promise<Array<{ collaboratorDocId: string; userId: string; name: string; email: string }>>;

async function hydrateApproverSelections(
  approverIds: string[],
): Promise<{
  approvers: WorkflowVersionEditorApprover[];
  unresolvedApproverIds: string[];
}>;
```

Comportamentos:

1. `resolveCollaboratorSelections()` le por `doc.id`, nao por `id3a`;
2. cada selecao valida precisa resultar em exatamente um colaborador com `id3a` nao vazio;
3. a persistencia final e sempre `approverIds: string[]`;
4. `hydrateApproverSelections()` e usada apenas para UX de reabertura do editor;
5. IDs nao resolvidos viram warning de compatibilidade no GET;
6. drafts com `unresolvedApproverIds` nao podem ser salvos nem publicados ate saneamento explicito;
7. o backend nunca pode sobrescrever silenciosamente `approverIds` historicos nao reidratados.

---

## 7. Regras de Negocio

1. A tab `Definicoes` continua sendo o contexto primario do configurador.
2. Versoes `draft` abrem o modal em `editorMode='edit'`.
3. Versoes `published` abrem o modal em `editorMode='read-only'`.
4. Em `read-only`, os campos do formulario nao podem ser editados e nenhuma acao de mutacao aparece no modal.
5. `Publicar versao` continua disponivel apenas para draft.
6. `Ativar` pode continuar disponivel apenas no catalogo; o modal published permanece estritamente read-only.
7. `areaId` e imutavel desde a criacao do workflow type.
8. O `ownerUserId` continua editavel em draft, mas `ownerEmail` segue derivado do colaborador selecionado.
9. Qualquer etapa `action` exige ao menos um colaborador selecionado apos normalizacao para `id3a`.
10. `publishability` continua avaliando `approverIds` canonicos e mantendo os bloqueios existentes da `2E.3`.
11. Reabrir um draft existente deve mostrar nomes/emails dos aprovadores ja configurados sempre que os colaboradores ainda existirem.
12. Se algum `approverId` historico nao puder ser reidratado, o editor deve expor warning e impedir qualquer novo save ou publicacao ate a selecao ser saneada.

---

## 8. File Manifest

### 8.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared contracts | `src/lib/workflows/admin-config/types.ts`, `src/lib/workflows/admin-config/lookups.ts` | @firebase-specialist |
| 2. Version service + routes | `src/lib/workflows/admin-config/draft-repository.ts`, `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route.ts`, `src/lib/workflows/admin-config/api-client.ts` | @firebase-specialist |
| 3. Modal orchestration | `src/components/workflows/admin-config/WorkflowConfigPage.tsx`, `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx`, `src/app/(app)/admin/request-config/[workflowTypeId]/versions/[version]/edit/page.tsx` | @react-frontend-developer |
| 4. Shared editor UI | `src/components/workflows/admin-config/editor/*` | @react-frontend-developer |
| 5. Tests | `src/lib/workflows/admin-config/__tests__/*`, `src/app/api/admin/request-config/__tests__/*`, `src/components/workflows/admin-config/__tests__/*` | @firebase-specialist + @react-frontend-developer |

### 8.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/admin-config/types.ts` | Modify | tipar `WorkflowVersionEditorData`, `WorkflowConfigCollaboratorLookup` e novo save payload administrativo | @firebase-specialist | - |
| 2 | `src/lib/workflows/admin-config/lookups.ts` | Modify | listar colaboradores com `collaboratorDocId` e criar resolucao `docId -> id3a` | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/admin-config/draft-repository.ts` | Modify | aceitar GET para draft/published, hidratar area read-only e approvers, salvar canonicalizacao | @firebase-specialist | #1, #2 |
| 4 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route.ts` | Modify | expor contrato neutro de versao e novo save payload | @firebase-specialist | #3 |
| 5 | `src/lib/workflows/admin-config/api-client.ts` | Modify | normalizar DTO neutro, abrir modal via query-state e enviar approvers por `collaboratorDocId` | @react-frontend-developer | #1, #4 |
| 6 | `src/components/workflows/admin-config/WorkflowConfigPage.tsx` | Modify | coordenar search params e renderizar dialogo de versao | @react-frontend-developer | #5 |
| 7 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | substituir `router.push(editorPath)` por abertura do modal e adicionar CTA de visualizacao read-only | @react-frontend-developer | #6 |
| 8 | `src/components/workflows/admin-config/editor/WorkflowVersionEditorDialog.tsx` | Create | shell modal full-height com close guard e acoes por modo | @react-frontend-developer | #5, #6 |
| 9 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Refactor/Modify | extrair panel reutilizavel e consumir DTO neutro | @react-frontend-developer | #5, #8 |
| 10 | `src/components/workflows/admin-config/editor/WorkflowDraftGeneralSection.tsx` | Modify | trocar `Select` de area por campo contextual read-only e suportar `readOnly` | @react-frontend-developer | #9 |
| 11 | `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Modify | trocar input textual por picker de colaboradores e suportar `readOnly` | @react-frontend-developer | #9 |
| 12 | `src/components/workflows/admin-config/editor/WorkflowActionApproverPicker.tsx` | Create | componente auxiliar para busca/selecao de approvers via `collaboratorDocId` | @react-frontend-developer | #11 |
| 13 | `src/components/workflows/admin-config/editor/types.ts` | Modify | refletir o novo estado de form administrativo de steps/action/approvers | @react-frontend-developer | #1 |
| 14 | `src/app/(app)/admin/request-config/[workflowTypeId]/versions/[version]/edit/page.tsx` | Modify | manter wrapper dedicado com o mesmo panel em modo full-page/fallback | @react-frontend-developer | #9 |
| 15 | `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts` | Modify | cobrir area imutavel, hydrate de approvers e canonicalizacao por docId | @firebase-specialist | #3 |
| 16 | `src/app/api/admin/request-config/__tests__/write-routes.test.ts` | Modify | contratos GET draft/published e PUT com `collaboratorDocId` | @firebase-specialist | #4 |
| 17 | `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx` | Modify | validar abertura do modal sem navegacao dedicada | @react-frontend-developer | #7 |
| 18 | `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | Modify | validar modo read-only, area contextual e acoes por estado | @react-frontend-developer | #9, #10, #11 |
| 19 | `src/components/workflows/admin-config/__tests__/WorkflowConfigPage.test.tsx` | Modify | validar sincronizacao entre query params, modal e catalogo | @react-frontend-developer | #6, #8 |

---

## 9. Code Patterns

### 9.1. Pattern de abertura/fechamento do modal via search params

```ts
function openVersionEditor(workflowTypeId: string, version: number) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('tab', 'definitions');
  params.set('editorWorkflowTypeId', workflowTypeId);
  params.set('editorVersion', String(version));
  router.push(`/admin/request-config?${params.toString()}`);
}

function closeVersionEditor() {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('editorWorkflowTypeId');
  params.delete('editorVersion');
  router.push(`/admin/request-config?${params.toString()}`);
}
```

### 9.2. Pattern do campo de area contextual read-only

```tsx
<div className="space-y-2">
  <Label>Area</Label>
  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
    <div className="font-medium">{version.general.area.name}</div>
    <div className="text-xs text-muted-foreground">
      Herdada do tipo de workflow ({version.general.area.areaId})
    </div>
  </div>
</div>
```

### 9.3. Pattern de canonicalizacao server-side de approvers

```ts
async function normalizeActionApprovers(
  approvers: Array<{ collaboratorDocId: string }>,
): Promise<string[]> {
  const resolved = await resolveCollaboratorSelections(approvers);
  return Array.from(new Set(resolved.map((item) => item.userId)));
}
```

### 9.4. Pattern de hidratação do editor a partir de `approverIds`

```ts
async function buildEditorAction(action: StepActionDef | undefined): Promise<WorkflowVersionEditorAction | undefined> {
  if (!action) return undefined;

  const hydrated = await hydrateApproverSelections(action.approverIds ?? []);

  return {
    type: action.type,
    label: action.label,
    approvers: hydrated.approvers,
    unresolvedApproverIds: hydrated.unresolvedApproverIds,
    commentRequired: action.commentRequired,
    attachmentRequired: action.attachmentRequired,
    commentPlaceholder: action.commentPlaceholder,
    attachmentPlaceholder: action.attachmentPlaceholder,
  };
}
```

### 9.5. Pattern de shell unico para draft e published

```tsx
<WorkflowVersionEditorDialog
  open={isOpen}
  onOpenChange={handleOpenChange}
  workflowTypeId={editorWorkflowTypeId}
  version={editorVersion}
>
  {data.version.editorMode === 'edit' ? <SaveAndPublishActions /> : <ReadOnlyActions />}
</WorkflowVersionEditorDialog>
```

---

## 10. Testing Strategy

### 10.1. Unit

- `resolveCollaboratorSelections()` resolve `collaboratorDocId` para `id3a` e rejeita colaborador sem `id3a`;
- `hydrateApproverSelections()` devolve `approvers` legiveis e `unresolvedApproverIds`;
- `saveWorkflowDraft()` ignora ou rejeita drift de `areaId`;
- `saveWorkflowDraft()` bloqueia persistencia quando houver `unresolvedApproverIds`;
- construcao do DTO published retorna `editorMode='read-only'`;
- `publishability` continua bloqueando actions sem approvers canonicos.

### 10.2. Integration

- abrir draft pelo catalogo nao desmonta `WorkflowConfigPage`;
- abrir versao published renderiza as secoes em modo somente leitura;
- salvar draft com `collaboratorDocId` persiste `approverIds` canonicos;
- reabrir draft devolve os mesmos colaboradores selecionados por nome/email;
- draft com `unresolvedApproverIds` nao salva ate saneamento explicito;
- fechar modal sujo exige confirmacao antes de limpar search params.

### 10.3. API contract

Seguir envelope canonico do projeto:

- `401` sem token;
- `403` sem `canManageWorkflowsV2`;
- `200` no GET para draft;
- `200` no GET para published;
- `404` para tipo/versao inexistente;
- `422` quando `PUT` receber `collaboratorDocId` invalido ou area divergente;
- `422` quando `PUT` tentar salvar versao published;
- `200` no `PUT` com `publishReadiness` calculado sobre `approverIds` canonicos.

### 10.4. Component tests

- o CTA do catalogo abre modal em vez de navegar para rota dedicada;
- a URL recebe e remove `editorWorkflowTypeId`/`editorVersion`;
- a secao `Configuracao geral` mostra area read-only com mensagem de heranca;
- a secao de steps mostra aprovadores por nome/email, sem input cru de IDs;
- o modo published nao renderiza `Salvar rascunho`;
- o modo published nao renderiza `Ativar` dentro do modal;
- o modo draft continua renderizando `Publicar versao`.

### 10.5. Regressao funcional obrigatoria

- `publish` e `activate` continuam usando os endpoints e invariantes da `2E.3`;
- `StepActionDef.approverIds` permanece canonico em `id3a`;
- a rota dedicada fallback continua funcionando;
- a tab `Definicoes` continua protegida apenas por `canManageWorkflowsV2`;
- `areaId` continua correto em tipos draft-only e tipos ja publicados.

---

## 11. Rollback Plan

### 11.1. Rollback de codigo

1. voltar `WorkflowConfigDefinitionsTab` para `router.push(editorPath)` como antes;
2. remover `WorkflowVersionEditorDialog` e a coordenacao por search params;
3. manter a rota dedicada e o editor full-page como fluxo unico.

### 11.2. Rollback de dados

Nao ha migracao de schema obrigatoria:

- `approverIds` continuam persistidos como `id3a`, portanto nao exigem reversao;
- `collaboratorDocId` existe apenas no payload administrativo e nao precisa ser limpo;
- published versions e snapshots da `2E.3` permanecem intactos.

### 11.3. Risco conhecido no rollback

- se o frontend for revertido e o backend novo permanecer, os contratos continuam additive, mas parte da hidratação de approvers ficara ociosa;
- se o backend for revertido sem o frontend, o modal deixa de abrir published ou falha ao salvar approvers por `collaboratorDocId`.

---

## 12. Checklist de Build

- [ ] neutralizar o contrato do editor de `draft` para `version`;
- [ ] adicionar `collaboratorDocId` aos lookups administrativos;
- [ ] implementar resolucao `collaboratorDocId -> id3a` no save;
- [ ] implementar hidratação `approverIds -> approvers legiveis` no GET;
- [ ] remover `areaId` do payload mutavel e renderiza-lo como campo contextual read-only;
- [ ] adicionar shell modal com estado em search params sobre `/admin/request-config`;
- [ ] manter a rota dedicada como fallback com o mesmo panel compartilhado;
- [ ] cobrir draft editavel, published read-only e dirty close nos testes.

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-09 | Codex | Especificacao tecnica para modal contextual do editor, area imutavel e selecao canonica de approvers |
