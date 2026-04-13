'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  formatManagementMonthKey,
  getManagementEmptyStateCopy,
  sortManagementMonthGroups,
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
  const groupsToRender = sortManagementMonthGroups(
    groups.length > 0 ? groups : [{ monthKey: 'unknown', items }],
  );
  const defaultOpenGroup = groupsToRender[0]?.monthKey;
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
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpenGroup}
        className="rounded-2xl border border-border/70 bg-background/95 px-4"
      >
        {groupsToRender.map((group) => (
          <AccordionItem
            key={group.monthKey}
            value={group.monthKey}
            className="border-border/70 last:border-b-0"
          >
            <AccordionTrigger className="gap-4 py-5 text-left hover:no-underline">
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {formatManagementMonthKey(group.monthKey)}
                </p>
                <p className="text-sm font-normal text-muted-foreground">
                  {group.items.length} chamado{group.items.length === 1 ? '' : 's'}
                </p>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-5">
              <ManagementRequestList items={group.items} onOpenRequest={onOpenRequest} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ManagementAsyncState>
  );
}
