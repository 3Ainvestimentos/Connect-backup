import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { buildWorkflowConfigCatalog } from '@/lib/workflows/admin-config/catalog';
import type {
  WorkflowConfigCatalogError,
  WorkflowConfigCatalogSuccess,
} from '@/lib/workflows/admin-config/types';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const data = await buildWorkflowConfigCatalog();

    const response: WorkflowConfigCatalogSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      const response: WorkflowConfigCatalogError = {
        ok: false,
        code: error.code,
        message: error.message,
      };

      return NextResponse.json(response, { status: error.httpStatus });
    }

    console.error('[GET /api/admin/request-config/catalog] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
