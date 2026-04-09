import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEmail } from '@/lib/email-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';

type WorkflowConfigAdminPermissions = {
  canManageWorkflowsV2?: boolean;
};

type WorkflowConfigAdminCollaborator = {
  id: string;
  id3a?: string;
  name?: string;
  email?: string;
  authUid?: string;
  permissions?: WorkflowConfigAdminPermissions;
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

export async function authenticateWorkflowConfigAdmin(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; collaborator: WorkflowConfigAdminCollaborator }> {
  const decodedToken = await verifyBearerToken(request);
  const collaboratorDoc =
    (await resolveCollaboratorByAuthUid(decodedToken)) ?? (await resolveCollaboratorByEmail(decodedToken));

  if (!collaboratorDoc) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario autenticado nao possui colaborador operacional associado.',
      403,
    );
  }

  const collaborator = {
    id: collaboratorDoc.id,
    ...collaboratorDoc.data(),
  } as WorkflowConfigAdminCollaborator;

  if (!collaborator.permissions?.canManageWorkflowsV2) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario sem permissao para configurar workflows v2.',
      403,
    );
  }

  return { decodedToken, collaborator };
}
