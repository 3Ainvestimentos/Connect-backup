'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManagementMonthKey } from '@/lib/workflows/management/presentation';
import type { WorkflowManagementCompletedData } from '@/lib/workflows/management/types';
import { ManagementRequestList } from './ManagementRequestList';

type CompletedPanelProps = {
  data?: WorkflowManagementCompletedData;
  isLoading: boolean;
  errorMessage?: string;
  onOpenRequest: (requestId: number) => void;
};

export function CompletedPanel({
  data,
  isLoading,
  errorMessage,
  onOpenRequest,
}: CompletedPanelProps) {
  const items = data?.items ?? [];
  const groups = data?.groups ?? [];
  const groupsToRender = groups.length > 0 ? groups : [{ monthKey: 'unknown', items }];

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Concluidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum item concluido ou arquivado dentro do seu escopo operacional e dos filtros atuais.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupsToRender.map((group) => (
        <Card key={group.monthKey}>
          <CardHeader>
            <CardTitle>{formatManagementMonthKey(group.monthKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ManagementRequestList
              items={group.items}
              isLoading={isLoading}
              emptyTitle="Nenhum item concluido neste periodo."
              emptyDescription="Os grupos seguem exatamente o agrupamento devolvido pelo endpoint oficial."
              onOpenRequest={onOpenRequest}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
