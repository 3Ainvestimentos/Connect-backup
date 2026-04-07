import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { respondAction } from '@/lib/workflows/runtime/use-cases/respond-action';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseBody(request: Request): Promise<{
  actorName?: string;
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
  comment?: string;
  attachment?: {
    fileName: string;
    contentType: string;
    fileUrl: string;
    storagePath: string;
    uploadId?: string;
  };
}> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new RuntimeError(RuntimeErrorCode.INVALID_FORM_DATA, 'Body invalido.', 400);
  }

  if (!isObject(body)) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_FORM_DATA, 'Body invalido.', 400);
  }

  const attachment = isObject(body.attachment) ? body.attachment : null;
  const response =
    body.response === 'approved' ||
    body.response === 'rejected' ||
    body.response === 'acknowledged' ||
    body.response === 'executed'
      ? body.response
      : null;

  if (!response) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_RESPONSE_INVALID,
      'Resposta de action invalida.',
      400,
    );
  }

  return {
    actorName: typeof body.actorName === 'string' ? body.actorName : undefined,
    response,
    comment: typeof body.comment === 'string' ? body.comment : undefined,
    attachment: attachment
      ? {
          fileName: typeof attachment.fileName === 'string' ? attachment.fileName : '',
          contentType: typeof attachment.contentType === 'string' ? attachment.contentType : '',
          fileUrl: typeof attachment.fileUrl === 'string' ? attachment.fileUrl : '',
          storagePath: typeof attachment.storagePath === 'string' ? attachment.storagePath : '',
          ...(typeof attachment.uploadId === 'string' ? { uploadId: attachment.uploadId } : {}),
        }
      : undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_FORM_DATA', message: 'ID invalido.' },
        { status: 400 },
      );
    }

    const { actor } = await authenticateRuntimeActor(request);
    const body = await parseBody(request);
    const actorName =
      typeof body.actorName === 'string' && body.actorName.trim() !== ''
        ? body.actorName.trim()
        : actor.actorName;

    const data = await respondAction({
      requestId,
      actorUserId: actor.actorUserId,
      actorName,
      response: body.response,
      comment: body.comment,
      attachment: body.attachment,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/requests/[id]/respond-action] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
