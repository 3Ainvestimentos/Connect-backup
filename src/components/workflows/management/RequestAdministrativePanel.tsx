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
  variant?: 'default' | 'elevated';
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
  variant = 'default',
}: RequestAdministrativePanelProps) {
  const canShowAssignForm = detail.permissions.canAssign;
  const canShowArchive = detail.permissions.canArchive;

  if (!canShowAssignForm && !canShowArchive) {
    return null;
  }

  const selectedResponsible =
    collaborators.find((collaborator) => collaborator.id3a === selectedResponsibleId) ?? null;

  return (
    <section
      className={
        variant === 'elevated'
          ? 'rounded-xl border border-admin-primary/25 bg-admin-primary/5 p-4'
          : 'rounded-xl border bg-background p-4'
      }
      aria-labelledby="request-admin-panel-title"
    >
      <div className="space-y-1">
        <h2 id="request-admin-panel-title" className="text-sm font-semibold text-foreground">
          Administração do chamado
        </h2>
        <p className="text-sm text-muted-foreground">
          Atribuição e arquivamento ficam disponíveis apenas quando o payload autoriza.
        </p>
      </div>

      {canShowAssignForm ? (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {detail.summary.hasResponsible ? 'Reatribuir responsável' : 'Atribuir responsável'}
            </p>
            <p className="text-sm text-muted-foreground">
              Selecione um colaborador carregado pela sessão autenticada.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="management-responsible-select">Responsável</Label>
              <Select value={selectedResponsibleId} onValueChange={onResponsibleChange}>
                <SelectTrigger id="management-responsible-select" aria-label="Responsável">
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
              className={variant === 'elevated' ? 'bg-admin-primary hover:bg-admin-primary/90' : undefined}
              onClick={onAssign}
              disabled={
                !selectedResponsible ||
                selectedResponsible.id3a === detail.summary.responsibleUserId ||
                isAssigning
              }
              aria-disabled={
                !selectedResponsible ||
                selectedResponsible.id3a === detail.summary.responsibleUserId ||
                isAssigning
              }
            >
              {isAssigning
                ? 'Salvando...'
                : detail.summary.hasResponsible
                  ? 'Reatribuir responsável'
                  : 'Atribuir responsável'}
            </Button>
          </div>
        </div>
      ) : null}

      {canShowArchive ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onArchive}
            disabled={isArchiving}
            aria-disabled={isArchiving}
          >
            {isArchiving ? 'Arquivando...' : 'Arquivar'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
