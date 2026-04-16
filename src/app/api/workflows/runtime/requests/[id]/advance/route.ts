/**
 * @fileOverview POST /api/workflows/runtime/requests/{id}/advance
 *
 * Advances the request to the next non-final step.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { authenticateManagementV2Actor } from '@/lib/workflows/runtime/permission-auth';
import { advanceStep } from '@/lib/workflows/runtime/use-cases/advance-step';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseBody(request: Request): Promise<{ actorName?: string }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new RuntimeError(RuntimeErrorCode.INVALID_FORM_DATA, 'Body invalido.', 400);
  }

  if (!isObject(body)) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_FORM_DATA, 'Body invalido.', 400);
  }

  return {
    actorName: typeof body.actorName === 'string' ? body.actorName : undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const requestId = Number(id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_FORM_DATA', message: 'ID invalido.' },
        { status: 400 },
      );
    }

    const { actor } = await authenticateManagementV2Actor(request);

    // --- Parse body ---
    const body = await parseBody(request);

    // --- Execute use case ---
    const result = await advanceStep({
      requestId,
      actorUserId: actor.actorUserId,
      actorName:
        typeof actorName === 'string' && actorName.trim() !== ''
          ? actorName.trim()
          : actor.actorName,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/requests/[id]/advance] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
