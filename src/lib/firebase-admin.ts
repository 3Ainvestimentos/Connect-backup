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
