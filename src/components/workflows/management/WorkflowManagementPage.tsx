'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowManagement } from '@/hooks/use-workflow-management';
import {
  MANAGEMENT_TAB_DEFINITIONS,
  WORKFLOW_MANAGEMENT_DESCRIPTION,
  WORKFLOW_MANAGEMENT_TITLE,
  WORKFLOW_MANAGEMENT_TRANSITION_DESCRIPTION,
  WORKFLOW_MANAGEMENT_TRANSITION_TITLE,
} from '@/lib/workflows/management/constants';
import {
  buildManagementViewState,
  parseManagementSearchParams,
  serializeManagementSearchParams,
} from '@/lib/workflows/management/search-params';
import type {
  ManagementAssignmentsSubtab,
  ManagementCurrentQueueFilter,
  ManagementTabId,
  WorkflowManagementFilters,
  WorkflowManagementViewState,
} from '@/lib/workflows/management/types';
import { AssignmentsPanel } from './AssignmentsPanel';
import { CompletedPanel } from './CompletedPanel';
import { CurrentQueuePanel } from './CurrentQueuePanel';
import { ManagementToolbar } from './ManagementToolbar';
import { RequestDetailDialog } from './RequestDetailDialog';

function resolveErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function LoadingState() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
      </CardContent>
    </Card>
  );
}

export function WorkflowManagementPage() {
  const { collaborators } = useCollaborators();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = React.useTransition();
  const [selectedRequestId, setSelectedRequestId] = React.useState<number | null>(null);

  const rawState = React.useMemo(
    () => parseManagementSearchParams(searchParams),
    [searchParams],
  );

  const {
    bootstrapQuery,
    currentQuery,
    assignmentsQuery,
    completedQuery,
    detailQuery,
    assignMutation,
    finalizeMutation,
    archiveMutation,
  } = useWorkflowManagement(rawState, selectedRequestId);

  const canViewCurrentQueue = bootstrapQuery.data?.capabilities.canViewCurrentQueue ?? false;

  const viewState = React.useMemo<WorkflowManagementViewState>(() => {
    if (bootstrapQuery.data && rawState.activeTab === 'current' && !canViewCurrentQueue) {
      return {
        ...rawState,
        activeTab: 'assignments',
      };
    }

    return rawState;
  }, [bootstrapQuery.data, canViewCurrentQueue, rawState]);

  const updateUrlState = React.useCallback(
    (nextState: WorkflowManagementViewState) => {
      const nextParams = serializeManagementSearchParams(nextState);
      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router],
  );

  React.useEffect(() => {
    if (bootstrapQuery.data && rawState.activeTab === 'current' && !canViewCurrentQueue) {
      updateUrlState({
        ...rawState,
        activeTab: 'assignments',
      });
    }
  }, [bootstrapQuery.data, canViewCurrentQueue, rawState, updateUrlState]);

  const updateViewState = React.useCallback(
    (
      updates: Partial<WorkflowManagementViewState> & {
        filters?: WorkflowManagementFilters;
      },
    ) => {
      updateUrlState(buildManagementViewState(viewState, updates));
    },
    [updateUrlState, viewState],
  );

  const visibleTabs = React.useMemo(
    () =>
      MANAGEMENT_TAB_DEFINITIONS.filter(
        (tab) => tab.tab !== 'current' || canViewCurrentQueue,
      ),
    [canViewCurrentQueue],
  );

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title={WORKFLOW_MANAGEMENT_TITLE}
        description={WORKFLOW_MANAGEMENT_DESCRIPTION}
      />

      <Card className="border-border/70 bg-muted/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Fase 2A.3</Badge>
            <Badge variant="outline">
              {isNavigating ? 'Sincronizando URL' : 'URL state oficial ativo'}
            </Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-headline text-lg">
              {WORKFLOW_MANAGEMENT_TRANSITION_TITLE}
            </CardTitle>
            <CardDescription className="max-w-3xl font-body text-sm">
              {WORKFLOW_MANAGEMENT_TRANSITION_DESCRIPTION}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          /requests, /me/tasks, /applications e /pilot/facilities permanecem disponiveis durante a
          transicao desta superficie oficial.
        </CardContent>
      </Card>

      {bootstrapQuery.isLoading && !bootstrapQuery.data ? <LoadingState /> : null}

      {bootstrapQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {resolveErrorMessage(
            bootstrapQuery.error,
            'Nao foi possivel carregar o bootstrap oficial da tela.',
          )}
        </div>
      ) : null}

      {bootstrapQuery.data ? (
        <>
          <ManagementToolbar
            bootstrap={bootstrapQuery.data}
            filters={viewState.filters}
            onApplyFilters={(filters) => updateViewState({ filters })}
            onResetFilters={() => updateViewState({ filters: {} })}
          />

          {!canViewCurrentQueue ? (
            <Card className="border-dashed">
              <CardContent className="p-4 text-sm text-muted-foreground">
                A aba `Chamados atuais` exige ownership explicito. Seu perfil continua com acesso
                operacional a `Atribuicoes e acoes` e `Concluidas`.
              </CardContent>
            </Card>
          ) : null}

          <Tabs
            value={viewState.activeTab}
            onValueChange={(value) => updateViewState({ activeTab: value as ManagementTabId })}
            className="space-y-4"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-muted/60 p-1">
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.tab} value={tab.tab} className="px-4 py-2">
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {viewState.activeTab === 'current' && canViewCurrentQueue ? (
            <CurrentQueuePanel
              data={currentQuery.data}
              filter={viewState.currentFilter}
              isLoading={currentQuery.isLoading || isNavigating}
              errorMessage={
                currentQuery.error
                  ? resolveErrorMessage(currentQuery.error, 'Falha ao carregar a fila atual.')
                  : undefined
              }
              onFilterChange={(filter: ManagementCurrentQueueFilter) =>
                updateViewState({ activeTab: 'current', currentFilter: filter })
              }
              onOpenRequest={setSelectedRequestId}
            />
          ) : null}

          {viewState.activeTab === 'assignments' ? (
            <AssignmentsPanel
              data={assignmentsQuery.data}
              activeSubtab={viewState.assignmentsSubtab}
              isLoading={assignmentsQuery.isLoading || isNavigating}
              errorMessage={
                assignmentsQuery.error
                  ? resolveErrorMessage(
                      assignmentsQuery.error,
                      'Falha ao carregar atribuicoes e acoes.',
                    )
                  : undefined
              }
              onSubtabChange={(subtab: ManagementAssignmentsSubtab) =>
                updateViewState({ activeTab: 'assignments', assignmentsSubtab: subtab })
              }
              onOpenRequest={setSelectedRequestId}
            />
          ) : null}

          {viewState.activeTab === 'completed' ? (
            <CompletedPanel
              data={completedQuery.data}
              isLoading={completedQuery.isLoading || isNavigating}
              errorMessage={
                completedQuery.error
                  ? resolveErrorMessage(
                      completedQuery.error,
                      'Falha ao carregar a lista de concluidas.',
                  )
                  : undefined
              }
              onOpenRequest={setSelectedRequestId}
            />
          ) : null}

          <RequestDetailDialog
            open={selectedRequestId !== null}
            requestId={selectedRequestId}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            errorMessage={
              detailQuery.error
                ? resolveErrorMessage(detailQuery.error, 'Falha ao carregar o detalhe do chamado.')
                : undefined
            }
            collaborators={collaborators}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedRequestId(null);
              }
            }}
            onAssign={async (summary, collaborator) => {
              await assignMutation.mutateAsync({
                requestId: summary.requestId,
                responsibleUserId: collaborator.id3a,
                responsibleName: collaborator.name,
              });
            }}
            onFinalize={async (summary) => {
              await finalizeMutation.mutateAsync({
                requestId: summary.requestId,
              });
            }}
            onArchive={async (summary) => {
              await archiveMutation.mutateAsync({
                requestId: summary.requestId,
              });
            }}
            isAssigning={assignMutation.isPending}
            isFinalizing={finalizeMutation.isPending}
            isArchiving={archiveMutation.isPending}
          />
        </>
      ) : null}
    </div>
  );
}
