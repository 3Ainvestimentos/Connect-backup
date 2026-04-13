import { assertCanOpen, assertCanRespondAction } from '@/lib/workflows/runtime/authz';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { createSignedWorkflowUpload, type SignedWorkflowUpload } from '@/lib/workflows/runtime/upload-storage';
import { getWorkflowRequestByRequestId, getWorkflowVersion } from '../repository';
import { resolvePublishedVersion } from './resolve-published-version';
import { assertCurrentStepActionConfigured, findPendingActionForActor } from '../action-helpers';

export type InitFileUploadInput =
  | {
      target: 'form_field';
      actorUserId: string;
      workflowTypeId: string;
      fieldId: string;
      fileName: string;
      contentType: string;
    }
  | {
      target: 'action_response';
      actorUserId: string;
      requestId: number;
      fileName: string;
      contentType: string;
    };

function requireNonEmptyString(
  value: unknown,
  fieldName: string,
  message = `Campo obrigatorio ausente: ${fieldName}.`,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RuntimeError(RuntimeErrorCode.INVALID_UPLOAD_REQUEST, message, 400);
  }

  return value.trim();
}

/**
 * Validates the upload target against the published workflow metadata and returns a signed upload payload.
 */
export async function initFileUpload(input: InitFileUploadInput): Promise<SignedWorkflowUpload> {
  const actorUserId = requireNonEmptyString(input.actorUserId, 'actorUserId');
  const fileName = requireNonEmptyString(input.fileName, 'fileName', 'Nome do arquivo obrigatorio.');
  const contentType = requireNonEmptyString(
    input.contentType,
    'contentType',
    'Content-Type obrigatorio.',
  );

  if (input.target === 'form_field') {
    const workflowTypeId = requireNonEmptyString(input.workflowTypeId, 'workflowTypeId');
    const fieldId = requireNonEmptyString(input.fieldId, 'fieldId');

    const { workflowType, version } = await resolvePublishedVersion(workflowTypeId);
    assertCanOpen(workflowType, actorUserId);

    const field = version.fields.find((entry) => entry.id === fieldId);
    if (!field || field.type !== 'file') {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_UPLOAD_TARGET,
        'Campo de upload invalido para a versao publicada.',
        400,
      );
    }

    return createSignedWorkflowUpload({
      target: 'form_field',
      workflowTypeId,
      fieldId,
      actorUserId,
      fileName,
      contentType,
    });
  }

  const actionInput = input;

  if (!Number.isInteger(actionInput.requestId) || actionInput.requestId <= 0) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      'RequestId obrigatorio para upload de resposta operacional.',
      400,
    );
  }

  const requestEntry = await getWorkflowRequestByRequestId(actionInput.requestId);
  if (!requestEntry) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const version = await getWorkflowVersion(
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

  const actionDescription = assertCurrentStepActionConfigured(version, requestEntry.data);
  if (actionDescription.action.type !== 'execution') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_TARGET,
      'Upload operacional so e permitido para actions do tipo execution.',
      400,
    );
  }

  const pendingAction = findPendingActionForActor(requestEntry.data, actorUserId);
  if (!pendingAction) {
    if (requestEntry.data.pendingActionRecipientIds.length > 0) {
      assertCanRespondAction(requestEntry.data, actorUserId);
    }

    throw new RuntimeError(
      RuntimeErrorCode.ACTION_REQUEST_NOT_PENDING,
      'Nao existe action pendente para upload de resposta operacional.',
      400,
    );
  }

  return createSignedWorkflowUpload({
    target: 'action_response',
    workflowTypeId: requestEntry.data.workflowTypeId,
    requestId: actionInput.requestId,
    stepId: pendingAction.stepId,
    actorUserId,
    fileName,
    contentType,
  });
}
