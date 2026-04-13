'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import type { TimestampLike } from '@/lib/workflows/read/types';

type RequesterRequestSummaryHeaderProps = {
  requesterName: string | null | undefined;
  submittedAt: TimestampLike;
  workflowName: string | null | undefined;
  lastUpdatedAt: TimestampLike;
  responsibleName: string | null | undefined;
  openedInLabel: string;
};

function formatTimestamp(date: TimestampLike, fallback = '-'): string {
  const d = normalizeReadTimestamp(date);
  if (!d) return fallback;
  return formatManagementDate(d);
}

export function RequesterRequestSummaryHeader({
  requesterName,
  submittedAt,
  workflowName,
  lastUpdatedAt,
  responsibleName,
  openedInLabel,
}: RequesterRequestSummaryHeaderProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Informacoes do chamado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-foreground">Solicitante</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{requesterName ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Data</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatTimestamp(submittedAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Tipo</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{workflowName ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Ultima Atualizacao</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatTimestamp(lastUpdatedAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Responsavel</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{responsibleName ?? 'Nao atribuido'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Aberto em</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{openedInLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
