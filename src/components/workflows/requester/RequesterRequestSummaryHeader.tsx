'use client';

import { formatManagementDate } from '@/lib/workflows/management/presentation';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import type { TimestampLike } from '@/lib/workflows/read/types';

type RequesterRequestSummaryHeaderProps = {
  requesterName: string | null | undefined;
  submittedAt: TimestampLike | Date | null;
  workflowName: string | null | undefined;
  lastUpdatedAt: TimestampLike | Date | null;
  responsibleName: string | null | undefined;
  openedInLabel: string;
};

function formatTimestamp(date: TimestampLike | Date | null, fallback = '-'): string {
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
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Informações do chamado</h3>
        <p className="text-sm text-muted-foreground">
          Resumo geral da solicitação aberta pelo solicitante.
        </p>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="space-y-1 border-b px-4 py-3 sm:border-r">
            <p className="text-sm font-medium text-foreground">Solicitante</p>
            <p className="text-sm text-muted-foreground">{requesterName ?? '-'}</p>
          </div>
          <div className="space-y-1 border-b px-4 py-3">
            <p className="text-sm font-medium text-foreground">Tipo</p>
            <p className="text-sm text-muted-foreground">{workflowName ?? '-'}</p>
          </div>
          <div className="space-y-1 border-b px-4 py-3 sm:border-r">
            <p className="text-sm font-medium text-foreground">Data</p>
            <p className="text-sm text-muted-foreground">{formatTimestamp(submittedAt)}</p>
          </div>
          <div className="space-y-1 border-b px-4 py-3">
            <p className="text-sm font-medium text-foreground">Última atualização</p>
            <p className="text-sm text-muted-foreground">{formatTimestamp(lastUpdatedAt)}</p>
          </div>
          <div className="space-y-1 px-4 py-3 sm:border-r">
            <p className="text-sm font-medium text-foreground">Responsável</p>
            <p className="text-sm text-muted-foreground">{responsibleName ?? 'Não atribuído'}</p>
          </div>
          <div className="space-y-1 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Área</p>
            <p className="text-sm text-muted-foreground">{openedInLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
