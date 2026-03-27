'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PilotRequestSummary } from '@/lib/workflows/pilot/types';
import { RequestSummaryList } from './RequestSummaryList';

type AssignmentsTabProps = {
  assignedItems: PilotRequestSummary[];
  pendingActionItems: PilotRequestSummary[];
  isLoading: boolean;
  errorMessage?: string;
  actorUserId: string;
  onOpenRequest: (item: PilotRequestSummary) => void;
};

export function AssignmentsTab({
  assignedItems,
  pendingActionItems,
  isLoading,
  errorMessage,
  actorUserId,
  onOpenRequest,
}: AssignmentsTabProps) {
  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Atribuido a mim</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestSummaryList
            items={assignedItems}
            isLoading={isLoading}
            actorUserId={actorUserId}
            emptyTitle="Nenhum chamado atribuido."
            emptyDescription="Quando um owner atribuir um item a voce, ele aparecera aqui."
            onOpenRequest={onOpenRequest}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acao pendente para mim</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestSummaryList
            items={pendingActionItems}
            isLoading={isLoading}
            actorUserId={actorUserId}
            emptyTitle="Nenhuma acao pendente."
            emptyDescription="Itens aguardando alguma resposta sua aparecerao nesta secao."
            onOpenRequest={onOpenRequest}
          />
        </CardContent>
      </Card>
    </div>
  );
}
