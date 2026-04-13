'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getManagementCurrentFilterLabel,
  getManagementEmptyStateCopy,
} from '@/lib/workflows/management/presentation';
import type {
  ManagementCurrentQueueFilter,
  WorkflowManagementCurrentData,
} from '@/lib/workflows/management/types';
import { ManagementAsyncState } from './ManagementAsyncState';
import { ManagementRequestList } from './ManagementRequestList';

type CurrentQueuePanelProps = {
  data?: WorkflowManagementCurrentData;
  filter: ManagementCurrentQueueFilter;
  hasActiveFilters: boolean;
  isLoading: boolean;
  errorMessage?: string;
  onFilterChange: (filter: ManagementCurrentQueueFilter) => void;
  onRetry?: () => void;
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
  hasActiveFilters,
  isLoading,
  errorMessage,
  onFilterChange,
  onRetry,
  onOpenRequest,
}: CurrentQueuePanelProps) {
  const emptyState = getManagementEmptyStateCopy({
    activeTab: 'current',
    hasActiveFilters: hasActiveFilters || filter !== 'all',
    canViewTab: true,
  });

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Chamados atuais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fila operacional do owner com filtro canonico do backend e refinamentos oficiais de
            estado.
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
        <ManagementAsyncState
          isLoading={isLoading}
          errorMessage={errorMessage}
          errorTitle="Falha na fila atual"
          isEmpty={(data?.items ?? []).length === 0}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          onRetry={onRetry}
        >
          <ManagementRequestList
            items={data?.items ?? []}
            onOpenRequest={onOpenRequest}
          />
        </ManagementAsyncState>
      </CardContent>
    </Card>
  );
}
