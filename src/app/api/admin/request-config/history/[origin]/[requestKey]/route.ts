import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { getAdminHistoryDetail } from '@/lib/workflows/admin-config/history-service';
import { type AdminHistoryDetailSuccess, type AdminHistoryOrigin } from '@/lib/workflows/admin-config/history-types';
import { handleWorkflowConfigRouteError } from '@/lib/workflows/admin-config/route-helpers';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

export async function GET(
  request: Request,
  context: { params: Promise<{ origin: string; requestKey: string }> },
) {
  try {
    await authenticateWorkflowConfigAdmin(request);
    const { origin, requestKey } = await context.params;
    if (origin !== 'legacy' && origin !== 'v2') {
      throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Origem de historico invalida.', 400);
    }
    const data = await getAdminHistoryDetail(origin as AdminHistoryOrigin, requestKey);

    const response: AdminHistoryDetailSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleWorkflowConfigRouteError(
      'GET /api/admin/request-config/history/[origin]/[requestKey]',
      error,
    );
  }
}
