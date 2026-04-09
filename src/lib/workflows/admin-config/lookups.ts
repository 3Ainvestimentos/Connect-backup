import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import type {
  WorkflowConfigAreaLookup,
  WorkflowConfigCollaboratorLookup,
  WorkflowConfigOwnerLookup,
} from './types';

type CollaboratorLookupDocument = {
  id3a?: string;
  name?: string;
  email?: string;
  area?: string;
  position?: string;
};

type WorkflowAreaLookupDocument = {
  name?: string;
  icon?: string;
};

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

export async function resolveOwnerByUserId(ownerUserId: string): Promise<WorkflowConfigOwnerLookup> {
  const normalizedOwnerId = ownerUserId.trim();

  if (normalizedOwnerId === '') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'ownerUserId obrigatorio para salvar ou criar workflow.',
      422,
    );
  }

  const snapshot = await getDb()
    .collection('collaborators')
    .where('id3a', '==', normalizedOwnerId)
    .get();

  if (snapshot.empty) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'Owner informado nao foi encontrado entre os colaboradores.',
      422,
    );
  }

  if (snapshot.size > 1) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'Mais de um colaborador foi encontrado para o owner informado.',
      422,
    );
  }

  const data = snapshot.docs[0].data() as CollaboratorLookupDocument;
  const email = data.email?.trim() || '';

  if (email === '') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      'Owner informado nao possui email valido configurado.',
      422,
    );
  }

  return {
    collaboratorDocId: snapshot.docs[0].id,
    userId: data.id3a?.trim() || normalizedOwnerId,
    name: data.name?.trim() || email,
    email,
  };
}

export async function listWorkflowConfigAreas(): Promise<WorkflowConfigAreaLookup[]> {
  const snapshot = await getDb().collection('workflowAreas').get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as WorkflowAreaLookupDocument;
      return {
        areaId: doc.id,
        name: data.name?.trim() || doc.id,
        icon: data.icon?.trim() || 'FolderOpen',
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listWorkflowConfigOwners(): Promise<WorkflowConfigOwnerLookup[]> {
  const snapshot = await getDb().collection('collaborators').get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as CollaboratorLookupDocument;
      return {
        collaboratorDocId: doc.id,
        userId: data.id3a?.trim() || '',
        name: data.name?.trim() || data.email?.trim() || doc.id,
        email: data.email?.trim() || '',
        area: data.area?.trim() || '',
        position: data.position?.trim() || '',
      };
    })
    .filter((owner) => owner.userId !== '' && owner.email !== '')
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listWorkflowConfigCollaborators(): Promise<WorkflowConfigCollaboratorLookup[]> {
  const owners = await listWorkflowConfigOwners();

  return owners.filter(
    (owner): owner is WorkflowConfigCollaboratorLookup =>
      typeof owner.collaboratorDocId === 'string' && owner.collaboratorDocId.trim() !== '',
  );
}
