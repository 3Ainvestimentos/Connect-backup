import { NextResponse } from 'next/server';
import { authenticateWorkflowConfigAdmin } from '@/lib/workflows/admin-config/auth';
import {
  publishDraftVersion,
  VersionNotPublishableError,
} from '@/lib/workflows/admin-config/publication-service';
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
    const data = await publishDraftVersion({
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
    if (error instanceof VersionNotPublishableError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.message,
          issues: error.issues,
        },
        { status: error.httpStatus },
      );
    }

    return handleWorkflowConfigRouteError(
      'POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish',
      error,
    );
  }
}
