'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminHistoryDetailData } from '@/lib/workflows/admin-config/types';

type V2HistoryDetailViewProps = {
  detail: Extract<AdminHistoryDetailData, { origin: 'v2' }>;
};

function ValueList({
  items,
  emptyMessage,
}: {
  items: Array<{ label: string; value: unknown }>;
  emptyMessage: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1 text-sm">
          <p className="font-medium">{item.label}</p>
          <p className="break-words text-muted-foreground">{String(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

export function V2HistoryDetailView({ detail }: V2HistoryDetailViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dados do formulario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValueList
            items={[
              ...detail.detail.formData.fields.map((field) => ({ label: field.label, value: field.value })),
              ...detail.detail.formData.extraFields.map((field) => ({ label: field.key, value: field.value })),
            ]}
            emptyMessage="Nenhum dado de formulario disponivel."
          />
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
                key={attachment.fieldId}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-primary underline-offset-4 hover:underline"
              >
                {attachment.label}
              </a>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum anexo publicado neste chamado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.detail.progress.items.map((item) => (
            <div key={item.stepId} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{item.stepName}</p>
                <p className="text-muted-foreground">{item.statusKey}</p>
              </div>
              <Badge variant={item.isCurrent ? 'default' : 'outline'}>{item.state}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.detail.timeline.length ? (
            detail.detail.timeline.map((item, index) => (
              <div key={`${item.action}-${index}`} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground">{item.userName}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum evento de timeline disponivel.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
