# DESIGN: CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL

> Generated: 2026-04-13
> Status: Ready for /build
> Source: DEFINE_CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL.md
> Scope: Mudança cirúrgica em um único módulo (`src/lib/firebase-admin.ts`)

## 1. Requirements Summary

### Problem
O bootstrap atual do Firebase Admin SDK em `src/lib/firebase-admin.ts` depende de um arquivo físico apontado por `GOOGLE_APPLICATION_CREDENTIALS`, o que é incompatível com o filesystem efêmero/inexistente da Vercel e quebra as rotas server-side v2 de workflows em produção.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Rotas v2 estáveis em produção (Vercel) | 0 falhas 500 por erro de bootstrap do Admin SDK |
| Paridade local/produção | Mesmo mecanismo (`FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`) em ambos |
| Falha rápida e orientada em misconfig | Mensagem clara em <1s do cold start |
| Superfície de manutenção reduzida | 1 único caminho de bootstrap; zero referências a `GOOGLE_APPLICATION_CREDENTIALS` no runtime do Next.js |
| Feature v2 destravada no piloto | Smoke test OK em `/api/workflows/requester/catalog`, `/api/workflows/read/mine` e rotas de admin-config v2 |

### Constraints
- Mudança 100% server-side, localizada em `src/lib/firebase-admin.ts`.
- Não alterar semântica do singleton nem assinatura pública `getFirebaseAdminApp(): App`.
- Não alterar Cloud Functions (`functions/src/*`) nem scripts Python em `src/scripts/*`.
- Não logar o JSON da service account nem a `private_key`.
- Brainstorm decidiu por Abordagem A (sem fallback híbrido); não reintroduzir `GOOGLE_APPLICATION_CREDENTIALS` como caminho alternativo dentro do módulo.
- Segredo `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` nunca pode ser commitado; `.env.local` deve continuar no `.gitignore`.

## 2. Architecture

### System Diagram

```text
                         +-----------------------------------+
                         |          Vercel Runtime           |
                         |  (Next.js 15 server components +  |
                         |   API route handlers - serverless)|
                         +-----------------+-----------------+
                                           |
                                           | import { getFirebaseAdminApp }
                                           v
                    +-------------------------------------------+
                    |        src/lib/firebase-admin.ts          |
                    |                                           |
                    |   [1] read process.env                    |
                    |       FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON |
                    |   [2] JSON.parse                          |
                    |   [3] normalize private_key (\n escaped)  |
                    |   [4] validate required fields            |
                    |   [5] initializeApp({credential.cert})    |
                    |   [6] cache via getApps()/getApp() singleton
                    +---------------------+---------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                |                                |
         v                                v                                v
+------------------+        +--------------------------+        +-------------------+
| permission-auth  |        |  admin-config/* (catalog,|        |  read/queries.ts  |
| (verify ID token)|        |  draft-repo, publication)|        |  (list mine, etc) |
+------------------+        +--------------------------+        +-------------------+
         |                                |                                |
         +--------------------------------+--------------------------------+
                                          |
                                          v
                              +-------------------------+
                              | Firebase (Firestore,    |
                              | Auth, Storage)          |
                              +-------------------------+
```

### Data Flow

```text
LAYER 1 (API Route - serverless function entrypoint):
1. src/app/api/workflows/requester/catalog/route.ts (ou outra rota v2): handler GET
2. handler chama getFirebaseAdminApp() em src/lib/firebase-admin.ts

LAYER 2 (Admin SDK bootstrap - COLD START PATH):
3. firebase-admin.ts:
   a. Se getApps().length > 0 -> retorna getApp() (singleton warm)
   b. Senão:
      - lê process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON (string)
      - valida presença -> se faltar, lança Error com mensagem orientada
      - JSON.parse -> se falhar, lança Error "JSON inválido"
      - parseServiceAccount(raw): valida project_id, client_email, private_key
      - normalizePrivateKey: converte `\n` literais em quebras de linha reais
      - initializeApp({ credential: credential.cert(serviceAccount) })
      - console.info com project_id e client_email mascarado (sem private_key)

LAYER 3 (Admin SDK uso - mesmo fluxo já existente):
4. getAuth(app).verifyIdToken(...) em permission-auth.ts
5. getFirestore(app).collection(...) em admin-config/catalog.ts, etc.

LAYER 4 (Backend Firebase):
6. Firestore / Auth respondem conforme IAM da service account
7. firestore.rules aplica-se apenas a client SDK; Admin bypassa (comportamento inalterado)
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------|
| `App` singleton do Admin SDK | Memória do processo (global via `getApps()`/`getApp()`) | Criado no primeiro `getFirebaseAdminApp()` dentro da função serverless. Vive enquanto a instância lambda estiver quente. Descartado no cold start seguinte. |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` | Env var (Vercel secret / `.env.local`) | Lida UMA ÚNICA VEZ por cold start. Nunca persistida em memória fora do objeto `credential.cert`. |

## 3. Architecture Decisions

### ADR-001: Credencial por env var JSON (Abordagem A) em vez de file path

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-13 |
| **Context** | Vercel serverless não possui filesystem persistente para apontar um arquivo `service-account.json` via `GOOGLE_APPLICATION_CREDENTIALS`. Hoje o bootstrap quebra em produção e as rotas v2 de workflows retornam 500. Precisamos de um mecanismo único, portável entre local e Vercel. |

**Choice:** Usar uma única env var `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` contendo o JSON completo da service account, lida por `src/lib/firebase-admin.ts`, parseada e passada para `credential.cert(...)`. Mesma variável em `.env.local` e na Vercel (Production + Preview).

**Rationale:**
1. Mecanismo único em todos os ambientes — elimina drift entre local e produção (goal M2).
2. Compatível com o modelo de secrets da Vercel (env var, não filesystem) — destrava o piloto v2 (goal M5).
3. Mudança cirúrgica e localizada em um único módulo técnico — menor risco de regressão.
4. Mantém a integridade atômica do JSON (assinado pelo Google) — menos superfície para erro humano que quebraria private_key em várias envs.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| (B) Híbrido: tenta JSON, fallback para `GOOGLE_APPLICATION_CREDENTIALS` | Mantém dois caminhos concorrentes no módulo, aumenta superfície de manutenção e não resolve o drift local/produção que o M2 exige. Brainstorm §4 e DEFINE W1 rejeitaram. |
| (C) Variáveis separadas por campo (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_PRIVATE_KEY`, etc.) | Mais superfície de erro humano (especialmente com `private_key` multilinha), sem ganho real. YAGNI. Brainstorm §4 e DEFINE W2. |
| Secret Manager / Doppler / cofre externo | Nova infraestrutura fora do escopo; Vercel env + `.env.local` são suficientes. DEFINE W4. |
| Manter `GOOGLE_APPLICATION_CREDENTIALS` e fazer Vercel montar arquivo em /tmp via build script | Gera gambiarra, depende de build hook e filesystem lambda, mantém dependência de arquivo. Brainstorm recomendou "solução definitiva, não temporária". |

**Consequences:**
- Positivo: paridade local/produção absoluta; um único caminho de bootstrap; destrava piloto v2.
- Positivo: erro de misconfig falha rápido, antes de qualquer consulta de dados.
- Negativo: envs longas (~2KB) no painel da Vercel — aceitável, bem abaixo do limite.
- Negativo: `private_key` tem `\n` que precisa de normalização (mitigado por helper dedicado e testes unitários).
- Negativo: script `scripts/dev-with-firebase-admin.sh` continua usando `GOOGLE_APPLICATION_CREDENTIALS` e vira um caminho legado não utilizado pelo runtime Next.js. Decisão: NÃO remover o script nesta iteração (fora do escopo — segue usado por fluxos Python/scripts operacionais); documentar como legacy em comentário no módulo.

---

### ADR-002: Singleton cacheado via `getApps()`/`getApp()` com parse idempotente

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-13 |
| **Context** | Em ambiente serverless da Vercel, cada cold start cria uma nova instância do processo Node, mas dentro de uma instância "quente" múltiplas invocações podem chamar `getFirebaseAdminApp()` em rápida sucessão. O Firebase Admin SDK lança erro se `initializeApp()` for chamado mais de uma vez com o mesmo nome de app. Precisamos garantir idempotência. |

**Choice:** Manter o padrão singleton atual baseado em `getApps().length > 0 ? getApp() : initializeApp(...)`, mas encapsular toda a lógica de parsing/validação de credencial em um helper puro que só é executado no primeiro boot. Caching do objeto `App` é delegado ao próprio SDK (global do módulo `firebase-admin/app`).

**Rationale:**
1. Padrão oficial recomendado pelo Firebase Admin SDK — evita reinventar cache.
2. `getApps()` é global ao processo Node, sobrevivendo entre invocações dentro da mesma instância lambda, que é exatamente o ganho de performance desejado.
3. Parse/validação de JSON só acontece no cold start (1x por instância), mantendo custo amortizado próximo de zero.
4. Zero mudança na assinatura pública — callers existentes (`permission-auth.ts`, `admin-config/*`, rotas v2) não mudam.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Cache manual em variável de módulo (`let cachedApp: App | null`) | Redundante com `getApps()` do SDK e adiciona estado paralelo que pode divergir em edge cases. |
| Inicializar no topo do módulo (import-time side effect) | Mata testabilidade e faz o boot falhar no import, antes mesmo do handler da rota capturar o erro. Perde a capacidade de falhar com contexto de request. |
| Múltiplos apps nomeados (`initializeApp(config, "admin")`) | Não há requisito de múltiplos apps; complicaria os callers que hoje usam `getApp()` sem nome. |
| `globalThis` cache custom | Mesmo ganho que `getApps()` do SDK, porém não idiomático. |

**Consequences:**
- Positivo: idempotente em invocações concorrentes dentro de uma mesma instância lambda.
- Positivo: mantém compatibilidade 100% com callers existentes (assinatura pública inalterada).
- Positivo: erro de bootstrap acontece lazy (no primeiro `getFirebaseAdminApp()`), permitindo que o handler do route capture e retorne 500 com contexto.
- Negativo: cold start paga o custo de `JSON.parse` + validação (~1-5ms) — trivial.
- Ressalva: em caso de race condition teórica entre duas chamadas simultâneas no mesmíssimo tick, ambas poderiam chamar `initializeApp`. Mitigação: Node.js é single-threaded por natureza, e `getFirebaseAdminApp` é síncrono até o `initializeApp`, então não há janela real de race dentro de um único event loop tick. Documentado como "comportamento esperado" no JSDoc do módulo.

---

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Backend (library único) | `src/lib/firebase-admin.ts` | @firebase-specialist |
| 2. Infra / Docs (não-código) | `.env.local` (dev), Vercel env vars (Production + Preview) | Operador (manual, fora do manifest de código) |

### Detailed Manifest
| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/firebase-admin.ts` | Modify | Substituir bootstrap por leitura de `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` + parse + validate + `credential.cert`; manter singleton; exportar helper puro `parseServiceAccount` (testável). | @firebase-specialist | - |

### Files intentionally NOT changed
| File | Why |
|------|-----|
| `src/lib/workflows/runtime/permission-auth.ts` | Consome `getFirebaseAdminApp()` — assinatura inalterada, zero mudança necessária. |
| `src/lib/workflows/admin-config/*` | Idem. |
| `src/app/api/workflows/**` | Idem. |
| `src/app/api/billing/route.ts` | Idem. |
| `functions/src/*` (Cloud Functions) | Rodam em ambiente Google Cloud, não Vercel — usam Application Default Credentials automaticamente. Fora do escopo. |
| `src/scripts/*.py` | Scripts operacionais Python — continuam usando `GOOGLE_APPLICATION_CREDENTIALS` localmente. Fora do escopo (DEFINE §7). |
| `scripts/dev-with-firebase-admin.sh` | Legacy helper baseado em `GOOGLE_APPLICATION_CREDENTIALS`. Não deve guiar a implementação principal desta feature, porque o objetivo final local passa a ser `npm run dev` com `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` em `.env.local`. O script pode permanecer intacto nesta iteração por YAGNI, desde que o runtime do Next.js não dependa mais dele. |
| `.claude/kb/firebase-nextjs/*` | Documentação de KB — pode ser atualizada em iteração separada se necessário; não é gate desta feature. |

## 5. Code Patterns

### Pattern 1: Bootstrap seguro do Firebase Admin via env JSON

Implementação completa copy-paste ready do novo `src/lib/firebase-admin.ts`:

```typescript
/**
 * Firebase Admin SDK bootstrap.
 *
 * Lê a service account a partir de uma env var única contendo o JSON completo:
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
 *
 * Esse padrão é o mesmo em ambiente local (`.env.local`) e em Vercel
 * (Production + Preview), garantindo paridade absoluta e eliminando a
 * dependência de `GOOGLE_APPLICATION_CREDENTIALS` (file path) que não
 * funciona no filesystem efêmero de funções serverless.
 *
 * Singleton:
 * - Reutiliza o app do Admin SDK via `getApps()`/`getApp()`, de modo que
 *   múltiplas invocações dentro de uma mesma instância "quente" do lambda
 *   paguem o custo de parse/validate apenas no cold start.
 *
 * Falha rápido:
 * - Env ausente, JSON inválido ou campos obrigatórios faltando disparam
 *   Error com mensagem orientada ao desenvolvedor, antes de qualquer
 *   consulta a Firestore/Auth.
 */

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';

const ENV_VAR_NAME = 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON';

const REQUIRED_FIELDS = ['project_id', 'client_email', 'private_key'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

export interface ServiceAccountShape {
  project_id: string;
  client_email: string;
  private_key: string;
  // Campos opcionais do JSON oficial do Google (type, private_key_id, client_id,
  // auth_uri, token_uri, etc.) são preservados mas não validados explicitamente.
  [key: string]: unknown;
}

/**
 * Normaliza uma `private_key` que possa ter vindo com quebras de linha
 * escapadas (`\\n` literais) — comportamento comum quando o JSON é colado
 * em painéis de env var de provedores como Vercel.
 */
function normalizePrivateKey(rawKey: string): string {
  return rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
}

/**
 * Parseia e valida o JSON da service account a partir de uma string bruta.
 * Exportado para permitir testes unitários isolados.
 *
 * @throws Error se o JSON for inválido ou se qualquer campo obrigatório estiver ausente.
 */
export function parseServiceAccount(rawJson: string): ServiceAccountShape {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(
      `[firebase-admin] ${ENV_VAR_NAME} contém JSON inválido. ` +
      `Verifique se o conteúdo da env var é o JSON completo da service account, ` +
      `sem aspas extras no entorno. Erro original: ${(err as Error).message}`
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `[firebase-admin] ${ENV_VAR_NAME} deve ser um objeto JSON (service account).`
    );
  }

  const candidate = parsed as Record<string, unknown>;
  const missing: RequiredField[] = REQUIRED_FIELDS.filter(
    (field) => typeof candidate[field] !== 'string' || !(candidate[field] as string).trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `[firebase-admin] ${ENV_VAR_NAME} está faltando campo(s) obrigatório(s): ` +
      `${missing.join(', ')}. ` +
      `Verifique se o JSON colado é o arquivo completo da service account gerado ` +
      `pelo Firebase Console (Project Settings > Service Accounts > Generate new private key).`
    );
  }

  const serviceAccount: ServiceAccountShape = {
    ...candidate,
    project_id: candidate.project_id as string,
    client_email: candidate.client_email as string,
    private_key: normalizePrivateKey(candidate.private_key as string),
  };

  return serviceAccount;
}

/** Máscara segura para logs: mantém domínio e primeiro caractere do local-part. */
function maskClientEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

/**
 * Retorna o app do Firebase Admin SDK (singleton por processo).
 *
 * Em ambiente serverless (Vercel), o app é inicializado uma única vez por
 * cold start e reutilizado entre invocações quentes da mesma instância.
 */
export function getFirebaseAdminApp(): App {
  // Singleton: se já existe um app default inicializado, reusa.
  if (getApps().length > 0) {
    return getApp();
  }

  const rawJson = process.env[ENV_VAR_NAME];

  if (!rawJson || !rawJson.trim()) {
    throw new Error(
      `[firebase-admin] Variável de ambiente ${ENV_VAR_NAME} não definida. ` +
      `Defina-a com o JSON completo da service account do Firebase. ` +
      `Local: adicione em .env.local. ` +
      `Produção/Preview: adicione no painel da Vercel (Settings > Environment Variables).`
    );
  }

  const serviceAccount = parseServiceAccount(rawJson);

  const app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });

  // Log único de sucesso, sem vazar secrets.
  console.info(
    `[firebase-admin] initialized project_id=${serviceAccount.project_id} ` +
    `client_email=${maskClientEmail(serviceAccount.client_email)}`
  );

  return app;
}
```

### Pattern 2: Env var setup (documentação operacional)

#### `.env.local` (desenvolvimento)
```bash
# Firebase Admin SDK (server-side). JSON completo da service account em UMA LINHA.
# Obter em: Firebase Console > Project Settings > Service Accounts > Generate new private key.
# IMPORTANTE: envolver em aspas simples para preservar o \n escapado dentro do JSON.
FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"a-riva-hub","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@a-riva-hub.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

Fluxo local desejado apos a implementacao:

```bash
npm run dev
```

Sem necessidade de `scripts/dev-with-firebase-admin.sh` e sem dependência de arquivo físico em `GOOGLE_APPLICATION_CREDENTIALS`.

#### Vercel (Production + Preview)
No painel Vercel → Settings → Environment Variables:
- Name: `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`
- Value: `{"type":"service_account","project_id":"a-riva-hub", ... }` (JSON completo em uma linha; Vercel NÃO precisa de aspas externas)
- Environments: Production + Preview (Development NÃO — fica em `.env.local`)
- Type: Secret (encrypted)

## 6. API Contract

Nenhum endpoint novo ou alterado. As rotas v2 existentes mantêm contrato 100% inalterado; a mudança é puramente no bootstrap do Admin SDK que elas consomem indiretamente via `getFirebaseAdminApp()`.

Rotas impactadas indiretamente (devem continuar respondendo 200 após a migração):
- `GET /api/workflows/requester/catalog`
- `GET /api/workflows/read/mine`
- Rotas de admin-config v2 em `/api/workflows/admin/*`
- `GET /api/billing` (também consome `getFirebaseAdminApp`)

## 7. Database Schema (mudanças)

Nenhuma mudança no schema do Firestore, nenhuma alteração em `firestore.rules`, `storage.rules` ou índices. A feature é exclusivamente de bootstrap de credencial server-side.

## 8. Testing Strategy

### Unit Tests

Criar testes unitários isolados para `parseServiceAccount` (a função já está exportada justamente para viabilizar esse teste sem depender do Firebase SDK real):

| Component | Test |
|-----------|------|
| `parseServiceAccount` — happy path | JSON válido com 3 campos obrigatórios → retorna objeto com `private_key` normalizada |
| `parseServiceAccount` — JSON malformado | String inválida → lança Error contendo `"JSON inválido"` e nome da env |
| `parseServiceAccount` — array/null/primitive | Entrada não-objeto → lança Error `"deve ser um objeto JSON"` |
| `parseServiceAccount` — `project_id` ausente | Lança Error listando `project_id` como missing |
| `parseServiceAccount` — `client_email` vazio | Lança Error listando `client_email` (valida `.trim()` também) |
| `parseServiceAccount` — `private_key` com `\n` literal | `\\n` literais são convertidos para `\n` reais no output |
| `parseServiceAccount` — `private_key` com quebras reais | Passa através sem modificação (idempotente) |
| `maskClientEmail` (se exportado como util interno testável) | `'firebase-adminsdk-abc@x.iam.gserviceaccount.com'` → `'f***@x.iam.gserviceaccount.com'` |

Localização sugerida: `src/lib/__tests__/firebase-admin.test.ts`. Usar Jest já configurado no projeto (`npm test`). Não requer mocks do Firebase Admin SDK — só testa o helper puro.

Exemplo de skeleton:
```typescript
// src/lib/__tests__/firebase-admin.test.ts
import { parseServiceAccount } from '@/lib/firebase-admin';

describe('parseServiceAccount', () => {
  const baseValid = {
    type: 'service_account',
    project_id: 'a-riva-hub',
    client_email: 'svc@a-riva-hub.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
  };

  it('parses valid JSON and normalizes escaped newlines', () => {
    const result = parseServiceAccount(JSON.stringify(baseValid));
    expect(result.project_id).toBe('a-riva-hub');
    expect(result.private_key).toContain('\n');
    expect(result.private_key).not.toContain('\\n');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseServiceAccount('not json')).toThrow(/JSON inválido/);
  });

  it('throws when required fields are missing', () => {
    const { private_key, ...partial } = baseValid;
    expect(() => parseServiceAccount(JSON.stringify(partial))).toThrow(/private_key/);
  });
});
```

### Integration Tests

Teste manual (não automatizado — DEFINE §7 declara smoke test suficiente):

| Flow | Test |
|------|------|
| Cold start local com env válida | `npm run dev` com `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` no `.env.local` → hit em `GET /api/workflows/requester/catalog` retorna 200 e log `[firebase-admin] initialized project_id=...` aparece no terminal |
| Cold start local sem env | Comentar a env em `.env.local` → hit em qualquer rota server-side → erro 500 com mensagem `Variável de ambiente FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON não definida` |
| Cold start local com JSON corrompido | Remover `}` final → erro 500 com `JSON inválido` |
| Warm reuse | Segundo hit na mesma rota NÃO deve logar novamente `[firebase-admin] initialized` (singleton hit) |
| Vercel Preview deploy | Após configurar env no painel Preview, push em branch → deploy Preview gera URL → smoke test das 4 rotas listadas no DEFINE §5 |

### Acceptance Tests

```gherkin
Feature: Bootstrap do Firebase Admin SDK em Vercel

  Scenario: Cold start em produção com credencial válida
    GIVEN a env FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON está configurada em Vercel Production
    AND o JSON contém project_id, client_email e private_key válidos
    WHEN um usuário autenticado faz GET /api/workflows/requester/catalog
    THEN a resposta tem status 200
    AND os logs da Vercel mostram "[firebase-admin] initialized project_id=a-riva-hub"
    AND nenhum log contém a string completa de private_key

  Scenario: Cold start com env ausente
    GIVEN a env FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON NÃO está configurada
    WHEN um usuário faz GET /api/workflows/read/mine
    THEN a resposta tem status 500
    AND o log contém "Variável de ambiente FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON não definida"
    AND o log instrui o desenvolvedor a configurar .env.local ou Vercel env

  Scenario: Cold start com private_key escapada
    GIVEN a env FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON tem private_key com \n literais
    WHEN getFirebaseAdminApp() é chamado
    THEN parseServiceAccount normaliza \n para quebras reais
    AND credential.cert aceita a chave sem erro
    AND getAuth(app).verifyIdToken funciona normalmente

  Scenario: Warm reuse do singleton
    GIVEN getFirebaseAdminApp() já foi chamado com sucesso em uma invocação anterior da mesma instância lambda
    WHEN getFirebaseAdminApp() é chamado novamente
    THEN retorna o mesmo App sem reparsear o JSON
    AND nenhum log "[firebase-admin] initialized" é emitido novamente
```

## 9. Rollback Plan

Mudança localizada em um único arquivo + uma env var. Rollback é trivial.

| Step | Action | Verification |
|------|--------|--------------|
| 1 | `git revert <commit>` no branch de deploy e push | CI verde, build da Vercel ok |
| 2 | (Opcional) Manter a env `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` no painel Vercel desativada/removida temporariamente | Env var no painel |
| 3 | Restaurar `GOOGLE_APPLICATION_CREDENTIALS` apontando para arquivo local (apenas dev) | `npm run dev` bootap sem erro |
| 4 | Confirmar que as rotas v2 voltam ao estado anterior (quebradas em Vercel, funcionando local) | Smoke test |

**Método rápido:** `git revert <commit-hash>` — como o diff é de ~80 linhas em um único arquivo, o revert é limpo e sem conflitos esperados.

**Forward-fix preferível ao rollback:** se algo der errado, normalmente a causa é JSON mal colado na env. O comportamento de "falha rápida com mensagem orientada" deve bastar para diagnosticar e corrigir direto no painel Vercel sem precisar de revert.

**Segurança pós-rollback:** mesmo após revert, a env `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` já configurada na Vercel é inofensiva (não é lida por código algum). Recomendação: rotacionar a service account APENAS se houver suspeita de vazamento real (ex: log acidental), não por precaução rotineira.

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE document aprovado (Clarity 14/15)
- [x] ADRs documentados (2 ADRs cobrindo escolha da env e estratégia de singleton)
- [x] File manifest completo (1 arquivo)
- [x] Code pattern validado contra padrão atual do módulo e contra uso em `src/app/api/billing/route.ts`
- [ ] Service account JSON obtida do Firebase Console (operador)
- [ ] Env configurada em Vercel Production + Preview (operador)
- [ ] Env configurada em `.env.local` (operador, antes do `npm run dev`)
- [ ] Fluxo local de validação alinhado: usar `npm run dev`, não `scripts/dev-with-firebase-admin.sh`

### Post-Build
- [ ] `src/lib/firebase-admin.ts` reescrito conforme Pattern 1
- [ ] `parseServiceAccount` exportado e com testes unitários passando (`npm test`)
- [ ] `npm run typecheck` sem erros
- [ ] `npm run lint` sem warnings novos
- [ ] `npm run build` finaliza sem erros
- [ ] Zero referências a `GOOGLE_APPLICATION_CREDENTIALS` dentro de `src/lib/firebase-admin.ts` (grep confirma)
- [ ] Smoke test manual local:
  - [ ] `GET /api/workflows/requester/catalog` → 200
  - [ ] `GET /api/workflows/read/mine` → 200
  - [ ] Uma rota de admin-config v2 → 200
- [ ] Confirmado que `npm run dev` sobe corretamente apenas com `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` no `.env.local`
- [ ] Smoke test em Vercel Preview deploy:
  - [ ] Mesmas 3 rotas acima → 200
  - [ ] Log `[firebase-admin] initialized project_id=a-riva-hub` presente nos logs da função
- [ ] Deploy em Production → mesmo smoke test → 200
- [ ] Verificar que `private_key` NÃO aparece em nenhum log da Vercel
- [ ] CLAUDE.md NÃO precisa de update (mudança não altera convenção arquitetural)

## 11. Specialist Instructions

### For @firebase-specialist

```markdown
Files to modify:
- src/lib/firebase-admin.ts (único arquivo)

Key requirements:
- Substituir integralmente o conteúdo atual pelo Pattern 1 da seção 5 deste DESIGN.
- Manter assinatura pública EXATA: `export function getFirebaseAdminApp(): App`.
- Exportar adicionalmente:
  - `parseServiceAccount(rawJson: string): ServiceAccountShape` (helper puro, para testes)
  - `ServiceAccountShape` (tipo)
- NÃO adicionar fallback para `GOOGLE_APPLICATION_CREDENTIALS` (ADR-001 rejeitou Abordagem B).
- NÃO inicializar o app no import-time do módulo (deve ser lazy, dentro de `getFirebaseAdminApp`).
- NÃO logar o conteúdo de `private_key` nem o JSON completo em nenhuma circunstância.
- Usar import `cert` de `firebase-admin/app` (não `credential.cert` do namespace `firebase-admin`).
- Máscara de email nos logs: primeiro caractere do local-part + `***@<domínio>`.
- O critério local final desta feature é: `.env.local` com `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` + `npm run dev`. O script `scripts/dev-with-firebase-admin.sh` não deve guiar a solução nem ser requisito para o runtime do Next.js.

Tests to create:
- src/lib/__tests__/firebase-admin.test.ts
- Cobrir todos os casos da tabela "Unit Tests" na seção 8 (8 casos mínimos).
- Rodar com `npm test`.

Validation:
- `npm run typecheck` limpo
- `npm run lint` limpo
- `npm test -- firebase-admin` verde
- `grep -n "GOOGLE_APPLICATION_CREDENTIALS" src/lib/firebase-admin.ts` retorna vazio

Operational handoff (NÃO é responsabilidade do agente, só documentar no PR):
- Service account JSON deve ser obtida pelo dev responsável no Firebase Console.
- Env `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` deve ser configurada em:
  1. `.env.local` (dev — usar aspas simples envolvendo o JSON)
  2. Vercel Production (painel → Environment Variables → Secret)
  3. Vercel Preview (mesmo valor)
- NÃO configurar em Vercel Development (fica em .env.local).
```

### For @react-frontend-developer

```markdown
Nenhuma ação necessária. Esta feature é 100% server-side (bootstrap do Admin SDK).
Nenhum componente, contexto, hook ou página React é afetado.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-13 | design-agent | Initial design based on DEFINE_CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL.md (Abordagem A do brainstorm) |
| 1.1 | 2026-04-13 | Codex | Clarified local success path as `npm run dev` with `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` in `.env.local`; marked `scripts/dev-with-firebase-admin.sh` as legacy helper that must not drive the main implementation |
