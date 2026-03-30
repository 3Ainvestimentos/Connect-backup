import { assertCanOpen } from '@/lib/workflows/runtime/authz';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { createSignedWorkflowUpload, type SignedWorkflowUpload } from '@/lib/workflows/runtime/upload-storage';
import { resolvePublishedVersion } from './resolve-published-version';

export type InitFileUploadInput = {
  actorUserId: string;
  workflowTypeId: string;
  fieldId: string;
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
  const workflowTypeId = requireNonEmptyString(input.workflowTypeId, 'workflowTypeId');
  const fieldId = requireNonEmptyString(input.fieldId, 'fieldId');
  const fileName = requireNonEmptyString(input.fileName, 'fileName', 'Nome do arquivo obrigatorio.');
  const contentType = requireNonEmptyString(
    input.contentType,
    'contentType',
    'Content-Type obrigatorio.',
  );

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
    workflowTypeId,
    fieldId,
    actorUserId,
    fileName,
    contentType,
  });
}
