'use client';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import type { AdminHistoryDetailData } from '@/lib/workflows/admin-config/types';
import { LegacyHistoryDetailView } from './LegacyHistoryDetailView';
import { V2HistoryDetailView } from './V2HistoryDetailView';

type HistoryDetailDialogProps = {
  open: boolean;
  detail?: AdminHistoryDetailData;
  isLoading?: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
};

export function HistoryDetailDialog({
  open,
  detail,
  isLoading = false,
  errorMessage,
  onOpenChange,
  onRetry,
}: HistoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>
            {detail ? `Chamado ${detail.summary.requestIdLabel}` : 'Detalhe do chamado'}
          </DialogTitle>
          <DialogDescription>
            Shell de auditoria read-only para historico administrativo consolidado.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-92px)]">
          <div className="space-y-6 px-6 py-5">
            {isLoading && !detail ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <LoadingSpinner message="Carregando detalhe read-only" />
              </div>
            ) : null}

            {!isLoading && errorMessage && !detail ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <h3 className="font-semibold text-destructive">Falha ao carregar o detalhe</h3>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                {onRetry ? (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Tentar novamente
                  </Button>
                ) : null}
              </div>
            ) : null}

            {detail ? (
              <>
                <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Origem</p>
                    <Badge variant={detail.origin === 'v2' ? 'default' : 'outline'}>
                      {detail.origin === 'v2' ? 'V2' : 'Legado'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Workflow</p>
                    <p className="text-muted-foreground">{detail.summary.workflowLabel}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Status</p>
                    <p className="text-muted-foreground">{detail.summary.statusLabel}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Owner</p>
                    <p className="text-muted-foreground">{detail.summary.ownerLabel}</p>
                  </div>
                </div>

                {detail.origin === 'v2' ? (
                  <V2HistoryDetailView detail={detail} />
                ) : (
                  <LegacyHistoryDetailView detail={detail} />
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
