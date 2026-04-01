import { NextResponse } from 'next/server';
import { getWorkflowRequestDetail } from '@/lib/workflows/read/detail';
import type { ReadError, ReadSuccess, WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await context.params;
    const parsedRequestId = Number(requestId);

    if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
      const response: ReadError = {
        ok: false,
        code: 'INVALID_REQUEST_ID',
        message: 'RequestId invalido.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { actor } = await authenticateRuntimeActor(request);
    const data = await getWorkflowRequestDetail(parsedRequestId, actor.actorUserId);

    const response: ReadSuccess<WorkflowRequestDetailData> = {
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

    console.error('[GET /api/workflows/read/requests/[requestId]] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
