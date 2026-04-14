'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
import { RequesterRequestSummaryHeader } from './RequesterRequestSummaryHeader';
import { RequestFormData } from '@/components/workflows/management/RequestFormData';
import { RequestProgress } from '@/components/workflows/management/RequestProgress';
import { RequestTimeline } from '@/components/workflows/management/RequestTimeline';
import { RequestAttachments } from '@/components/workflows/management/RequestAttachments';
import { legacyRequestToUnifiedDetail } from '@/lib/workflows/requester/adapters/legacy-to-unified-detail';
import { v2ReadDetailToUnifiedDetail } from '@/lib/workflows/requester/adapters/v2-to-unified-detail';
import type {
  RequesterUnifiedLegacyListItem,
  RequesterUnifiedV2ListItem,
  RequesterUnifiedRequestDetail,
} from '@/lib/workflows/requester/unified-types';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestAttachment,
  WorkflowManagementRequestProgressItem,
  WorkflowManagementRequestTimelineItem,
} from '@/lib/workflows/management/types';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';

type Props =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      selected: null;
      areaLabelById?: Map<string, string>;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      selected: RequesterUnifiedV2ListItem | RequesterUnifiedLegacyListItem;
      areaLabelById?: Map<string, string>;
    };

/**
 * Adapters para converter tipos unificados nos tipos esperados pelos
 * componentes de apresentacao de management.
 */
function adaptFormData(
  fields: RequesterUnifiedRequestDetail['fields'],
): WorkflowManagementRequestDetailData['formData'] {
  return {
    fields: fields.map((f) => ({
      fieldId: f.fieldId,
      label: f.label,
      type: f.type as WorkflowManagementRequestDetailData['formData']['fields'][number]['type'],
      value: f.value,
    })),
    extraFields: [],
  } as unknown as WorkflowManagementRequestDetailData['formData'];
}

function adaptAttachments(
  attachments: RequesterUnifiedRequestDetail['attachments'],
): WorkflowManagementRequestAttachment[] {
  return attachments as unknown as WorkflowManagementRequestAttachment[];
}

function adaptProgress(
  progress: RequesterUnifiedRequestDetail['progress'],
): WorkflowManagementRequestDetailData['progress'] | null {
  if (!progress) return null;
  return progress as unknown as WorkflowManagementRequestDetailData['progress'];
}

function adaptTimeline(
  timeline: RequesterUnifiedRequestDetail['timeline'],
): WorkflowManagementRequestTimelineItem[] {
  return timeline.map((item) => ({
    action: 'status_change' as const,
    label: item.label,
    timestamp: item.timestamp,
    userId: '',
    userName: item.userName,
    details: item.notes ? { notes: item.notes } : undefined,
  })) as unknown as WorkflowManagementRequestTimelineItem[];
}

export function RequesterUnifiedRequestDetailDialog(props: Props) {
  const { open, onOpenChange, selected, areaLabelById } = props;

  const v2RequestId =
    selected && selected.origin === 'v2' ? selected.requestId : null;
  const v2Query = useRequestDetail(v2RequestId, open && selected?.origin === 'v2');

  const unifiedDetail = React.useMemo<RequesterUnifiedRequestDetail | null>(() => {
    if (!selected) return null;

    if (selected.origin === 'legacy') {
      return legacyRequestToUnifiedDetail(
        selected.raw.request,
        selected.raw.definition,
        selected.raw.workflowArea ?? null,
      );
    }

    const source = v2Query.stableData ?? v2Query.data;
    if (!source) return null;
    return v2ReadDetailToUnifiedDetail(source, areaLabelById);
  }, [selected, v2Query.data, v2Query.stableData, areaLabelById]);

  const isV2Loading =
    selected?.origin === 'v2' && v2Query.isLoading && !unifiedDetail;
  const isV2BlockingError =
    selected?.origin === 'v2' && v2Query.isError && !v2Query.hasStableData;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {unifiedDetail
              ? `Solicitacao #${unifiedDetail.summary.displayRequestId} - ${unifiedDetail.summary.workflowName}`
              : 'Detalhe da solicitacao'}
          </DialogTitle>
          <DialogDescription>
            {unifiedDetail
              ? `${unifiedDetail.summary.workflowName} - status ${unifiedDetail.summary.statusLabel}.`
              : 'Visualizacao read-only do chamado do solicitante.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-146px)]">
          <div className="space-y-6 px-6 py-5">
            {isV2Loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Carregando detalhe...</span>
              </div>
            ) : null}

            {isV2BlockingError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nao foi possivel carregar os detalhes desta solicitacao.
                </AlertDescription>
              </Alert>
            ) : null}

            {unifiedDetail ? (
              <>
                <RequesterRequestSummaryHeader
                  requesterName={unifiedDetail.summary.requesterName}
                  submittedAt={unifiedDetail.summary.submittedAt as any}
                  workflowName={unifiedDetail.summary.workflowName}
                  lastUpdatedAt={unifiedDetail.summary.lastUpdatedAt as any}
                  responsibleName={unifiedDetail.summary.responsibleName}
                  openedInLabel={unifiedDetail.summary.openedInLabel}
                />
                <RequestFormData formData={adaptFormData(unifiedDetail.fields)} />
                {unifiedDetail.progress ? (
                  <RequestProgress progress={adaptProgress(unifiedDetail.progress)!} />
                ) : null}
                <RequestTimeline timeline={adaptTimeline(unifiedDetail.timeline)} />
                <RequestAttachments attachments={adaptAttachments(unifiedDetail.attachments)} />
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
