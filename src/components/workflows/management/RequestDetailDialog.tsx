'use client';

import * as React from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { RequestAttachments } from './RequestAttachments';
import { RequestFormData } from './RequestFormData';
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
  onAssign: (summary: WorkflowManagementRequestSummary, collaborator: Collaborator) => Promise<unknown>;
  onFinalize: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onArchive: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  isAssigning?: boolean;
  isFinalizing?: boolean;
  isArchiving?: boolean;
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
  onAssign,
  onFinalize,
  onArchive,
  isAssigning = false,
  isFinalizing = false,
  isArchiving = false,
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
  const canShowAssignForm = permissions?.canAssign === true;
  const canShowFinalize = permissions?.canFinalize === true;
  const canShowArchive = permissions?.canArchive === true;
  const hasAction = canShowAssignForm || canShowFinalize || canShowArchive;

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

  const handleArchive = async () => {
    if (!summary) {
      return;
    }

    await onArchive(summary);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Chamado #{summary?.requestId ?? requestId}</DialogTitle>
          <DialogDescription>
            {summary
              ? `${summary.workflowName || summary.workflowTypeId} • etapa atual ${summary.currentStepName}.`
              : 'Carregando detalhe oficial do chamado.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-146px)]">
          <div className="space-y-6 px-6 py-5">
            {isLoading && !detail ? <LoadingState /> : null}

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Falha ao carregar o detalhe</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {detail ? (
              <>
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {presentation ? (
                      <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
                    ) : null}
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
                      <p className="text-muted-foreground">
                        {summary?.responsibleName || 'Nao atribuido'}
                      </p>
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
                </div>

                {canShowAssignForm ? (
                  <div className="rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {summary?.hasResponsible ? 'Reatribuir responsavel' : 'Atribuir responsavel'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Selecione um colaborador carregado pela sessao autenticada.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="management-responsible-select">Responsavel</Label>
                        <Select
                          value={selectedResponsibleId}
                          onValueChange={setSelectedResponsibleId}
                        >
                          <SelectTrigger id="management-responsible-select" aria-label="Responsavel">
                            <SelectValue placeholder="Selecione um colaborador" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedCollaborators.map((collaborator) => (
                              <SelectItem key={collaborator.id3a} value={collaborator.id3a}>
                                {collaborator.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        onClick={handleAssign}
                        disabled={
                          !selectedResponsible ||
                          selectedResponsible.id3a === summary?.responsibleUserId ||
                          isAssigning
                        }
                      >
                        {isAssigning
                          ? 'Salvando...'
                          : summary?.hasResponsible
                            ? 'Reatribuir responsavel'
                            : 'Atribuir responsavel'}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {!hasAction ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhuma acao operacional disponivel para o estado atual e para as permissoes
                    do ator autenticado.
                  </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <RequestProgress progress={detail.progress} />
                    <RequestAttachments attachments={detail.attachments} />
                  </div>

                  <div className="space-y-6">
                    <RequestFormData formData={detail.formData} />
                    <RequestTimeline timeline={detail.timeline} />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          {canShowFinalize ? (
            <Button type="button" variant="secondary" onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? 'Finalizando...' : 'Finalizar'}
            </Button>
          ) : null}
          {canShowArchive ? (
            <Button type="button" variant="outline" onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? 'Arquivando...' : 'Arquivar'}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
