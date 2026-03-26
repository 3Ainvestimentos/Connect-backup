import { NextResponse } from 'next/server';
import { groupWorkflowsByMonth, queryRequesterHistory } from '@/lib/workflows/read/queries';
import type { ReadError, ReadSuccess, WorkflowGroupedReadData } from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const items = await queryRequesterHistory(actor.actorUserId);

    const response: ReadSuccess<WorkflowGroupedReadData> = {
      ok: true,
      data: {
        items,
        groups: groupWorkflowsByMonth(items, 'submittedMonthKey'),
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

    console.error('[GET /api/workflows/read/mine] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
