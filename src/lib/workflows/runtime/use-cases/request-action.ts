import { randomUUID } from 'node:crypto';
import { assertCanRequestAction } from '../authz';
import {
  assertCurrentStepActionConfigured,
  hasAnyActionBatchForCurrentStep,
} from '../action-helpers';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import { buildActionReadModelUpdate } from '../read-model';
import * as repo from '../repository';
import type { WorkflowActionRequest } from '../types';

export interface RequestActionInput {
  requestId: number;
  actorUserId: string;
  actorName: string;
}

export interface RequestActionResult {
  docId: string;
  requestId: number;
  actionBatchId: string;
  pendingRecipients: string[];
}

export async function requestAction(input: RequestActionInput): Promise<RequestActionResult> {
  const requestEntry = await repo.getWorkflowRequestByRequestId(input.requestId);

  if (!requestEntry) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const version = await repo.getWorkflowVersion(
    requestEntry.data.workflowTypeId,
    requestEntry.data.workflowVersion,
  );

  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      'Versao publicada nao encontrada para este chamado.',
      404,
    );
  }

  return repo.mutateWorkflowRequestAtomically(requestEntry.docId, (currentRequest, now) => {
    if (currentRequest.statusCategory === 'finalized' || currentRequest.statusCategory === 'archived') {
      throw new RuntimeError(
        RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
        'Chamado ja finalizado ou arquivado.',
      );
    }

    if (currentRequest.statusCategory !== 'in_progress') {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_STEP_TRANSITION,
        `Chamado precisa estar em andamento para solicitar action (statusCategory=${currentRequest.statusCategory}).`,
      );
    }

    assertCanRequestAction(
      currentRequest.ownerUserId,
      currentRequest.responsibleUserId,
      input.actorUserId,
    );

    const actionDescription = assertCurrentStepActionConfigured(version, currentRequest);

    if (hasAnyActionBatchForCurrentStep(currentRequest)) {
      throw new RuntimeError(
        RuntimeErrorCode.ACTION_REQUEST_ALREADY_OPEN,
        'A etapa atual ja possui uma action aberta ou encerrada e nao pode ser reaberta.',
        409,
      );
    }

    const actionBatchId = `act_batch_${randomUUID()}`;
    const nextActionRequests: WorkflowActionRequest[] = [
      ...(currentRequest.actionRequests ?? []),
      ...actionDescription.approverIds.map((recipientUserId) => ({
        actionRequestId: `act_req_${randomUUID()}`,
        actionBatchId,
        stepId: actionDescription.step.stepId,
        stepName: actionDescription.step.stepName,
        statusKey: actionDescription.step.statusKey,
        type: actionDescription.action.type,
        label: actionDescription.action.label,
        recipientUserId,
        requestedByUserId: input.actorUserId,
        requestedByName: input.actorName,
        requestedAt: now,
        status: 'pending' as const,
      })),
    ];

    const historyEntry = buildHistoryEntry(
      'action_requested',
      input.actorUserId,
      input.actorName,
      {
        actionBatchId,
        stepId: actionDescription.step.stepId,
        stepName: actionDescription.step.stepName,
        statusKey: actionDescription.step.statusKey,
        type: actionDescription.action.type,
        label: actionDescription.action.label,
        recipientUserIds: actionDescription.approverIds,
      },
      now,
    );

    return {
      update: {
        ...buildActionReadModelUpdate({
          request: currentRequest,
          actionRequests: nextActionRequests,
          extraParticipantIds: actionDescription.approverIds,
          now,
        }),
      },
      historyEntries: historyEntry,
      result: {
        docId: requestEntry.docId,
        requestId: input.requestId,
        actionBatchId,
        pendingRecipients: actionDescription.approverIds,
      },
    };
  });
}
