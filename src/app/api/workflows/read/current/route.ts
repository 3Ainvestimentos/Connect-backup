import { NextResponse } from 'next/server';
import { queryOwnerCurrentQueue } from '@/lib/workflows/read/queries';
import {
  CURRENT_QUEUE_FILTERS,
  type CurrentQueueFilter,
  type ReadError,
  type ReadSuccess,
  type WorkflowCurrentReadData,
} from '@/lib/workflows/read/types';
import { resolveRuntimeActor } from '@/lib/workflows/runtime/actor-resolution';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';

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

    const decodedToken = await verifyBearerToken(request);
    const actor = await resolveRuntimeActor(decodedToken);
    const items = await queryOwnerCurrentQueue(actor.actorUserId, rawFilter);

    const response: ReadSuccess<WorkflowCurrentReadData> = {
      ok: true,
      data: {
        filter: rawFilter,
        items,
      },
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

    console.error('[GET /api/workflows/read/current] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
