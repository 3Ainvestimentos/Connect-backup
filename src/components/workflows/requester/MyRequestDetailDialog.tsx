'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
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
  return timeline as unknown as WorkflowManagementRequestTimelineItem[];
}

export function MyRequestDetailDialog({ open, onOpenChange, requestId }: MyRequestDetailDialogProps) {
  const { data, isLoading, error, isError } = useRequestDetail(requestId, open);

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
            {data
              ? `Solicitacao #${data.summary.requestId} — ${data.summary.workflowName}`
              : 'Detalhe da solicitacao'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-146px)]">
          <div className="space-y-6 px-6 py-5">
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Carregando detalhe...</span>
              </div>
            ) : null}

            {isError && error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nao foi possivel carregar os detalhes desta solicitacao. Tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            ) : null}

            {data ? (
              <>
                <RequesterRequestSummaryHeader
                  requesterName={data.summary.requesterName}
                  submittedAt={data.summary.submittedAt}
                  workflowName={data.summary.workflowName}
                  lastUpdatedAt={data.summary.lastUpdatedAt}
                  responsibleName={data.summary.responsibleName}
                  areaId={data.summary.areaId}
                />
                <RequestFormData formData={adaptFormData(data.formData)} />
                <RequestProgress progress={adaptProgress(data.progress)} />
                <RequestTimeline timeline={adaptTimeline(data.timeline)} />
                <RequestAttachments attachments={adaptAttachments(data.attachments)} />
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
