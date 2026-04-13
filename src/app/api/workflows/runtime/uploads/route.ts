import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { initFileUpload } from '@/lib/workflows/runtime/use-cases/init-file-upload';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseUploadBody(request: Request): Promise<{
  target: 'form_field' | 'action_response';
  workflowTypeId?: string;
  fieldId?: string;
  requestId?: number;
  fileName: string;
  contentType: string;
}> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      'Body de upload invalido.',
      400,
    );
  }

  if (!isObject(body)) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_REQUEST,
      'Body de upload invalido.',
      400,
    );
  }

  const target =
    body.target === 'action_response'
      ? 'action_response'
      : body.target === 'form_field'
        ? 'form_field'
        : null;
  if (!target) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_UPLOAD_TARGET,
      'Target de upload invalido.',
      400,
    );
  }

  return {
    target,
    workflowTypeId: typeof body.workflowTypeId === 'string' ? body.workflowTypeId : undefined,
    fieldId: typeof body.fieldId === 'string' ? body.fieldId : undefined,
    requestId:
      typeof body.requestId === 'number' && Number.isInteger(body.requestId)
        ? body.requestId
        : undefined,
    fileName: typeof body.fileName === 'string' ? body.fileName : '',
    contentType: typeof body.contentType === 'string' ? body.contentType : '',
  };
}

export async function POST(request: Request) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const body = await parseUploadBody(request);
    const data =
      body.target === 'form_field'
        ? await initFileUpload({
            target: 'form_field',
            actorUserId: actor.actorUserId,
            workflowTypeId: body.workflowTypeId ?? '',
            fieldId: body.fieldId ?? '',
            fileName: body.fileName,
            contentType: body.contentType,
          })
        : await initFileUpload({
            target: 'action_response',
            actorUserId: actor.actorUserId,
            requestId: body.requestId ?? 0,
            fileName: body.fileName,
            contentType: body.contentType,
          });

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/uploads] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
