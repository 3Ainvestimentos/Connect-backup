import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { createOrReuseWorkflowDraft } from '@/lib/workflows/admin-config/draft-repository';
import type { CreateWorkflowDraftSuccess } from '@/lib/workflows/admin-config/types';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(
  request: Request,
  context: { params: Promise<{ workflowTypeId: string }> },
) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const { workflowTypeId } = await context.params;
    const data = await createOrReuseWorkflowDraft(workflowTypeId);

    const response: CreateWorkflowDraftSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response, { status: data.reusedExistingDraft ? 200 : 201 });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/admin/request-config/workflow-types/[workflowTypeId]/drafts] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
