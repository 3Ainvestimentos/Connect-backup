'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MANAGEMENT_ASSIGNMENTS_SUBTAB_DEFINITIONS,
} from '@/lib/workflows/management/constants';
import { getManagementEmptyStateCopy } from '@/lib/workflows/management/presentation';
import type {
  ManagementAssignmentsSubtab,
  WorkflowManagementAssignmentsData,
} from '@/lib/workflows/management/types';
import { ManagementAsyncState } from './ManagementAsyncState';
import { ManagementRequestList } from './ManagementRequestList';

type AssignmentsPanelProps = {
  data?: WorkflowManagementAssignmentsData;
  activeSubtab: ManagementAssignmentsSubtab;
  hasActiveFilters: boolean;
  isLoading: boolean;
  errorMessage?: string;
  onSubtabChange: (subtab: ManagementAssignmentsSubtab) => void;
  onRetry?: () => void;
  onOpenRequest: (requestId: number) => void;
};

export function AssignmentsPanel({
  data,
  activeSubtab,
  hasActiveFilters,
  isLoading,
  errorMessage,
  onSubtabChange,
  onRetry,
  onOpenRequest,
}: AssignmentsPanelProps) {
  const items =
    activeSubtab === 'pending' ? data?.pendingActionItems ?? [] : data?.assignedItems ?? [];
  const emptyState = hasActiveFilters
    ? getManagementEmptyStateCopy({
        activeTab: 'assignments',
        hasActiveFilters,
        canViewTab: true,
      })
    : activeSubtab === 'pending'
      ? {
          title: 'Nenhuma acao pendente para voce',
          description:
            'Quando algum fluxo depender da sua resposta, ele aparecera nesta subtab.',
        }
      : {
          title: 'Nenhum chamado atribuido a voce',
          description:
            'Quando um owner atribuir um item ao seu usuario, ele aparecera nesta subtab.',
        };

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Atribuicoes e acoes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Escopo operacional do ator separado em subtabs explicitas com retry local e estados
            consistentes.
          </p>
        </div>

        <Tabs
          value={activeSubtab}
          onValueChange={(value) => onSubtabChange(value as ManagementAssignmentsSubtab)}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-muted/60 p-1">
            {MANAGEMENT_ASSIGNMENTS_SUBTAB_DEFINITIONS.map((tab) => (
              <TabsTrigger key={tab.tab} value={tab.tab}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <ManagementAsyncState
          isLoading={isLoading}
          errorMessage={errorMessage}
          errorTitle="Falha em atribuicoes e acoes"
          isEmpty={items.length === 0}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          onRetry={onRetry}
        >
          <ManagementRequestList
            items={items}
            onOpenRequest={onOpenRequest}
          />
        </ManagementAsyncState>
      </CardContent>
    </Card>
  );
}
