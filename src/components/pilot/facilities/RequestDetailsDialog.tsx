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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { derivePilotRequestPresentation, formatPilotDate } from '@/lib/workflows/pilot/presentation';
import type {
  ArchivePilotRequestInput,
  AssignPilotResponsibleInput,
  FinalizePilotRequestInput,
  PilotRequestSummary,
} from '@/lib/workflows/pilot/types';

type RequestDetailsDialogProps = {
  open: boolean;
  request: PilotRequestSummary | null;
  actorUserId: string;
  collaborators: Collaborator[];
  isAssigning?: boolean;
  isFinalizing?: boolean;
  isArchiving?: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (payload: AssignPilotResponsibleInput) => Promise<unknown>;
  onFinalize: (payload: FinalizePilotRequestInput) => Promise<unknown>;
  onArchive: (payload: ArchivePilotRequestInput) => Promise<unknown>;
};

export function RequestDetailsDialog({
  open,
  request,
  actorUserId,
  collaborators,
  isAssigning = false,
  isFinalizing = false,
  isArchiving = false,
  onOpenChange,
  onAssign,
  onFinalize,
  onArchive,
}: RequestDetailsDialogProps) {
  const [selectedResponsibleId, setSelectedResponsibleId] = React.useState('');

  React.useEffect(() => {
    setSelectedResponsibleId(request?.responsibleUserId ?? '');
  }, [request]);

  const sortedCollaborators = React.useMemo(
    () =>
      [...collaborators]
        .filter((collaborator) => Boolean(collaborator.id3a))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [collaborators],
  );

  if (!request) {
    return null;
  }

  const presentation = derivePilotRequestPresentation(request, actorUserId);
  const selectedResponsible =
    sortedCollaborators.find((collaborator) => collaborator.id3a === selectedResponsibleId) ?? null;

  const handleAssign = async () => {
    if (!selectedResponsible) {
      return;
    }

    await onAssign({
      requestId: request.requestId,
      responsibleUserId: selectedResponsible.id3a,
      responsibleName: selectedResponsible.name,
    });
  };

  const handleFinalize = async () => {
    await onFinalize({ requestId: request.requestId });
  };

  const handleArchive = async () => {
    await onArchive({ requestId: request.requestId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chamado #{request.requestId}</DialogTitle>
          <DialogDescription>
            {request.workflowName} - etapa atual {request.currentStepName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
            <Badge variant="outline">Workflow {request.workflowVersion}</Badge>
            {request.hasPendingActions ? <Badge variant="outline">Ha acoes pendentes</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Solicitante</p>
              <p className="text-muted-foreground">{request.requesterName || '-'}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Responsavel</p>
              <p className="text-muted-foreground">{request.responsibleName || 'Nao atribuido'}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Aberto em</p>
              <p className="text-muted-foreground">{formatPilotDate(request.submittedAt)}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Atualizado em</p>
              <p className="text-muted-foreground">{formatPilotDate(request.lastUpdatedAt)}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Finalizado em</p>
              <p className="text-muted-foreground">{formatPilotDate(request.finalizedAt)}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Arquivado em</p>
              <p className="text-muted-foreground">{formatPilotDate(request.archivedAt)}</p>
            </div>
          </div>

          {presentation.canAssign ? (
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Atribuir responsavel</p>
                <p className="text-sm text-muted-foreground">
                  Selecione um colaborador carregado pelo shell autenticado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pilot-responsible-select">Responsavel</Label>
                <Select value={selectedResponsibleId} onValueChange={setSelectedResponsibleId}>
                  <SelectTrigger id="pilot-responsible-select" aria-label="Responsavel">
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
                disabled={!selectedResponsible || isAssigning}
              >
                {isAssigning ? 'Atribuindo...' : 'Atribuir responsavel'}
              </Button>
            </div>
          ) : null}

          {(presentation.canFinalize || presentation.canArchive) === false ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Nenhuma acao operacional disponivel para o estado atual.
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {presentation.canFinalize ? (
            <Button type="button" variant="secondary" onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? 'Finalizando...' : 'Finalizar'}
            </Button>
          ) : null}
          {presentation.canArchive ? (
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
