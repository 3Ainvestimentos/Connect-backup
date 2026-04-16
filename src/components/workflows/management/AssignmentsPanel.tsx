'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      title: 'Acoes pendentes para mim',
      description: 'Aprovacoes, ciencias e execucoes que aguardam sua resposta operacional.',
      emptyTitle: 'Nenhuma acao pendente para voce',
      emptyDescription:
        'Quando algum fluxo depender da sua resposta, ele aparecera nesta secao.',
      filteredEmptyDescription:
        'Nenhuma acao pendente corresponde aos filtros aplicados no recorte atual.',
      items: data?.pendingActionItems ?? [],
    },
    {
      key: 'assigned',
      title: 'Atribuidos a mim',
      description: 'Chamados atribuidos ao seu usuario para tratamento e acompanhamento.',
      emptyTitle: 'Nenhum chamado atribuido a voce',
      emptyDescription:
        'Quando um owner atribuir um item ao seu usuario, ele aparecera nesta secao.',
      filteredEmptyDescription:
        'Nenhum chamado atribuido corresponde aos filtros aplicados no recorte atual.',
      items: data?.assignedItems ?? [],
    },
  ];
  const orderedSections =
    activeSubtab === 'assigned' ? [sections[1], sections[0]] : sections;

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-2">
        <div className="space-y-1">
          <CardTitle>Atribuicoes e acoes</CardTitle>
          <CardDescription>
            As duas filas operacionais ficam visiveis na mesma leitura, com estados independentes
            por secao e compatibilidade com links legados.
          </CardDescription>
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
