import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import type { WorkflowTypeV2, WorkflowVersionV2 } from '@/lib/workflows/runtime/types';
import type { DraftReadinessIssue, WorkflowVersionTransitionResult } from './types';
import {
  buildWorkflowTypeSnapshot,
  canActivateVersion,
  deriveVersionStatus,
  evaluatePublishability,
  hasSufficientWorkflowTypeSnapshot,
} from './publishability';
import { listWorkflowConfigOwners } from './lookups';

export type PublishDraftInput = {
  workflowTypeId: string;
  version: number;
  actorUserId: string;
  actorName: string;
};

export type ActivateVersionInput = PublishDraftInput;

export class VersionNotPublishableError extends RuntimeError {
  readonly issues: DraftReadinessIssue[];

  constructor(issues: DraftReadinessIssue[]) {
    super(RuntimeErrorCode.VERSION_NOT_PUBLISHABLE, 'A versao possui bloqueios e nao pode ser publicada.', 409);
    this.issues = issues;
  }
}

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

function asIso(timestamp: Timestamp | null | undefined) {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

export async function publishDraftVersion(input: PublishDraftInput): Promise<WorkflowVersionTransitionResult> {
  const collaborators = await listWorkflowConfigOwners();
  const db = getDb();

  return db.runTransaction(async (tx) => {
    const rootRef = db.collection('workflowTypes_v2').doc(input.workflowTypeId);
    const versionRef = rootRef.collection('versions').doc(String(input.version));
    const [rootSnap, versionSnap] = await Promise.all([tx.get(rootRef), tx.get(versionRef)]);
    const root = rootSnap.data() as WorkflowTypeV2 | undefined;
    const version = versionSnap.data() as WorkflowVersionV2 | undefined;

    if (!root) {
      throw new RuntimeError(RuntimeErrorCode.WORKFLOW_TYPE_NOT_FOUND, 'Workflow type nao encontrado.', 404);
    }

    if (!version) {
      throw new RuntimeError(RuntimeErrorCode.WORKFLOW_VERSION_NOT_FOUND, 'Versao nao encontrada.', 404);
    }

    if (version.state !== 'draft') {
      throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'A publicacao so aceita versoes draft.', 422);
    }

    const issues = evaluatePublishability({
      workflowType: root,
      version,
      collaborators,
    });
    const blockingIssues = issues.filter((issue) => issue.severity === 'blocking');
    if (blockingIssues.length > 0) {
      throw new VersionNotPublishableError(blockingIssues);
    }

    const draftSnapshot = version.draftConfig?.workflowType;
    if (!draftSnapshot) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
        'O draft nao possui snapshot de workflowType para publicar.',
        409,
      );
    }

    const now = Timestamp.now();
    const workflowTypeSnapshot = buildWorkflowTypeSnapshot({
      ...draftSnapshot,
      active: true,
    });

    tx.update(versionRef, {
      state: 'published',
      publishedAt: version.publishedAt ?? now,
      publishedByUserId: input.actorUserId,
      publishedByName: input.actorName,
      activatedAt: now,
      activatedByUserId: input.actorUserId,
      activatedByName: input.actorName,
      workflowTypeSnapshot,
      updatedAt: now,
    });

    tx.update(rootRef, {
      ...workflowTypeSnapshot,
      active: true,
      latestPublishedVersion: input.version,
      updatedAt: now,
      lastActivatedAt: now,
      lastActivatedVersion: input.version,
    });

    return {
      workflowTypeId: input.workflowTypeId,
      version: input.version,
      state: 'published',
      latestPublishedVersion: input.version,
      publishedAt: asIso(version.publishedAt ?? now),
      transition: 'published',
      catalogStatus: deriveVersionStatus({ latestPublishedVersion: input.version }, { version: input.version, state: 'published' }),
    };
  });
}

export async function activatePublishedVersion(input: ActivateVersionInput): Promise<WorkflowVersionTransitionResult> {
  const db = getDb();

  return db.runTransaction(async (tx) => {
    const rootRef = db.collection('workflowTypes_v2').doc(input.workflowTypeId);
    const versionRef = rootRef.collection('versions').doc(String(input.version));
    const [rootSnap, versionSnap] = await Promise.all([tx.get(rootRef), tx.get(versionRef)]);
    const root = rootSnap.data() as WorkflowTypeV2 | undefined;
    const version = versionSnap.data() as WorkflowVersionV2 | undefined;

    if (!root) {
      throw new RuntimeError(RuntimeErrorCode.WORKFLOW_TYPE_NOT_FOUND, 'Workflow type nao encontrado.', 404);
    }

    if (!version) {
      throw new RuntimeError(RuntimeErrorCode.WORKFLOW_VERSION_NOT_FOUND, 'Versao nao encontrada.', 404);
    }

    if (version.state !== 'published') {
      throw new RuntimeError(RuntimeErrorCode.VERSION_NOT_PUBLISHED, 'A ativacao exige uma versao publicada.', 409);
    }

    if (root.latestPublishedVersion === input.version) {
      throw new RuntimeError(RuntimeErrorCode.VERSION_ALREADY_ACTIVE, 'A versao informada ja esta ativa.', 409);
    }

    if (!canActivateVersion(root, version) || !hasSufficientWorkflowTypeSnapshot(version.workflowTypeSnapshot)) {
      throw new RuntimeError(
        RuntimeErrorCode.VERSION_SNAPSHOT_MISSING,
        'A versao nao possui snapshot suficiente para reativacao.',
        409,
      );
    }

    const now = Timestamp.now();

    tx.update(versionRef, {
      activatedAt: now,
      activatedByUserId: input.actorUserId,
      activatedByName: input.actorName,
      updatedAt: now,
    });

    tx.update(rootRef, {
      ...version.workflowTypeSnapshot,
      active: true,
      latestPublishedVersion: input.version,
      updatedAt: now,
      lastActivatedAt: now,
      lastActivatedVersion: input.version,
    });

    return {
      workflowTypeId: input.workflowTypeId,
      version: input.version,
      state: 'published',
      latestPublishedVersion: input.version,
      publishedAt: asIso(version.publishedAt),
      transition: 'activated',
      catalogStatus: deriveVersionStatus({ latestPublishedVersion: input.version }, { version: input.version, state: 'published' }),
    };
  });
}
