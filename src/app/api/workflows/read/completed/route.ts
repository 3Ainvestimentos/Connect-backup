import { NextResponse } from 'next/server';
import { parseWorkflowManagementFilters, ReadValidationError } from '@/lib/workflows/read/filters';
import { groupWorkflowsByMonth, queryScopedCompletedHistory } from '@/lib/workflows/read/queries';
import type { ReadError, ReadSuccess, WorkflowGroupedReadData } from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseWorkflowManagementFilters(searchParams);
    const { actor } = await authenticateRuntimeActor(request);
    const items = await queryScopedCompletedHistory(actor.actorUserId, filters);

    const response: ReadSuccess<WorkflowGroupedReadData> = {
      ok: true,
      data: {
        items,
        groups: groupWorkflowsByMonth(items, 'closedMonthKey'),
      },
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

    console.error('[GET /api/workflows/read/completed] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
