import type { User } from 'firebase/auth';
import {
  WorkflowFileTransferError,
  WorkflowUploadRequestError,
  type WorkflowUploadFileInput,
  type WorkflowUploadFileResult,
  type WorkflowUploadInitInput,
  type WorkflowUploadInitResult,
} from './types';

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  code?: string;
  message?: string;
};

type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeHeaders(input: unknown): Record<string, string> {
  if (!isObject(input)) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (typeof value === 'string') {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function normalizeUploadInitResult(input: unknown): WorkflowUploadInitResult {
  const result = isObject(input) ? input : {};

  return {
    uploadUrl: asString(result.uploadUrl),
    uploadMethod: (asString(result.uploadMethod) || 'PUT') as WorkflowUploadInitResult['uploadMethod'],
    uploadHeaders: normalizeHeaders(result.uploadHeaders),
    fileUrl: asString(result.fileUrl),
    storagePath: asString(result.storagePath),
    uploadId: asString(result.uploadId),
    expiresAt: asString(result.expiresAt),
  };
}

export async function requestWorkflowFileUpload(
  user: User,
  payload: WorkflowUploadInitInput,
): Promise<WorkflowUploadInitResult> {
  const token = await user.getIdToken();
  const response = await fetch('/api/workflows/runtime/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  let envelope: ApiEnvelope<unknown> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<unknown>;
  } catch (error) {
    if (!response.ok) {
      throw new WorkflowUploadRequestError(
        'UNKNOWN_ERROR',
        'Falha ao consumir API de upload.',
        response.status,
      );
    }

    throw error;
  }

  if (!response.ok || !envelope || envelope.ok !== true) {
    const errorPayload = (envelope ?? {}) as ApiError;
    throw new WorkflowUploadRequestError(
      errorPayload.code ?? 'UNKNOWN_ERROR',
      errorPayload.message ?? 'Falha ao consumir API de upload.',
      response.status,
    );
  }

  return normalizeUploadInitResult(envelope.data);
}

export async function putFileToSignedUrl(
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  file: Blob,
  uploadMethod: WorkflowUploadInitResult['uploadMethod'] = 'PUT',
): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: uploadMethod,
      headers: uploadHeaders,
      body: file,
    });

    if (!response.ok) {
      throw new WorkflowFileTransferError(
        'UPLOAD_TRANSFER_FAILED',
        response.status,
        'Falha ao transferir arquivo para o Storage.',
      );
    }
  } catch (error) {
    if (error instanceof WorkflowFileTransferError) {
      throw error;
    }

    throw new WorkflowFileTransferError(
      'UPLOAD_TRANSFER_FAILED',
      0,
      'Falha ao transferir arquivo para o Storage.',
    );
  }
}

export async function uploadWorkflowFile(
  user: User,
  input: WorkflowUploadFileInput,
): Promise<WorkflowUploadFileResult> {
  const signed = await requestWorkflowFileUpload(user, {
    workflowTypeId: input.workflowTypeId,
    fieldId: input.fieldId,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
  });

  await putFileToSignedUrl(
    signed.uploadUrl,
    signed.uploadHeaders,
    input.file,
    signed.uploadMethod,
  );

  return { fileUrl: signed.fileUrl };
}
