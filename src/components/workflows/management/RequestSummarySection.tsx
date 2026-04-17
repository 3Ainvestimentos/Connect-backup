'use client';

import type { RequestDetailShellViewModel } from '@/lib/workflows/management/request-detail-view-model';

type RequestSummarySectionProps = {
  summary: RequestDetailShellViewModel['summary'];
};

export function RequestSummarySection({ summary }: RequestSummarySectionProps) {
  return (
    <section
      className="space-y-4 rounded-xl border bg-muted/20 p-4"
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.metaItems.map((item) => (
          <div key={item.label} className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
