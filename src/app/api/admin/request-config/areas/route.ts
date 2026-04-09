import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { createWorkflowArea } from '@/lib/workflows/admin-config/draft-repository';
import type { CreateWorkflowAreaInput, CreateWorkflowAreaSuccess } from '@/lib/workflows/admin-config/types';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(request: Request) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const payload = (await request.json()) as CreateWorkflowAreaInput;
    const data = await createWorkflowArea(payload);

    const response: CreateWorkflowAreaSuccess = {
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

    console.error('[POST /api/admin/request-config/areas] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
