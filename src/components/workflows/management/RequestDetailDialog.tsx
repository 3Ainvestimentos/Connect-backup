'use client';

import * as React from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '@/components/ui/badge';
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
import {
  deriveManagementRequestPresentation,
  formatManagementDate,
  getManagementSlaBadgeVariant,
  getManagementSlaLabel,
} from '@/lib/workflows/management/presentation';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';
import { buildRequestOperationalViewModel } from '@/lib/workflows/management/request-detail-view-model';
import { ManagementAsyncState, ManagementErrorState } from './ManagementAsyncState';
import { RequestAdministrativePanel } from './RequestAdministrativePanel';
import { RequestActionCard } from './RequestActionCard';
import { RequestAttachments } from './RequestAttachments';
import { RequestFormData } from './RequestFormData';
import { RequestOperationalHero } from './RequestOperationalHero';
import { RequestProgress } from './RequestProgress';
import { RequestTimeline } from './RequestTimeline';

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
  const permissions = detail?.permissions;
  const presentation = summary ? deriveManagementRequestPresentation(summary) : null;
  const slaLabel = summary ? getManagementSlaLabel(summary.slaState) : null;
  const blockingErrorMessage = detail ? undefined : errorMessage;
  const hasNonBlockingError = Boolean(detail && errorMessage);
  const viewModel = detail ? buildRequestOperationalViewModel(detail) : null;

  const handleAssign = async () => {
    if (!summary || !selectedResponsible) {
      return;
    }

    await onAssign(summary, selectedResponsible);
  };

  const handleFinalize = async () => {
    if (!summary) {
      return;
    }

    await onFinalize(summary);
  };

  const handleAdvance = async () => {
    if (!summary) {
      return;
    }

    await onAdvance(summary);
  };

  const handleArchive = async () => {
    if (!summary) {
      return;
    }

    await onArchive(summary);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,calc(100vh-2rem))] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>Chamado #{summary?.requestId ?? requestId}</DialogTitle>
          <DialogDescription>
            {summary
              ? `${summary.workflowName || summary.workflowTypeId} • etapa atual ${summary.currentStepName}.`
              : 'Carregando detalhe oficial do chamado.'}
          </DialogDescription>
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
                {detail && viewModel ? (
                  <>
                    {hasNonBlockingError ? (
                      <ManagementErrorState
                        title="Falha ao atualizar o detalhe"
                        message={errorMessage!}
                        onRetry={onRetry}
                      />
                    ) : null}

                    <section className="space-y-4 rounded-xl border bg-muted/20 p-4" aria-labelledby="request-summary-title">
                      <div className="space-y-1">
                        <h2 id="request-summary-title" className="text-sm font-semibold text-foreground">
                          Resumo do chamado
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Contexto principal, identificacao e metadados oficiais do chamado.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {presentation ? <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge> : null}
                        <Badge variant="outline">{summary?.workflowName || summary?.workflowTypeId}</Badge>
                        <Badge variant="outline">Workflow {summary?.workflowVersion}</Badge>
                        {summary?.hasPendingActions ? (
                          <Badge variant="outline">Ha acoes pendentes</Badge>
                        ) : null}
                        {slaLabel ? (
                          <Badge variant={getManagementSlaBadgeVariant(summary?.slaState)}>
                            SLA: {slaLabel}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Solicitante</p>
                          <p className="text-muted-foreground">{summary?.requesterName || '-'}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Responsavel</p>
                          <p className="text-muted-foreground">{summary?.responsibleName || 'Nao atribuido'}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Aberto em</p>
                          <p className="text-muted-foreground">
                            {formatManagementDate(summary?.submittedAt ?? null)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Ultima atualizacao</p>
                          <p className="text-muted-foreground">
                            {formatManagementDate(summary?.lastUpdatedAt ?? null)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Finalizado em</p>
                          <p className="text-muted-foreground">
                            {formatManagementDate(summary?.finalizedAt ?? null)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Arquivado em</p>
                          <p className="text-muted-foreground">
                            {formatManagementDate(summary?.archivedAt ?? null)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Area</p>
                          <p className="text-muted-foreground">{summary?.areaId || '-'}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Owner</p>
                          <p className="text-muted-foreground">{summary?.ownerEmail || '-'}</p>
                        </div>
                      </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
                      <div className="space-y-6">
                        <RequestOperationalHero
                          detail={detail}
                          viewModel={viewModel}
                          onAdvance={handleAdvance}
                          onFinalize={handleFinalize}
                          isAdvancing={isAdvancing}
                          isFinalizing={isFinalizing}
                        />

                        {viewModel.shouldRenderActionZone ? (
                          <section className="space-y-3" aria-labelledby="request-action-zone-title">
                            <div className="space-y-1">
                              <h2 id="request-action-zone-title" className="text-sm font-semibold text-foreground">
                                Action da etapa
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                A superficie oficial de requestAction/respondAction continua neste bloco.
                              </p>
                            </div>
                            <RequestActionCard
                              detail={detail}
                              collaborators={collaborators}
                              onRequestAction={onRequestAction}
                              onRespondAction={onRespondAction}
                              isRequestingAction={isRequestingAction}
                              isRespondingAction={isRespondingAction}
                              variant={viewModel.showActionZoneAsPrimary ? 'primary' : 'default'}
                            />
                          </section>
                        ) : null}

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
                      </div>

                      <div className="space-y-6">
                        <RequestProgress progress={detail.progress} />
                        <RequestTimeline timeline={detail.timeline} />
                        <RequestFormData formData={detail.formData} />
                        <RequestAttachments attachments={detail.attachments} />
                      </div>
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
