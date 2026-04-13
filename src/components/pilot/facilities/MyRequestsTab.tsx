'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPilotMonthKey } from '@/lib/workflows/pilot/presentation';
import type { PilotMonthGroup, PilotRequestSummary } from '@/lib/workflows/pilot/types';
import { RequestSummaryList } from './RequestSummaryList';

type MyRequestsTabProps = {
  groups: PilotMonthGroup[];
  items: PilotRequestSummary[];
  isLoading: boolean;
  errorMessage?: string;
  actorUserId: string;
  scopeLabel: string;
  onOpenRequest: (item: PilotRequestSummary) => void;
};

export function MyRequestsTab({
  groups,
  items,
  isLoading,
  errorMessage,
  actorUserId,
  scopeLabel,
  onOpenRequest,
}: MyRequestsTabProps) {
  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  const groupsToRender = groups.length > 0 ? groups : [{ monthKey: 'unknown', items }];

  if (!isLoading && items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas solicitacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <p>Exibindo: {scopeLabel}.</p>
            <p className="mt-2">Suas solicitacoes abertas e historicas aparecerao aqui.</p>
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
            <CardTitle>{formatPilotMonthKey(group.monthKey)}</CardTitle>
            <p className="text-sm text-muted-foreground">Exibindo: {scopeLabel}.</p>
          </CardHeader>
          <CardContent>
            <RequestSummaryList
              items={group.items}
              isLoading={isLoading}
              actorUserId={actorUserId}
              emptyTitle="Nenhuma solicitacao neste periodo."
              emptyDescription="Os grupos seguem exatamente a resposta do endpoint /read/mine."
              onOpenRequest={onOpenRequest}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
