'use client';

import * as React from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';
import { buildRequestDetailShellViewModel } from '@/lib/workflows/management/request-detail-view-model';
import { ManagementAsyncState, ManagementErrorState } from './ManagementAsyncState';
import { RequestAdministrativePanel } from './RequestAdministrativePanel';
import { RequestActionCard } from './RequestActionCard';
import { RequestDetailHeader } from './RequestDetailHeader';
import { RequestOperationalHero } from './RequestOperationalHero';
import { RequestStepHistorySection } from './RequestStepHistorySection';
import { RequestSubmittedDataSection } from './RequestSubmittedDataSection';
import { RequestSummarySection } from './RequestSummarySection';

type RequestDetailDialogProps = {
  open: boolean;
  requestId: number | null;
  detail?: WorkflowManagementRequestDetailData;
  isLoading?: boolean;
  errorMessage?: string;
  collaborators: Collaborator[];
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  onAssign: (summary: WorkflowManagementRequestSummary, collaborator: Collaborator) => Promise<unknown>;
  onAdvance: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onFinalize: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onArchive: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onRequestAction: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onRespondAction: (
    summary: WorkflowManagementRequestSummary,
    payload: {
      response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
      comment?: string;
      attachmentFile?: File | null;
    },
  ) => Promise<unknown>;
  isAssigning?: boolean;
  isAdvancing?: boolean;
  isFinalizing?: boolean;
  isArchiving?: boolean;
  isRequestingAction?: boolean;
  isRespondingAction?: boolean;
};

function LoadingState() {
  return (
    <div className="space-y-4 p-1">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function RequestDetailDialog({
  open,
  requestId,
  detail,
  isLoading = false,
  errorMessage,
  collaborators,
  onOpenChange,
  onRetry,
  onAssign,
  onAdvance,
  onFinalize,
  onArchive,
  onRequestAction,
  onRespondAction,
  isAssigning = false,
  isAdvancing = false,
  isFinalizing = false,
  isArchiving = false,
  isRequestingAction = false,
  isRespondingAction = false,
}: RequestDetailDialogProps) {
  const [selectedResponsibleId, setSelectedResponsibleId] = React.useState('');

  React.useEffect(() => {
    setSelectedResponsibleId(detail?.summary.responsibleUserId ?? '');
  }, [detail?.summary.responsibleUserId]);

  const sortedCollaborators = React.useMemo(
    () =>
      [...collaborators]
        .filter((collaborator) => Boolean(collaborator.id3a))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [collaborators],
  );

  const selectedResponsible =
    sortedCollaborators.find((collaborator) => collaborator.id3a === selectedResponsibleId) ?? null;

  if (!requestId) {
    return null;
  }

  const summary = detail?.summary;
  const blockingErrorMessage = detail ? undefined : errorMessage;
  const hasNonBlockingError = Boolean(detail && errorMessage);
  const shellViewModel = detail ? buildRequestDetailShellViewModel(detail) : null;

  const handleAssign = async () => {
    if (!summary || !selectedResponsible) {
      return;
    }

    try {
      await onAssign(summary, selectedResponsible);
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  const handleFinalize = async () => {
    if (!summary) {
      return;
    }

    try {
      await onFinalize(summary);
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  const handleAdvance = async () => {
    if (!summary) {
      return;
    }

    try {
      await onAdvance(summary);
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  const handleArchive = async () => {
    if (!summary) {
      return;
    }

    try {
      await onArchive(summary);
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,calc(100vh-2rem))] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          {shellViewModel ? (
            <RequestDetailHeader header={shellViewModel.header} />
          ) : (
            <>
              <DialogTitle>Chamado #{summary?.requestId ?? requestId}</DialogTitle>
              <DialogDescription>
                {summary
                  ? `${summary.workflowName || summary.workflowTypeId} • etapa atual ${summary.currentStepName}.`
                  : 'Carregando detalhe oficial do chamado.'}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-6 px-6 py-5">
              <ManagementAsyncState
                isLoading={isLoading && !detail}
                errorMessage={blockingErrorMessage}
                errorTitle="Falha ao carregar o detalhe"
                isEmpty={!detail}
                emptyTitle="Detalhe indisponivel no momento"
                emptyDescription="Reabra o chamado ou tente novamente para recarregar o contexto operacional."
                onRetry={onRetry}
                loadingContent={<LoadingState />}
              >
                {detail && shellViewModel ? (
                  <>
                    {hasNonBlockingError ? (
                      <ManagementErrorState
                        title="Falha ao atualizar o detalhe"
                        message={errorMessage!}
                        onRetry={onRetry}
                      />
                    ) : null}

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start">
                      <RequestSummarySection summary={shellViewModel.summary} />

                      <section className="space-y-4" aria-labelledby="request-current-action-title">
                        <div className="space-y-1">
                          <h2 id="request-current-action-title" className="text-sm font-semibold text-foreground">
                            Acao atual
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Proximo passo do fluxo, action da etapa e administracao reunidos numa unica macrozona.
                          </p>
                        </div>

                        <div className="space-y-4 rounded-xl border bg-background p-4">
                        {shellViewModel.currentAction.primaryMode === 'admin' ? (
                          <RequestAdministrativePanel
                            detail={detail}
                              collaborators={sortedCollaborators}
                              selectedResponsibleId={selectedResponsibleId}
                              onResponsibleChange={setSelectedResponsibleId}
                              onAssign={handleAssign}
                              onArchive={handleArchive}
                              isAssigning={isAssigning}
                              isArchiving={isArchiving}
                              variant="elevated"
                            />
                          ) : null}

                        <RequestOperationalHero
                          viewModel={shellViewModel.operational}
                          onAdvance={handleAdvance}
                          onFinalize={handleFinalize}
                            isAdvancing={isAdvancing}
                            isFinalizing={isFinalizing}
                          />

                          {shellViewModel.currentAction.shouldRenderActionCard ? (
                            <section className="space-y-3" aria-labelledby="request-action-zone-title">
                              <div className="space-y-1">
                                <h3 id="request-action-zone-title" className="text-sm font-semibold text-foreground">
                                  Action da etapa
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Superficie oficial de requestAction/respondAction dentro da etapa atual.
                                </p>
                              </div>
                              <RequestActionCard
                                detail={detail}
                                collaborators={collaborators}
                                onRequestAction={onRequestAction}
                                onRespondAction={onRespondAction}
                                isRequestingAction={isRequestingAction}
                                isRespondingAction={isRespondingAction}
                                variant={
                                  shellViewModel.currentAction.primaryMode === 'action-card'
                                    ? 'primary'
                                    : 'default'
                                }
                              />
                            </section>
                          ) : null}

                          {shellViewModel.currentAction.shouldRenderAdminPanel &&
                          shellViewModel.currentAction.primaryMode !== 'admin' ? (
                            <RequestAdministrativePanel
                              detail={detail}
                              collaborators={sortedCollaborators}
                              selectedResponsibleId={selectedResponsibleId}
                              onResponsibleChange={setSelectedResponsibleId}
                              onAssign={handleAssign}
                              onArchive={handleArchive}
                              isAssigning={isAssigning}
                              isArchiving={isArchiving}
                            />
                          ) : null}
                        </div>
                      </section>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
                      <RequestStepHistorySection
                        stepsHistory={detail.stepsHistory}
                        progress={detail.progress}
                        timeline={detail.timeline}
                        hasLegacyFallback={shellViewModel.history.hasLegacyFallback}
                      />

                      <RequestSubmittedDataSection
                        formData={detail.formData}
                        attachments={detail.attachments}
                      />
                    </div>
                  </>
                ) : null}
              </ManagementAsyncState>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
