'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestTimelineItem } from '@/lib/workflows/management/types';

type RequestTimelineProps = {
  timeline: WorkflowManagementRequestTimelineItem[];
};

export function RequestTimeline({ timeline }: RequestTimelineProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            O historico oficial ainda nao possui eventos para este chamado.
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, index) => {
              const detailEntries = Object.entries(item.details ?? {});

              return (
                <div key={`${item.action}-${item.userId}-${index}`} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatManagementDate(item.timestamp)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.userName || item.userId || 'Sistema'}
                  </p>

                  {detailEntries.length > 0 ? (
                    <div className="mt-3 space-y-1 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                      {detailEntries.map(([key, value]) => (
                        <p key={key}>
                          <span className="font-medium text-foreground">{key}:</span>{' '}
                          {typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : String(value)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
