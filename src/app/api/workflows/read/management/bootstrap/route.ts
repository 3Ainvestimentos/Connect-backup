import { NextResponse } from 'next/server';
import { buildWorkflowManagementBootstrap } from '@/lib/workflows/read/bootstrap';
import type { ReadError, ReadSuccess, WorkflowManagementBootstrapData } from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const data = await buildWorkflowManagementBootstrap(actor);

    const response: ReadSuccess<WorkflowManagementBootstrapData> = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      const response: ReadError = {
        ok: false,
        code: error.code,
        message: error.message,
      };
      return NextResponse.json(response, { status: error.httpStatus });
    }

    console.error('[GET /api/workflows/read/management/bootstrap] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
