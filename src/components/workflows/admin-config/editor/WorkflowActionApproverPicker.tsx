"use client";

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  WorkflowConfigCollaboratorLookup,
  WorkflowDraftEditorApprover,
} from '@/lib/workflows/admin-config/types';

/**
 * Props publicas do `WorkflowActionApproverPicker`.
 *
 * O componente e puro (apenas estado local de busca) e nao acessa `react-hook-form`
 * diretamente. A integracao com o formulario fica a cargo do parent, que recebe
 * um unico `onChange(approvers, unresolvedIds)` ja deduplicado e com
 * `unresolvedApproverIds` sempre limpos apos qualquer toggle (vide ADR-3 do DESIGN).
 */
export type WorkflowActionApproverPickerProps = {
  /** Lista completa de colaboradores disponiveis para selecao. */
  collaborators: WorkflowConfigCollaboratorLookup[];
  /** Aprovadores ja resolvidos no estado atual do form. */
  selectedApprovers: WorkflowDraftEditorApprover[];
  /** IDs antigos (id3a) que nao puderam ser hidratados a partir do collaborator lookup. */
  unresolvedApproverIds: string[];
  /** Disabled visual + bloqueio de interacao quando true. */
  readOnly?: boolean;
  /**
   * Callback unico para qualquer mudanca de selecao.
   * - approvers: array deduplicado por `collaboratorDocId`.
   * - unresolvedApproverIds: sempre `[]` apos qualquer interacao (vide ADR-3).
   */
  onChange: (approvers: WorkflowDraftEditorApprover[], unresolvedApproverIds: string[]) => void;
  /** Slug usado para data-testid (opcional, util quando o picker e renderizado por step). */
  testIdPrefix?: string;
};

const UNRESOLVED_BANNER_TEXT =
  'Alguns aprovadores anteriores nao puderam ser resolvidos. Remova-os para poder salvar.';

/**
 * Componente stateless para selecao de aprovadores de uma acao de workflow.
 *
 * Responsabilidades:
 * - Filtragem local por nome, email ou area.
 * - Renderizacao da lista de checkboxes e das badges de aprovadores selecionados.
 * - Exibicao do banner ambar quando existem `unresolvedApproverIds`.
 * - Deduplicacao por `collaboratorDocId` antes de chamar `onChange`.
 * - Limpeza automatica dos `unresolvedApproverIds` ao tocar em qualquer checkbox.
 */
export function WorkflowActionApproverPicker({
  collaborators,
  selectedApprovers,
  unresolvedApproverIds,
  readOnly = false,
  onChange,
  testIdPrefix = 'approver-picker',
}: WorkflowActionApproverPickerProps) {
  const [search, setSearch] = useState('');

  const filteredCollaborators = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return collaborators;
    }

    return collaborators.filter((collaborator) => {
      const haystack = `${collaborator.name} ${collaborator.email} ${collaborator.area || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [collaborators, search]);

  const handleToggle = (collaborator: WorkflowConfigCollaboratorLookup, nextChecked: boolean) => {
    const next = nextChecked
      ? [
          ...selectedApprovers,
          {
            collaboratorDocId: collaborator.collaboratorDocId,
            userId: collaborator.userId,
            name: collaborator.name,
            email: collaborator.email,
          },
        ]
      : selectedApprovers.filter((approver) => approver.collaboratorDocId !== collaborator.collaboratorDocId);

    const deduped = Array.from(
      new Map(next.map((approver) => [approver.collaboratorDocId, approver])).values(),
    );

    onChange(deduped, []);
  };

  return (
    <div className="space-y-2" data-testid={testIdPrefix}>
      <Label>Selecionar aprovadores</Label>
      <Input
        placeholder="Filtrar por nome, email ou area"
        value={search}
        disabled={readOnly}
        onChange={(event) => setSearch(event.target.value)}
        data-testid={`${testIdPrefix}-search`}
      />

      <div className="flex flex-wrap gap-2" data-testid={`${testIdPrefix}-selected`}>
        {selectedApprovers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aprovador selecionado.</p>
        ) : (
          selectedApprovers.map((approver) => (
            <Badge key={approver.collaboratorDocId} variant="secondary">
              {approver.name}
            </Badge>
          ))
        )}
      </div>

      {unresolvedApproverIds.length > 0 ? (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
          data-testid={`${testIdPrefix}-unresolved-banner`}
        >
          {UNRESOLVED_BANNER_TEXT}
        </div>
      ) : null}

      <ScrollArea className="h-48 rounded-md border bg-background p-3">
        <div className="space-y-3">
          {filteredCollaborators.map((collaborator) => {
            const checked = selectedApprovers.some(
              (approver) => approver.collaboratorDocId === collaborator.collaboratorDocId,
            );

            return (
              <label
                key={collaborator.collaboratorDocId}
                className="flex items-start gap-3 rounded-md border p-3 text-sm"
              >
                <Checkbox
                  checked={checked}
                  disabled={readOnly}
                  onCheckedChange={(value) => handleToggle(collaborator, value === true)}
                />
                <div className="space-y-1">
                  <p className="font-medium">{collaborator.name}</p>
                  <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                  {collaborator.area ? (
                    <p className="text-xs text-muted-foreground">{collaborator.area}</p>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
