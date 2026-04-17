'use client';

import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';

type RequestAdministrativePanelProps = {
  detail: WorkflowManagementRequestDetailData;
  collaborators: Collaborator[];
  selectedResponsibleId: string;
  onResponsibleChange: (value: string) => void;
  onAssign: () => Promise<unknown>;
  onArchive: () => Promise<unknown>;
  isAssigning?: boolean;
  isArchiving?: boolean;
};

export function RequestAdministrativePanel({
  detail,
  collaborators,
  selectedResponsibleId,
  onResponsibleChange,
  onAssign,
  onArchive,
  isAssigning = false,
  isArchiving = false,
}: RequestAdministrativePanelProps) {
  const canShowAssignForm = detail.permissions.canAssign;
  const canShowArchive = detail.permissions.canArchive;

  if (!canShowAssignForm && !canShowArchive) {
    return null;
  }

  const selectedResponsible =
    collaborators.find((collaborator) => collaborator.id3a === selectedResponsibleId) ?? null;

  return (
    <section className="rounded-xl border bg-background p-4" aria-labelledby="request-admin-panel-title">
      <div className="space-y-1">
        <h2 id="request-admin-panel-title" className="text-sm font-semibold text-foreground">
          Administracao do chamado
        </h2>
        <p className="text-sm text-muted-foreground">
          Atribuicao e arquivamento ficam separados do proximo passo do fluxo.
        </p>
      </div>

      {canShowAssignForm ? (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {detail.summary.hasResponsible ? 'Reatribuir responsavel' : 'Atribuir responsavel'}
            </p>
            <p className="text-sm text-muted-foreground">
              Selecione um colaborador carregado pela sessao autenticada.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="management-responsible-select">Responsavel</Label>
              <Select value={selectedResponsibleId} onValueChange={onResponsibleChange}>
                <SelectTrigger id="management-responsible-select" aria-label="Responsavel">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((collaborator) => (
                    <SelectItem key={collaborator.id3a} value={collaborator.id3a!}>
                      {collaborator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={onAssign}
              disabled={
                !selectedResponsible ||
                selectedResponsible.id3a === detail.summary.responsibleUserId ||
                isAssigning
              }
            >
              {isAssigning
                ? 'Salvando...'
                : detail.summary.hasResponsible
                  ? 'Reatribuir responsavel'
                  : 'Atribuir responsavel'}
            </Button>
          </div>
        </div>
      ) : null}

      {canShowArchive ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onArchive} disabled={isArchiving}>
            {isArchiving ? 'Arquivando...' : 'Arquivar'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
