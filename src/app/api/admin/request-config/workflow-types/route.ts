import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { createWorkflowTypeWithDraft } from '@/lib/workflows/admin-config/draft-repository';
import type { CreateWorkflowTypeInput, CreateWorkflowTypeSuccess } from '@/lib/workflows/admin-config/types';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(request: Request) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const payload = (await request.json()) as CreateWorkflowTypeInput;
    const data = await createWorkflowTypeWithDraft(payload);

    const response: CreateWorkflowTypeSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/admin/request-config/workflow-types] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
