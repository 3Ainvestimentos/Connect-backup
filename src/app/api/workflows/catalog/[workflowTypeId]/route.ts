import { NextResponse } from 'next/server';
import { getPublishedWorkflowMetadata } from '@/lib/workflows/catalog/published-metadata';
import type { WorkflowCatalogError, WorkflowCatalogSuccess } from '@/lib/workflows/catalog/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowTypeId: string }> },
) {
  try {
    const { workflowTypeId } = await params;
    const { actor } = await authenticateRuntimeActor(request);
    const data = await getPublishedWorkflowMetadata({
      workflowTypeId,
      actorUserId: actor.actorUserId,
    });

    const response: WorkflowCatalogSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      const response: WorkflowCatalogError = {
        ok: false,
        code: error.code,
        message: error.message,
      };
      return NextResponse.json(response, { status: error.httpStatus });
    }

    console.error(
      '[GET /api/workflows/catalog/[workflowTypeId]] Unexpected error:',
      error,
    );
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
