import {
  assertCurrentStepActionConfigured,
  findPendingActionForActor,
  getCurrentPendingActionBatchEntries,
  getPendingActionEntriesForCurrentStep,
  mapActionResponseToStatus,
} from '../action-helpers';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import { buildActionReadModelUpdate } from '../read-model';
import * as repo from '../repository';
import type { WorkflowActionResponseAttachment } from '../types';

type ActionResponse = 'approved' | 'rejected' | 'acknowledged' | 'executed';

export interface RespondActionInput {
  requestId: number;
  actorUserId: string;
  actorName: string;
  response: ActionResponse;
  comment?: string;
  attachment?: WorkflowActionResponseAttachment;
}

export interface RespondActionResult {
  docId: string;
  requestId: number;
  actionRequestId: string;
  actionBatchId: string;
  remainingPendingCount: number;
  statusCategory: 'waiting_action' | 'in_progress';
}

function normalizeOptionalComment(comment?: string): string | undefined {
  if (typeof comment !== 'string') {
    return undefined;
  }

  const trimmed = comment.trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeAttachment(
  attachment: WorkflowActionResponseAttachment | undefined,
): WorkflowActionResponseAttachment | undefined {
  if (!attachment) {
    return undefined;
  }

  const fileName = attachment.fileName?.trim();
  const contentType = attachment.contentType?.trim();
  const fileUrl = attachment.fileUrl?.trim();
  const storagePath = attachment.storagePath?.trim();
  const uploadId = attachment.uploadId?.trim();

  if (!fileName || !contentType || !fileUrl || !storagePath) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action possui campos obrigatorios ausentes.',
      400,
    );
  }

  return {
    fileName,
    contentType,
    fileUrl,
    storagePath,
    ...(uploadId ? { uploadId } : {}),
  };
}

function assertResponseMatchesActionType(
  response: ActionResponse,
  actionType: 'approval' | 'acknowledgement' | 'execution',
): void {
  const valid =
    (actionType === 'approval' && (response === 'approved' || response === 'rejected')) ||
    (actionType === 'acknowledgement' && response === 'acknowledged') ||
    (actionType === 'execution' && response === 'executed');

  if (!valid) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Resposta informada nao e compativel com a action pendente desta etapa.',
      400,
    );
  }
}

function resolveResponseHistoryAction(response: ActionResponse) {
  switch (response) {
    case 'approved':
      return 'action_approved' as const;
    case 'rejected':
      return 'action_rejected' as const;
    case 'acknowledged':
      return 'action_acknowledged' as const;
    case 'executed':
      return 'action_executed' as const;
    default:
      throw new Error(`Resposta de action nao suportada: ${response}`);
  }
}

export async function respondAction(input: RespondActionInput): Promise<RespondActionResult> {
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
    const actionDescription = assertCurrentStepActionConfigured(version, currentRequest);
    const pendingEntries = getPendingActionEntriesForCurrentStep(currentRequest);
    const pendingForActor = findPendingActionForActor(currentRequest, input.actorUserId);
    const currentBatchEntries = getCurrentPendingActionBatchEntries(currentRequest);
    const currentStepEntries = (currentRequest.actionRequests ?? []).filter(
      (entry) => entry.stepId === currentRequest.currentStepId,
    );

    if (!pendingForActor) {
      if (
        currentStepEntries.some(
          (entry) =>
            entry.recipientUserId === input.actorUserId &&
            entry.status !== 'pending',
        )
      ) {
        throw new RuntimeError(
          RuntimeErrorCode.ACTION_RESPONSE_ALREADY_RECORDED,
          'A resposta desta action ja foi registrada anteriormente.',
          409,
        );
      }

      if (pendingEntries.length > 0) {
        throw new RuntimeError(
          RuntimeErrorCode.ACTION_RESPONSE_NOT_ALLOWED,
          'Usuario nao possui action pendente para responder neste chamado.',
          403,
        );
      }

      throw new RuntimeError(
        RuntimeErrorCode.ACTION_REQUEST_NOT_PENDING,
        'Nao existe action pendente na etapa atual para registrar resposta.',
        400,
      );
    }

    assertResponseMatchesActionType(input.response, actionDescription.action.type);

    const comment = normalizeOptionalComment(input.comment);
    if (actionDescription.commentRequired && !comment) {
      throw new RuntimeError(
        RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        'Comentario obrigatorio para responder esta action.',
        400,
      );
    }

    const attachment = normalizeAttachment(input.attachment);
    if (actionDescription.action.type !== 'execution' && attachment) {
      throw new RuntimeError(
        RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        'Anexo so pode ser enviado em actions do tipo execution.',
        400,
      );
    }

    if (actionDescription.attachmentRequired && !attachment) {
      throw new RuntimeError(
        RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        'Anexo obrigatorio para responder esta action.',
        400,
      );
    }

    const nextActionRequests = (currentRequest.actionRequests ?? []).map((entry) => {
      if (entry.actionRequestId !== pendingForActor.actionRequestId) {
        return entry;
      }

      return {
        ...entry,
        status: mapActionResponseToStatus(input.response),
        respondedAt: now,
        respondedByUserId: input.actorUserId,
        respondedByName: input.actorName,
        ...(comment ? { responseComment: comment } : {}),
        ...(attachment ? { responseAttachment: attachment } : {}),
      };
    });

    const remainingPendingCount = currentBatchEntries.filter(
      (entry) => entry.actionRequestId !== pendingForActor.actionRequestId && entry.status === 'pending',
    ).length;
    const statusCategory = remainingPendingCount > 0 ? 'waiting_action' : 'in_progress';

    return {
      update: buildActionReadModelUpdate({
        request: currentRequest,
        actionRequests: nextActionRequests,
        now,
      }),
      historyEntries: buildHistoryEntry(
        resolveResponseHistoryAction(input.response),
        input.actorUserId,
        input.actorName,
        {
          actionRequestId: pendingForActor.actionRequestId,
          actionBatchId: pendingForActor.actionBatchId,
          stepId: currentRequest.currentStepId,
          type: pendingForActor.type,
          recipientUserId: pendingForActor.recipientUserId,
          responseCommentPresent: Boolean(comment),
          responseAttachmentPresent: Boolean(attachment),
        },
        now,
      ),
      result: {
        docId: requestEntry.docId,
        requestId: input.requestId,
        actionRequestId: pendingForActor.actionRequestId,
        actionBatchId: pendingForActor.actionBatchId,
        remainingPendingCount,
        statusCategory,
      },
    };
  });
}
