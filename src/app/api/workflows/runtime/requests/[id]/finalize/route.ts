/**
 * @fileOverview POST /api/workflows/runtime/requests/{id}/finalize
 *
 * Finalizes the request, moving it to the final step.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { authenticateManagementV2Actor } from '@/lib/workflows/runtime/permission-auth';
import { finalizeRequest } from '@/lib/workflows/runtime/use-cases/finalize-request';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

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
    const body = await request.json();
    const { actorName } = body;

    // --- Execute use case ---
    const result = await finalizeRequest({
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

    console.error('[POST /api/workflows/runtime/requests/[id]/finalize] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
