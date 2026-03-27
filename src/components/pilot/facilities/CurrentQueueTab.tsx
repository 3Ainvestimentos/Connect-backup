'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPilotCurrentFilterLabel } from '@/lib/workflows/pilot/presentation';
import {
  PILOT_CURRENT_QUEUE_FILTERS,
  type PilotCurrentQueueFilter,
  type PilotRequestSummary,
} from '@/lib/workflows/pilot/types';
import { RequestSummaryList } from './RequestSummaryList';

type CurrentQueueTabProps = {
  filter: PilotCurrentQueueFilter;
  items: PilotRequestSummary[];
  isLoading: boolean;
  errorMessage?: string;
  actorUserId: string;
  onFilterChange: (value: PilotCurrentQueueFilter) => void;
  onOpenRequest: (item: PilotRequestSummary) => void;
};

export function CurrentQueueTab({
  filter,
  items,
  isLoading,
  errorMessage,
  actorUserId,
  onFilterChange,
  onOpenRequest,
}: CurrentQueueTabProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Chamados atuais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fila operacional do owner com filtros canonicos do backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PILOT_CURRENT_QUEUE_FILTERS.map((option) => (
            <Button
              key={option}
              type="button"
              variant={filter === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(option)}
            >
              {getPilotCurrentFilterLabel(option)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : (
          <RequestSummaryList
            items={items}
            isLoading={isLoading}
            actorUserId={actorUserId}
            emptyTitle={`Nenhum item em ${getPilotCurrentFilterLabel(filter).toLowerCase()}.`}
            emptyDescription="Quando houver chamados nesta fila, eles aparecerao aqui."
            onOpenRequest={onOpenRequest}
          />
        )}
      </CardContent>
    </Card>
  );
}
