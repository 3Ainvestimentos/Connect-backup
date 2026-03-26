/**
 * @fileOverview POST /api/workflows/runtime/requests
 *
 * Opens a new workflow request.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { resolveRuntimeActor } from '@/lib/workflows/runtime/actor-resolution';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';
import { openRequest } from '@/lib/workflows/runtime/use-cases/open-request';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyBearerToken(request);

    // --- Parse body ---
    const body = await request.json();
    const { workflowTypeId, formData, requesterName } = body;

    if (!workflowTypeId || !formData) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_FORM_DATA',
          message: 'Campos obrigatorios ausentes: workflowTypeId, formData.',
        },
        { status: 400 },
      );
    }

    const actor = await resolveRuntimeActor(decodedToken);

    // --- Execute use case ---
    const result = await openRequest({
      workflowTypeId,
      formData,
      requesterUserId: actor.actorUserId,
      requesterName:
        typeof requesterName === 'string' && requesterName.trim() !== ''
          ? requesterName.trim()
          : actor.actorName,
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/requests] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
