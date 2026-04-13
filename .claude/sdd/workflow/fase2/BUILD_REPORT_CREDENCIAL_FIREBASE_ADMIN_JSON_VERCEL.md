# BUILD REPORT: CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL

> Generated: 2026-04-13
> Source: DESIGN_CREDENCIAL_FIREBASE_ADMIN_JSON_VERCEL.md

## Summary

Implementação concluída com sucesso. Mudança cirúrgica em `src/lib/firebase-admin.ts` substituindo o bootstrap baseado em `GOOGLE_APPLICATION_CREDENTIALS` (file path) por `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` (env var JSON), com testes unitários e build validados.

## Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firebase-admin.ts` | **Modified** | Substituído bootstrap completo. Agora lê `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`, faz JSON.parse, valida campos obrigatórios, normaliza `private_key`, e chama `initializeApp({ credential.cert(...) })`. Mantém singleton via `getApps()`/`getApp()`. Exporta `parseServiceAccount` para testabilidade. |
| `src/lib/__tests__/firebase-admin.test.ts` | **Created** | 12 testes unitários cobrindo happy path, JSON inválido, campos faltando, tipos não-objeto, normalização de `\n`, preservação de campos extras. |

## Verification Results

| Check | Result |
|-------|--------|
| **Unit Tests** | ✅ 12/12 passed (0 failed) |
| **TypeScript (tsc --noEmit)** | ⚠️ 98 erros preexistentes — **0 erros novos** em `firebase-admin.ts` ou `firebase-admin.test.ts` |
| **Next.js Build** | ✅ Sucesso (`npx next build` exit code 0) |

## What Changed (Behavior)

| Before | After |
|--------|-------|
| `GOOGLE_APPLICATION_CREDENTIALS` → file path para JSON físico | `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` → env var com JSON inline |
| Falha silenciosa com `console.warn` + `initializeApp()` sem config | Falha rápida com `Error` orientado se env ausente, JSON inválido ou campos faltando |
| Sem validação de campos obrigatórios | Valida `project_id`, `client_email`, `private_key` |
| Sem normalização de `\n` em `private_key` | `normalizePrivateKey` converte `\\n` literais em quebras reais |
| Log sem máscara | Log com `client_email` mascarado (`f***@domain`) |

## What Did NOT Change

- Assinatura pública `getFirebaseAdminApp(): App` — idêntica
- Singleton pattern via `getApps()`/`getApp()` — idêntico
- Cloud Functions (`functions/src/*`) — fora do escopo
- Scripts Python (`src/scripts/*.py`) — fora do escopo
- `scripts/dev-with-firebase-admin.sh` — permanece intacto (legacy)
- Todos os callers (`permission-auth.ts`, `admin-config/*`, rotas v2) — inalterados

## Required Infrastructure Steps (Operador)

### 1. `.env.local` (desenvolvimento local)
```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"a-riva-hub","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@a-riva-hub.iam.gserviceaccount.com",...}'
```
> ⚠️ Envolver em **aspas simples** para preservar `\n` escapados.

### 2. Vercel (Production + Preview)
No painel Vercel → Settings → Environment Variables:
- **Name:** `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`
- **Value:** JSON completo em uma linha (sem aspas externas)
- **Environments:** Production + Preview
- **Type:** Secret (encrypted)

### 3. Smoke Test pós-deploy
```bash
# Após configurar env e redeploy
curl https://<your-domain>/api/workflows/requester/catalog
# Esperado: HTTP 200
# Logs Vercel: "[firebase-admin] initialized project_id=a-riva-hub client_email=f***@..."
```

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Mudança 100% em `src/lib/firebase-admin.ts` | ✅ |
| Assinatura `getFirebaseAdminApp()` inalterada | ✅ |
| Cloud Functions/scripts não tocados | ✅ |
| Zero log de `private_key` | ✅ |
| Sem fallback para `GOOGLE_APPLICATION_CREDENTIALS` | ✅ |
| `.env.local` no `.gitignore` | ✅ (já existente) |
| 12 testes unitários passando | ✅ |
| Build Next.js sem erros novos | ✅ |
