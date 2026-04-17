'use client';

import { Badge } from '@/components/ui/badge';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import type { RequesterHistoryItem } from '@/lib/workflows/requester/presentation/build-requester-history';

type RequesterRequestHistoryProps = {
  items: RequesterHistoryItem[];
};

export function RequesterRequestHistory({ items }: RequesterRequestHistoryProps) {
  return (
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Histórico</h3>
        <p className="text-sm text-muted-foreground">
          Acompanhe a evolução da solicitação em ordem cronológica.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum histórico disponível para esta solicitação.
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex w-6 flex-col items-center">
                <span
                  className={[
                    'mt-1 h-3 w-3 rounded-full border-2',
                    item.isCurrent
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background',
                  ].join(' ')}
                />
                {index < items.length - 1 ? (
                  <span className="mt-2 h-full min-h-8 w-px bg-border" />
                ) : null}
              </div>

              <div className="flex-1 pb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      {item.stateLabel ? (
                        <Badge variant={item.isCurrent ? 'default' : 'secondary'}>
                          {item.stateLabel}
                        </Badge>
                      ) : null}
                    </div>

                    {item.actorName ? (
                      <p className="text-xs text-muted-foreground">{item.actorName}</p>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {formatManagementDate(item.occurredAt, 'Sem data')}
                  </p>
                </div>

                {item.notesText ? (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {item.notesText}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
