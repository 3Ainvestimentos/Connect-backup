/**
 * @fileOverview POST /api/workflows/runtime/requests
 *
 * Opens a new workflow request.
 * Auth: Bearer token (Firebase Admin verification).
 */

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { openRequest } from '@/lib/workflows/runtime/use-cases/open-request';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(request: Request) {
  try {
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
    const { workflowTypeId, formData, requesterName } = body;

    if (!workflowTypeId || !formData || !requesterName) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_FORM_DATA',
          message: 'Campos obrigatorios ausentes: workflowTypeId, formData, requesterName.',
        },
        { status: 400 },
      );
    }

    // --- Execute use case ---
    const result = await openRequest({
      workflowTypeId,
      formData,
      requesterUserId: decodedToken.uid,
      requesterName,
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
