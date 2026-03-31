# DESIGN: FASE1_FACILITIES_ETAPA3

> Generated: 2026-03-27
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 3 - Rota de metadados publicados do workflow
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA3.md`

## 1. Objetivo

Construir a camada backend que expoe a definicao publicada do workflow para o frontend do piloto, preservando o versionamento real do motor e eliminando a necessidade de hardcode de campos e `options` na UI.

Esta etapa cobre:

- rota backend autenticada para consultar metadados publicados do workflow;
- resolucao de `latestPublishedVersion` a partir de `workflowTypes_v2/{workflowTypeId}`;
- leitura de `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- mapeamento da definicao publicada para um DTO orientado a frontend;
- testes de contrato e de mapeamento do payload publicado.

Esta etapa nao cobre:

- implementacao do frontend minimo do workflow 1;
- alteracoes no write-side;
- alteracoes no schema das colecoes `_v2`;
- Firestore direto no cliente.

### Convivencia com producao

Na Etapa 3, toda leitura continua isolada nas colecoes paralelas do piloto:

- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

Nao ha escrita nova em Firestore e nao ha mudanca em indices.

---

## 2. Fonte de Verdade

Este documento e derivado de:

- [DEFINE_FASE1_FACILITIES_ETAPA3.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA3.md)
- [DESIGN_FASE1_FACILITIES_ETAPA1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md)
- [DESIGN_FASE1_FACILITIES_ETAPA2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA2.md)
- [ROADMAP_ETAPAS_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_ETAPAS_FASE1_FACILITIES.md)
- [src/lib/workflows/bootstrap/fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [src/lib/workflows/runtime/use-cases/resolve-published-version.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/resolve-published-version.ts)
- [src/lib/workflows/runtime/authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA3.md` para o escopo e os criterios de aceite;
2. depois a implementacao real da Etapa 1/2 para contratos ja materializados;
3. depois este documento para a execucao da Etapa 3;
4. depois o roadmap da fase como direcao de sequenciamento.

---

## 3. Decisoes Fechadas da Etapa 3

- o namespace novo desta etapa sera `GET /api/workflows/catalog/[workflowTypeId]`;
- a rota sera autenticada com o mesmo helper canonico das demais rotas do motor:
  - `authenticateRuntimeActor`;
- a autorizacao de leitura da definicao reutiliza a mesma regra de abertura:
  - se o ator nao pode abrir o workflow, tambem nao pode receber os metadados de abertura;
- o payload nao espelha cruamente `workflowTypes_v2` nem `versions/{version}`;
- o payload devolve somente campos uteis para renderizacao do formulario e metadados de cabecalho;
- `fields` saem ordenados por `order asc`;
- `steps` saem como lista ordenada derivada de `stepOrder`, mesmo a fonte de verdade continuando em `stepOrder + stepsById`;
- a etapa nao cria indice composto novo;
- a etapa nao altera seeds, runtime write-side ou read-side de `workflows_v2`.

### 3.1. Workflow alvo inicial

- `workflowTypeId` inicial:
  - `facilities_manutencao_solicitacoes_gerais`
- nome funcional:
  - `Manutenção / Solicitações Gerais`

### 3.2. Fechamento de autorizacao

Para esta etapa, fica fechado:

- a rota exige usuario autenticado;
- a rota so devolve payload se o ator passar na mesma semantica de `assertCanOpen`;
- para workflows futuros com `allowedUserIds` restrito, a rota ja nasce protegida sem depender de filtro no frontend;
- a rota nao devolve `allowedUserIds`, `ownerEmail` ou `ownerUserId`, porque esses campos nao sao necessarios para abrir o chamado e aumentam vazamento desnecessario de configuracao.

---

## 4. Entregas da Etapa 3

Ao final desta etapa devem existir:

- namespace `catalog` em `/api/workflows`;
- modulo server-side para montar o DTO de metadados publicados;
- contrato HTTP pronto para o frontend minimo da Etapa 4;
- testes unitarios do mapper de metadados publicados;
- testes de contrato da rota nova;
- documentacao da etapa pronta para build.

### 4.1. Diagrama arquitetural

```text
Authenticated Frontend
  |
  | GET /api/workflows/catalog/{workflowTypeId}
  v
Next.js Route Handler
  |
  +--> authenticateRuntimeActor(request)
  |       |
  |       +--> Firebase Admin verifyIdToken
  |       +--> authUid -> collaborator.id3a
  |
  v
Catalog Service
  |
  +--> resolvePublishedVersion(workflowTypeId)
  |       |
  |       +--> workflowTypes_v2/{workflowTypeId}
  |       +--> workflowTypes_v2/{workflowTypeId}/versions/{latestPublishedVersion}
  |
  +--> assertCanOpen(workflowType, actor.actorUserId)
  +--> mapPublishedWorkflowMetadata(workflowType, version)
  |
  v
Catalog DTO
  |
  +--> workflow header
  +--> ordered fields
  +--> ordered steps
```

### 4.2. Fronteira com a Etapa 1 e Etapa 2

A Etapa 1 ja entregou:

- o schema publicado de `workflowTypes_v2` e `versions/{version}`;
- a resolucao canonica de `latestPublishedVersion`;
- o bootstrap do workflow 1;
- a regra de autorizacao de abertura por `allowedUserIds`.

A Etapa 2 ja entregou:

- autenticacao unificada em `authenticateRuntimeActor`;
- envelope HTTP canonico `{ ok, data }` / `{ ok, code, message }`;
- padrao de rota `GET /api/workflows/*` com `RuntimeError`.

A Etapa 3 nao reimplementa nada disso. Ela apenas:

- reutiliza os contratos existentes;
- introduz uma superficie de leitura para definicao publicada;
- adapta a shape publicada para consumo do frontend.

---

## 5. Contrato de Metadados Publicados

### 5.1. Endpoint

- metodo:
  - `GET`
- path:
  - `/api/workflows/catalog/[workflowTypeId]`
- auth:
  - `Authorization: Bearer <Firebase ID token>`

### 5.2. Formato de sucesso

```ts
type WorkflowPublishedField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
};

type WorkflowPublishedStep = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: 'start' | 'work' | 'final';
  order: number;
};

type WorkflowPublishedMetadata = {
  workflowTypeId: string;
  workflowName: string;
  description: string;
  icon: string;
  areaId: string;
  version: number;
  publishedAt: TimestampLike | null;
  defaultSlaDays: number;
  initialStepId: string;
  initialStepName: string;
  fields: WorkflowPublishedField[];
  steps: WorkflowPublishedStep[];
};

type WorkflowCatalogSuccess = {
  ok: true;
  data: WorkflowPublishedMetadata;
};
```

### 5.3. Formato de erro

```ts
type WorkflowCatalogError = {
  ok: false;
  code: string;
  message: string;
};
```

### 5.4. Payload de referencia

```json
{
  "ok": true,
  "data": {
    "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
    "workflowName": "Manutenção / Solicitações Gerais",
    "description": "Solicitação para serviços administrativos gerais...",
    "icon": "Settings",
    "areaId": "u3entfMNB17iklBOdq5H",
    "version": 1,
    "publishedAt": "<Timestamp>",
    "defaultSlaDays": 5,
    "initialStepId": "stp_<generated>",
    "initialStepName": "Solicitação Aberta",
    "fields": [
      {
        "id": "nome_sobrenome",
        "label": "Nome e Sobrenome",
        "type": "text",
        "required": true,
        "order": 1,
        "placeholder": "Insira nome e sobrenome"
      },
      {
        "id": "impacto",
        "label": "Nível de criticidade",
        "type": "select",
        "required": true,
        "order": 3,
        "placeholder": "Insira o nível de criticidade",
        "options": ["Baixo", "Médio", "Alto", "Urgente (Crítico)"]
      }
    ],
    "steps": [
      {
        "stepId": "stp_<generated>",
        "stepName": "Solicitação Aberta",
        "statusKey": "solicitacao_aberta",
        "kind": "start",
        "order": 1
      },
      {
        "stepId": "stp_<generated>",
        "stepName": "Em andamento",
        "statusKey": "em_andamento",
        "kind": "work",
        "order": 2
      },
      {
        "stepId": "stp_<generated>",
        "stepName": "Finalizado",
        "statusKey": "finalizado",
        "kind": "final",
        "order": 3
      }
    ]
  }
}
```

### 5.5. Regras de mapeamento

- `workflowName`, `description`, `icon` e `areaId` saem de `workflowTypes_v2/{workflowTypeId}`;
- `version`, `publishedAt`, `defaultSlaDays`, `initialStepId`, `fields`, `stepOrder` e `stepsById` saem de `versions/{latestPublishedVersion}`;
- `initialStepName` e resolvido por `version.stepsById[version.initialStepId]`;
- `fields` devem ser ordenados por `order asc` antes de responder;
- `steps` devem ser montados iterando `stepOrder` e resolvendo cada item em `stepsById`;
- `steps.order` e derivado da posicao em `stepOrder`, nao de um campo adicional persistido;
- `options` so devem aparecer para campos que realmente as possuem;
- o endpoint nao deve repassar `allowedUserIds`, `ownerEmailAtPublish`, `ownerEmail`, `ownerUserId` ou `stepsById` bruto;
- o endpoint nao deve consultar `workflows_v2`.

### 5.6. Regras de erro

- `401 UNAUTHORIZED`
  - bearer ausente ou invalido;
- `400 WORKFLOW_TYPE_INACTIVE`
  - tipo existente, mas inativo para novas aberturas;
- `403 FORBIDDEN`
  - ator autenticado, mas sem permissao para abrir esse workflow;
- `404 PUBLISHED_VERSION_NOT_FOUND`
  - tipo ausente, sem `latestPublishedVersion` valida, ou subdocumento da versao nao encontrado;
- `400 VERSION_NOT_PUBLISHED`
  - `resolvePublishedVersion` encontrou uma versao apontada por `latestPublishedVersion`, mas o documento nao esta em `state = 'published'`;
- `500 INVALID_PUBLISHED_VERSION`
  - `initialStepId` ausente em `stepsById`, `stepOrder` inconsistente, ou shape publicada sem integridade suficiente para montar o DTO;
- `500 INTERNAL_ERROR`
  - falha inesperada de infraestrutura.

---

## 6. Estrutura Tecnica Recomendada

### 6.1. Pastas

```text
src/
  lib/
    workflows/
      catalog/
        types.ts
        published-metadata.ts
        __tests__/
          published-metadata.test.js
          api-contract.test.js
      runtime/
        auth-helpers.ts
        authz.ts
        use-cases/
          resolve-published-version.ts
  app/
    api/
      workflows/
        catalog/
          [workflowTypeId]/
            route.ts
```

### 6.2. File Manifest

| # | Arquivo | Acao | Objetivo | Skill/Agente relevante |
|---|---------|------|----------|------------------------|
| 1 | `src/lib/workflows/catalog/types.ts` | Create | Tipos do DTO publico de metadados publicados | `build` |
| 2 | `src/lib/workflows/catalog/published-metadata.ts` | Create | Montar o DTO a partir de `workflowType + version` | `build`, `@firebase-specialist` |
| 3 | `src/lib/workflows/catalog/__tests__/published-metadata.test.js` | Create | Cobrir ordenacao, mapeamento e validacoes do payload | `build` |
| 4 | `src/lib/workflows/catalog/__tests__/api-contract.test.js` | Create | Validar envelope HTTP, auth e erros da rota nova | `build` |
| 5 | `src/app/api/workflows/catalog/[workflowTypeId]/route.ts` | Create | Surface HTTP para consumo do frontend | `build` |
| 6 | `src/lib/workflows/runtime/errors.ts` | Modify | Introduzir `VERSION_NOT_PUBLISHED` para separar versao existente mas fora de `state=published` de inconsistencias estruturais da versao publicada | `build` |

### 6.3. Reaproveitamento obrigatorio

O build da Etapa 3 deve reaproveitar:

- `authenticateRuntimeActor` para auth;
- `resolvePublishedVersion` para leitura de `latestPublishedVersion`;
- `assertCanOpen` para a regra de acesso;
- `RuntimeError` para envelope de erro consistente.

Nao deve haver:

- novo repository para ler os mesmos documentos sem necessidade;
- consulta client-side ao Firestore;
- duplicacao do fluxo de autenticacao fora do helper existente.

---

## 7. Code Patterns

### 7.1. Service para montar metadados publicados

```ts
import { assertCanOpen } from '@/lib/workflows/runtime/authz';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { resolvePublishedVersion } from '@/lib/workflows/runtime/use-cases/resolve-published-version';

export async function getPublishedWorkflowMetadata(params: {
  workflowTypeId: string;
  actorUserId: string;
}): Promise<WorkflowPublishedMetadata> {
  const { workflowType, version } = await resolvePublishedVersion(params.workflowTypeId);
  assertCanOpen(workflowType, params.actorUserId);

  const initialStep = version.stepsById[version.initialStepId];
  if (!initialStep) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      `Versao ${version.version} do tipo "${workflowType.workflowTypeId}" sem initialStep valido.`,
      500,
    );
  }

  const steps = version.stepOrder.map((stepId, index) => {
    const step = version.stepsById[stepId];
    if (!step) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        `Versao ${version.version} do tipo "${workflowType.workflowTypeId}" com stepOrder inconsistente.`,
        500,
      );
    }

    return {
      stepId: step.stepId,
      stepName: step.stepName,
      statusKey: step.statusKey,
      kind: step.kind,
      order: index + 1,
    };
  });

  return {
    workflowTypeId: workflowType.workflowTypeId,
    workflowName: workflowType.name,
    description: workflowType.description,
    icon: workflowType.icon,
    areaId: workflowType.areaId,
    version: version.version,
    publishedAt: version.publishedAt ?? null,
    defaultSlaDays: version.defaultSlaDays,
    initialStepId: version.initialStepId,
    initialStepName: initialStep.stepName,
    fields: [...version.fields].sort((a, b) => a.order - b.order),
    steps,
  };
}
```

### 7.2. Pattern de rota

```ts
import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import { getPublishedWorkflowMetadata } from '@/lib/workflows/catalog/published-metadata';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowTypeId: string }> },
) {
  try {
    const { workflowTypeId } = await params;
    const { actor } = await authenticateRuntimeActor(request);
    const data = await getPublishedWorkflowMetadata({
      workflowTypeId,
      actorUserId: actor.actorUserId,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
```

### 7.3. Compatibilidade com a Etapa 4

O frontend minimo da Etapa 4 deve poder:

- buscar a definicao publicada por `workflowTypeId`;
- renderizar o header da abertura usando `workflowName`, `description` e `icon`;
- renderizar campos na ordem do array `fields`;
- usar `fields[].options` nos selects;
- abrir o chamado no write-side sem conhecer `workflowDefinitions` legado.

---

## 8. Testing Strategy

Deve haver cobertura para:

- resolucao de `latestPublishedVersion`;
- autorizacao alinhada com `assertCanOpen`;
- ordenacao de `fields` por `order`;
- derivacao de `initialStepName`;
- derivacao de `steps` em ordem a partir de `stepOrder`;
- rejeicao de versao publicada inconsistente;
- envelope HTTP da rota nova;
- mapeamento de `401`, `403`, `404` e `500`.

### 8.1. Casos minimos obrigatorios

- retorna metadados publicados do workflow 1 com `impacto` e `centro_custo` presentes quando publicados;
- ordena `fields` pelo `order`, mesmo se a fixture vier fora de ordem;
- converte `stepOrder + stepsById` em `steps[]` ordenado;
- falha com `400 WORKFLOW_TYPE_INACTIVE` quando o tipo existe mas esta desativado;
- falha com `403` quando `allowedUserIds` nao contem `actorUserId` nem `all`;
- falha com `404` quando `latestPublishedVersion` nao existe ou aponta para versao ausente;
- falha com `400 VERSION_NOT_PUBLISHED` quando `latestPublishedVersion` aponta para documento em estado diferente de `published`;
- falha com `500 INVALID_PUBLISHED_VERSION` quando `initialStepId` nao existe em `stepsById`;
- rota retorna envelope canonico `{ ok: true, data }` no sucesso;
- rota retorna envelope canonico `{ ok: false, code, message }` nos erros.

### 8.2. Artefatos de teste

- `published-metadata.test.js`
  - valida mapeamento, ordenacao e guardrails do DTO;
- `api-contract.test.js`
  - valida auth, authz, sucesso e erros da rota `GET /api/workflows/catalog/[workflowTypeId]`.

### 8.3. Fora do escopo de teste desta etapa

- testes do frontend de abertura;
- smoke test E2E do modal do workflow 1;
- queries sobre `workflows_v2`.

---

## 9. ADRs da Etapa 3

### ADR-ET3-001: O endpoint nasce em `catalog`, nao em `read`

O namespace `read/*` ja esta ocupado pelo read-side de instancias em `workflows_v2`. A definicao publicada e um outro tipo de leitura e deve ter fronteira propria.

### ADR-ET3-002: Ler definicao publicada exige a mesma permissao de abrir chamado

Como o objetivo do endpoint e sustentar a abertura dinamica, a regra de acesso deve ser a mesma do `open-request`, evitando que o backend publique metadados de workflows indisponiveis ao ator.

### ADR-ET3-003: O payload e adaptado para UI, nao um espelho bruto do Firestore

O backend devolve `fields[]` ordenado e `steps[]` ordenado, preservando `workflowTypes_v2` e `versions/{version}` como fonte de verdade, mas sem obrigar o frontend a conhecer `stepsById`.

### ADR-ET3-004: `stepOrder + stepsById` continuam sendo a fonte de verdade

O DTO de saida pode usar `steps[]` por ergonomia, mas nenhuma alteracao estrutural sera feita no documento publicado.

### ADR-ET3-005: Etapa 3 nao toca schema nem indices

Como a leitura e por documento identificado e subdocumento conhecido, nao ha necessidade de indice novo nem de alteracao no modelo persistido.

---

## 10. Rollback Plan

Se a Etapa 3 falhar:

1. remover ou desabilitar apenas o namespace `catalog/*`;
2. reverter apenas:
   - modulo `src/lib/workflows/catalog/*`
   - rota `src/app/api/workflows/catalog/[workflowTypeId]/route.ts`
   - testes da etapa
   - `src/lib/workflows/runtime/errors.ts`, se tiver sido alterado nesta etapa
3. manter intactos:
   - `workflowTypes_v2`
   - `versions/{version}`
   - runtime write-side
   - read-side de `workflows_v2`
4. nao alterar seeds nem colecoes legadas;
5. permitir que a Etapa 4 volte temporariamente para uma fixture local controlada apenas se isso for explicitamente decidido em novo `DEFINE`.

---

## 11. Pronto para Build

A Etapa 3 fica pronta para build quando:

- o path da rota estiver fechado;
- a regra de auth/authz estiver fechada;
- o DTO publico estiver fechado;
- o manifesto de arquivos estiver fechado;
- a estrategia de testes estiver fechada;
- nao houver dependencia adicional de interpretacao sobre `workflowType + version`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-27 | codex | Criado o design da Etapa 3 para a rota de metadados publicados do workflow, com namespace `catalog`, DTO adaptado para frontend, estrategia de authz reaproveitando `assertCanOpen` e plano de testes/rollback. |
