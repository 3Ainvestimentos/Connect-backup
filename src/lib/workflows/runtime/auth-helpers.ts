import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { resolveRuntimeActor, type RuntimeActor } from './actor-resolution';
import { RuntimeError, RuntimeErrorCode } from './errors';

function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401);
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (idToken === '') {
    throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401);
  }

  return idToken;
}

export async function verifyBearerToken(request: Request): Promise<DecodedIdToken> {
  const idToken = extractBearerToken(request);

  try {
    return await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
  } catch {
    throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token invalido.', 401);
  }
}

export async function authenticateRuntimeActor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const actor = await resolveRuntimeActor(decodedToken);
  return { decodedToken, actor };
}
