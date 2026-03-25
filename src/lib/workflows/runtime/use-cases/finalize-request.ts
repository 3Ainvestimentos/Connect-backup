/**
 * @fileOverview Use case: finalize a workflow request.
 *
 * Rules:
 * - This is the ONLY path to the final step.
 * - Allowed when the request is in 'in_progress' (Em andamento).
 * - Only the current responsible or the owner (as exception) can finalize.
 * - Sets closedAt = finalizedAt.
 * - archivedAt is separate (handled by archive-request).
 */

import { Timestamp } from 'firebase-admin/firestore';
import { assertCanFinalize } from '../authz';
import { findFinalStep, finalizeStepStates } from '../engine';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import { buildFinalizeReadModelUpdate } from '../read-model';
import * as repo from '../repository';

export interface FinalizeRequestInput {
  requestId: number;
  actorUserId: string;
  actorName: string;
}

export interface FinalizeRequestResult {
  docId: string;
  requestId: number;
}

/**
 * Finalizes a workflow request, moving it to the final step.
 *
 * @param input - The input parameters.
 * @returns The document ID and request ID.
 */
export async function finalizeRequest(input: FinalizeRequestInput): Promise<FinalizeRequestResult> {
  const result = await repo.getWorkflowRequestByRequestId(input.requestId);
  if (!result) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const { docId, data: request } = result;

  // Guard: already finalized
  if (request.statusCategory === 'finalized' || request.statusCategory === 'archived') {
    throw new RuntimeError(
      RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
      'Chamado ja finalizado.',
    );
  }

  // Guard: must be in_progress
  if (request.statusCategory !== 'in_progress') {
    throw new RuntimeError(
      RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
      `Chamado precisa estar em andamento para ser finalizado (statusCategory=${request.statusCategory}).`,
    );
  }

  // Authorization
  assertCanFinalize(request.ownerUserId, request.responsibleUserId, input.actorUserId);

  // Load version for final step
  const version = await repo.getWorkflowVersion(request.workflowTypeId, request.workflowVersion);
  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      'Versao publicada nao encontrada para o chamado.',
      404,
    );
  }

  const finalStep = findFinalStep(version);
  if (!finalStep) {
    throw new RuntimeError(
      RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
      'Versao publicada nao possui etapa final definida.',
    );
  }

  const now = Timestamp.now();

  // Update step states
  const newStepStates = finalizeStepStates(
    request.stepStates,
    request.currentStepId,
    finalStep.stepId,
  );

  // Build read-model update
  const readModelUpdate = buildFinalizeReadModelUpdate({
    finalStepId: finalStep.stepId,
    finalStepName: finalStep.stepName,
    finalStatusKey: finalStep.statusKey,
    now,
  });

  // History entry
  const historyEntry = buildHistoryEntry(
    'request_finalized',
    input.actorUserId,
    input.actorName,
    {
      finalStepId: finalStep.stepId,
      finalStepName: finalStep.stepName,
    },
    now,
  );

  await repo.updateWorkflowRequestWithHistory(
    docId,
    {
      stepStates: newStepStates,
      ...readModelUpdate,
    },
    historyEntry,
  );

  return { docId, requestId: input.requestId };
}
