'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MANAGEMENT_ASSIGNMENTS_SUBTAB_DEFINITIONS,
} from '@/lib/workflows/management/constants';
import type {
  ManagementAssignmentsSubtab,
  WorkflowManagementAssignmentsData,
} from '@/lib/workflows/management/types';
import { ManagementRequestList } from './ManagementRequestList';

type AssignmentsPanelProps = {
  data?: WorkflowManagementAssignmentsData;
  activeSubtab: ManagementAssignmentsSubtab;
  isLoading: boolean;
  errorMessage?: string;
  onSubtabChange: (subtab: ManagementAssignmentsSubtab) => void;
  onOpenRequest: (requestId: number) => void;
};

export function AssignmentsPanel({
  data,
  activeSubtab,
  isLoading,
  errorMessage,
  onSubtabChange,
  onOpenRequest,
}: AssignmentsPanelProps) {
  const items =
    activeSubtab === 'pending' ? data?.pendingActionItems ?? [] : data?.assignedItems ?? [];

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Atribuicoes e acoes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Escopo operacional do ator separado em subtabs explicitas.
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
        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : (
          <ManagementRequestList
            items={items}
            isLoading={isLoading}
            emptyTitle={
              activeSubtab === 'pending'
                ? 'Nenhuma acao pendente para voce.'
                : 'Nenhum chamado atribuido a voce.'
            }
            emptyDescription={
              activeSubtab === 'pending'
                ? 'Quando algum fluxo depender da sua resposta, ele aparecera nesta subtab.'
                : 'Quando um owner atribuir um item a voce, ele aparecera nesta subtab.'
            }
            onOpenRequest={onOpenRequest}
          />
        )}
      </CardContent>
    </Card>
  );
}
