# DESIGN: Fase 2E.3 - Publicacao, ativacao e invariantes de versionamento

> Generated: 2026-04-08
> Status: Ready for build
> Scope: Fase 2 / 2E.3 - publicacao de rascunhos validos, reativacao de versoes publicadas e manutencao atomica do ponteiro publicado em `workflowTypes_v2`
> Base document: `DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md`
> Depends on: `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`, `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`

## 1. Objetivo

Entregar a camada que transforma o editor permissivo da `2E.2` em configuracao operacional segura para o runtime v2. A subetapa fecha o gap entre `draft` e `published` com regras de validacao bloqueante, troca atomica da versao ativa e consistencia continua do documento raiz do tipo.

Esta subetapa cobre:

- publicar um `draft` apenas quando a definicao estiver valida para o runtime;
- promover snapshot de `draftConfig.workflowType` para o documento raiz no ato da publicacao;
- gerar `version` sequencial sem colisao e sem overwrite da publicada atual;
- reativar uma versao historica `published` sem criar novo estado persistido;
- derivar `Inativa` apenas na UI para versoes publicadas que nao sao a ativa;
- atualizar `latestPublishedVersion`, `active`, `owner*` e `allowedUserIds` do documento raiz de forma atomica, sempre promovendo `active=true` em `Publicar` e `Ativar`;
- registrar metadata operacional minima de transicao.

Esta subetapa nao cobre:

- novo estado persistido `inactive` ou `retired`;
- workflow de aprovacao humana para publicar;
- historico geral completo da aba `Historico Geral`;
- rollback automatico multi-documento apos uma publicacao bem-sucedida;
- refactor do runtime de requests alem do necessario para aceitar `latestPublishedVersion: number | null`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md)
- [DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md)
- [DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [resolve-published-version.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/resolve-published-version.ts)
- [payload-builder.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/catalog/[workflowTypeId]/route.ts)
- [auth-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/auth-helpers.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md` para escopo e aceite;
2. depois prevalecem os designs da `2E.1` e `2E.2` para shell, authz e modelo de draft;
3. depois prevalece este design para orientar o build;
4. o runtime publicado segue como restricao final: `resolvePublishedVersion` e `assertCanOpen` nao podem observar estado ambiguo.

---

## 3. Estado Atual e Lacuna que a 2E.3 Fecha

### 3.1. O que o repositorio ja oferece

- o runtime v2 ja le o documento raiz em `workflowTypes_v2/{workflowTypeId}` e depois resolve `versions/{latestPublishedVersion}`;
- `resolvePublishedVersion` ja falha quando `latestPublishedVersion` e nulo/invalido ou quando a versao apontada nao esta em `state='published'`;
- o seed da `2C` materializa a versao inicial como `published`, com `publishedAt` e `latestPublishedVersion=1`;
- a `2E.2` ja definiu drafts isolados no version doc via `draftConfig.workflowType`, com save permissivo e no maximo um draft por tipo.

### 3.2. Problema real no codigo atual

- ainda nao existe comando de `Publicar` que valide o draft antes de mexer no ponteiro do runtime;
- ainda nao existe comando de `Ativar` que permita voltar para uma versao historica publicada;
- o documento raiz hoje so e coerente porque os seeds escrevem uma unica versao; apos a `2E.2`, tipos publicados podem ter draft cujo snapshot diverge da raiz;
- sem transacao de promocao, o sistema pode cair em janelas onde o root aponta para uma versao nao publicada ou metadados do root ficam dessincronizados da versao ativa;
- a UI da `2E.1` precisa derivar `Inativa` sem persistir novo estado, mas isso ainda nao foi especificado em contrato final.

### 3.3. Resultado esperado ao final da 2E.3

- publicar um draft valido muda a versao para `published`, preenche metadata de publicacao e promove os metadados do snapshot draft para o documento raiz;
- reativar uma versao historica apenas muda o ponteiro `latestPublishedVersion` e os metadados raiz para refletir essa versao;
- existe sempre no maximo uma versao `published` considerada ativa por `workflowTypeId`, determinada por `workflowTypes_v2.latestPublishedVersion`;
- versoes publicadas antigas continuam `state='published'`, mas a UI as exibe como `Inativa` quando nao correspondem ao ponteiro ativo;
- o runtime sempre encontra root e version coerentes dentro da mesma transacao Firestore.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config
  |      |
  |      +--> Catalog tree / version row actions
  |      |      |- Publicar draft
  |      |      \- Ativar versao publicada
  |      |
  |      \--> Draft editor readiness panel
  |             \- bloqueios de publicacao
  |
  v
Client admin-config api client
  |
  +--> POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish
  \--> POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/activate
        |
        v
Admin authz layer
  |
  +--> verifyBearerToken
  +--> resolve collaborator (authUid -> normalized email)
  \--> assert canManageWorkflowsV2
        |
        v
Admin publication service
  |
  +--> validate publishability
  +--> firestore transaction
  |      |- read workflow root
  |      |- read target version
  |      |- read existing versions if needed
  |      |- update target version metadata
  |      \- update workflow root pointer + root metadata
  |
  \--> catalog presenter / editor presenter refresh
        |
        v
Firestore
  |
  +--> workflowTypes_v2/{workflowTypeId}
  \--> workflowTypes_v2/{workflowTypeId}/versions/{version}
         |- draft      (editable)
         \- published  (immutable after publish; can become inactive only in UI)
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Client actions)
1. Catalogo e editor mostram readiness de publicacao.
2. CTA "Publicar" aparece apenas para draft.
3. CTA "Ativar" aparece apenas para versao publicada nao ativa.

LAYER 2 (Server commands)
4. Rotas admin autenticam Bearer token e validam canManageWorkflowsV2.
5. Service resolve root + version alvo.
6. Service executa validacoes bloqueantes de publicacao ou elegibilidade de ativacao.

LAYER 3 (Atomic persistence)
7. Firestore transaction atualiza target version e documento raiz no mesmo commit.
8. Nenhuma versao antiga recebe novo estado persistido.
9. O ponteiro `latestPublishedVersion` passa a definir a unica versao operacionalmente ativa.

LAYER 4 (Read models)
10. Catalogo e editor recarregam DTOs apos mutacao.
11. A UI deriva `Draft`, `Publicada` e `Inativa` a partir de `state` + `latestPublishedVersion`.

LAYER 5 (Runtime safety)
12. Runtime continua lendo apenas root + versao apontada.
13. Se a transacao falhar, nada muda no runtime.
```

### 4.3. Modelo final de estado

Estado persistido de versao continua restrito a:

- `draft`
- `published`

Estado derivado de UI:

- `Inativa`: versao com `state='published'` e `version !== workflowType.latestPublishedVersion`
- `Ativa/Publicada`: versao com `state='published'` e `version === workflowType.latestPublishedVersion`
- `Rascunho inicial`: `state='draft'` em tipo com `latestPublishedVersion = null`

### 4.4. Invariantes fechadas pela subetapa

1. `workflowTypes_v2.latestPublishedVersion` e `null` apenas quando nenhuma versao foi publicada.
2. Se `latestPublishedVersion = N`, entao `versions/N` existe e deve estar em `state='published'`.
3. `active` do documento raiz reflete se o tipo esta operacionalmente aberto no runtime, nunca o estado de um draft.
4. No maximo um draft aberto por tipo continua valendo.
5. Versao `published` e imutavel por `PUT` do editor; qualquer mudanca exige abrir novo draft.
6. `publishedAt` e preenchido somente na primeira publicacao de uma versao.
7. Reativacao nao reescreve `publishedAt`; apenas registra metadata de ativacao separada.
8. `Publicar` e `Ativar` sempre deixam o tipo operacionalmente ativo no runtime (`root.active = true`).
9. `Ativar` so fica disponivel para versoes `published` que possuam `workflowTypeSnapshot` suficiente para reconstruir o documento raiz com seguranca.

---

## 5. Architecture Decisions

### ADR-2E3-001: A versao ativa e um ponteiro no documento raiz, nao um estado extra nas versoes

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define proibe criar estado persistido `inactive`, mas a UI precisa distinguir versao ativa da historica publicada. |

**Choice:** manter `VersionState = 'draft' | 'published'` e usar `workflowTypes_v2.latestPublishedVersion` como unica referencia de ativacao.

**Rationale:**

1. preserva compatibilidade com runtime e seeds existentes;
2. evita atualizacao em massa de varias versoes a cada ativacao;
3. torna a regra de resolucao publicada trivial para o runtime.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| adicionar `inactive` ou `retired` em `VersionState` | viola o define e complica runtime/read models |
| marcar `isActive=true/false` em cada versao | adiciona redundancia e risco de duas ativas |

**Consequences:**

- positivo: derivacao de UI fica simples;
- positivo: reativar versao historica exige apenas trocar ponteiro + metadados raiz;
- negativo: toda UI precisa sempre conhecer o root para classificar a versao.

### ADR-2E3-002: Publicacao promove o snapshot draft para o documento raiz na mesma transacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | Na `2E.2`, tipos publicados podem ter `draftConfig.workflowType` divergente do root. Publicar exige que o runtime passe a refletir esse snapshot imediatamente. |

**Choice:** o comando de publicacao atualiza `versions/{version}` e `workflowTypes_v2/{workflowTypeId}` no mesmo `runTransaction`.

**Rationale:**

1. elimina janela em que `latestPublishedVersion` aponta para versao correta, mas root ainda carrega owner/acesso antigos;
2. garante consistencia para `assertCanOpen` e qualquer leitura que use campos do root;
3. evita passo posterior de reconciliacao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| publicar versao e depois atualizar root fora da transacao | abre janela de inconsistencias observaveis |
| usar job async de reconciliacao do root | adiciona latencia e estados intermediarios nao desejados |

**Consequences:**

- positivo: publicacao vira operacao atomica observavel;
- negativo: a transacao toca mais documentos e precisa validar payload antes.

### ADR-2E3-003: Reativar versao publicada nao duplica documento nem cria nova versao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define pede reativacao previsivel de versao anterior, mas nao pede clonagem ou rollback por copia. |

**Choice:** `Ativar` apenas move o root para uma versao `published` ja existente.

**Rationale:**

1. preserva auditabilidade do versionamento;
2. evita inflar numeracao com copias identicas;
3. torna reversao operacional rapida e barata.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| clonar a versao historica para novo draft e publicar de novo | muda semantica de "ativar" e cria atrito |
| sobrescrever a versao ativa atual | viola imutabilidade de published |

**Consequences:**

- positivo: ativacao e instantanea;
- positivo: versoes publicadas legadas sem snapshot podem ser tratadas explicitamente como nao elegiveis, sem CTA enganoso;
- negativo: para editar a historica antes de ativar, continua sendo necessario abrir novo draft.

### ADR-2E3-004: Validacao de publicacao e servidor-side, com feedback estruturado no cliente

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O editor da `2E.2` aceita save permissivo. A `2E.3` precisa bloquear a transicao sem confiar apenas na UX local. |

**Choice:** consolidar `publishability` em helper server-side reutilizado por `GET` do editor/catalogo e por `POST publish`.

**Rationale:**

1. evita divergencia entre warning exibido e bloqueio real;
2. protege contra chamadas diretas na API;
3. permite evoluir a lista de regras sem alterar as rotas principais.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| validar apenas no frontend | inseguro e facil de burlar |
| validar inline em cada rota sem helper compartilhado | propaga logica duplicada |

**Consequences:**

- positivo: UI e API compartilham a mesma taxonomia de issues;
- negativo: amplia o escopo da camada server-side admin.

---

## 6. Regras de Dominio

### 6.1. Regras bloqueantes de publicacao

Um draft nao pode ser publicado quando qualquer item abaixo ocorrer:

- `ownerUserId` ausente, invalido ou nao resolvivel para colaborador unico;
- `name`, `description`, `icon` ou `areaId` vazios apos trim;
- `defaultSlaDays` nao inteiro ou negativo;
- `fields` com `id` duplicado;
- `fields` `select` sem `options` nao vazias;
- `stepsById` vazio;
- `stepOrder` vazio;
- `initialStepId` ausente ou fora de `stepsById`;
- nenhuma etapa `kind='start'`;
- nenhuma etapa `kind='final'`;
- mais de uma etapa `kind='start'`;
- `stepOrder` contendo ids ausentes, repetidos ou fora do mapa;
- `statusKey` duplicado;
- step `action` com `approverIds` ausente ou vazia;
- `approverIds` com duplicados;
- `approverIds` contendo colaboradores inexistentes;
- step final contendo `action` invalida para o runtime, se a regra existente do motor impedir essa combinacao.

Regra complementar desta fase:

- `Publicar` sempre promove `root.active = true`, independentemente do valor armazenado no draft snapshot;
- isso preserva a semantica de que uma versao publicada/ativada continua operacionalmente aberta no runtime;
- qualquer capacidade futura de desligar um workflow type deve virar feature explicita, fora do escopo desta subetapa.

### 6.2. Regras de ativacao

Uma versao so pode ser ativada quando:

- o documento existe;
- `state === 'published'`;
- `version !== latestPublishedVersion`;
- os metadados necessarios para promover root podem ser reconstruidos da propria versao ou de snapshot persistido;
- o `workflowTypeId` da URL bate com o version doc.

Inferencia explicita:

- para reativacao previsivel, o design assume que a primeira publicacao de cada versao deve persistir snapshot suficiente da configuracao de root dentro da propria versao publicada.
- versoes publicadas historicas sem `workflowTypeSnapshot` nao exibem CTA `Ativar` e devem retornar `VERSION_SNAPSHOT_MISSING` em chamada direta.

### 6.3. Metadata de transicao

Novos campos opcionais sugeridos:

- `versions/{version}.publishedByUserId`
- `versions/{version}.publishedByName`
- `versions/{version}.activatedAt`
- `versions/{version}.activatedByUserId`
- `versions/{version}.activatedByName`
- `versions/{version}.workflowTypeSnapshot`
- `workflowTypes_v2.lastActivatedAt`
- `workflowTypes_v2.lastActivatedVersion`

Sem nova colecao obrigatoria.

### 6.4. Classificacao visual de versoes

Regra do presenter:

```ts
if (version.state === 'draft') return 'Rascunho';
if (version.version === workflowType.latestPublishedVersion) return 'Publicada';
return 'Inativa';
```

---

## 7. API Contract

### 7.1. `POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish`

```http
POST /api/admin/request-config/workflow-types/facilities_manutencao_predial/versions/3/publish
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Body opcional:

```json
{
  "confirm": true
}
```

Auth:

1. validar Bearer token;
2. resolver colaborador autenticado com fallback `authUid -> email normalizado`;
3. rejeitar com `403` quando `canManageWorkflowsV2 !== true`.

Write rules:

1. carregar root e target version na mesma transacao;
2. exigir `state='draft'`;
3. calcular `publishIssues`;
4. se existir issue bloqueante, responder `409`;
5. promover `draftConfig.workflowType` para root;
6. atualizar target version para `state='published'`;
7. preencher `publishedAt` apenas se ainda nulo;
8. persistir `workflowTypeSnapshot` canonico na versao publicada;
9. atualizar `latestPublishedVersion = version`;
10. manter versoes publicadas anteriores inalteradas.

Response `200`:

```json
{
  "ok": true,
  "data": {
    "workflowTypeId": "facilities_manutencao_predial",
    "version": 3,
    "state": "published",
    "latestPublishedVersion": 3,
    "publishedAt": "2026-04-08T19:10:00.000Z",
    "transition": "published",
    "catalogStatus": "Publicada"
  }
}
```

### 7.2. `POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/activate`

Ativa uma versao historica ja publicada.

```json
{
  "confirm": true
}
```

Write rules:

1. target version deve existir e estar `published`;
2. target version nao pode ser a atual;
3. root recebe metadados de `workflowTypeSnapshot` persistido na versao alvo;
4. `latestPublishedVersion` passa a apontar para a versao alvo;
5. `activatedAt` e `activatedBy*` da versao alvo sao atualizados;
6. nenhuma outra versao e alterada.
7. `root.active` passa a `true`, mesmo que snapshots historicos carreguem valor divergente.

Response `200`:

```json
{
  "ok": true,
  "data": {
    "workflowTypeId": "facilities_manutencao_predial",
    "version": 1,
    "latestPublishedVersion": 1,
    "transition": "activated",
    "catalogStatus": "Publicada"
  }
}
```

### 7.3. `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`

Contrato herdado da `2E.2`, com extensoes:

- `publishReadiness` passa a devolver `severity: 'warning' | 'blocking'`;
- `canPublish: boolean`;
- `canActivate: boolean`;
- `derivedStatus: 'Rascunho' | 'Publicada' | 'Inativa'`.

Trecho relevante:

```json
{
  "ok": true,
  "data": {
    "draft": {
      "workflowTypeId": "facilities_manutencao_predial",
      "version": 3,
      "state": "draft",
      "derivedStatus": "Rascunho",
      "canPublish": false,
      "canActivate": false,
      "publishReadiness": [
        {
          "code": "DUPLICATE_ACTION_APPROVER",
          "category": "actions",
          "severity": "blocking",
          "message": "A etapa de aprovacao possui approverIds duplicados.",
          "path": "steps.aprovacao_financeira.action.approverIds"
        }
      ]
    }
  }
}
```

### 7.4. `GET /api/admin/request-config/catalog`

Contrato herdado da `2E.1`, com extensoes por versao:

- `derivedStatus`
- `canPublish`
- `canActivate`
- `hasBlockingIssues`
- `lastTransitionAt`

Objetivo:

- suportar CTA de `Publicar` e `Ativar` no catalogo sem abrir o editor.
- `canActivate` deve ser `false` quando a versao publicada nao possuir `workflowTypeSnapshot` suficiente para reconstituir o root.

### 7.5. Erros padrao adicionais

`409`:

```json
{
  "ok": false,
  "code": "VERSION_NOT_PUBLISHABLE",
  "message": "A versao 3 possui pendencias bloqueantes e nao pode ser publicada.",
  "details": {
    "issues": [
      {
        "code": "MISSING_FINAL_STEP",
        "category": "steps",
        "severity": "blocking",
        "message": "Defina uma etapa final antes de publicar."
      }
    ]
  }
}
```

`409`:

```json
{
  "ok": false,
  "code": "VERSION_ALREADY_ACTIVE",
  "message": "A versao 1 ja esta ativa para este workflow type."
}
```

`422`:

```json
{
  "ok": false,
  "code": "VERSION_SNAPSHOT_MISSING",
  "message": "A versao publicada nao possui snapshot suficiente para reativacao segura."
}
```

---

## 8. Database / Auth Contract

### 8.1. Firestore

Colecoes tocadas:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

Sem novas colecoes obrigatorias.

Novos campos opcionais no version doc:

- `workflowTypeSnapshot`
- `publishedByUserId`
- `publishedByName`
- `activatedAt`
- `activatedByUserId`
- `activatedByName`

Novos campos opcionais no root:

- `lastActivatedAt`
- `lastActivatedVersion`

### 8.2. Compatibilidade com runtime publicado

Regras obrigatorias:

- `resolvePublishedVersion` deve continuar aceitando apenas `state='published'`;
- nenhuma chamada do runtime depende de `activatedAt` ou `workflowTypeSnapshot`;
- published versions legadas sem snapshot nao quebram leitura; apenas nao sao ativaveis nesta fase;
- published versions legadas sem snapshot continuam legiveis para leitura, mas nao sao ativaveis nesta fase;
- tipos draft-only continuam com `latestPublishedVersion = null` e seguem invisiveis para abertura operacional.

### 8.3. Contrato de permissao

Todas as mutacoes desta fase exigem:

```ts
canManageWorkflowsV2: boolean;
```

### 8.4. Politica de autenticacao server-side

Seguir o padrao do runtime:

1. extrair Bearer token do header `Authorization`;
2. validar com Firebase Admin;
3. resolver colaborador do admin;
4. aplicar gate de permissao dedicado.

---

## 9. File Manifest

### 9.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared contracts | `src/lib/workflows/runtime/types.ts`, `src/lib/workflows/admin-config/types.ts` | @firebase-specialist |
| 2. Publishability core | `src/lib/workflows/admin-config/publishability.ts`, `src/lib/workflows/admin-config/publication-service.ts`, `src/lib/workflows/admin-config/draft-repository.ts` | @firebase-specialist |
| 3. API routes | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish/route.ts`, `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/activate/route.ts`, `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route.ts`, `src/app/api/admin/request-config/catalog/route.ts` | @firebase-specialist |
| 4. Frontend actions | `src/lib/workflows/admin-config/api-client.ts`, `src/components/workflows/admin-config/**`, `src/app/(app)/admin/request-config/**` | @react-frontend-developer |
| 5. Tests | `src/lib/workflows/admin-config/__tests__/*`, `src/app/api/admin/request-config/__tests__/*`, `src/components/workflows/admin-config/__tests__/*` | @firebase-specialist + @react-frontend-developer |

### 9.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/runtime/types.ts` | Modify | aceitar `latestPublishedVersion: number | null` e metadata opcional de publish/activate | @firebase-specialist | - |
| 2 | `src/lib/workflows/admin-config/types.ts` | Modify | taxonomia de `PublishIssue`, DTOs de publish/activate e status derivados | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/admin-config/publishability.ts` | Create | regras bloqueantes reutilizaveis entre editor, catalogo e publish route | @firebase-specialist | #1, #2 |
| 4 | `src/lib/workflows/admin-config/publication-service.ts` | Create | transacoes atomicas de `publishDraftVersion` e `activatePublishedVersion` | @firebase-specialist | #1, #2, #3 |
| 5 | `src/lib/workflows/admin-config/draft-repository.ts` | Modify | leitura de snapshots publicados e helpers de root/version | @firebase-specialist | #4 |
| 6 | `src/lib/workflows/admin-config/auth.ts` | Reuse/Modify | gate server-side `canManageWorkflowsV2` | @firebase-specialist | - |
| 7 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish/route.ts` | Create | endpoint de publicacao | @firebase-specialist | #4, #6 |
| 8 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/activate/route.ts` | Create | endpoint de ativacao | @firebase-specialist | #4, #6 |
| 9 | `src/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route.ts` | Modify | enriquecer `GET` com `canPublish/canActivate/derivedStatus` | @firebase-specialist | #3 |
| 10 | `src/app/api/admin/request-config/catalog/route.ts` | Modify | expor flags derivadas para linhas do catalogo | @firebase-specialist | #3 |
| 11 | `src/lib/workflows/admin-config/api-client.ts` | Modify | adicionar `publishVersion()` e `activateVersion()` | @react-frontend-developer | #7, #8 |
| 12 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | botao `Publicar`/`Ativar`, loading state e refresh de catalogo | @react-frontend-developer | #10, #11 |
| 13 | `src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx` | Modify | separar warnings vs bloqueios e CTA de publish | @react-frontend-developer | #9, #11 |
| 14 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Modify | acionar publicacao, invalidar cache e navegar conforme retorno | @react-frontend-developer | #11, #13 |
| 15 | `src/lib/workflows/admin-config/__tests__/publishability.test.ts` | Create | regras bloqueantes e derivacao de status | @firebase-specialist | #3 |
| 16 | `src/lib/workflows/admin-config/__tests__/publication-service.test.ts` | Create | transacoes de publicar e ativar | @firebase-specialist | #4 |
| 17 | `src/app/api/admin/request-config/__tests__/publication-routes.test.ts` | Create | contratos HTTP 401/403/409/422/200 | @firebase-specialist | #7, #8, #9, #10 |
| 18 | `src/components/workflows/admin-config/__tests__/WorkflowDraftReadinessPanel.test.tsx` | Create | UX de bloqueios e CTA publish | @react-frontend-developer | #13 |
| 19 | `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx` | Create | CTA activate/publish no catalogo | @react-frontend-developer | #12 |

---

## 10. Code Patterns

### 10.1. Taxonomia de issues de publicacao

```ts
export type PublishIssue = {
  code: string;
  category: 'general' | 'access' | 'fields' | 'steps' | 'actions';
  severity: 'warning' | 'blocking';
  message: string;
  path?: string;
};
```

### 10.2. Pattern de avaliacao de publicabilidade

```ts
export function evaluatePublishability(input: DraftAggregate): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!input.general.ownerUserId) {
    issues.push({
      code: 'INVALID_OWNER',
      category: 'general',
      severity: 'blocking',
      message: 'Selecione um owner valido antes de publicar.',
      path: 'general.ownerUserId',
    });
  }

  const finalSteps = input.steps.filter((step) => step.kind === 'final');
  if (finalSteps.length === 0) {
    issues.push({
      code: 'MISSING_FINAL_STEP',
      category: 'steps',
      severity: 'blocking',
      message: 'Defina uma etapa final antes de publicar.',
      path: 'steps',
    });
  }

  return issues;
}
```

### 10.3. Pattern de publicacao atomica

```ts
export async function publishDraftVersion(input: PublishDraftInput) {
  const db = getFirestore(getFirebaseAdminApp());

  return db.runTransaction(async (tx) => {
    const rootRef = db.collection('workflowTypes_v2').doc(input.workflowTypeId);
    const versionRef = rootRef.collection('versions').doc(String(input.version));

    const [rootSnap, versionSnap] = await Promise.all([tx.get(rootRef), tx.get(versionRef)]);
    const root = rootSnap.data() as WorkflowTypeV2 | undefined;
    const version = versionSnap.data() as WorkflowVersionDraft | undefined;

    if (!root || !version || version.state !== 'draft') {
      throw new Error('Draft alvo nao encontrado.');
    }

    const issues = evaluatePublishability(buildDraftAggregate(root, version));
    const blockingIssues = issues.filter((issue) => issue.severity === 'blocking');
    if (blockingIssues.length > 0) {
      throw new VersionNotPublishableError(blockingIssues);
    }

    const now = Timestamp.now();
    const workflowTypeSnapshot = buildWorkflowTypeSnapshot({
      ...version.draftConfig.workflowType,
      active: true,
    });

    tx.update(versionRef, {
      state: 'published',
      publishedAt: version.publishedAt ?? now,
      publishedByUserId: input.actorUserId,
      publishedByName: input.actorName,
      activatedAt: now,
      activatedByUserId: input.actorUserId,
      activatedByName: input.actorName,
      workflowTypeSnapshot,
      updatedAt: now,
    });

    tx.update(rootRef, {
      ...workflowTypeSnapshot,
      latestPublishedVersion: input.version,
      updatedAt: now,
      lastActivatedAt: now,
      lastActivatedVersion: input.version,
    });

    return { workflowTypeId: input.workflowTypeId, version: input.version };
  });
}
```

### 10.4. Pattern de reativacao por ponteiro

```ts
export async function activatePublishedVersion(input: ActivateVersionInput) {
  const db = getFirestore(getFirebaseAdminApp());

  return db.runTransaction(async (tx) => {
    const rootRef = db.collection('workflowTypes_v2').doc(input.workflowTypeId);
    const versionRef = rootRef.collection('versions').doc(String(input.version));

    const [rootSnap, versionSnap] = await Promise.all([tx.get(rootRef), tx.get(versionRef)]);
    const root = rootSnap.data() as WorkflowTypeV2 | undefined;
    const version = versionSnap.data() as WorkflowVersionPublished | undefined;

    if (!root || !version || version.state !== 'published') {
      throw new Error('Versao publicada nao encontrada.');
    }
    if (root.latestPublishedVersion === input.version) {
      throw new Error('Versao ja ativa.');
    }
    if (!version.workflowTypeSnapshot) {
      throw new Error('Snapshot de root ausente para reativacao.');
    }

    const now = Timestamp.now();

    tx.update(versionRef, {
      activatedAt: now,
      activatedByUserId: input.actorUserId,
      activatedByName: input.actorName,
      updatedAt: now,
    });

    tx.update(rootRef, {
      ...version.workflowTypeSnapshot,
      active: true,
      latestPublishedVersion: input.version,
      updatedAt: now,
      lastActivatedAt: now,
      lastActivatedVersion: input.version,
    });
  });
}
```

### 10.5. Pattern de status derivado no presenter

```ts
export function deriveVersionStatus(
  workflowType: Pick<WorkflowTypeV2, 'latestPublishedVersion'>,
  version: Pick<WorkflowVersionV2, 'version' | 'state'>,
): 'Rascunho' | 'Publicada' | 'Inativa' {
  if (version.state === 'draft') return 'Rascunho';
  return workflowType.latestPublishedVersion === version.version ? 'Publicada' : 'Inativa';
}
```

```ts
export function canActivateVersion(
  workflowType: Pick<WorkflowTypeV2, 'latestPublishedVersion'>,
  version: Pick<WorkflowVersionPublished, 'version' | 'state' | 'workflowTypeSnapshot'>,
): boolean {
  return (
    version.state === 'published' &&
    workflowType.latestPublishedVersion !== version.version &&
    version.workflowTypeSnapshot != null
  );
}
```

---

## 11. Testing Strategy

### 11.1. Unit

- `evaluatePublishability` marca como `blocking` cada regra do define;
- deduplicacao de `approverIds`;
- derivacao de status `Rascunho/Publicada/Inativa`;
- validacao de snapshot obrigatorio para reativacao.

### 11.2. Integration

- publicar draft valido promove root + version no mesmo commit;
- publicar draft invalido nao altera nenhum documento;
- reativar versao historica troca apenas o ponteiro e metadata relacionada;
- versao historica permanece `state='published'` apos perder ativacao;
- `publishedAt` nao muda ao reativar;
- nova publicacao sobrescreve ponteiro sem tocar em published antigas.

### 11.3. API contract

Seguir o padrao de envelope existente:

- `401` sem token;
- `403` sem `canManageWorkflowsV2`;
- `404` para tipo/versao inexistente;
- `409` para draft nao publicavel ou versao ja ativa;
- `422` para snapshot publicado insuficiente;
- `200` com `{ ok: true, data }` nas transicoes validas.

### 11.4. Component tests

- painel de readiness distingue aviso de bloqueio;
- botao `Publicar` fica desabilitado quando ha bloqueios;
- botao `Ativar` so aparece para versao `Inativa`;
- catalogo atualiza badges apos publish/activate sem reload completo.

### 11.5. Regressao funcional obrigatoria

- `resolvePublishedVersion` continua resolvendo a nova versao ativa sem alterar sua semantica;
- tipos draft-only seguem retornando erro de "nao possui versao publicada";
- abrir novo draft apos publicar continua clonando a ultima publicada correta;
- runtime continua usando `allowedUserIds` e `ownerUserId` do root, agora coerentes com a ultima ativacao.

---

## 12. Rollback Plan

### 12.1. Rollback de codigo

1. remover rotas `publish` e `activate`;
2. manter editor da `2E.2` em modo draft-only;
3. esconder CTAs de publicacao/ativacao no catalogo e editor;
4. preservar o contrato de leitura herdado da `2E.1`.

### 12.2. Rollback de dados

Como nao ha migracao obrigatoria em massa:

- campos opcionais novos podem permanecer sem quebrar o runtime;
- versoes publicadas por engano podem ser neutralizadas reativando a versao anterior;
- drafts invalidos permanecem editaveis e nao afetam o runtime.

### 12.3. Risco conhecido no rollback

- published versions novas podem carregar `workflowTypeSnapshot` e metadata de ativacao mesmo se o codigo de UI voltar atras;
- isso e aceitavel porque o runtime ignora esses campos.

---

## 13. Checklist de Build

- [ ] ampliar tipos compartilhados para metadata opcional de publish/activate;
- [ ] implementar helper server-side de `publishability`;
- [ ] implementar transacao atomica de `publishDraftVersion`;
- [ ] implementar transacao atomica de `activatePublishedVersion`;
- [ ] enriquecer DTOs de editor e catalogo com status derivado e readiness bloqueante;
- [ ] adicionar CTAs `Publicar` e `Ativar` na UI admin;
- [ ] cobrir contratos HTTP e regressao do runtime;
- [ ] validar fallback para published legada sem snapshot antes de expor `Ativar`.

---

## 14. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Design tecnico da 2E.3 cobrindo publicacao, ativacao, invariantes de versionamento, contratos HTTP e estrategia de testes |
