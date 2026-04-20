import { assertCanReadRequest } from '@/lib/workflows/runtime/authz';
import {
  describeCurrentStepAction,
  findPendingActionForActor,
  getDisplayActionBatchEntriesForCurrentStep,
} from '@/lib/workflows/runtime/action-helpers';
import { canOperateCurrentStep } from '@/lib/workflows/runtime/authz';
import { getRequestContinuationState } from '@/lib/workflows/runtime/continuation';
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
  WorkflowActionRequest,
  WorkflowRequestV2,
  WorkflowVersionV2,
} from '@/lib/workflows/runtime/types';
import { enrichWorkflowReadSummaryWithSlaState, normalizeReadTimestamp } from './filters';
import { getWorkflowAreaLabel, mapWorkflowRequestToReadSummary } from './queries';
import type {
  TimestampLike,
  WorkflowRequestAttachment,
  WorkflowRequestActionDetail,
  WorkflowRequestDetailData,
  WorkflowRequestDetailExtraField,
  WorkflowRequestDetailField,
  WorkflowRequestDetailPermissions,
  WorkflowRequestProgressItem,
  WorkflowRequestStepActionResponse,
  WorkflowRequestStepEvent,
  WorkflowRequestStepHistoryItem,
  WorkflowRequestTimelineItem,
} from './types';

const TIMELINE_LABELS: Record<HistoryAction, string> = {
  request_opened: 'Solicitacao aberta',
  responsible_assigned: 'Responsavel atribuido',
  responsible_reassigned: 'Responsavel reatribuido',
  step_completed: 'Etapa concluida',
  entered_step: 'Entrada em etapa',
  action_requested: 'Action solicitada',
  action_approved: 'Action aprovada',
  action_rejected: 'Action rejeitada',
  action_acknowledged: 'Action registrada',
  action_executed: 'Action executada',
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

function extractAttachmentUrl(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized !== '' && isValidAttachmentUrl(normalized) ? normalized : null;
  }

  if (!isPlainRecord(value)) {
    return null;
  }

  const fileUrl = typeof value.fileUrl === 'string' ? value.fileUrl.trim() : '';
  return fileUrl !== '' && isValidAttachmentUrl(fileUrl) ? fileUrl : null;
}

function extractAttachmentFileName(value: unknown): string | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const fileName = typeof value.fileName === 'string' ? value.fileName.trim() : '';
  return fileName !== '' ? fileName : undefined;
}

function sortVersionFields(fields: VersionFieldDef[]): VersionFieldDef[] {
  return [...fields].sort((left, right) => left.order - right.order);
}

function buildDetailPermissions(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
  actorUserId: string,
): WorkflowRequestDetailPermissions {
  const isOwner = request.ownerUserId === actorUserId;
  const canOperate = canOperateCurrentStep(
    request.ownerUserId,
    request.responsibleUserId,
    actorUserId,
  );
  const actionDescription = describeCurrentStepAction(version, request);
  const continuation = getRequestContinuationState(request, version);
  const pendingActionForActor = findPendingActionForActor(request, actorUserId);
  const canRequestAction =
    canOperate &&
    request.statusCategory === 'in_progress' &&
    continuation.currentStepIsActive &&
    actionDescription.available &&
    !actionDescription.configurationError &&
    !continuation.hasAnyActionBatch;
  const canRespondAction = Boolean(pendingActionForActor);

  return {
    canAssign:
      isOwner &&
      request.statusCategory !== 'waiting_action' &&
      request.statusCategory !== 'finalized' &&
      request.statusCategory !== 'archived',
    canAdvance: canOperate && continuation.canAdvanceByState,
    canFinalize: canOperate && continuation.canFinalizeByState,
    canArchive:
      isOwner && request.statusCategory === 'finalized' && !request.isArchived,
    canRequestAction,
    canRespondAction,
  };
}

function buildAdminDetailPermissions(): WorkflowRequestDetailPermissions {
  return {
    canAssign: false,
    canAdvance: false,
    canFinalize: false,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
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
      order: field.order,
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

    const url = extractAttachmentUrl(formData[field.id]);
    if (!url) {
      return accumulator;
    }

    accumulator.push({
      fieldId: field.id,
      label: field.label,
      url,
      ...(extractAttachmentFileName(formData[field.id]) ? { fileName: extractAttachmentFileName(formData[field.id]) } : {}),
      order: field.order,
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

function buildDetailSummary(
  docId: string,
  request: WorkflowRequestV2,
  areaLabel?: string | null,
) {
  const base = enrichWorkflowReadSummaryWithSlaState(
    mapWorkflowRequestToReadSummary(docId, request),
  );

  return {
    ...base,
    areaLabel: areaLabel?.trim() || base.areaId,
  };
}

function buildActionRecipients(entries: WorkflowActionRequest[], actorUserId: string, request: WorkflowRequestV2) {
  const canSeeResponseAttachment =
    actorUserId === request.ownerUserId ||
    (request.responsibleUserId != null && actorUserId === request.responsibleUserId);

  return entries.map((entry) => ({
    actionRequestId: entry.actionRequestId,
    recipientUserId: entry.recipientUserId,
    status: entry.status,
    respondedAt: entry.respondedAt ?? null,
    respondedByUserId: entry.respondedByUserId ?? null,
    respondedByName: entry.respondedByName ?? null,
    ...(typeof entry.responseComment === 'string' && entry.responseComment.trim() !== ''
      ? { responseComment: entry.responseComment }
      : {}),
    ...(canSeeResponseAttachment &&
    typeof entry.responseAttachment?.fileUrl === 'string' &&
    entry.responseAttachment.fileUrl.trim() !== ''
      ? { responseAttachmentUrl: entry.responseAttachment.fileUrl }
      : {}),
    }));
}

function mapHistoryEntryToStepEvent(entry: HistoryEntry): WorkflowRequestStepEvent {
  return {
    action: entry.action,
    label: TIMELINE_LABELS[entry.action] ?? entry.action,
    timestamp: entry.timestamp,
    userId: entry.userId,
    userName: entry.userName,
  };
}

function mapActionRequestToStepResponse(
  entry: WorkflowActionRequest,
  actorUserId: string,
  request: WorkflowRequestV2,
): WorkflowRequestStepActionResponse {
  const canSeeResponseAttachment =
    actorUserId === request.ownerUserId ||
    (request.responsibleUserId != null && actorUserId === request.responsibleUserId);

  return {
    actionRequestId: entry.actionRequestId,
    recipientUserId: entry.recipientUserId,
    status: entry.status,
    respondedAt: entry.respondedAt ?? null,
    respondedByUserId: entry.respondedByUserId ?? null,
    respondedByName: entry.respondedByName ?? null,
    ...(typeof entry.responseComment === 'string' && entry.responseComment.trim() !== ''
      ? { responseComment: entry.responseComment }
      : {}),
    ...(canSeeResponseAttachment &&
    typeof entry.responseAttachment?.fileUrl === 'string' &&
    entry.responseAttachment.fileUrl.trim() !== ''
      ? { responseAttachmentUrl: entry.responseAttachment.fileUrl }
      : {}),
  };
}

function buildDetailStepsHistory(
  request: WorkflowRequestV2,
  progressItems: WorkflowRequestProgressItem[],
  actorUserId: string,
): WorkflowRequestStepHistoryItem[] {
  const history = request.history ?? [];
  const actionRequests = request.actionRequests ?? [];

  return progressItems.map((item) => ({
    stepId: item.stepId,
    stepName: item.stepName,
    kind: item.kind,
    order: item.order,
    state: item.state,
    isCurrent: item.isCurrent,
    events: history
      .filter((entry) => entry.details?.stepId === item.stepId)
      .map(mapHistoryEntryToStepEvent),
    actionResponses: actionRequests
      .filter((entry) => entry.stepId === item.stepId)
      .map((entry) => mapActionRequestToStepResponse(entry, actorUserId, request)),
  }));
}

function buildAdminActionRecipients(entries: WorkflowActionRequest[]) {
  return entries.map((entry) => ({
    actionRequestId: entry.actionRequestId,
    recipientUserId: entry.recipientUserId,
    status: entry.status,
    respondedAt: entry.respondedAt ?? null,
    respondedByUserId: entry.respondedByUserId ?? null,
    respondedByName: entry.respondedByName ?? null,
    ...(typeof entry.responseComment === 'string' && entry.responseComment.trim() !== ''
      ? { responseComment: entry.responseComment }
      : {}),
  }));
}

function resolveCompletedAt(entries: WorkflowActionRequest[]): TimestampLike {
  let latest: TimestampLike = null;

  for (const entry of entries) {
    if (!entry.respondedAt) {
      continue;
    }

    if (!latest) {
      latest = entry.respondedAt;
      continue;
    }

    const entryTime = normalizeReadTimestamp(entry.respondedAt)?.getTime() ?? 0;
    const latestTime = normalizeReadTimestamp(latest)?.getTime() ?? 0;
    if (entryTime > latestTime) {
      latest = entry.respondedAt;
    }
  }

  return latest;
}

function buildConfiguredRecipients(
  actionDescription: ReturnType<typeof describeCurrentStepAction>,
): WorkflowRequestActionDetail['configuredRecipients'] {
  if (!actionDescription.available || actionDescription.configurationError) {
    return [];
  }

  return actionDescription.approverIds.map((recipientUserId) => ({
    recipientUserId,
  }));
}

function buildDetailAction(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
  permissions: WorkflowRequestDetailPermissions,
  actorUserId: string,
): WorkflowRequestActionDetail {
  const actionDescription = describeCurrentStepAction(version, request);
  const batchEntries = getDisplayActionBatchEntriesForCurrentStep(request);
  const requestedEntry = batchEntries[0] ?? null;
  const hasPending = batchEntries.some((entry) => entry.status === 'pending');
  const hasHistory = batchEntries.length > 0;

  if (!actionDescription.available) {
    return {
      available: false,
      state: 'idle',
      batchId: null,
      type: null,
      label: null,
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configuredRecipients: [],
      configurationError: null,
    };
  }

  return {
    available: true,
    state: hasPending ? 'pending' : hasHistory ? 'completed' : 'idle',
    batchId: requestedEntry?.actionBatchId ?? null,
    type: actionDescription.action.type,
    label: actionDescription.action.label,
    commentRequired: actionDescription.commentRequired,
    attachmentRequired: actionDescription.attachmentRequired,
    commentPlaceholder: actionDescription.commentPlaceholder,
    attachmentPlaceholder: actionDescription.attachmentPlaceholder,
    canRequest: permissions.canRequestAction,
    canRespond: permissions.canRespondAction,
    requestedAt: requestedEntry?.requestedAt ?? null,
    completedAt: hasPending ? null : resolveCompletedAt(batchEntries),
    requestedByUserId: requestedEntry?.requestedByUserId ?? null,
    requestedByName: requestedEntry?.requestedByName ?? null,
    recipients: buildActionRecipients(batchEntries, actorUserId, request),
    configuredRecipients: buildConfiguredRecipients(actionDescription),
    configurationError: actionDescription.configurationError,
  };
}

function buildAdminDetailAction(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
): WorkflowRequestActionDetail {
  const actionDescription = describeCurrentStepAction(version, request);
  const batchEntries = getDisplayActionBatchEntriesForCurrentStep(request);
  const requestedEntry = batchEntries[0] ?? null;
  const hasPending = batchEntries.some((entry) => entry.status === 'pending');
  const hasHistory = batchEntries.length > 0;

  if (!actionDescription.available) {
    return {
      available: false,
      state: 'idle',
      batchId: null,
      type: null,
      label: null,
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configuredRecipients: [],
      configurationError: null,
    };
  }

  return {
    available: true,
    state: hasPending ? 'pending' : hasHistory ? 'completed' : 'idle',
    batchId: requestedEntry?.actionBatchId ?? null,
    type: actionDescription.action.type,
    label: actionDescription.action.label,
    commentRequired: actionDescription.commentRequired,
    attachmentRequired: actionDescription.attachmentRequired,
    commentPlaceholder: actionDescription.commentPlaceholder,
    attachmentPlaceholder: actionDescription.attachmentPlaceholder,
    canRequest: false,
    canRespond: false,
    requestedAt: requestedEntry?.requestedAt ?? null,
    completedAt: hasPending ? null : resolveCompletedAt(batchEntries),
    requestedByUserId: requestedEntry?.requestedByUserId ?? null,
    requestedByName: requestedEntry?.requestedByName ?? null,
    recipients: buildAdminActionRecipients(batchEntries),
    configuredRecipients: buildConfiguredRecipients(actionDescription),
    configurationError: actionDescription.configurationError,
  };
}

export function buildWorkflowRequestDetail(input: {
  docId: string;
  request: WorkflowRequestV2;
  version: WorkflowVersionV2;
  actorUserId: string;
  areaLabel?: string | null;
}): WorkflowRequestDetailData {
  const { docId, request, version, actorUserId, areaLabel } = input;
  const permissions = buildDetailPermissions(request, version, actorUserId);
  const progress = buildDetailProgress(request, version);

  return {
    summary: buildDetailSummary(docId, request, areaLabel),
    permissions,
    formData: buildDetailFormData(request.formData ?? {}, version),
    attachments: buildDetailAttachments(request.formData ?? {}, version),
    progress,
    action: buildDetailAction(request, version, permissions, actorUserId),
    timeline: buildDetailTimeline(request.history ?? []),
    stepsHistory: buildDetailStepsHistory(request, progress.items, actorUserId),
  };
}

export function buildAdminWorkflowRequestDetail(input: {
  docId: string;
  request: WorkflowRequestV2;
  version: WorkflowVersionV2;
}): WorkflowRequestDetailData {
  const { docId, request, version } = input;
  const permissions = buildAdminDetailPermissions();

  return {
    summary: enrichWorkflowReadSummaryWithSlaState(
      mapWorkflowRequestToReadSummary(docId, request),
    ),
    permissions,
    formData: buildDetailFormData(request.formData ?? {}, version),
    attachments: buildDetailAttachments(request.formData ?? {}, version),
    progress: buildDetailProgress(request, version),
    action: buildAdminDetailAction(request, version),
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

  const areaLabel = await getWorkflowAreaLabel(request.areaId);

  return buildWorkflowRequestDetail({
    docId: requestEntry.docId,
    request,
    version,
    actorUserId,
    areaLabel,
  });
}
