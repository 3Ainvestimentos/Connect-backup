'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminHistoryDetailData } from '@/lib/workflows/admin-config/types';

type LegacyHistoryDetailViewProps = {
  detail: Extract<AdminHistoryDetailData, { origin: 'legacy' }>;
};

export function LegacyHistoryDetailView({ detail }: LegacyHistoryDetailViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Campos disponiveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.detail.formEntries.length ? (
            detail.detail.formEntries.map((entry) => (
              <div key={entry.key} className="space-y-1 text-sm">
                <p className="font-medium">{entry.label}</p>
                <p className="break-words text-muted-foreground">{String(entry.value)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum campo legado legivel neste documento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.detail.attachments.length ? (
            detail.detail.attachments.map((attachment) => (
              <a
                key={`${attachment.label}-${attachment.url}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-primary underline-offset-4 hover:underline"
              >
                {attachment.label}
              </a>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum anexo legado detectado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Historico legado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.detail.history.length ? (
            detail.detail.history.map((entry, index) => (
              <div key={`${entry.status}-${index}`} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{entry.status}</p>
                <p className="text-muted-foreground">{entry.userName}</p>
                {entry.notes ? <p className="mt-2 text-muted-foreground">{entry.notes}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum historico legado disponivel.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
