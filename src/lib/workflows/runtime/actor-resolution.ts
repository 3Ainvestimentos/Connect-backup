/**
 * @fileOverview Resolves the authenticated Firebase user into the operational
 * identity used by the v2 workflow runtime.
 */

import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEmail } from '@/lib/email-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from './errors';

type CollaboratorRecord = {
  id3a?: string;
  name?: string;
  email?: string;
  authUid?: string;
};

export type RuntimeActor = {
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  collaboratorDocId: string;
};

/**
 * Resolves a Firebase-authenticated user into the operational `id3a`
 * identity used by the Facilities v2 runtime.
 */
export async function resolveRuntimeActor(decodedToken: DecodedIdToken): Promise<RuntimeActor> {
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db
    .collection('collaborators')
    .where('authUid', '==', decodedToken.uid)
    .get();

  if (snap.empty) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario autenticado nao possui colaborador operacional associado.',
      403,
    );
  }

  if (snap.size !== 1) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      `Usuario autenticado possui ${snap.size} colaboradores associados ao mesmo authUid.`,
      403,
    );
  }

  const collaboratorDoc = snap.docs[0];
  const collaborator = collaboratorDoc.data() as CollaboratorRecord;

  if (!collaborator.id3a || collaborator.id3a.trim() === '') {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Colaborador autenticado nao possui id3a operacional configurado.',
      403,
    );
  }

  const actorEmail =
    normalizeEmail(collaborator.email) ??
    normalizeEmail(decodedToken.email) ??
    '';
  const actorName =
    collaborator.name?.trim() ||
    decodedToken.name?.trim() ||
    actorEmail ||
    collaborator.id3a;

  return {
    actorUserId: collaborator.id3a,
    actorName,
    actorEmail,
    collaboratorDocId: collaboratorDoc.id,
  };
}
