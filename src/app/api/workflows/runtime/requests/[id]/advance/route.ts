/**
 * @fileOverview POST /api/workflows/runtime/requests/{id}/advance
 *
 * Advances the request to the next non-final step.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { resolveRuntimeActor } from '@/lib/workflows/runtime/actor-resolution';
import { advanceStep } from '@/lib/workflows/runtime/use-cases/advance-step';
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

    // --- Authentication ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Token nao fornecido.' },
        { status: 401 },
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const app = getFirebaseAdminApp();
    const decodedToken = await getAuth(app).verifyIdToken(idToken);

    // --- Parse body ---
    const body = await request.json();
    const { actorName } = body;

    const actor = await resolveRuntimeActor(decodedToken);

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
