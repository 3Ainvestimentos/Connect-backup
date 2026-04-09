import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { getWorkflowDraftEditorData, saveWorkflowDraft } from '@/lib/workflows/admin-config/draft-repository';
import type { SaveWorkflowDraftInput, SaveWorkflowDraftSuccess, WorkflowDraftEditorSuccess } from '@/lib/workflows/admin-config/types';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

function parseVersion(value: string) {
  const version = Number(value);
  if (!Number.isInteger(version) || version < 1) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Versao de rascunho invalida.', 422);
  }
  return version;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ workflowTypeId: string; version: string }> },
) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const { workflowTypeId, version } = await context.params;
    const data = await getWorkflowDraftEditorData(workflowTypeId, parseVersion(version));

    const response: WorkflowDraftEditorSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ workflowTypeId: string; version: string }> },
) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const { workflowTypeId, version } = await context.params;
    const payload = (await request.json()) as SaveWorkflowDraftInput;
    const data = await saveWorkflowDraft(workflowTypeId, parseVersion(version), payload);

    const response: SaveWorkflowDraftSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
