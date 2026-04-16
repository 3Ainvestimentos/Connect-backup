'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ManagementAssignmentsSubtab,
  WorkflowManagementAssignmentsData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';
import { ManagementAsyncState } from './ManagementAsyncState';
import { ManagementRequestList } from './ManagementRequestList';

type AssignmentSectionConfig = {
  key: 'pending' | 'assigned';
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  filteredEmptyDescription: string;
  items: WorkflowManagementRequestSummary[];
};

type AssignmentsPanelProps = {
  data?: WorkflowManagementAssignmentsData;
  activeSubtab: ManagementAssignmentsSubtab;
  hasActiveFilters: boolean;
  isLoading: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenRequest: (requestId: number) => void;
};

export function AssignmentsPanel({
  data,
  activeSubtab,
  hasActiveFilters,
  isLoading,
  errorMessage,
  onRetry,
  onOpenRequest,
}: AssignmentsPanelProps) {
  const sections: AssignmentSectionConfig[] = [
    {
      key: 'pending',
      title: 'Ações pendentes para mim',
      description: 'Aprovações, ciências e execuções que aguardam sua resposta operacional.',
      emptyTitle: 'Nenhuma ação pendente para você',
      emptyDescription:
        'Quando algum fluxo depender da sua resposta, ele aparecerá nesta seção.',
      filteredEmptyDescription:
        'Nenhuma ação pendente corresponde aos filtros aplicados no recorte atual.',
      items: data?.pendingActionItems ?? [],
    },
    {
      key: 'assigned',
      title: 'Atribuídos a mim',
      description: 'Chamados atribuídos ao seu usuário para tratamento e acompanhamento.',
      emptyTitle: 'Nenhum chamado atribuído a você',
      emptyDescription:
        'Quando um owner atribuir um item ao seu usuário, ele aparecerá nesta seção.',
      filteredEmptyDescription:
        'Nenhum chamado atribuído corresponde aos filtros aplicados no recorte atual.',
      items: data?.assignedItems ?? [],
    },
  ];
  const orderedSections =
    activeSubtab === 'assigned' ? [sections[1], sections[0]] : sections;

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-2">
        <div className="space-y-1">
          <CardTitle>Atribuições e ações</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {orderedSections.map((section, index) => (
          <section
            key={section.key}
            className={index > 0 ? 'border-t border-border/60 pt-6' : undefined}
          >
            <div className="mb-4 space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>

            <ManagementAsyncState
              isLoading={isLoading}
              errorMessage={errorMessage}
              errorTitle={`Falha em ${section.title.toLowerCase()}`}
              isEmpty={section.items.length === 0}
              emptyTitle={section.emptyTitle}
              emptyDescription={
                hasActiveFilters ? section.filteredEmptyDescription : section.emptyDescription
              }
              onRetry={onRetry}
            >
              <ManagementRequestList items={section.items} onOpenRequest={onOpenRequest} />
            </ManagementAsyncState>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
