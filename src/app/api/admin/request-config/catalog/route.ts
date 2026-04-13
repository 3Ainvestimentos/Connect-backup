import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { buildWorkflowConfigCatalog } from '@/lib/workflows/admin-config/catalog';
import { handleWorkflowConfigRouteError } from '@/lib/workflows/admin-config/route-helpers';
import type { WorkflowConfigCatalogSuccess } from '@/lib/workflows/admin-config/types';

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
    return handleWorkflowConfigRouteError('GET /api/admin/request-config/catalog', error);
  }
}
