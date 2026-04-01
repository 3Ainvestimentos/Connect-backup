'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getManagementCurrentFilterLabel } from '@/lib/workflows/management/presentation';
import type {
  ManagementCurrentQueueFilter,
  WorkflowManagementCurrentData,
} from '@/lib/workflows/management/types';
import { ManagementRequestList } from './ManagementRequestList';

type CurrentQueuePanelProps = {
  data?: WorkflowManagementCurrentData;
  filter: ManagementCurrentQueueFilter;
  isLoading: boolean;
  errorMessage?: string;
  onFilterChange: (filter: ManagementCurrentQueueFilter) => void;
  onOpenRequest: (requestId: number) => void;
};

const FILTER_OPTIONS: ManagementCurrentQueueFilter[] = [
  'all',
  'waiting_assignment',
  'in_progress',
  'waiting_action',
];

export function CurrentQueuePanel({
  data,
  filter,
  isLoading,
  errorMessage,
  onFilterChange,
  onOpenRequest,
}: CurrentQueuePanelProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Chamados atuais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fila operacional do owner com filtro canonico do backend e refinamentos oficiais.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={filter === option ? 'default' : 'outline'}
              onClick={() => onFilterChange(option)}
            >
              {getManagementCurrentFilterLabel(option)}
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
          <ManagementRequestList
            items={data?.items ?? []}
            isLoading={isLoading}
            emptyTitle={`Nenhum item em ${getManagementCurrentFilterLabel(filter).toLowerCase()}.`}
            emptyDescription="A capability existe, mas nao ha itens operacionais visiveis com os filtros atuais."
            onOpenRequest={onOpenRequest}
          />
        )}
      </CardContent>
    </Card>
  );
}
