/**
 * @fileOverview Permission-aware authentication for the v2 workflow surfaces.
 *
 * Follows the same pattern as src/lib/workflows/admin-config/auth.ts.
 * Each exported function verifies the bearer token, resolves the collaborator,
 * and checks the surface-specific permission flag.
 */

import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEmail } from '@/lib/email-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';
import type { RuntimeActor } from '@/lib/workflows/runtime/actor-resolution';

type CollaboratorPermissions = {
  canOpenRequestsV2?: boolean;
  canManageRequestsV2?: boolean;
};

type CollaboratorRecord = {
  id3a?: string;
  name?: string;
  email?: string;
  authUid?: string;
  permissions?: CollaboratorPermissions;
};

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

async function resolveCollaboratorByAuthUid(decodedToken: DecodedIdToken) {
  const snapshot = await getDb()
    .collection('collaborators')
    .where('authUid', '==', decodedToken.uid)
    .get();

  if (snapshot.size > 1) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      `Usuario autenticado possui ${snapshot.size} colaboradores associados ao mesmo authUid.`,
      403,
    );
  }

  return snapshot.docs[0] ?? null;
}

async function resolveCollaboratorByEmail(decodedToken: DecodedIdToken) {
  const emailCandidates = Array.from(
    new Set(
      [decodedToken.email, normalizeEmail(decodedToken.email)].filter(
        (email): email is string => typeof email === 'string' && email.trim() !== '',
      ),
    ),
  );

  if (emailCandidates.length === 0) {
    return null;
  }

  const snapshot = await getDb()
    .collection('collaborators')
    .where('email', 'in', emailCandidates)
    .get();

  if (snapshot.size > 1) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      `Usuario autenticado possui ${snapshot.size} colaboradores associados ao mesmo email reconciliado.`,
      403,
    );
  }

  return snapshot.docs[0] ?? null;
}

async function resolveCollaboratorWithPermissions(
  decodedToken: DecodedIdToken,
): Promise<{ collaboratorDocId: string; collaborator: CollaboratorRecord }> {
  const doc =
    (await resolveCollaboratorByAuthUid(decodedToken)) ??
    (await resolveCollaboratorByEmail(decodedToken));

  if (!doc) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario autenticado nao possui colaborador operacional associado.',
      403,
    );
  }

  return { collaboratorDocId: doc.id, collaborator: doc.data() as CollaboratorRecord };
}

function buildActor(
  collaboratorDocId: string,
  collaborator: CollaboratorRecord,
  decodedToken: DecodedIdToken,
): RuntimeActor {
  if (!collaborator.id3a || collaborator.id3a.trim() === '') {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Colaborador autenticado nao possui id3a operacional configurado.',
      403,
    );
  }

  const actorEmail =
    normalizeEmail(collaborator.email) ?? normalizeEmail(decodedToken.email) ?? '';
  const actorName =
    collaborator.name?.trim() ||
    decodedToken.name?.trim() ||
    actorEmail ||
    collaborator.id3a;

  return {
    actorUserId: collaborator.id3a,
    actorName,
    actorEmail,
    collaboratorDocId,
  };
}

/**
 * Authenticates a request for the v2 requester surface.
 * Requires `permissions.canOpenRequestsV2 === true` in the collaborator document.
 */
export async function authenticateRequesterV2Actor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const { collaboratorDocId, collaborator } =
    await resolveCollaboratorWithPermissions(decodedToken);

  if (!collaborator.permissions?.canOpenRequestsV2) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario sem permissao para abertura de solicitacoes v2.',
      403,
    );
  }

  return { decodedToken, actor: buildActor(collaboratorDocId, collaborator, decodedToken) };
}

/**
 * Authenticates a request for the v2 management surface.
 * Requires `permissions.canManageRequestsV2 === true` in the collaborator document.
 */
export async function authenticateManagementV2Actor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const { collaboratorDocId, collaborator } =
    await resolveCollaboratorWithPermissions(decodedToken);

  if (!collaborator.permissions?.canManageRequestsV2) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario sem permissao para gestao de chamados v2.',
      403,
    );
  }

  return { decodedToken, actor: buildActor(collaboratorDocId, collaborator, decodedToken) };
}
