# DESIGN: FASE1_FACILITIES_ETAPA5_1

> Generated: 2026-03-30
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 5.1 - Promocao do helper cliente de upload para camada generica
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA5_1.md`

## 1. Objetivo

Corrigir a fronteira da camada cliente de upload criada na Etapa 5, promovendo o helper hoje acoplado ao namespace `pilot` para um modulo generico de workflows em `src/lib/workflows/upload/`, com naming neutro, tipos neutros e testes alinhados a essa nova responsabilidade.

Esta etapa cobre:

- mover a API cliente de upload para um namespace generico de workflows;
- renomear `requestPilotUpload` para `requestWorkflowFileUpload`;
- renomear `uploadPilotFile` para `uploadWorkflowFile`;
- mover os DTOs e erros de upload para a mesma camada generica;
- atualizar imports e testes para refletir o corte limpo;
- preservar exatamente o contrato e o comportamento do backend de upload entregue na Etapa 5.

Esta etapa nao cobre:

- alterar `POST /api/workflows/runtime/uploads`;
- alterar `POST /api/workflows/runtime/requests`;
- integrar upload na UI do piloto;
- promover todo o restante de `src/lib/workflows/pilot/*` para uma camada compartilhada;
- introduzir facade, reexport ou compatibilidade dupla em `pilot/*`.

### Convivencia com producao

O backend ja esta correto e permanece intacto. O objetivo da Etapa 5.1 e apenas alinhar a camada cliente para que a Etapa 6 consuma upload como capacidade generica de workflows, e nao como API estruturalmente "do piloto".

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE1_FACILITIES_ETAPA5_1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA5_1.md)
- [DEFINE_FASE1_FACILITIES_ETAPA5.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA5.md)
- [DESIGN_FASE1_FACILITIES_ETAPA5.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA5.md)
- [DEFINE_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA6.md)
- [DESIGN_FASE1_FACILITIES_ETAPA6.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA6.md)
- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts)
- [api-client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/api-client.test.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/uploads/route.ts)
- [init-file-upload.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/init-file-upload.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA5_1.md` para escopo e aceite;
2. depois prevalece o contrato real do backend de upload entregue na Etapa 5;
3. depois este documento guia o build da Etapa 5.1;
4. o `DESIGN_FASE1_FACILITIES_ETAPA6.md` deve ser lido como dependente desta correcao arquitetural, e nao como fonte superior para o namespace do helper.

---

## 3. Decisoes Fechadas da Etapa 5.1

### 3.1. Namespace alvo do helper

Fica fechado que a API cliente de upload passa a viver em:

```text
src/lib/workflows/upload/
```

Arquivos esperados nessa camada:

- `client.ts`
- `types.ts`
- `__tests__/client.test.ts`

O namespace `pilot` volta a concentrar apenas consumo especifico de catalogo, read-side, runtime e apresentacao do piloto.

### 3.2. Naming generico e coerente com o backend

Ficam fechados os nomes publicos abaixo:

| Antes | Depois |
|------|--------|
| `requestPilotUpload` | `requestWorkflowFileUpload` |
| `uploadPilotFile` | `uploadWorkflowFile` |
| `PilotUploadInitInput` | `WorkflowUploadInitInput` |
| `PilotUploadInitResult` | `WorkflowUploadInitResult` |
| `PilotUploadFileInput` | `WorkflowUploadFileInput` |
| `PilotUploadFileResult` | `WorkflowUploadFileResult` |
| `PilotFileTransferError` | `WorkflowFileTransferError` |

`putFileToSignedUrl` permanece com o mesmo nome, apenas mudando de modulo.

### 3.3. Corte limpo, sem facade

Fica fechado que a Etapa 5.1 faz migracao direta:

- sem reexport em `src/lib/workflows/pilot/*`;
- sem manter funcoes antigas como alias temporario;
- sem adapter em `pilot/api-client.ts` que apenas encaminhe para o modulo novo.

Consequencia aceita:

- qualquer consumidor existente ou futuro deve importar diretamente da camada `src/lib/workflows/upload/*`.

### 3.4. Backend nao muda

Fica fechado que a etapa nao altera:

- `src/app/api/workflows/runtime/uploads/route.ts`;
- `src/lib/workflows/runtime/use-cases/init-file-upload.ts`;
- shape de `uploadUrl`, `uploadHeaders`, `fileUrl`, `storagePath`, `uploadId`, `expiresAt`;
- semantica de authz, signed URL ou path no Storage.

### 3.5. Erros continuam separados entre assinatura e transferencia

Fica fechado que a nova camada generica preserva a mesma fronteira funcional da Etapa 5:

- falha ao pedir assinatura/auth/envelope: erro proprio da chamada HTTP de init;
- falha no `PUT` do blob: erro tipado especifico de transferencia.

Como a promocao da camada cliente inteira de workflows continua fora do escopo, a Etapa 5.1 nao precisa promover `PilotApiError` para todo o dominio. O modulo generico de upload pode declarar seu proprio erro de requisicao de upload para nao depender de `pilot/*`.

### 3.6. Compatibilidade com a Etapa 6

Fica fechado que a Etapa 6 deve consumir upload assim:

```ts
import { uploadWorkflowFile } from '@/lib/workflows/upload/client';
```

E nao mais por qualquer caminho em `src/lib/workflows/pilot/*`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated User
  |
  +--> pilot UI / future workflow UI
          |
          +--> uploadWorkflowFile(user, { workflowTypeId, fieldId, file })
                  |
                  +--> requestWorkflowFileUpload(user, payload)
                  |       |
                  |       +--> POST /api/workflows/runtime/uploads
                  |       v
                  |     WorkflowUploadInitResult
                  |
                  +--> putFileToSignedUrl(uploadUrl, uploadHeaders, file, uploadMethod)
                  v
                { fileUrl }

Other pilot APIs
  |
  +--> src/lib/workflows/pilot/api-client.ts
          |
          +--> catalog / read / runtime mutations

Backend upload flow
  |
  +--> route.ts
          +--> init-file-upload.ts
                  +--> createSignedWorkflowUpload()
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Generic upload client):
1. requestWorkflowFileUpload() autentica e chama /api/workflows/runtime/uploads
2. normalizeUploadInitResult() valida o payload de resposta
3. putFileToSignedUrl() envia o blob para a signed URL
4. uploadWorkflowFile() devolve apenas fileUrl ao chamador

LAYER 2 (Pilot client kept local):
5. pilot/api-client.ts continua responsavel por catalogo, read-side e runtime mutations
6. pilot/types.ts volta a conter apenas tipos especificos do piloto

LAYER 3 (Existing backend):
7. route.ts e init-file-upload.ts continuam iguais
8. Storage e fileUrl final permanecem inalterados
```

### 4.3. Estado e contratos preservados

| Item | Antes da Etapa 5.1 | Depois da Etapa 5.1 |
|------|--------------------|---------------------|
| endpoint de init | `/api/workflows/runtime/uploads` | igual |
| metodo de upload | `PUT` assinado | igual |
| valor retornado ao chamador | `{ fileUrl }` | igual |
| path de storage | definido no backend | igual |
| dependencia do namespace `pilot` | obrigatoria | removida |

---

## 5. Architecture Decision Records

### ADR-5.1.1: O helper sobe para `src/lib/workflows/upload/*`, nao para `pilot/*`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | O backend de upload ja nasceu generico. Manter o client helper em `pilot/*` espalharia uma fronteira errada para a Etapa 6 e para evolucoes futuras. |

**Choice:** criar um namespace dedicado `src/lib/workflows/upload/` para a capacidade cliente de upload.

**Consequences:**

- corrige a assimetria backend/client;
- permite reuso sem carregar naming do piloto;
- evita que a Etapa 6 precise combinar feature multiworkflow com refactor estrutural.

### ADR-5.1.2: Corte limpo, sem compatibilidade dupla

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | A etapa e curta e antecede imediatamente a Etapa 6. Manter API antiga e nova ao mesmo tempo so prolongaria o acoplamento. |

**Choice:** remover os helpers de upload de `pilot/api-client.ts` e atualizar os imports diretamente para o novo namespace.

**Consequences:**

- reduz ambiguidade sobre qual e a API oficial;
- simplifica a manutencao dos testes;
- exige ajuste imediato dos poucos consumidores existentes.

### ADR-5.1.3: Nao promover toda a camada HTTP do piloto nesta etapa

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-03-30 |
| Context | O roadmap indica que a promocao de `PilotApiError` para algo compartilhado e candidata natural, mas ainda nao e requisito desta correcao. |

**Choice:** a camada generica de upload encapsula sua propria semantica de erro de requisicao de assinatura, sem depender de `pilot/api-client.ts` e sem exigir a consolidacao completa de `src/lib/workflows/client/*`.

**Consequences:**

- mantem a Etapa 5.1 pequena e focada;
- elimina a dependencia estrutural de `upload/*` em `pilot/*`;
- deixa a promocao de `WorkflowApiError` como evolucao posterior, se a Fase 1 confirmar reuso mais amplo.

---

## 6. File Manifest

| Ordem | Caminho | Acao | Responsabilidade | Skill/Agente sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/types.ts) | Create | Declarar DTOs genericos de init/upload e erros do modulo | `build` |
| 2 | [client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/client.ts) | Create | Implementar `requestWorkflowFileUpload`, `putFileToSignedUrl`, `uploadWorkflowFile` e normalizacao da resposta | `build` |
| 3 | [client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/upload/__tests__/client.test.ts) | Create | Cobrir assinatura, `PUT`, distincao de erros e shape normalizado | `build` |
| 4 | [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/types.ts) | Modify | Remover tipos e erros de upload especificos do piloto | `build` |
| 5 | [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts) | Modify | Remover helpers e normalizadores de upload; manter apenas superficie especifica do piloto | `build` |
| 6 | [api-client.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/__tests__/api-client.test.ts) | Modify | Remover cobertura de upload do namespace `pilot` e preservar cobertura de catalogo/read/runtime | `build` |

### 6.1. Arquivos que NAO devem ser criados

| Arquivo | Razao |
|---------|-------|
| `src/lib/workflows/pilot/upload-client.ts` | manteria a fronteira errada do helper. |
| `src/lib/workflows/pilot/index.ts` com reexport de upload | viola a politica de corte limpo. |
| qualquer arquivo backend novo em `runtime/uploads` | backend ja esta correto e fora do escopo. |
| qualquer facade em `src/lib/workflows/client/*` para toda a API do piloto | ampliaria o escopo alem da correcao arquitetural pedida. |

---

## 7. Padroes de Implementacao

### 7.1. Tipos genericos de upload

```ts
export type WorkflowUploadInitInput = {
  workflowTypeId: string;
  fieldId: string;
  fileName: string;
  contentType: string;
};

export type WorkflowUploadInitResult = {
  uploadUrl: string;
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
  expiresAt: string;
};

export type WorkflowUploadFileInput = {
  workflowTypeId: string;
  fieldId: string;
  file: File;
};

export type WorkflowUploadFileResult = {
  fileUrl: string;
};

export class WorkflowUploadRequestError extends Error {
  code: string;
  httpStatus: number;
}

export class WorkflowFileTransferError extends Error {
  code: 'UPLOAD_TRANSFER_FAILED';
  httpStatus: number;
}
```

Regra:

- todos os nomes publicos do modulo devem ser neutros;
- nenhum tipo do modulo novo carrega prefixo `Pilot`;
- os erros ficam ao lado do helper, como parte do contrato do upload.

### 7.2. Cliente generico de upload

```ts
import type { User } from 'firebase/auth';
import {
  WorkflowFileTransferError,
  WorkflowUploadRequestError,
  type WorkflowUploadFileInput,
  type WorkflowUploadFileResult,
  type WorkflowUploadInitInput,
  type WorkflowUploadInitResult,
} from './types';

type ApiSuccess<T> = { ok: true; data: T };
type ApiError = { ok: false; code?: string; message?: string };

export async function requestWorkflowFileUpload(
  user: User,
  payload: WorkflowUploadInitInput,
): Promise<WorkflowUploadInitResult> {
  const token = await user.getIdToken();

  const response = await fetch('/api/workflows/runtime/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  let envelope: ApiSuccess<unknown> | ApiError | null = null;

  try {
    envelope = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new WorkflowUploadRequestError(
        'UNKNOWN_ERROR',
        'Falha ao consumir API de upload.',
        response.status,
      );
    }
    throw error;
  }

  if (!response.ok || !envelope || envelope.ok !== true) {
    throw new WorkflowUploadRequestError(
      envelope?.code ?? 'UNKNOWN_ERROR',
      envelope?.message ?? 'Falha ao consumir API de upload.',
      response.status,
    );
  }

  return normalizeUploadInitResult(envelope.data);
}

export async function putFileToSignedUrl(
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  file: Blob,
  uploadMethod: WorkflowUploadInitResult['uploadMethod'] = 'PUT',
) {
  const response = await fetch(uploadUrl, {
    method: uploadMethod,
    headers: uploadHeaders,
    body: file,
  });

  if (!response.ok) {
    throw new WorkflowFileTransferError('UPLOAD_TRANSFER_FAILED', response.status);
  }
}

export async function uploadWorkflowFile(
  user: User,
  input: WorkflowUploadFileInput,
): Promise<WorkflowUploadFileResult> {
  const signed = await requestWorkflowFileUpload(user, {
    workflowTypeId: input.workflowTypeId,
    fieldId: input.fieldId,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
  });

  await putFileToSignedUrl(signed.uploadUrl, signed.uploadHeaders, input.file, signed.uploadMethod);
  return { fileUrl: signed.fileUrl };
}
```

Regra:

- o modulo novo nao importa nada de `src/lib/workflows/pilot/*`;
- a semantica da rota canonica de upload continua igual;
- a API publica do modulo e pequena e pronta para ser usada pela Etapa 6.

### 7.3. Limpeza do `pilot/api-client.ts`

```ts
export async function getPilotCatalog(user: User, workflowTypeId: string) {
  // permanece igual
}

export async function openPilotRequest(user: User, payload: OpenPilotRequestInput) {
  // permanece igual
}

// helpers de upload deixam de existir neste arquivo
```

Regra:

- `PilotApiError` pode permanecer local ao cliente do piloto;
- `authenticatedWorkflowFetch()` continua servindo catalogo, read-side e runtime mutations do piloto;
- o arquivo deixa de conhecer DTOs e erros de upload.

### 7.4. Testes separados por fronteira correta

```ts
// src/lib/workflows/upload/__tests__/client.test.ts
describe('workflow upload client', () => {
  it('normalizes the signed upload init payload', async () => {});
  it('uploads the blob before returning fileUrl', async () => {});
  it('preserves request failures as WorkflowUploadRequestError', async () => {});
  it('raises WorkflowFileTransferError when PUT fails', async () => {});
});

// src/lib/workflows/pilot/__tests__/api-client.test.ts
describe('workflow pilot api client', () => {
  it('returns normalized catalog data from the canonical envelope', async () => {});
  it('preserves backend code and http status in typed errors', async () => {});
});
```

Regra:

- upload passa a ser testado no modulo onde de fato vive;
- o teste do piloto deixa de afirmar comportamento de upload que nao e mais responsabilidade dele.

---

## 8. API / Contract Impact

### 8.1. Backend

Nenhum impacto de contrato.

Permanece consumido exatamente o endpoint:

- `POST /api/workflows/runtime/uploads`

### 8.2. Frontend

Mudanca de contrato apenas de import publico.

Antes:

```ts
import { uploadPilotFile } from '@/lib/workflows/pilot/api-client';
```

Depois:

```ts
import { uploadWorkflowFile } from '@/lib/workflows/upload/client';
```

### 8.3. Contrato funcional preservado

O helper generico continua:

- pedindo assinatura com `workflowTypeId`, `fieldId`, `fileName`, `contentType`;
- fazendo `PUT` do blob com `uploadHeaders` devolvidos pelo backend;
- retornando `{ fileUrl }` para o chamador;
- distinguindo falha de assinatura de falha de transferencia.

---

## 9. Estrategia de Build

### 9.1. Sequencia recomendada

1. criar `src/lib/workflows/upload/types.ts`;
2. criar `src/lib/workflows/upload/client.ts` reaproveitando a semantica atual do helper;
3. mover a cobertura de upload para `src/lib/workflows/upload/__tests__/client.test.ts`;
4. remover DTOs e helpers de upload de `pilot/types.ts` e `pilot/api-client.ts`;
5. ajustar imports quebrados para o novo namespace;
6. validar que nenhum comportamento do backend mudou;
7. registrar a Etapa 5.1 como pre-condicao estrutural da Etapa 6.

### 9.2. Invariantes do build

- nenhum arquivo backend de upload e alterado;
- nenhum import de `upload/*` aponta para `pilot/*`;
- nenhum alias legado de upload permanece em `pilot/api-client.ts`;
- `putFileToSignedUrl` continua com nome generico;
- o contrato do `fileUrl` final permanece igual ao da Etapa 5.

---

## 10. Testing Strategy

### 10.1. Unitario

| Componente | Teste |
|-----------|-------|
| `src/lib/workflows/upload/client.ts` | normaliza payload de assinatura com envelope canonico |
| `src/lib/workflows/upload/client.ts` | faz `PUT` antes de devolver `fileUrl` |
| `src/lib/workflows/upload/client.ts` | transforma erro HTTP/envelope em `WorkflowUploadRequestError` |
| `src/lib/workflows/upload/client.ts` | transforma falha no `PUT` em `WorkflowFileTransferError` |
| `src/lib/workflows/pilot/api-client.ts` | continua cobrindo catalogo/read/runtime sem helpers de upload |

### 10.2. Contract / regression

| Fluxo | Teste |
|------|-------|
| `POST /api/workflows/runtime/uploads` | suite existente continua verde sem qualquer ajuste funcional |
| `uploadWorkflowFile` | reproduz o mesmo handshake da Etapa 5 contra a rota existente |
| imports do piloto | compilam sem depender dos tipos `PilotUpload*` |

### 10.3. Acceptance tests

```gherkin
GIVEN o backend de upload da Etapa 5 ja esta publicado
WHEN um consumidor chama uploadWorkflowFile() com workflowTypeId, fieldId e File
THEN o helper chama POST /api/workflows/runtime/uploads
AND faz PUT do blob na signed URL recebida
AND devolve a mesma fileUrl persistivel esperada pela Etapa 5
```

```gherkin
GIVEN uma falha 403 na chamada de assinatura
WHEN requestWorkflowFileUpload() e executado
THEN o modulo rejeita com erro tipado de requisicao
AND nenhum PUT para o Storage e tentado
```

### 10.4. Validacao manual obrigatoria

1. rodar os testes unitarios do cliente de upload e os testes existentes do backend de upload;
2. executar um smoke equivalente ao da Etapa 5 usando o helper novo;
3. confirmar que a `fileUrl` final e identica em semantica a do helper anterior;
4. confirmar que nenhum import residual de `requestPilotUpload` ou `uploadPilotFile` permanece no repositorio.

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o commit da Etapa 5.1 que cria `src/lib/workflows/upload/*` e limpa `pilot/*` | `requestPilotUpload` e `uploadPilotFile` voltam a existir apenas no modulo antigo |
| 2 | Revalidar a suite de upload da Etapa 5 no namespace anterior | os testes antigos de upload voltam a passar em `pilot/__tests__/api-client.test.ts` |
| 3 | Adiar a Etapa 6 ate existir novo design de promocao | evita que multiworkflow nasca sobre helper novamente acoplado ao piloto |

Metodo rapido: `git revert <commit-da-etapa-5_1>`

---

## 12. Implementation Checklist

### Pre-Build

- [ ] DEFINE da Etapa 5.1 aprovado
- [ ] contrato da rota `/api/workflows/runtime/uploads` confirmado como estavel
- [ ] namespace alvo `src/lib/workflows/upload/` fechado
- [ ] politica de corte limpo sem facade aceita

### Post-Build

- [ ] `src/lib/workflows/upload/client.ts` criado
- [ ] `src/lib/workflows/upload/types.ts` criado
- [ ] testes de upload movidos para o namespace generico
- [ ] `pilot/api-client.ts` sem `requestPilotUpload` e `uploadPilotFile`
- [ ] `pilot/types.ts` sem `PilotUpload*` e `PilotFileTransferError`
- [ ] nenhum backend de upload alterado
- [ ] nenhum import residual para helpers antigos permanece

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-30 | design-agent | Initial design for Etapa 5.1, promoting the signed upload client helper from `pilot/*` to `src/lib/workflows/upload/*` |
