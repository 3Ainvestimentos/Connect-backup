'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowManagement } from '@/hooks/use-workflow-management';
import {
  MANAGEMENT_TAB_DEFINITIONS,
  WORKFLOW_MANAGEMENT_DESCRIPTION,
  WORKFLOW_MANAGEMENT_TITLE,
} from '@/lib/workflows/management/constants';
import {
  buildManagementViewState,
  parseManagementSearchParams,
  serializeManagementSearchParams,
} from '@/lib/workflows/management/search-params';
import {
  getManagementActiveFilterChips,
  getManagementTabErrorMessage,
  hasManagementActiveFilters,
} from '@/lib/workflows/management/presentation';
import {
  ManagementErrorState,
  ManagementPanelSkeleton,
} from './ManagementAsyncState';
import type {
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

export function WorkflowManagementPage() {
  const { collaborators } = useCollaborators();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
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
    refetchActiveTab,
    refetchDetail,
    assignMutation,
    finalizeMutation,
    archiveMutation,
    requestActionMutation,
    respondActionMutation,
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
      setSelectedRequestId(null);
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
  const tabsGridClassName = React.useMemo(() => {
    if (visibleTabs.length === 2) {
      return 'grid-cols-1 sm:grid-cols-2';
    }

    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }, [visibleTabs.length]);
  const hasActiveFilters = React.useMemo(
    () => hasManagementActiveFilters(viewState.filters),
    [viewState.filters],
  );
  const activeFilterChips = React.useMemo(
    () =>
      getManagementActiveFilterChips(
        viewState.filters,
        bootstrapQuery.data?.filterOptions,
      ),
    [bootstrapQuery.data?.filterOptions, viewState.filters],
  );
  const handleRetryActiveTab = React.useCallback(() => {
    void refetchActiveTab();
  }, [refetchActiveTab]);
  const handleRetryBootstrap = React.useCallback(() => {
    void bootstrapQuery.refetch();
  }, [bootstrapQuery]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title={WORKFLOW_MANAGEMENT_TITLE}
        description={WORKFLOW_MANAGEMENT_DESCRIPTION}
      />

      {bootstrapQuery.isLoading && !bootstrapQuery.data ? (
        <Card className="border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">Carregando superfície oficial</CardTitle>
            <CardDescription>
              Bootstrap, ownership e filtros oficiais estão sendo resolvidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManagementPanelSkeleton rows={2} />
          </CardContent>
        </Card>
      ) : null}

      {bootstrapQuery.error ? (
        <ManagementErrorState
          title="Falha ao carregar a tela oficial"
          message={resolveErrorMessage(
            bootstrapQuery.error,
            'Nao foi possivel carregar o bootstrap oficial da tela.',
          )}
          onRetry={handleRetryBootstrap}
        />
      ) : null}

      {bootstrapQuery.data ? (
        <>
          <section className="space-y-4 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm">
            <Tabs
              value={viewState.activeTab}
              onValueChange={(value) => updateViewState({ activeTab: value as ManagementTabId })}
              className="space-y-0"
            >
              <TabsList
                className={`grid h-auto w-full gap-2 rounded-xl bg-muted/70 p-1 ${tabsGridClassName}`}
              >
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.tab}
                    value={tab.tab}
                    className="w-full px-4 py-2 text-center"
                  >
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-4">
              <div className="flex w-full justify-end">
                <div className="w-full lg:w-auto">
                  <ManagementToolbar
                    bootstrap={bootstrapQuery.data}
                    filters={viewState.filters}
                    onApplyFilters={(filters) => updateViewState({ filters })}
                    onResetFilters={() => updateViewState({ filters: {} })}
                  />
                </div>
              </div>

              {activeFilterChips.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilterChips.map((chip) => (
                    <Badge
                      key={chip.key}
                      variant="outline"
                      className="border-admin-primary/20 bg-admin-primary/5 text-admin-primary"
                    >
                      {chip.label}
                    </Badge>
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateViewState({ filters: {} })}
                    className="h-8 px-2 text-admin-primary hover:bg-admin-primary/10 hover:text-admin-primary"
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          {viewState.activeTab === 'current' && canViewCurrentQueue ? (
            <CurrentQueuePanel
              data={currentQuery.data}
              filter={viewState.currentFilter}
              hasActiveFilters={hasActiveFilters}
              isLoading={currentQuery.isLoading || isNavigating}
              errorMessage={
                currentQuery.error
                  ? resolveErrorMessage(currentQuery.error, getManagementTabErrorMessage('current'))
                  : undefined
              }
              onFilterChange={(filter: ManagementCurrentQueueFilter) =>
                updateViewState({ activeTab: 'current', currentFilter: filter })
              }
              onRetry={handleRetryActiveTab}
              onOpenRequest={setSelectedRequestId}
            />
          ) : null}

          {viewState.activeTab === 'assignments' ? (
            <AssignmentsPanel
              data={assignmentsQuery.data}
              activeSubtab={viewState.assignmentsSubtab}
              hasActiveFilters={hasActiveFilters}
              isLoading={assignmentsQuery.isLoading || isNavigating}
              errorMessage={
                assignmentsQuery.error
                  ? resolveErrorMessage(assignmentsQuery.error, getManagementTabErrorMessage('assignments'))
                  : undefined
              }
              onRetry={handleRetryActiveTab}
              onOpenRequest={setSelectedRequestId}
            />
          ) : null}

          {viewState.activeTab === 'completed' ? (
            <CompletedPanel
              data={completedQuery.data}
              hasActiveFilters={hasActiveFilters}
              isLoading={completedQuery.isLoading || isNavigating}
              errorMessage={
                completedQuery.error
                  ? resolveErrorMessage(completedQuery.error, getManagementTabErrorMessage('completed'))
                  : undefined
              }
              onRetry={handleRetryActiveTab}
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
            onRetry={() => {
              void refetchDetail();
            }}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedRequestId(null);
              }
            }}
            onAssign={async (summary, collaborator) => {
              try {
                const result = await assignMutation.mutateAsync({
                  requestId: summary.requestId,
                  responsibleUserId: collaborator.id3a,
                  responsibleName: collaborator.name,
                });
                toast({
                  title: 'Responsavel atualizado',
                  description: `Chamado #${result.requestId} reprocessado com sucesso.`,
                });
                return result;
              } catch (error) {
                toast({
                  title: 'Falha ao atribuir responsavel',
                  description: resolveErrorMessage(
                    error,
                    'Nao foi possivel atualizar o responsavel deste chamado.',
                  ),
                  variant: 'destructive',
                });
                throw error;
              }
            }}
            onFinalize={async (summary) => {
              try {
                const result = await finalizeMutation.mutateAsync({
                  requestId: summary.requestId,
                });
                toast({
                  title: 'Chamado finalizado',
                  description: `Chamado #${result.requestId} finalizado com sucesso.`,
                });
                setSelectedRequestId(null);
                return result;
              } catch (error) {
                toast({
                  title: 'Falha ao finalizar chamado',
                  description: resolveErrorMessage(
                    error,
                    'Nao foi possivel finalizar este chamado.',
                  ),
                  variant: 'destructive',
                });
                throw error;
              }
            }}
            onArchive={async (summary) => {
              try {
                const result = await archiveMutation.mutateAsync({
                  requestId: summary.requestId,
                });
                toast({
                  title: 'Chamado arquivado',
                  description: `Chamado #${result.requestId} arquivado com sucesso.`,
                });
                setSelectedRequestId(null);
                return result;
              } catch (error) {
                toast({
                  title: 'Falha ao arquivar chamado',
                  description: resolveErrorMessage(
                    error,
                    'Nao foi possivel arquivar este chamado.',
                  ),
                  variant: 'destructive',
                });
                throw error;
              }
            }}
            onRequestAction={async (summary) => {
              try {
                const result = await requestActionMutation.mutateAsync({
                  requestId: summary.requestId,
                });
                toast({
                  title: 'Action solicitada',
                  description: `Chamado #${result.requestId} entrou em aguardando action.`,
                });
                return result;
              } catch (error) {
                toast({
                  title: 'Falha ao solicitar action',
                  description: resolveErrorMessage(
                    error,
                    'Nao foi possivel abrir a action operacional desta etapa.',
                  ),
                  variant: 'destructive',
                });
                throw error;
              }
            }}
            onRespondAction={async (summary, payload) => {
              try {
                const result = await respondActionMutation.mutateAsync({
                  requestId: summary.requestId,
                  response: payload.response,
                  comment: payload.comment,
                  attachmentFile: payload.attachmentFile,
                });
                toast({
                  title: 'Action respondida',
                  description: `Resposta operacional do chamado #${result.requestId} registrada com sucesso.`,
                });
                return result;
              } catch (error) {
                toast({
                  title: 'Falha ao responder action',
                  description: resolveErrorMessage(
                    error,
                    'Nao foi possivel registrar a resposta operacional deste chamado.',
                  ),
                  variant: 'destructive',
                });
                throw error;
              }
            }}
            isAssigning={assignMutation.isPending}
            isFinalizing={finalizeMutation.isPending}
            isArchiving={archiveMutation.isPending}
            isRequestingAction={requestActionMutation.isPending}
            isRespondingAction={respondActionMutation.isPending}
          />
        </>
      ) : null}
    </div>
  );
}
