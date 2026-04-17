'use client';

import type { RequestDetailShellViewModel } from '@/lib/workflows/management/request-detail-view-model';

type RequestSummarySectionProps = {
  summary: RequestDetailShellViewModel['summary'];
};

export function RequestSummarySection({ summary }: RequestSummarySectionProps) {
  return (
    <section
      className="h-full space-y-4 rounded-xl border bg-muted/20 p-4"
      aria-labelledby="request-summary-title"
    >
      <div className="space-y-1">
        <h2 id="request-summary-title" className="text-sm font-semibold text-foreground">
          Resumo do chamado
        </h2>
        <p className="text-sm text-muted-foreground">
          Leitura institucional e operacional do chamado usando area amigavel e metadados oficiais.
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
        {summary.metaItems.map((item) => (
          <div key={item.label} className="min-w-0 space-y-1 text-sm">
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="break-words text-muted-foreground [overflow-wrap:anywhere]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
