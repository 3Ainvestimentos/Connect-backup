'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  deriveManagementRequestPresentation,
  formatManagementDate,
  getManagementSlaBadgeVariant,
  getManagementSlaLabel,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestSummary } from '@/lib/workflows/management/types';

type ManagementRequestListProps = {
  items: WorkflowManagementRequestSummary[];
  onOpenRequest?: (requestId: number) => void;
};

export function ManagementRequestList({
  items,
  onOpenRequest,
}: ManagementRequestListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const presentation = deriveManagementRequestPresentation(item);
        const slaLabel = getManagementSlaLabel(item.slaState);

        return (
          <Card key={item.docId} className="border-border/70 transition-colors hover:border-border">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Chamado #{item.requestId}</p>
                  <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
                  <Badge variant="outline">{item.workflowName || item.workflowTypeId}</Badge>
                  {item.hasPendingActions ? (
                    <Badge variant="outline">Acao pendente</Badge>
                  ) : null}
                  {slaLabel ? (
                    <Badge variant={getManagementSlaBadgeVariant(item.slaState)}>
                      SLA: {slaLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                  <p>Solicitante: {item.requesterName || '-'}</p>
                  <p>Responsavel: {item.responsibleName || 'Nao atribuido'}</p>
                  <p>Etapa atual: {item.currentStepName || '-'}</p>
                  <p>Aberto em: {formatManagementDate(item.submittedAt)}</p>
                  <p>Ultima atualizacao: {formatManagementDate(item.lastUpdatedAt)}</p>
                  <p>Owner: {item.ownerEmail || '-'}</p>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenRequest?.(item.requestId)}
                disabled={!onOpenRequest}
                className="self-start"
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
