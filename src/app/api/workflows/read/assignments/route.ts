import { NextResponse } from 'next/server';
import { parseWorkflowManagementFilters, ReadValidationError } from '@/lib/workflows/read/filters';
import { queryScopedAssignments } from '@/lib/workflows/read/queries';
import type { ReadError, ReadSuccess, WorkflowAssignmentsReadData } from '@/lib/workflows/read/types';
import { authenticateManagementV2Actor } from '@/lib/workflows/runtime/permission-auth';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseWorkflowManagementFilters(searchParams);
    const { actor } = await authenticateManagementV2Actor(request);
    const data = await queryScopedAssignments(actor.actorUserId, filters);

    const response: ReadSuccess<WorkflowAssignmentsReadData> = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ReadValidationError) {
      const response: ReadError = {
        ok: false,
        code: error.code,
        message: error.message,
      };
      return NextResponse.json(response, { status: error.httpStatus });
    }

    if (error instanceof RuntimeError) {
      const response: ReadError = {
        ok: false,
        code: error.code,
        message: error.message,
      };
      return NextResponse.json(response, { status: error.httpStatus });
    }

    console.error('[GET /api/workflows/read/assignments] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
