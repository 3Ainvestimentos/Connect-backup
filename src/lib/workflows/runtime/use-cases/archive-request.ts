/**
 * @fileOverview Use case: archive a finalized workflow request.
 *
 * Rules:
 * - Can only be performed after finalization.
 * - Only the owner can archive.
 * - archivedAt is separate from closedAt/finalizedAt.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { assertCanArchive } from '../authz';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import { buildArchiveReadModelUpdate } from '../read-model';
import * as repo from '../repository';

export interface ArchiveRequestInput {
  requestId: number;
  actorUserId: string;
  actorName: string;
}

export interface ArchiveRequestResult {
  docId: string;
  requestId: number;
}

/**
 * Archives a finalized workflow request.
 *
 * @param input - The input parameters.
 * @returns The document ID and request ID.
 */
export async function archiveRequest(input: ArchiveRequestInput): Promise<ArchiveRequestResult> {
  const result = await repo.getWorkflowRequestByRequestId(input.requestId);
  if (!result) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const { docId, data: request } = result;

  // Guard: already archived
  if (request.isArchived || request.statusCategory === 'archived') {
    throw new RuntimeError(
      RuntimeErrorCode.REQUEST_ALREADY_ARCHIVED,
      'Chamado ja esta arquivado.',
    );
  }

  // Guard: must be finalized first
  if (request.statusCategory !== 'finalized') {
    throw new RuntimeError(
      RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
      'Chamado precisa estar finalizado para ser arquivado.',
    );
  }

  // Authorization
  assertCanArchive(request.ownerUserId, input.actorUserId);

  const now = Timestamp.now();

  // Build read-model update
  const readModelUpdate = buildArchiveReadModelUpdate({ now });

  // History entry
  const historyEntry = buildHistoryEntry(
    'request_archived',
    input.actorUserId,
    input.actorName,
    undefined,
    now,
  );

  await repo.updateWorkflowRequestWithHistory(docId, readModelUpdate, historyEntry);

  return { docId, requestId: input.requestId };
}
