import { assertCanReadRequest } from '@/lib/workflows/runtime/authz';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import {
  getWorkflowRequestByRequestId,
  getWorkflowVersion,
} from '@/lib/workflows/runtime/repository';
import type {
  HistoryAction,
  HistoryEntry,
  StepState,
  VersionFieldDef,
  WorkflowRequestV2,
  WorkflowVersionV2,
} from '@/lib/workflows/runtime/types';
import { enrichWorkflowReadSummaryWithSlaState, normalizeReadTimestamp } from './filters';
import { mapWorkflowRequestToReadSummary } from './queries';
import type {
  WorkflowRequestAttachment,
  WorkflowRequestDetailData,
  WorkflowRequestDetailExtraField,
  WorkflowRequestDetailField,
  WorkflowRequestDetailPermissions,
  WorkflowRequestProgressItem,
  WorkflowRequestTimelineItem,
} from './types';

const TIMELINE_LABELS: Record<HistoryAction, string> = {
  request_opened: 'Solicitacao aberta',
  responsible_assigned: 'Responsavel atribuido',
  responsible_reassigned: 'Responsavel reatribuido',
  step_completed: 'Etapa concluida',
  entered_step: 'Entrada em etapa',
  request_finalized: 'Chamado finalizado',
  request_archived: 'Chamado arquivado',
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyDetailValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isPlainRecord(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

function isValidAttachmentUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function sortVersionFields(fields: VersionFieldDef[]): VersionFieldDef[] {
  return [...fields].sort((left, right) => left.order - right.order);
}

function buildDetailPermissions(
  request: WorkflowRequestV2,
  actorUserId: string,
): WorkflowRequestDetailPermissions {
  const isOwner = request.ownerUserId === actorUserId;
  const isResponsible =
    request.responsibleUserId != null && request.responsibleUserId === actorUserId;

  return {
    canAssign:
      isOwner &&
      request.statusCategory !== 'waiting_action' &&
      request.statusCategory !== 'finalized' &&
      request.statusCategory !== 'archived',
    canFinalize:
      (isOwner || isResponsible) && request.statusCategory === 'in_progress',
    canArchive:
      isOwner && request.statusCategory === 'finalized' && !request.isArchived,
  };
}

function buildDetailFormData(
  formData: Record<string, unknown>,
  version: WorkflowVersionV2,
): {
  fields: WorkflowRequestDetailField[];
  extraFields: WorkflowRequestDetailExtraField[];
} {
  const orderedFields = sortVersionFields(version.fields);
  const publishedFieldIds = new Set(version.fields.map((field) => field.id));

  const fields = orderedFields.reduce<WorkflowRequestDetailField[]>((accumulator, field) => {
    if (field.id.startsWith('_') || field.type === 'file') {
      return accumulator;
    }

    const value = formData[field.id];
    if (isEmptyDetailValue(value)) {
      return accumulator;
    }

    accumulator.push({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value,
    });

    return accumulator;
  }, []);

  const extraFields = Object.entries(formData).reduce<WorkflowRequestDetailExtraField[]>(
    (accumulator, [key, value]) => {
      if (key.startsWith('_') || publishedFieldIds.has(key) || isEmptyDetailValue(value)) {
        return accumulator;
      }

      accumulator.push({ key, value });
      return accumulator;
    },
    [],
  );

  return {
    fields,
    extraFields,
  };
}

function buildDetailAttachments(
  formData: Record<string, unknown>,
  version: WorkflowVersionV2,
): WorkflowRequestAttachment[] {
  return sortVersionFields(version.fields).reduce<WorkflowRequestAttachment[]>((accumulator, field) => {
    if (field.id.startsWith('_') || field.type !== 'file') {
      return accumulator;
    }

    const value = formData[field.id];
    if (typeof value !== 'string' || value.trim() === '' || !isValidAttachmentUrl(value)) {
      return accumulator;
    }

    accumulator.push({
      fieldId: field.id,
      label: field.label,
      url: value,
    });

    return accumulator;
  }, []);
}

function buildDetailProgress(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
): {
  currentStepId: string;
  totalSteps: number;
  completedSteps: number;
  items: WorkflowRequestProgressItem[];
} {
  const items = version.stepOrder.reduce<WorkflowRequestProgressItem[]>((accumulator, stepId, index) => {
    const step = version.stepsById[stepId];

    if (!step) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        `Versao publicada inconsistente: etapa "${stepId}" nao encontrada em stepsById.`,
        500,
      );
    }

    const state = (request.stepStates[stepId] ?? 'pending') as StepState;

    accumulator.push({
      stepId: step.stepId,
      stepName: step.stepName,
      statusKey: step.statusKey,
      kind: step.kind,
      order: index + 1,
      state,
      isCurrent: request.currentStepId === step.stepId,
    });

    return accumulator;
  }, []);

  return {
    currentStepId: request.currentStepId,
    totalSteps: items.length,
    completedSteps: items.filter((item) => item.state === 'completed').length,
    items,
  };
}

function buildDetailTimeline(history: HistoryEntry[]): WorkflowRequestTimelineItem[] {
  return [...history]
    .sort((left, right) => {
      const leftTime = normalizeReadTimestamp(left.timestamp)?.getTime() ?? 0;
      const rightTime = normalizeReadTimestamp(right.timestamp)?.getTime() ?? 0;
      return leftTime - rightTime;
    })
    .map((entry) => ({
      action: entry.action,
      label: TIMELINE_LABELS[entry.action] ?? entry.action,
      timestamp: entry.timestamp,
      userId: entry.userId,
      userName: entry.userName,
      details: isPlainRecord(entry.details) ? entry.details : {},
    }));
}

export function buildWorkflowRequestDetail(input: {
  docId: string;
  request: WorkflowRequestV2;
  version: WorkflowVersionV2;
  actorUserId: string;
}): WorkflowRequestDetailData {
  const { docId, request, version, actorUserId } = input;

  return {
    summary: enrichWorkflowReadSummaryWithSlaState(
      mapWorkflowRequestToReadSummary(docId, request),
    ),
    permissions: buildDetailPermissions(request, actorUserId),
    formData: buildDetailFormData(request.formData ?? {}, version),
    attachments: buildDetailAttachments(request.formData ?? {}, version),
    progress: buildDetailProgress(request, version),
    timeline: buildDetailTimeline(request.history ?? []),
  };
}

export async function getWorkflowRequestDetail(
  requestId: number,
  actorUserId: string,
): Promise<WorkflowRequestDetailData> {
  const requestEntry = await getWorkflowRequestByRequestId(requestId);

  if (!requestEntry) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Request nao encontrado.', 404);
  }

  const request = requestEntry.data;
  assertCanReadRequest(request, actorUserId);

  const version = await getWorkflowVersion(request.workflowTypeId, request.workflowVersion);

  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      'Versao publicada do request nao encontrada.',
      500,
    );
  }

  return buildWorkflowRequestDetail({
    docId: requestEntry.docId,
    request,
    version,
    actorUserId,
  });
}
