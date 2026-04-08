import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { buildStorageFilePath, sanitizeStoragePath } from '@/lib/path-sanitizer';
import { RuntimeError, RuntimeErrorCode } from './errors';

const LEGACY_WORKFLOW_UPLOAD_PREFIX =
  'Workflows/Facilities e Suprimentos/workflows_v2/preopen';
const WORKFLOW_RUNTIME_UPLOAD_PREFIX = 'Workflows/workflows_v2/uploads';
const SIGNED_UPLOAD_TTL_MS = 10 * 60 * 1000;

export type SignedWorkflowUpload = {
  uploadUrl: string;
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
  expiresAt: string;
};

export type WorkflowUploadObjectMetadata = {
  name?: string;
  contentType?: string;
  metadata?: Record<string, string | undefined>;
};

type CreateSignedWorkflowUploadInput =
  | {
      target?: 'form_field';
      workflowTypeId: string;
      fieldId: string;
      actorUserId: string;
      fileName: string;
      contentType: string;
    }
  | {
      target: 'action_response';
      workflowTypeId: string;
      requestId: number;
      stepId: string;
      actorUserId: string;
      fileName: string;
      contentType: string;
    };

function resolveStorageBucketName(): string {
  const app = getFirebaseAdminApp();
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    (typeof app.options.storageBucket === 'string' ? app.options.storageBucket : '');

  if (typeof bucketName !== 'string' || bucketName.trim() === '') {
    throw new RuntimeError(
      RuntimeErrorCode.STORAGE_NOT_CONFIGURED,
      'Bucket do Storage nao configurado no ambiente.',
      500,
    );
  }

  return bucketName.replace(/^gs:\/\//, '').trim();
}

function sanitizeUploadFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (trimmed === '') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      'Nome do arquivo obrigatorio.',
      400,
    );
  }

  const safeName = trimmed.replace(/[/\\]/g, '_').replace(/\.\./g, '__');

  try {
    sanitizeStoragePath(safeName);
  } catch {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      'Nome do arquivo invalido para upload.',
      400,
    );
  }

  return safeName;
}

function parseWorkflowUploadObjectPath(fileUrl: string): string | null {
  try {
    const parsed = new URL(fileUrl);

    if (parsed.hostname === 'firebasestorage.googleapis.com') {
      const match = parsed.pathname.match(/\/o\/(.+)$/);
      if (!match?.[1]) {
        return null;
      }

      return sanitizeStoragePath(decodeURIComponent(match[1]));
    }

    if (parsed.hostname === 'storage.googleapis.com') {
      const segments = parsed.pathname
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);

      if (segments.length < 2) {
        return null;
      }

      return sanitizeStoragePath(decodeURIComponent(segments.slice(1).join('/')));
    }

    return null;
  } catch {
    return null;
  }
}

function isAllowedWorkflowUploadPath(storagePath: string): boolean {
  return (
    storagePath === LEGACY_WORKFLOW_UPLOAD_PREFIX ||
    storagePath.startsWith(`${LEGACY_WORKFLOW_UPLOAD_PREFIX}/`) ||
    storagePath === WORKFLOW_RUNTIME_UPLOAD_PREFIX ||
    storagePath.startsWith(`${WORKFLOW_RUNTIME_UPLOAD_PREFIX}/`)
  );
}

export function assertAllowedWorkflowUploadPath(storagePath: string): string {
  let normalizedPath: string;

  try {
    normalizedPath = sanitizeStoragePath(storagePath);
  } catch {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action possui storagePath invalido.',
      400,
    );
  }

  if (!isAllowedWorkflowUploadPath(normalizedPath)) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action nao corresponde ao namespace oficial de uploads.',
      400,
    );
  }

  return normalizedPath;
}

export function assertAttachmentUrlMatchesStoragePath(
  fileUrl: string,
  storagePath: string,
): void {
  const normalizedPath = assertAllowedWorkflowUploadPath(storagePath);
  const parsedPath = parseWorkflowUploadObjectPath(fileUrl);

  if (!parsedPath || parsedPath !== normalizedPath) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action possui fileUrl inconsistente com o storagePath informado.',
      400,
    );
  }
}

export function assertUploadIdMatchesFileName(uploadId: string, storagePath: string): string {
  const normalizedUploadId = uploadId.trim();
  const normalizedPath = assertAllowedWorkflowUploadPath(storagePath);
  const fileName = normalizedPath.split('/').at(-1) ?? '';

  if (normalizedUploadId === '' || !fileName.startsWith(`${normalizedUploadId}-`)) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Anexo da action possui uploadId inconsistente com o arquivo informado.',
      400,
    );
  }

  return normalizedUploadId;
}

export async function readWorkflowUploadObjectMetadata(
  storagePath: string,
): Promise<WorkflowUploadObjectMetadata> {
  const app = getFirebaseAdminApp();
  const bucketName = resolveStorageBucketName();
  const normalizedPath = assertAllowedWorkflowUploadPath(storagePath);

  try {
    const bucket = getStorage(app).bucket(bucketName);
    const file = bucket.file(normalizedPath);
    const [metadata] = await file.getMetadata();

    return {
      name: typeof metadata.name === 'string' ? metadata.name : normalizedPath,
      contentType: typeof metadata.contentType === 'string' ? metadata.contentType : undefined,
      metadata:
        metadata.metadata && typeof metadata.metadata === 'object'
          ? Object.entries(metadata.metadata).reduce<Record<string, string | undefined>>(
              (accumulator, [key, value]) => {
                accumulator[key] = typeof value === 'string' ? value : undefined;
                return accumulator;
              },
              {},
            )
          : {},
    };
  } catch (error) {
    const storageError = error as { code?: unknown };

    if (storageError?.code === 404 || storageError?.code === '404') {
      throw new RuntimeError(
        RuntimeErrorCode.ACTION_RESPONSE_INVALID,
        'Anexo da action nao corresponde a um upload oficial existente.',
        400,
      );
    }

    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Nao foi possivel validar o anexo da action informada.',
      400,
    );
  }
}

/**
 * Creates a signed upload payload for a workflow file field.
 */
export async function createSignedWorkflowUpload(
  input: CreateSignedWorkflowUploadInput,
): Promise<SignedWorkflowUpload> {
  const app = getFirebaseAdminApp();
  const bucketName = resolveStorageBucketName();
  const uploadId = `upl_${randomUUID()}`;
  const downloadToken = randomUUID();
  const now = new Date();
  const yyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const safeFileName = sanitizeUploadFileName(input.fileName);
  const basePath = sanitizeStoragePath(
    input.target !== 'action_response'
      ? `${WORKFLOW_RUNTIME_UPLOAD_PREFIX}/form_field/${input.workflowTypeId}/${input.fieldId}`
      : `${WORKFLOW_RUNTIME_UPLOAD_PREFIX}/action_response/${input.workflowTypeId}/request_${input.requestId}/${input.stepId}`,
  );
  const storagePath = buildStorageFilePath(basePath, yyyyMm, `${uploadId}-${safeFileName}`);
  const expiresAtMs = now.getTime() + SIGNED_UPLOAD_TTL_MS;
  const uploadHeaders = {
    'Content-Type': input.contentType,
    'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
    'x-goog-meta-uploadid': uploadId,
    'x-goog-meta-target': input.target ?? 'form_field',
    'x-goog-meta-workflowtypeid': input.workflowTypeId,
    'x-goog-meta-actoruserid': input.actorUserId,
    ...(input.target !== 'action_response'
      ? {
          'x-goog-meta-fieldid': input.fieldId,
        }
      : {
          'x-goog-meta-requestid': String(input.requestId),
          'x-goog-meta-stepid': input.stepId,
        }),
  };

  try {
    const bucket = getStorage(app).bucket(bucketName);
    const file = bucket.file(storagePath);
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAtMs,
      contentType: input.contentType,
      extensionHeaders: uploadHeaders,
    });

    console.info('[workflows.runtime.uploads] signed-upload-created', {
      target: input.target ?? 'form_field',
      workflowTypeId: input.workflowTypeId,
      ...(input.target !== 'action_response'
        ? { fieldId: input.fieldId }
        : { requestId: input.requestId, stepId: input.stepId }),
      actorUserId: input.actorUserId,
      storagePath,
      status: 'success',
    });

    return {
      uploadUrl,
      uploadMethod: 'PUT',
      uploadHeaders,
      fileUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`,
      storagePath,
      uploadId,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  } catch (error) {
    console.error('[workflows.runtime.uploads] signed-upload-failed', {
      target: input.target ?? 'form_field',
      workflowTypeId: input.workflowTypeId,
      ...(input.target !== 'action_response'
        ? { fieldId: input.fieldId }
        : { requestId: input.requestId, stepId: input.stepId }),
      actorUserId: input.actorUserId,
      storagePath,
      status: 'error',
      error,
    });

    throw new RuntimeError(
      RuntimeErrorCode.UPLOAD_SIGNATURE_FAILED,
      'Nao foi possivel assinar o upload do arquivo.',
      500,
    );
  }
}
