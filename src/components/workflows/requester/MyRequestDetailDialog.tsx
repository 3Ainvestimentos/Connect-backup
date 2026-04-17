'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import { RequestFormData } from '@/components/workflows/management/RequestFormData';
import { RequestProgress } from '@/components/workflows/management/RequestProgress';
import { RequestTimeline } from '@/components/workflows/management/RequestTimeline';
import { RequestAttachments } from '@/components/workflows/management/RequestAttachments';
import { RequesterRequestSummaryHeader } from './RequesterRequestSummaryHeader';
import type {
  WorkflowRequestDetailData,
  WorkflowRequestAttachment,
  WorkflowRequestProgressItem,
  WorkflowRequestTimelineItem,
} from '@/lib/workflows/read/types';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestAttachment,
  WorkflowManagementRequestProgressItem,
  WorkflowManagementRequestTimelineItem,
} from '@/lib/workflows/management/types';

type MyRequestDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number | null;
  areaLabelById?: Map<string, string>;
};

/**
 * Adapters para converter tipos do read model nos tipos esperados pelos
 * componentes de apresentacao de management. Os shapes sao identicos;
 * isso e apenas uma ponte de tipagem sem custo em runtime.
 */
function adaptFormData(
  formData: WorkflowRequestDetailData['formData'],
): WorkflowManagementRequestDetailData['formData'] {
  return formData as unknown as WorkflowManagementRequestDetailData['formData'];
}

function adaptAttachments(
  attachments: WorkflowRequestAttachment[],
): WorkflowManagementRequestAttachment[] {
  return attachments as unknown as WorkflowManagementRequestAttachment[];
}

function adaptProgress(
  progress: WorkflowRequestDetailData['progress'],
): WorkflowManagementRequestDetailData['progress'] {
  return progress as unknown as WorkflowManagementRequestDetailData['progress'];
}

function adaptTimeline(
  timeline: WorkflowRequestTimelineItem[],
): WorkflowManagementRequestTimelineItem[] {
  return timeline.map((item) => ({
    ...item,
    timestamp: normalizeReadTimestamp(item.timestamp),
  })) as unknown as WorkflowManagementRequestTimelineItem[];
}

export function MyRequestDetailDialog({ open, onOpenChange, requestId, areaLabelById }: MyRequestDetailDialogProps) {
  const { data, isLoading, error, isError, stableData, hasStableData } = useRequestDetail(requestId, open);

  // Usa stableData como fonte principal, caindo para data quando disponivel
  const detail = stableData ?? data;
  const isBlockingError = isError && !hasStableData;
  const isNonBlockingError = isError && hasStableData;
  const serverAreaLabel = detail?.summary.areaLabel?.trim();
  const mappedAreaLabel = detail ? areaLabelById?.get(detail.summary.areaId) : undefined;

  const openedInLabel = detail
    ? (serverAreaLabel || mappedAreaLabel || detail.summary.areaId || '-')
    : '-';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {detail
              ? `Solicitacao #${detail.summary.requestId} - ${detail.summary.workflowName}`
              : 'Detalhe da solicitacao'}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.summary.workflowName || detail.summary.workflowTypeId} - etapa atual ${detail.summary.currentStepName || '-'}.`
              : 'Visualizacao read-only do chamado do solicitante.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-146px)]">
          <div className="space-y-6 px-6 py-5">
            {isLoading && !detail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Carregando detalhe...</span>
              </div>
            ) : null}

            {isBlockingError && error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nao foi possivel carregar os detalhes desta solicitacao. Tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            ) : null}

            {isNonBlockingError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nao foi possivel atualizar os detalhes. Exibindo dados carregados anteriormente.
                </AlertDescription>
              </Alert>
            ) : null}

            {detail ? (
              <>
                <RequesterRequestSummaryHeader
                  requesterName={detail.summary.requesterName}
                  submittedAt={detail.summary.submittedAt}
                  workflowName={detail.summary.workflowName}
                  lastUpdatedAt={detail.summary.lastUpdatedAt}
                  responsibleName={detail.summary.responsibleName}
                  openedInLabel={openedInLabel}
                />
                <RequestFormData formData={adaptFormData(detail.formData)} />
                <RequestProgress progress={adaptProgress(detail.progress)} />
                <RequestTimeline timeline={adaptTimeline(detail.timeline)} />
                <RequestAttachments attachments={adaptAttachments(detail.attachments)} />
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
