import { NextResponse } from 'next/server';
import { parseWorkflowManagementFilters, ReadValidationError } from '@/lib/workflows/read/filters';
import { queryScopedCurrentQueue } from '@/lib/workflows/read/queries';
import {
  CURRENT_QUEUE_FILTERS,
  type CurrentQueueFilter,
  type ReadError,
  type ReadSuccess,
  type WorkflowCurrentReadData,
} from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

function isCurrentQueueFilter(value: string): value is CurrentQueueFilter {
  return CURRENT_QUEUE_FILTERS.includes(value as CurrentQueueFilter);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFilter = searchParams.get('filter') ?? 'all';

    if (!isCurrentQueueFilter(rawFilter)) {
      const error: ReadError = {
        ok: false,
        code: 'INVALID_FILTER',
        message: `Filtro invalido: ${rawFilter}.`,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const filters = parseWorkflowManagementFilters(searchParams);
    const { actor } = await authenticateRuntimeActor(request);
    const items = await queryScopedCurrentQueue(actor.actorUserId, rawFilter, filters);

    const response: ReadSuccess<WorkflowCurrentReadData> = {
      ok: true,
      data: {
        filter: rawFilter,
        items,
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

    console.error('[GET /api/workflows/read/current] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
