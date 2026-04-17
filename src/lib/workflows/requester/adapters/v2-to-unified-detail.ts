import type {
  WorkflowRequestDetailData,
  WorkflowRequestAttachment,
  WorkflowRequestTimelineItem,
} from '@/lib/workflows/read/types';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import type {
  RequesterUnifiedV2Detail,
  RequesterUnifiedRequestDetailField,
  RequesterUnifiedRequestDetailAttachment,
  RequesterUnifiedRequestDetailTimelineItem,
} from '../unified-types';

function adaptFields(
  fields: WorkflowRequestDetailData['formData']['fields'],
): RequesterUnifiedRequestDetailField[] {
  return fields.map((f) => ({
    fieldId: f.fieldId,
    label: f.label,
    value: f.value,
    type: f.type,
  }));
}

function adaptAttachments(
  attachments: WorkflowRequestAttachment[],
): RequesterUnifiedRequestDetailAttachment[] {
  return attachments.map((a) => ({
    fieldId: a.fieldId,
    label: a.label,
    url: a.url,
  }));
}

function adaptTimeline(
  timeline: WorkflowRequestTimelineItem[],
): RequesterUnifiedRequestDetailTimelineItem[] {
  return timeline.map((item) => ({
    action: item.action,
    label: item.label,
    timestamp: normalizeReadTimestamp(item.timestamp),
    userName: item.userName,
    details: item.details ?? null,
    notes: item.details ? JSON.stringify(item.details, null, 2) : undefined,
  }));
}

export function v2ReadDetailToUnifiedDetail(
  detail: WorkflowRequestDetailData,
  areaLabelById?: Map<string, string>,
): RequesterUnifiedV2Detail {
  const openedInLabel =
    areaLabelById?.get(detail.summary.areaId) ??
    detail.summary.areaId ??
    '-';

  const statusLabel =
    detail.summary.currentStepName?.trim() ||
    detail.summary.currentStatusKey ||
    '-';

  return {
    origin: 'v2',
    detailKey: `v2:${detail.summary.requestId}`,
    summary: {
      requesterName: detail.summary.requesterName ?? '-',
      workflowName: detail.summary.workflowName ?? detail.summary.workflowTypeId ?? '-',
      displayRequestId: String(detail.summary.requestId),
      submittedAt: detail.summary.submittedAt
        ? normalizeReadTimestamp(detail.summary.submittedAt)
        : null,
      lastUpdatedAt: detail.summary.lastUpdatedAt
        ? normalizeReadTimestamp(detail.summary.lastUpdatedAt)
        : null,
      responsibleName: detail.summary.responsibleName ?? null,
      openedInLabel,
      statusLabel,
      currentStepName: detail.summary.currentStepName ?? null,
    },
    fields: adaptFields(detail.formData.fields),
    attachments: adaptAttachments(detail.attachments),
    timeline: adaptTimeline(detail.timeline),
    progress: detail.progress,
    raw: detail,
  };
}
