import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import { activatePublishedVersion } from '@/lib/workflows/admin-config/publication-service';
import { handleWorkflowConfigRouteError } from '@/lib/workflows/admin-config/route-helpers';
import type { WorkflowVersionTransitionSuccess } from '@/lib/workflows/admin-config/types';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';

function parseVersion(value: string) {
  const version = Number(value);
  if (!Number.isInteger(version) || version < 1) {
    throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'Versao invalida.', 422);
  }

  return version;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workflowTypeId: string; version: string }> },
) {
  try {
    const { collaborator } = await authenticateWorkflowConfigAdmin(request);
    const { workflowTypeId, version } = await context.params;
    const data = await activatePublishedVersion({
      workflowTypeId,
      version: parseVersion(version),
      actorUserId: collaborator.id3a?.trim() || collaborator.id,
      actorName: collaborator.name?.trim() || collaborator.email?.trim() || collaborator.id,
    });

    const response: WorkflowVersionTransitionSuccess = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleWorkflowConfigRouteError(
      'POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/activate',
      error,
    );
  }
}
