import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEmail } from '@/lib/email-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type {
  CollaboratorRecord,
  Fase2cManifestEntry,
  OwnerResolutionResult,
} from './types';

export const FASE2C_SENSITIVE_OWNER_EMAILS = new Set([
  'ti@3ariva.com.br',
  'pablo.costa@3ariva.com.br',
  'matheus@3ainvestimentos.com.br',
  'barbara@3ainvestimentos.com.br',
]);

export async function fetchCollaborators(): Promise<CollaboratorRecord[]> {
  const db = getFirestore(getFirebaseAdminApp());
  const snapshot = await db.collection('collaborators').get();

  return snapshot.docs.map((doc) => doc.data() as CollaboratorRecord);
}

export function resolveOwner(
  entry: Fase2cManifestEntry,
  legacyOwnerEmail: string,
  collaborators: CollaboratorRecord[],
): OwnerResolutionResult {
  const ownerEmailLegacy = legacyOwnerEmail;
  const ownerEmailCandidate = entry.ownerEmailOverride ?? legacyOwnerEmail;
  const ownerEmailResolved = normalizeEmail(ownerEmailCandidate);

  if (!ownerEmailResolved) {
    throw new Error(
      `Owner do workflow "${entry.workflowTypeId}" nao pode ser materializado: email ausente.`,
    );
  }

  if (entry.ownerUserIdOverride) {
    const ownerUserId = entry.ownerUserIdOverride.trim();

    if (!ownerUserId) {
      throw new Error(
        `ownerUserIdOverride invalido para "${entry.workflowTypeId}": valor vazio.`,
      );
    }

    return {
      ownerEmailLegacy,
      ownerEmailResolved,
      ownerUserId,
      resolutionMode: 'owner_user_id_override',
    };
  }

  const matchingCollaborators = collaborators.filter((collaborator) => {
    return normalizeEmail(collaborator.email) === ownerEmailResolved;
  });

  if (matchingCollaborators.length !== 1) {
    throw new Error(
      `Owner do workflow "${entry.workflowTypeId}" nao pode ser materializado: esperava 1 colaborador para ${ownerEmailCandidate}, encontrei ${matchingCollaborators.length}.`,
    );
  }

  const ownerUserId = matchingCollaborators[0].id3a?.trim();

  if (!ownerUserId) {
    throw new Error(
      `Owner do workflow "${entry.workflowTypeId}" nao possui id3a operacional configurado.`,
    );
  }

  return {
    ownerEmailLegacy,
    ownerEmailResolved,
    ownerUserId,
    resolutionMode: 'directory_match',
  };
}

