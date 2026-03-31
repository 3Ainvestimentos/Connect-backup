# DESIGN: FASE1_FACILITIES_ETAPA5

> Generated: 2026-03-30
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 5 - Infraestrutura de upload com signed URL
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA5.md`

## 1. Objetivo

Construir a infraestrutura minima de upload do piloto v2 com assinatura backend e envio direto do blob ao Storage, mantendo o backend como fonte de verdade de authz, path, nome final do objeto e URL persistivel que continuara sendo salva em `formData`.

Esta etapa cobre:

- nova rota autenticada para iniciar upload;
- validacao server-side de `workflowTypeId` e `fieldId` contra a versao publicada;
- definicao server-side do `storagePath`, `uploadId`, token de download e signed URL de escrita;
- helper cliente tipado para pedir assinatura e enviar o blob;
- testes automatizados e validacao manual por chamada direta, sem alterar a UI da Etapa 4.

Esta etapa nao cobre:

- habilitacao do workflow 2 na UX da rota `/pilot/facilities`;
- integracao visual de campo `file` em `OpenWorkflowCard` ou `DynamicFieldRenderer`;
- upload multiplo por campo;
- patch posterior do `formData`;
- limpeza automatica de uploads orfaos;
- download privado mediado por backend.

### Convivencia com producao

O build da Etapa 5 reaproveita as APIs do motor v2 e a rota autenticada do piloto, sem alterar o contrato de `POST /api/workflows/runtime/requests`, sem criar colecao nova em Firestore e sem reintroduzir `WorkflowAreasContext` ou `firestore-service.ts` nos arquivos novos do piloto.

---

## 2. Fonte de Verdade

Este documento e derivado de:

- [DEFINE_FASE1_FACILITIES_ETAPA5.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA5.md)
- [DESIGN_FASE1_FACILITIES_ETAPA4.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA4.md)
- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [ROADMAP_ETAPAS_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_ETAPAS_FASE1_FACILITIES.md)
- [src/app/api/workflows/runtime/requests/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/route.ts)
- [src/app/api/workflows/catalog/[workflowTypeId]/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/catalog/[workflowTypeId]/route.ts)
- [src/lib/workflows/runtime/auth-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/auth-helpers.ts)
- [src/lib/workflows/runtime/authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [src/lib/workflows/runtime/use-cases/resolve-published-version.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/resolve-published-version.ts)
- [src/lib/workflows/runtime/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [src/lib/workflows/catalog/published-metadata.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/catalog/published-metadata.ts)
- [src/lib/workflows/pilot/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [src/lib/workflows/pilot/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts)
- [src/lib/path-sanitizer.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/path-sanitizer.ts)
- [src/lib/firestore-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/firestore-service.ts)
- [src/lib/workflows/bootstrap/fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [src/lib/firebase-admin.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/firebase-admin.ts)
- [cors.json](/Users/lucasnogueira/Documents/3A/Connect-backup/cors.json)
- [storage.rules](/Users/lucasnogueira/Documents/3A/Connect-backup/storage.rules)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA5.md` para escopo e aceite;
2. depois prevalecem os contratos reais do runtime/catalogo ja implementados;
3. depois este documento guia a execucao do build da Etapa 5;
4. depois os roadmaps da Fase 1 servem como sequenciamento.

---

## 3. Decisoes Fechadas da Etapa 5

### 3.1. Nova superficie backend

- a nova rota sera `POST /api/workflows/runtime/uploads`;
- a rota usara o mesmo `authenticateRuntimeActor(request)` ja aplicado em catalogo e runtime write-side;
- o envelope HTTP continua canonico:
  - sucesso: `{ ok: true, data: ... }`
  - erro: `{ ok: false, code, message }`

### 3.2. Reuso das regras de autorizacao do motor

- a validacao de acesso reaproveita `resolvePublishedVersion(workflowTypeId)` e `assertCanOpen(workflowType, actorUserId)`;
- a rota de upload nao cria uma regra paralela de permissao;
- `fieldId` sera validado contra `version.fields` da versao publicada no momento da assinatura;
- a assinatura falha se o campo nao existir ou se existir com `type !== 'file'`.

### 3.3. Path server-side sem `requestId`

Como o upload acontece antes de `open-request`, o objeto nao pode depender do `requestId` sequencial.

Padrao fechado para o objeto:

```text
Workflows/Facilities e Suprimentos/workflows_v2/preopen/{workflowTypeId}/{fieldId}/{yyyy-mm}/{uploadId}-{sanitizedFileName}
```

Consequencias aceitas:

- o path nasce rastreavel por workflow, campo e periodo;
- `uploadId` e gerado no backend e vira o identificador tecnico principal do upload;
- o nome final nao e escolhido pelo frontend;
- a fase aceita risco controlado de orfao em prefixo `preopen/`.

### 3.4. URL persistivel fechada no backend

- o backend gera um token de download por arquivo e devolve `fileUrl` pronta;
- o cliente nao chama `getDownloadURL()` nem deriva URL final localmente;
- o valor salvo em `formData[fieldId]` continua sendo `string`, sem mudar o contrato de `POST /api/workflows/runtime/requests`.

### 3.5. Assinatura de escrita

- a assinatura sera de escrita direta para o bucket via signed URL `PUT`;
- o backend devolvera tambem os headers obrigatorios do upload;
- o cliente enviara exatamente o `Content-Type` aprovado e o token de download em metadata;
- o backend nao recebe o blob binario.

### 3.6. Integracao no frontend do piloto

- a camada cliente do piloto ganha helper proprio para:
  - pedir assinatura;
  - executar o `PUT` do blob;
  - devolver `fileUrl` ao chamador;
- o helper fica pronto para ser consumido pela UI na Etapa 6;
- a Etapa 5 nao altera `OpenWorkflowCard`, `DynamicFieldRenderer` nem `use-facilities-pilot`.

### 3.7. Fronteira com o legado

Continuam fora do build:

- [src/contexts/WorkflowAreasContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowAreasContext.tsx)
- [src/lib/firestore-service.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/firestore-service.ts)
- [src/components/applications/WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx)

Os arquivos novos da etapa nao podem depender da pasta legada nem da escolha client-side de `storageFolderPath`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated User
  |
  | direct API call or future UI integration
  v
pilot api-client
  |
  +--> requestPilotUpload(user, workflowTypeId, fieldId, fileName, contentType)
  |       |
  |       +--> POST /api/workflows/runtime/uploads
  |               |
  |               +--> authenticateRuntimeActor()
  |               +--> resolvePublishedVersion()
  |               +--> assertCanOpen()
  |               +--> validate field.type === "file"
  |               +--> build storagePath + uploadId + download token
  |               +--> sign PUT URL on bucket object
  |               v
  |            { uploadUrl, uploadHeaders, fileUrl, storagePath, uploadId, expiresAt }
  |
  +--> putFileToSignedUrl(uploadUrl, headers, blob)
  |
  v
returns fileUrl
  |
  +--> optional direct validation call to POST /api/workflows/runtime/requests
          |
          v
      openRequest() persists formData[fieldId] = fileUrl
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Client helper):
1. requestPilotUpload() chama a rota autenticada de assinatura
2. putFileToSignedUrl() envia o blob para a signed URL
3. uploadPilotFile() retorna fileUrl ao chamador

LAYER 2 (Backend runtime upload):
4. route.ts autentica ator e faz parse do body
5. init-file-upload.ts valida workflow/campo/metadados
6. upload-storage.ts define path, uploadId, token e assinatura

LAYER 3 (Persistence):
7. Cloud Storage recebe objeto no prefixo preopen/
8. workflows_v2 continua persistindo apenas a fileUrl no formData quando chamado pelo runtime existente
```

### 4.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| arquivo recebido pelo helper cliente | `File` passado por parametro | existe apenas durante a chamada do helper |
| upload em andamento | contexto local do helper cliente/teste manual | inicia na chamada do helper e termina antes de qualquer `open-request` |
| `fileUrl` resolvida | retorno do helper | existe so durante a composicao do payload final |
| erro de assinatura | `PilotApiError` | aborta o submit antes do upload binario |
| erro de transferencia do blob | erro tipado proprio do helper de upload | aborta o submit e preserva distincao entre assinatura e PUT |

### 4.4. Dependencias reaproveitadas

O build da Etapa 5 deve reaproveitar:

- `authenticateRuntimeActor`;
- `resolvePublishedVersion`;
- `assertCanOpen`;
- `buildStorageFilePath` e `sanitizeStoragePath` como base de seguranca de path;
- `authenticatedWorkflowFetch` como fetch autenticado do piloto;
- `cors.json` atual, que ja permite `PUT` e `x-goog-meta-firebaseStorageDownloadTokens`.

Nao deve haver:

- novo `Context` para upload;
- nova colecao/documento em Firestore;
- derivacao client-side do path final;
- fallback para `firestore-service.ts`.

---

## 5. Architecture Decision Records

### ADR-001: Signed URL de escrita + Firebase download URL pronta

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | O runtime de abertura continua JSON-only, mas o frontend precisa persistir uma URL final para campos `file` sem chamar o legado. |

**Choice:** O backend gera uma signed URL de escrita `PUT`, define um token de download e devolve `fileUrl` pronta no formato esperado pelos consumidores atuais.

**Rationale:**
1. preserva o contrato atual de `formData[fieldId] = string`;
2. evita `getDownloadURL()` no client e mantem o backend como fonte de verdade;
3. se alinha aos samples legados ja persistidos em `workflows`.

**Alternatives rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| Upload server-side via backend | adiciona trafego binario e complexidade desnecessaria para a etapa |
| Persistir `gs://` path em vez de URL final | quebraria o contrato atual de leitura do formData |
| Chamar `getDownloadURL()` no cliente depois do upload | devolve ao client a responsabilidade de derivar a URL final |

**Consequences:**

- Positivo: integracao pronta para o runtime atual e para a Etapa 6.
- Negativo: o conhecimento da `fileUrl` tokenizada permite leitura direta enquanto o token permanecer valido.

### ADR-002: Upload orquestrado no submit, nao no `onChange`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | A infraestrutura de upload precisa nascer pronta para a futura UX de campos `file`, mas a Etapa 5 ainda nao integra esse comportamento na UI. |

**Choice:** O helper cliente executa upload apenas quando chamado explicitamente pelo fluxo de abertura, e nao no momento de selecao do arquivo.

**Rationale:**
1. reduz uploads desnecessarios quando o usuario troca ou remove o arquivo antes do submit;
2. mantem a Etapa 5 independente da UI da Etapa 4;
3. permite abortar o `open-request` inteiro se a etapa de upload falhar.

**Alternatives rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| Upload imediato ao selecionar arquivo na UI | aumenta risco de orfao e forcaria mudanca de frontend fora do escopo |
| Upload em background desacoplado do fluxo de abertura | adiciona cache/state extra sem necessidade para a fase |

**Consequences:**

- Positivo: menos orfaos e menos estado distribuido.
- Negativo: o submit pode ficar mais lento quando houver arquivo grande.

### ADR-003: Prefixo `preopen/` + `uploadId` enquanto nao existe request aberto

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | O path historico com `requestId` nao pode ser usado antes do `open-request`, mas o bucket tambem nao deve ficar com identificadores opacos ou sem rastreabilidade tecnica. |

**Choice:** O path usa prefixo `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...` com `workflowTypeId`, `fieldId`, `yyyy-mm` e `uploadId`, mantendo metadata minima no objeto para correlacao operacional.

**Rationale:**
1. evita dependencia circular entre upload e criacao do request;
2. reaproveita a organizacao real do bucket por area sem depender do legado como fonte de verdade;
3. deixa a taxonomia do objeto rastreavel para hardening futuro;
4. permite cleanup posterior sem redesign do contrato do endpoint.

**Alternatives rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| Bloquear upload ate existir `requestId` | exigiria alterar o contrato do runtime para dois passos com patch posterior |
| Usar nome simples sem particionamento | piora rastreabilidade e risco de colisao |
| Incluir `requestId` no path | exigiria redesign do fluxo de abertura ou patch posterior no runtime |

**Consequences:**

- Positivo: simples de implementar e auditar.
- Negativo: existe risco de uploads orfaos ate uma fase futura de limpeza.

---

## 6. Contrato Funcional

### 6.1. Novo endpoint

- metodo:
  - `POST`
- path:
  - `/api/workflows/runtime/uploads`
- auth:
  - `Authorization: Bearer <Firebase ID token>`

### 6.2. Request body

```json
{
  "workflowTypeId": "facilities_solicitacao_suprimentos",
  "fieldId": "anexo_planilha",
  "fileName": "Controle_de_Suprimentos.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

### 6.3. Response de sucesso

```json
{
  "ok": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/...",
    "uploadMethod": "PUT",
    "uploadHeaders": {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "x-goog-meta-firebaseStorageDownloadTokens": "9b8d0d3a-...."
    },
    "fileUrl": "https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Workflows%2FFacilities%20e%20Suprimentos%2Fworkflows_v2%2Fpreopen%2Ffacilities_solicitacao_suprimentos%2Fanexo_planilha%2F2026-03%2Fupl_9b8d0d3a-Controle_de_Suprimentos.xlsx?alt=media&token=9b8d0d3a-....",
    "storagePath": "Workflows/Facilities e Suprimentos/workflows_v2/preopen/facilities_solicitacao_suprimentos/anexo_planilha/2026-03/upl_9b8d0d3a-Controle_de_Suprimentos.xlsx",
    "uploadId": "upl_9b8d0d3a",
    "expiresAt": "2026-03-30T14:10:00.000Z"
  }
}
```

Campos obrigatorios para o cliente:

- `uploadUrl`
- `fileUrl`

Campos auxiliares aceitos nesta etapa:

- `uploadMethod`
- `uploadHeaders`
- `storagePath`
- `uploadId`
- `expiresAt`

### 6.4. Response de erro

| HTTP | Code | Quando usar |
|------|------|-------------|
| 400 | `INVALID_UPLOAD_REQUEST` | body ausente, `fileName` vazio, `contentType` vazio ou metadata invalida |
| 400 | `INVALID_UPLOAD_TARGET` | `fieldId` ausente no catalogo publicado ou com `type !== 'file'` |
| 401 | `UNAUTHORIZED` | token ausente/invalido |
| 403 | `FORBIDDEN` | ator nao pode abrir o workflow |
| 404 | `PUBLISHED_VERSION_NOT_FOUND` | workflow ou versao publicada nao encontrados |
| 500 | `STORAGE_NOT_CONFIGURED` | bucket nao resolvido no ambiente |
| 500 | `UPLOAD_SIGNATURE_FAILED` | falha inesperada ao assinar a URL |

### 6.5. Contrato do upload binario

```http
PUT {uploadUrl}
Content-Type: {contentType aprovado}
x-goog-meta-firebaseStorageDownloadTokens: {token devolvido no init}

<blob binario do arquivo>
```

Esperado:

- `200` ou `201` sem envelope JSON;
- qualquer falha de `PUT` deve ser tratada pelo helper cliente como erro de transferencia;
- o cliente nao deve tentar recomputar URL final apos o `PUT`.

### 6.6. Contrato do runtime existente

Sem mudanca:

```json
{
  "workflowTypeId": "facilities_solicitacao_suprimentos",
  "requesterName": "Nome do usuario",
  "formData": {
    "nome_sobrenome": "Lucas",
    "anexo_planilha": "https://firebasestorage.googleapis.com/..."
  }
}
```

---

## 7. File Manifest

### 7.1. Pastas

```text
src/
  app/
    api/
      workflows/
        runtime/
          uploads/
            route.ts
  lib/
    workflows/
      runtime/
        errors.ts
        upload-storage.ts
        use-cases/
          init-file-upload.ts
        __tests__/
          init-file-upload.test.ts
          upload-route-contract.test.ts
      pilot/
        api-client.ts
        types.ts
        __tests__/
          api-client.test.ts
```

### 7.2. File Manifest detalhado

| # | Arquivo | Acao | Objetivo | Skill/Agente relevante |
|---|---------|------|----------|------------------------|
| 1 | `src/app/api/workflows/runtime/uploads/route.ts` | Create | Expor endpoint autenticado para iniciar uploads com envelope canonico | `build`, `@firebase-specialist` |
| 2 | `src/lib/workflows/runtime/use-cases/init-file-upload.ts` | Create | Validar workflow/campo e montar resposta de assinatura | `build`, `@firebase-specialist` |
| 3 | `src/lib/workflows/runtime/upload-storage.ts` | Create | Resolver bucket, path, token de download, signed URL e `fileUrl` final | `build`, `@firebase-specialist` |
| 4 | `src/lib/workflows/runtime/errors.ts` | Modify | Adicionar codigos de erro especificos de upload | `build`, `@firebase-specialist` |
| 5 | `src/lib/workflows/pilot/types.ts` | Modify | Declarar DTOs de init/upload e erro de transferencia | `build`, `@react-frontend-developer` |
| 6 | `src/lib/workflows/pilot/api-client.ts` | Modify | Implementar `requestPilotUpload`, `putFileToSignedUrl` e `uploadPilotFile` | `build`, `@react-frontend-developer` |
| 7 | `src/lib/workflows/runtime/__tests__/init-file-upload.test.ts` | Create | Cobrir validacoes de workflow, campo e shape do resultado | `build` |
| 8 | `src/lib/workflows/runtime/__tests__/upload-route-contract.test.ts` | Create | Cobrir contrato HTTP da rota nova e propagacao de erros | `build` |
| 9 | `src/lib/workflows/pilot/__tests__/api-client.test.ts` | Modify | Cobrir assinatura, transferencia e preservacao de erros | `build` |

### 7.3. Arquivos que NAO devem ser criados

| Arquivo | Razao |
|---------|-------|
| `src/app/(app)/pilot/facilities/suprimentos/page.tsx` | A etapa nao abre UI paralela para o workflow 2. |
| `src/contexts/PilotUploadContext.tsx` | Upload nao justifica novo contexto global. |
| `src/components/pilot/facilities/OpenWorkflowCard.tsx` | Integracao visual do campo `file` fica para a Etapa 6. |
| `src/components/pilot/facilities/DynamicFieldRenderer.tsx` | Integracao visual do campo `file` fica para a Etapa 6. |
| qualquer colecao Firestore nova | O aceite da etapa nao exige persistencia extra. |

---

## 8. Code Patterns

### 8.1. API route com auth + envelope canonico

```ts
import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import { initFileUpload } from '@/lib/workflows/runtime/use-cases/init-file-upload';

export async function POST(request: Request) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const body = await request.json();

    const data = await initFileUpload({
      actorUserId: actor.actorUserId,
      workflowTypeId: body.workflowTypeId,
      fieldId: body.fieldId,
      fileName: body.fileName,
      contentType: body.contentType,
    });

    return NextResponse.json({ ok: true, data }, { status: 200 });
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

### 8.2. Use case reaproveitando validacao do runtime

```ts
import { assertCanOpen } from '@/lib/workflows/runtime/authz';
import { resolvePublishedVersion } from '@/lib/workflows/runtime/use-cases/resolve-published-version';

export async function initFileUpload(input: InitFileUploadInput) {
  const { workflowType, version } = await resolvePublishedVersion(input.workflowTypeId);
  assertCanOpen(workflowType, input.actorUserId);

  const field = version.fields.find((entry) => entry.id === input.fieldId);
  if (!field || field.type !== 'file') {
    throw new RuntimeError('INVALID_UPLOAD_TARGET', 'Campo de upload invalido.', 400);
  }

  return createSignedWorkflowUpload({
    workflowTypeId: input.workflowTypeId,
    fieldId: input.fieldId,
    actorUserId: input.actorUserId,
    fileName: input.fileName,
    contentType: input.contentType,
  });
}
```

### 8.3. Helper cliente separado entre assinatura e PUT

```ts
export async function uploadPilotFile(
  user: User,
  input: PilotUploadFileInput,
): Promise<{ fileUrl: string }> {
  const signed = await requestPilotUpload(user, {
    workflowTypeId: input.workflowTypeId,
    fieldId: input.fieldId,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
  });

  const response = await fetch(signed.uploadUrl, {
    method: signed.uploadMethod ?? 'PUT',
    headers: signed.uploadHeaders,
    body: input.file,
  });

  if (!response.ok) {
    throw new PilotFileTransferError('UPLOAD_TRANSFER_FAILED', response.status);
  }

  return { fileUrl: signed.fileUrl };
}
```

### 8.4. `upload-storage.ts` com `uploadId`, metadata e `fileUrl`

```ts
import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { buildStorageFilePath, sanitizeStoragePath } from '@/lib/path-sanitizer';

const FACILITIES_WORKFLOW_UPLOAD_PREFIX =
  'Workflows/Facilities e Suprimentos/workflows_v2/preopen';

export async function createSignedWorkflowUpload(input: {
  workflowTypeId: string;
  fieldId: string;
  actorUserId: string;
  fileName: string;
  contentType: string;
}) {
  const uploadId = `upl_${randomUUID()}`;
  const downloadToken = randomUUID();
  const now = new Date();
  const yyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const safeFileName = sanitizeStoragePath(input.fileName).replace(/\//g, '_');

  const basePath = sanitizeStoragePath(
    `${FACILITIES_WORKFLOW_UPLOAD_PREFIX}/${input.workflowTypeId}/${input.fieldId}`,
  );
  const storagePath = buildStorageFilePath(basePath, yyyyMm, `${uploadId}-${safeFileName}`);

  const bucket = getStorage(getFirebaseAdminApp()).bucket();
  const file = bucket.file(storagePath);
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: expiresAt,
    contentType: input.contentType,
    extensionHeaders: {
      'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
      'x-goog-meta-uploadid': uploadId,
      'x-goog-meta-workflowtypeid': input.workflowTypeId,
      'x-goog-meta-fieldid': input.fieldId,
      'x-goog-meta-actoruserid': input.actorUserId,
    },
  });

  const encodedPath = encodeURIComponent(storagePath);
  const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return {
    uploadUrl,
    uploadMethod: 'PUT' as const,
    uploadHeaders: {
      'Content-Type': input.contentType,
      'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
      'x-goog-meta-uploadid': uploadId,
      'x-goog-meta-workflowtypeid': input.workflowTypeId,
      'x-goog-meta-fieldid': input.fieldId,
      'x-goog-meta-actoruserid': input.actorUserId,
    },
    uploadId,
    storagePath,
    fileUrl,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}
```

---

## 9. Database / Storage / Infra

### 9.1. Firestore

Nenhuma mudanca de schema, indice ou colecao.

### 9.2. Storage

- bucket continua sendo o mesmo projeto Firebase;
- a rota backend deve resolver o bucket explicitamente via ambiente/configuracao do Admin SDK;
- objetos novos ficam no prefixo `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...`;
- o backend deve sanitizar o nome do arquivo antes de compor o path final.

### 9.3. Regras e CORS

- `storage.rules` nao precisa mudar para o fluxo assinado;
- `cors.json` ja contempla `PUT` e `x-goog-meta-firebaseStorageDownloadTokens`;
- o build deve tratar a aplicacao do CORS no bucket como pre-condicao operacional de homologacao/producao.

### 9.4. Observabilidade minima

Adicionar logs estruturados apenas no backend:

- `workflowTypeId`
- `fieldId`
- `actorUserId`
- `storagePath`
- status da assinatura

Sem logar:

- token de download completo;
- signed URL completa;
- conteudo do arquivo.

---

## 10. Testing Strategy

### 10.1. Unit tests

| Componente | Teste |
|-----------|-------|
| `init-file-upload.ts` | aceita workflow/campo `file` valido e rejeita campo inexistente ou nao-file |
| `upload-storage.ts` | gera `uploadId`, `storagePath` sanitizado, metadata minima, token de download e `fileUrl` coerente |
| `errors.ts` | mapeia novos codigos para status corretos quando aplicavel |
| `api-client.ts` | diferencia falha de assinatura de falha do `PUT` |

### 10.2. Integration / contract tests

| Fluxo | Teste |
|------|-------|
| `POST /api/workflows/runtime/uploads` | sucesso com envelope canonico e repasse correto de `actorUserId` |
| `POST /api/workflows/runtime/uploads` | `401` sem bearer token |
| `POST /api/workflows/runtime/uploads` | `403` para ator sem permissao de abertura |
| `POST /api/workflows/runtime/uploads` | `400` para `fieldId` que nao e `file` |
| `api-client.uploadPilotFile` | faz `PUT` antes de devolver `fileUrl` ao chamador |
| `api-client.uploadPilotFile` | preserva distincao entre falha de assinatura e falha de transferencia |

### 10.3. Acceptance tests

```gherkin
GIVEN um usuario autenticado com permissao no workflow facilities_solicitacao_suprimentos
AND um arquivo real para o campo anexo_planilha
WHEN ele chama POST /api/workflows/runtime/uploads com workflowTypeId, fieldId, fileName e contentType
AND envia o blob para a signed URL recebida
THEN ele recebe uma fileUrl persistivel
AND essa URL pode ser enviada no formData do POST /api/workflows/runtime/requests sem alterar o contrato do runtime
```

```gherkin
GIVEN um usuario autenticado sem permissao de abertura
WHEN ele chama POST /api/workflows/runtime/uploads
THEN a API responde 403 FORBIDDEN
AND nenhuma signed URL e emitida
```

### 10.4. Validacao manual obrigatoria

1. subir a app com Firebase Admin configurado;
2. obter um Firebase ID token valido;
3. chamar `POST /api/workflows/runtime/uploads` para `facilities_solicitacao_suprimentos/anexo_planilha`;
4. fazer `PUT` do arquivo real na `uploadUrl`;
5. usar a `fileUrl` retornada em `POST /api/workflows/runtime/requests`;
6. confirmar que o documento salvo em `workflows_v2` contem a URL string em `formData.anexo_planilha`.

### 10.5. Pos-build operacional

Ao final do build, deve haver orientacao explicita para configurar a service account do ambiente com permissao para assinar URLs de Storage antes do smoke final em homologacao/producao.

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter a rota `src/app/api/workflows/runtime/uploads/route.ts` e os use cases/helpers de upload | `POST /api/workflows/runtime/uploads` volta a responder `404` |
| 2 | Reverter as mudancas no cliente do piloto (`api-client` e tipos relacionados) | a Etapa 4 continua intacta e sem regressao |
| 3 | Manter objetos ja enviados no bucket como lixo operacional temporario | confirmar que nao existe dependencia de dados em Firestore para esses objetos |

Metodo rapido: `git revert <commit-da-etapa-5>`

---

## 12. Implementation Checklist

### Pre-Build

- [ ] DEFINE aprovado
- [ ] bucket resolvido no ambiente backend
- [ ] padrao de path `preopen/` com `uploadId` aceito
- [ ] contrato de erro de upload fechado
- [ ] validacao do caso `facilities_solicitacao_suprimentos/anexo_planilha` mapeada

### Post-Build

- [ ] rota `POST /api/workflows/runtime/uploads` implementada
- [ ] helper cliente de upload implementado
- [ ] `upload-storage.ts` gera `uploadId`, metadata minima e `fileUrl`
- [ ] `POST /api/workflows/runtime/requests` permanece sem mudanca de contrato
- [ ] testes de unit/contract relevantes passaram
- [ ] validacao manual com arquivo real executada
- [ ] documentacao de permissao da service account registrada para o ambiente

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-30 | design-agent | Initial design for signed URL upload infrastructure in Facilities pilot Etapa 5 |
