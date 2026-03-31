# DESIGN: CORRECAO_IDENTIDADE_USUARIO_FASE1_FACILITIES

> Generated: 2026-03-25
> Status: Ready for build
> Scope: Correcao de identidade de usuario no runtime v2 da Etapa 1
> Base documents: `DESIGN_FASE1_FACILITIES_ETAPA1.md`, `DEFINE_FASE1_FACILITIES_ETAPA0.md`

## 1. Objetivo

Corrigir o modelo de identidade do runtime v2 para que a Fase 1:

- autentique usuarios via Firebase Auth (`authUid`);
- opere o motor com identidade operacional da aplicacao (`id3a`);
- alinhe `allowedUserIds`, owner, requester e responsible ao mesmo identificador;
- elimine o risco de `FORBIDDEN` incorreto nos workflows de Facilities;
- mantenha o isolamento em colecoes `_v2`.

Este documento nao redesenha a Etapa 1 inteira. Ele corrige apenas o eixo de identidade de usuario do que ja foi implementado.

---

## 2. Problema

O bloco novo do runtime v2 hoje mistura dois identificadores diferentes:

- `decodedToken.uid` do Firebase Auth
- `id3a` da colecao `collaborators`

O produto atual autentica com Firebase, mas usa `id3a` como identidade operacional em grande parte das regras de negocio.

Consequencias do estado atual:

- `assertCanOpen` compara `decodedToken.uid` com `allowedUserIds`;
- os `allowedUserIds` do piloto sao codigos como `BCS2`, `DLE`, `SMO2`;
- owner/responsible ficam comparando IDs de naturezas diferentes;
- o seed valida owner por `authUid`, enquanto o runtime deveria operar com identidade de negocio.

---

## 3. Decisao Canonica

### 3.1. Regra principal

Para o motor v2 da Fase 1:

- autenticacao = `authUid`
- identidade operacional do runtime = `id3a`

### 3.2. Owner do piloto

Dados fechados:

- owner email: `stefania.otoni@3ainvestimentos.com.br`
- owner operacional (`ownerUserId` do runtime): `SMO2`

### 3.3. Campo operacional canonico do runtime

Os campos abaixo devem usar `id3a`, nao `authUid`:

- `workflowTypes_v2.ownerUserId`
- `workflows_v2.requesterUserId`
- `workflows_v2.ownerUserId`
- `workflows_v2.responsibleUserId`
- comparacoes em `allowedUserIds`
- comparacoes de authz (`assign`, `finalize`, `archive`, `advance`)
- `operationalParticipantIds`

### 3.4. Papel do `authUid`

`authUid` continua existindo apenas para:

- autenticar o usuario na rota
- resolver o colaborador correspondente em `collaborators`

Depois da resolucao do colaborador, o runtime nao deve mais operar com `authUid`.

---

## 4. Arquitetura Corrigida

```text
Client
  |
  | Authorization: Bearer <idToken>
  v
Route Handler
  |
  +--> Firebase Admin verifyIdToken()
  |       -> authUid
  |
  +--> resolveRuntimeActor()
  |       collaborators where authUid == decodedToken.uid
  |       -> collaborator.id3a
  |
  v
Runtime Use Case
  |
  +--> authz compares id3a
  +--> allowedUserIds compares id3a
  +--> ownerUserId/responsibleUserId/requesterUserId persist id3a
  v
Firestore (_v2)
  |- workflowTypes_v2
  |- workflowTypes_v2/{workflowTypeId}/versions/{version}
  |- workflows_v2
```

---

## 5. Regras Operacionais

### 5.1. Resolucao do ator autenticado

Cada rota write-side deve:

1. validar o Bearer token;
2. obter `decodedToken.uid`;
3. consultar `collaborators`;
4. localizar exatamente um colaborador com `authUid == decodedToken.uid`;
5. usar `collaborator.id3a` como `actorUserId` / `requesterUserId`;
6. opcionalmente usar `collaborator.name` e `collaborator.email` como fallback de metadata.

### 5.2. Falha de resolucao

Se nao existir colaborador correspondente ao `authUid`, a rota deve falhar com:

- `FORBIDDEN` ou `UNAUTHORIZED`, conforme o padrao ja adotado no runtime

Sem fallback silencioso para `decodedToken.uid`.

### 5.3. Allowed users

`allowedUserIds` do piloto devem ser tratados como IDs operacionais da aplicacao.

Logo:

- `assertCanOpen` deve comparar com `id3a`
- nao com `decodedToken.uid`

### 5.4. Owner do tipo

`workflowTypes_v2.ownerUserId` deve persistir `SMO2`.

O seed nao deve validar esse valor contra `authUid`.
Ele deve validar contra a identidade operacional correta do colaborador.

---

## 6. ADRs

### ADR-ID-001: Runtime v2 autentica com Firebase e opera com `id3a`

**Decisao**

O runtime v2 usa `authUid` apenas como credencial de autenticacao e converte imediatamente para `id3a` antes de qualquer regra de negocio.

**Motivo**

O restante da aplicacao ja opera majoritariamente com `id3a` nas regras operacionais e os `allowedUserIds` do piloto seguem esse mesmo padrao.

### ADR-ID-002: `ownerUserId` do piloto deixa de usar `authUid`

**Decisao**

O owner do piloto passa a ser persistido como `SMO2` em `workflowTypes_v2.ownerUserId`.

**Motivo**

Owner, requester e responsible precisam usar a mesma familia de identificadores no runtime.

### ADR-ID-003: As rotas resolvem o colaborador antes de chamar os use cases

**Decisao**

As rotas write-side deixam de repassar `decodedToken.uid` diretamente aos use cases.

**Motivo**

Isso preserva os use cases simples e garante que toda regra de negocio receba apenas identidade operacional.

---

## 7. Arquivos Afetados

### 7.1. Runtime / rotas

- `src/app/api/workflows/runtime/requests/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/assign/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/advance/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/archive/route.ts`

### 7.2. Novo helper recomendado

- `src/lib/workflows/runtime/actor-resolution.ts`

Responsabilidade:

- receber `decodedToken`
- resolver o colaborador em `collaborators`
- devolver:
  - `actorUserId: collaborator.id3a`
  - `actorName`
  - `actorEmail`
  - `collaboratorDocId`, se util para debug

### 7.3. Authz / use cases / tipos

- `src/lib/workflows/runtime/authz.ts`
- `src/lib/workflows/runtime/use-cases/open-request.ts`
- `src/lib/workflows/runtime/use-cases/assign-responsible.ts`
- `src/lib/workflows/runtime/use-cases/advance-step.ts`
- `src/lib/workflows/runtime/use-cases/finalize-request.ts`
- `src/lib/workflows/runtime/use-cases/archive-request.ts`
- `src/lib/workflows/runtime/types.ts`

### 7.4. Bootstrap / seed

- `src/lib/workflows/bootstrap/fase1-facilities-v1.ts`
- `src/scripts/seed-fase1-facilities-v1.ts`

### 7.5. Testes

- `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`
- `src/lib/workflows/runtime/__tests__/input-normalization.test.js`
- novo teste recomendado para actor resolution

---

## 8. Contrato Tecnico Recomendado

### 8.1. Helper de resolucao do ator

```ts
type RuntimeActor = {
  actorUserId: string; // collaborator.id3a
  actorName: string;
  actorEmail: string;
};

async function resolveRuntimeActor(decodedToken: DecodedIdToken): Promise<RuntimeActor>
```

### 8.2. Fonte de dados

Consulta em `collaborators`:

- filtro principal: `authUid == decodedToken.uid`
- validacao secundaria opcional: e-mail

### 8.3. Comportamento

- 0 resultados -> erro
- mais de 1 resultado -> erro
- 1 resultado sem `id3a` -> erro

Sem fallback automatico para `decodedToken.uid`.

---

## 9. Mudancas por Camada

### 9.1. Rotas

Antes:

- `actorUserId = decodedToken.uid`

Depois:

- `const actor = await resolveRuntimeActor(decodedToken)`
- `actorUserId = actor.actorUserId`

### 9.2. Open request

Antes:

- `requesterUserId = decodedToken.uid`

Depois:

- `requesterUserId = collaborator.id3a`

### 9.3. Authz

Nenhuma regra de negocio muda.
O que muda e a garantia de que todos os lados da comparacao usam `id3a`.

### 9.4. Seed

Antes:

- valida owner contra `authUid`

Depois:

- valida owner contra `id3a == SMO2`

---

## 10. Impacto no Modelo de Dados

### 10.1. `workflowTypes_v2`

`ownerUserId` do piloto deve ser:

- `SMO2`

### 10.2. `workflows_v2`

Os campos abaixo continuam existindo, mas devem carregar `id3a`:

- `ownerUserId`
- `requesterUserId`
- `responsibleUserId`
- `operationalParticipantIds`

### 10.3. Sem migracao estrutural adicional

Essa correcao nao exige nova colecao e nao altera o schema conceitual.
Ela corrige apenas o identificador persistido e comparado.

---

## 11. Testing Strategy

### 11.1. Unitarios

Cobrir:

- resolucao de colaborador por `authUid`
- erro quando nao houver colaborador
- erro quando `id3a` estiver ausente
- `assertCanOpen` funcionando com `allowedUserIds` em `id3a`

### 11.2. Integracao

Cobrir:

1. rota `open-request`
   - token valido
   - colaborador encontrado
   - `requesterUserId = id3a`

2. rota `assign`
   - owner autenticado por `authUid`
   - owner operacional reconhecido por `id3a`

3. seed
   - owner e validado por `id3a == SMO2`

### 11.3. Regressao funcional

Casos criticos:

- usuario permitido em `allowedUserIds` consegue abrir `Suprimentos`
- usuario permitido em `allowedUserIds` consegue abrir `Compras`
- owner do piloto consegue atribuir
- owner/responsible conseguem finalizar conforme design

---

## 12. Rollback Plan

Se a correcao falhar:

1. manter runtime v2 desligado por feature flag;
2. nao executar seed em producao ate validar o modelo de identidade;
3. restaurar a branch/working tree anterior apenas se necessario;
4. preservar os documentos `_v2` ja gravados para analise;
5. nao tocar no legado.

---

## 13. Build Direction

A ordem recomendada de implementacao desta correcao e:

1. criar `actor-resolution.ts`
2. adaptar as 5 rotas write-side
3. trocar `ownerUserId` do seed para `SMO2`
4. validar o seed contra `id3a`
5. revisar testes
6. executar smoke validation do builder e do seed dry-run

---

## 14. Resultado Esperado

Ao final desta correcao:

- o runtime continua autenticando com Firebase;
- todo o motor v2 opera com `id3a`;
- `allowedUserIds` passa a funcionar de acordo com o piloto;
- owner/requester/responsible ficam no mesmo padrao de identidade;
- o seed do piloto publica `ownerUserId = SMO2`;
- o bloco da Etapa 1 fica coerente com a identidade operacional do restante da aplicacao.

