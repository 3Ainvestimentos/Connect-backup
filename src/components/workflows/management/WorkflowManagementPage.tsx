'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
import {
  getManagementTabErrorMessage,
  hasManagementActiveFilters,
} from '@/lib/workflows/management/presentation';
import {
  ManagementErrorState,
  ManagementPanelSkeleton,
} from './ManagementAsyncState';
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
  const hasActiveFilters = React.useMemo(
    () => hasManagementActiveFilters(viewState.filters),
    [viewState.filters],
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
        actions={
          bootstrapQuery.data ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant="secondary">Ator: {bootstrapQuery.data.actor.actorName}</Badge>
              <Badge variant={hasActiveFilters ? 'default' : 'outline'}>
                {hasActiveFilters ? 'Filtros ativos' : 'Sem filtros ativos'}
              </Badge>
              <Badge variant={canViewCurrentQueue ? 'default' : 'outline'}>
                {canViewCurrentQueue ? 'Ownership operacional ativo' : 'Fila atual sob gate'}
              </Badge>
            </div>
          ) : undefined
        }
      />

      <Card className="border-border/70 bg-muted/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Fase 2A.4</Badge>
            <Badge variant="outline">
              {isNavigating ? 'Sincronizando URL' : 'URL state oficial ativo'}
            </Badge>
            <Badge variant="outline">
              {selectedRequestId ? `Detalhe aberto #${selectedRequestId}` : 'Sem modal aberto'}
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
          /requests e /me/tasks seguem disponiveis como atalhos legados durante a transicao. /pilot/facilities permanece como fallback operacional fora do CTA principal.
        </CardContent>
      </Card>

      {bootstrapQuery.isLoading && !bootstrapQuery.data ? (
        <Card className="border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">Carregando superficie oficial</CardTitle>
            <CardDescription>
              Bootstrap, ownership e filtros oficiais estao sendo resolvidos.
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
              onSubtabChange={(subtab: ManagementAssignmentsSubtab) =>
                updateViewState({ activeTab: 'assignments', assignmentsSubtab: subtab })
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
            isAssigning={assignMutation.isPending}
            isFinalizing={finalizeMutation.isPending}
            isArchiving={archiveMutation.isPending}
          />
        </>
      ) : null}
    </div>
  );
}
