/**
 * @fileOverview POST /api/workflows/runtime/requests/{id}/assign
 *
 * Assigns or reassigns a responsible to the request.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { assignResponsible } from '@/lib/workflows/runtime/use-cases/assign-responsible';
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

    const { actor } = await authenticateRuntimeActor(request);

    // --- Parse body ---
    const body = await request.json();
    const { responsibleUserId, responsibleName, actorName } = body;

    if (!responsibleUserId || !responsibleName) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_FORM_DATA',
          message: 'Campos obrigatorios ausentes: responsibleUserId, responsibleName.',
        },
        { status: 400 },
      );
    }

    // --- Execute use case ---
    const result = await assignResponsible({
      requestId,
      responsibleUserId,
      responsibleName,
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

    console.error('[POST /api/workflows/runtime/requests/[id]/assign] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
