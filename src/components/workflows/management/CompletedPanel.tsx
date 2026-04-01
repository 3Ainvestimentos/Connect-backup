'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatManagementMonthKey,
  getManagementEmptyStateCopy,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementCompletedData } from '@/lib/workflows/management/types';
import { ManagementAsyncState } from './ManagementAsyncState';
import { ManagementRequestList } from './ManagementRequestList';

type CompletedPanelProps = {
  data?: WorkflowManagementCompletedData;
  hasActiveFilters: boolean;
  isLoading: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenRequest: (requestId: number) => void;
};

export function CompletedPanel({
  data,
  hasActiveFilters,
  isLoading,
  errorMessage,
  onRetry,
  onOpenRequest,
}: CompletedPanelProps) {
  const items = data?.items ?? [];
  const groups = data?.groups ?? [];
  const groupsToRender = groups.length > 0 ? groups : [{ monthKey: 'unknown', items }];
  const emptyState = getManagementEmptyStateCopy({
    activeTab: 'completed',
    hasActiveFilters,
    canViewTab: true,
  });

  return (
    <ManagementAsyncState
      isLoading={isLoading}
      errorMessage={errorMessage}
      errorTitle="Falha no historico operacional"
      isEmpty={items.length === 0}
      emptyTitle={emptyState.title}
      emptyDescription={emptyState.description}
      onRetry={onRetry}
    >
      <div className="space-y-6">
        {groupsToRender.map((group) => (
          <Card key={group.monthKey} className="border-border/70">
            <CardHeader>
              <CardTitle>{formatManagementMonthKey(group.monthKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementRequestList items={group.items} onOpenRequest={onOpenRequest} />
            </CardContent>
          </Card>
        ))}
      </div>
    </ManagementAsyncState>
  );
}
