'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  deriveManagementRequestPresentation,
  formatManagementDate,
  getManagementSlaBadgeVariant,
  getManagementSlaLabel,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestSummary } from '@/lib/workflows/management/types';

type ManagementRequestListProps = {
  items: WorkflowManagementRequestSummary[];
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onOpenRequest?: (requestId: number) => void;
};

export function ManagementRequestList({
  items,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onOpenRequest,
}: ManagementRequestListProps) {
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
        const presentation = deriveManagementRequestPresentation(item);
        const slaLabel = getManagementSlaLabel(item.slaState);

        return (
          <Card key={item.docId}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Chamado #{item.requestId}</p>
                  <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
                  <Badge variant="outline">{item.workflowName || item.workflowTypeId}</Badge>
                  {slaLabel ? (
                    <Badge variant={getManagementSlaBadgeVariant(item.slaState)}>
                      SLA: {slaLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{item.workflowName || item.workflowTypeId}</p>
                  <p>Solicitante: {item.requesterName || '-'}</p>
                  <p>Responsavel: {item.responsibleName || 'Nao atribuido'}</p>
                  <p>Etapa atual: {item.currentStepName || '-'}</p>
                  <p>Aberto em: {formatManagementDate(item.submittedAt)}</p>
                  <p>Ultima atualizacao: {formatManagementDate(item.lastUpdatedAt)}</p>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenRequest?.(item.requestId)}
                disabled={!onOpenRequest}
              >
                Abrir
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
