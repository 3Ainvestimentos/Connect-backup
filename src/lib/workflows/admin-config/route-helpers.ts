import { NextResponse } from 'next/server';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import type { RuntimeErrorResponse } from '@/lib/workflows/runtime/types';

export function handleWorkflowConfigRouteError(scope: string, error: unknown) {
  if (error instanceof RuntimeError) {
    const response: RuntimeErrorResponse = {
      ok: false,
      code: error.code,
      message: error.message,
    };

    return NextResponse.json(response, { status: error.httpStatus });
  }

  console.error(`[${scope}] Unexpected error:`, error);
  return NextResponse.json(
    { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
    { status: 500 },
  );
}
