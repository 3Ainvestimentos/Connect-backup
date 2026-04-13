import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import { requestAction } from '@/lib/workflows/runtime/use-cases/request-action';

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
    const body = await request.json().catch(() => ({}));
    const actorName =
      typeof body.actorName === 'string' && body.actorName.trim() !== ''
        ? body.actorName.trim()
        : actor.actorName;

    const data = await requestAction({
      requestId,
      actorUserId: actor.actorUserId,
      actorName,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/requests/[id]/request-action] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
