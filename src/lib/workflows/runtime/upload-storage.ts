import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { buildStorageFilePath, sanitizeStoragePath } from '@/lib/path-sanitizer';
import { RuntimeError, RuntimeErrorCode } from './errors';

const FACILITIES_WORKFLOW_UPLOAD_PREFIX =
  'Workflows/Facilities e Suprimentos/workflows_v2/preopen';
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

type CreateSignedWorkflowUploadInput = {
  workflowTypeId: string;
  fieldId: string;
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
    `${FACILITIES_WORKFLOW_UPLOAD_PREFIX}/${input.workflowTypeId}/${input.fieldId}`,
  );
  const storagePath = buildStorageFilePath(basePath, yyyyMm, `${uploadId}-${safeFileName}`);
  const expiresAtMs = now.getTime() + SIGNED_UPLOAD_TTL_MS;
  const uploadHeaders = {
    'Content-Type': input.contentType,
    'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
    'x-goog-meta-uploadid': uploadId,
    'x-goog-meta-workflowtypeid': input.workflowTypeId,
    'x-goog-meta-fieldid': input.fieldId,
    'x-goog-meta-actoruserid': input.actorUserId,
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
      workflowTypeId: input.workflowTypeId,
      fieldId: input.fieldId,
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
      workflowTypeId: input.workflowTypeId,
      fieldId: input.fieldId,
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
