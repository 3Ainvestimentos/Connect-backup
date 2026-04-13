'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { derivePilotRequestPresentation, formatPilotDate } from '@/lib/workflows/pilot/presentation';
import { getFacilitiesPilotWorkflowConfig } from '@/lib/workflows/pilot/workflow-registry';
import type { PilotRequestSummary } from '@/lib/workflows/pilot/types';

type RequestSummaryListProps = {
  items: PilotRequestSummary[];
  isLoading?: boolean;
  actorUserId: string;
  emptyTitle: string;
  emptyDescription: string;
  onOpenRequest: (item: PilotRequestSummary) => void;
};

export function RequestSummaryList({
  items,
  isLoading = false,
  actorUserId,
  emptyTitle,
  emptyDescription,
  onOpenRequest,
}: RequestSummaryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm">
        <p className="font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-1 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const presentation = derivePilotRequestPresentation(item, actorUserId);
        const workflowLabel =
          item.workflowName ||
          getFacilitiesPilotWorkflowConfig(item.workflowTypeId)?.shortLabel ||
          item.workflowTypeId;

        return (
          <Card key={item.docId}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Chamado #{item.requestId}</p>
                  <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
                  <Badge variant="outline">{workflowLabel}</Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{item.workflowName}</p>
                  <p>Solicitante: {item.requesterName || '-'}</p>
                  <p>Responsavel: {item.responsibleName || 'Nao atribuido'}</p>
                  <p>Etapa atual: {item.currentStepName || '-'}</p>
                  <p>Aberto em: {formatPilotDate(item.submittedAt)}</p>
                  <p>Ultima atualizacao: {formatPilotDate(item.lastUpdatedAt)}</p>
                </div>
              </div>

              <Button onClick={() => onOpenRequest(item)} variant="outline">
                Abrir
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
