'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
import { RequesterRequestSummaryHeader } from './RequesterRequestSummaryHeader';
import { RequesterRequestFormData } from './RequesterRequestFormData';
import { RequesterRequestHistory } from './RequesterRequestHistory';
import { RequesterRequestAttachments } from './RequesterRequestAttachments';
import { legacyRequestToUnifiedDetail } from '@/lib/workflows/requester/adapters/legacy-to-unified-detail';
import { v2ReadDetailToUnifiedDetail } from '@/lib/workflows/requester/adapters/v2-to-unified-detail';
import { buildRequesterHistory } from '@/lib/workflows/requester/presentation/build-requester-history';
import type {
  RequesterUnifiedLegacyListItem,
  RequesterUnifiedV2ListItem,
  RequesterUnifiedRequestDetail,
} from '@/lib/workflows/requester/unified-types';

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

  const historyItems = React.useMemo(
    () => (unifiedDetail ? buildRequesterHistory(unifiedDetail) : []),
    [unifiedDetail],
  );

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
              ? `Solicitação #${unifiedDetail.summary.displayRequestId} - ${unifiedDetail.summary.workflowName}`
              : 'Detalhe da solicitação'}
          </DialogTitle>
          <DialogDescription>
            {unifiedDetail
              ? `${unifiedDetail.summary.workflowName} - status ${unifiedDetail.summary.statusLabel}.`
              : 'Visualização somente leitura do chamado do solicitante.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-206px)]">
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
                  Não foi possível carregar os detalhes desta solicitação.
                </AlertDescription>
              </Alert>
            ) : null}

            {unifiedDetail ? (
              <>
                <RequesterRequestSummaryHeader
                  requesterName={unifiedDetail.summary.requesterName}
                  submittedAt={unifiedDetail.summary.submittedAt}
                  workflowName={unifiedDetail.summary.workflowName}
                  lastUpdatedAt={unifiedDetail.summary.lastUpdatedAt}
                  responsibleName={unifiedDetail.summary.responsibleName}
                  openedInLabel={unifiedDetail.summary.openedInLabel}
                />
                <RequesterRequestFormData fields={unifiedDetail.fields} />
                <RequesterRequestAttachments attachments={unifiedDetail.attachments} />
                <RequesterRequestHistory items={historyItems} />
              </>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
