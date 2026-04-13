'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MANAGEMENT_SLA_LABELS } from '@/lib/workflows/management/constants';
import { hasManagementActiveFilters } from '@/lib/workflows/management/presentation';
import type {
  WorkflowManagementBootstrapData,
  WorkflowManagementFilters,
} from '@/lib/workflows/management/types';

type ManagementToolbarProps = {
  bootstrap: WorkflowManagementBootstrapData;
  filters: WorkflowManagementFilters;
  onApplyFilters: (filters: WorkflowManagementFilters) => void;
  onResetFilters: () => void;
};

type DraftFilters = {
  requestId: string;
  workflowTypeId: string;
  areaId: string;
  requesterQuery: string;
  slaState: string;
  periodFrom: string;
  periodTo: string;
};

function toDraftFilters(filters: WorkflowManagementFilters): DraftFilters {
  return {
    requestId: filters.requestId ? String(filters.requestId) : '',
    workflowTypeId: filters.workflowTypeId ?? '',
    areaId: filters.areaId ?? '',
    requesterQuery: filters.requesterQuery ?? '',
    slaState: filters.slaState ?? '',
    periodFrom: filters.periodFrom ?? '',
    periodTo: filters.periodTo ?? '',
  };
}

function toWorkflowManagementFilters(draft: DraftFilters): WorkflowManagementFilters {
  const requestId = draft.requestId.trim();
  const parsedRequestId =
    /^\d+$/.test(requestId) && Number(requestId) > 0 ? Number(requestId) : undefined;

  return {
    requestId: parsedRequestId,
    workflowTypeId: draft.workflowTypeId || undefined,
    areaId: draft.areaId || undefined,
    requesterQuery: draft.requesterQuery.trim() || undefined,
    slaState:
      draft.slaState === 'on_track' || draft.slaState === 'at_risk' || draft.slaState === 'overdue'
        ? draft.slaState
        : undefined,
    periodFrom: draft.periodFrom || undefined,
    periodTo: draft.periodTo || undefined,
  };
}

export function ManagementToolbar({
  bootstrap,
  filters,
  onApplyFilters,
  onResetFilters,
}: ManagementToolbarProps) {
  const [draft, setDraft] = React.useState<DraftFilters>(() => toDraftFilters(filters));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDraft(toDraftFilters(filters));
  }, [filters]);

  const hasActiveFilters = hasManagementActiveFilters(filters);
  const hasDraftFilters = hasManagementActiveFilters(toWorkflowManagementFilters(draft));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const canReset = hasActiveFilters || hasDraftFilters;

  const handleApply = () => {
    onApplyFilters(toWorkflowManagementFilters(draft));
    setOpen(false);
  };

  const handleReset = () => {
    setDraft(toDraftFilters({}));

    if (hasActiveFilters) {
      onResetFilters();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Abrir filtros"
          className={cn(
            'w-full justify-between gap-3 border-border/70 bg-background/95 md:w-auto',
            hasActiveFilters &&
              'border-admin-primary/30 bg-admin-primary/10 text-admin-primary hover:bg-admin-primary/15 hover:text-admin-primary',
          )}
        >
          <span>Filtros</span>
          {activeFilterCount > 0 ? (
            <Badge className="bg-admin-primary text-primary-foreground hover:bg-admin-primary">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(92vw,28rem)] space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Filtros da lista</h2>
          <p className="text-xs text-muted-foreground">
            Ajuste o recorte da busca e confirme para sincronizar a URL da pagina.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min={1}
            step={1}
            value={draft.requestId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, requestId: event.target.value }))
            }
            placeholder="Numero do chamado"
            aria-label="Numero do chamado"
          />

          <Input
            value={draft.requesterQuery}
            onChange={(event) =>
              setDraft((current) => ({ ...current, requesterQuery: event.target.value }))
            }
            placeholder="Solicitante"
            aria-label="Solicitante"
          />

          <Select
            value={draft.workflowTypeId || 'all'}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                workflowTypeId: value === 'all' ? '' : value,
              }))
            }
          >
            <SelectTrigger aria-label="Workflow">
              <SelectValue placeholder="Workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os workflows</SelectItem>
              {bootstrap.filterOptions.workflows.map((workflow) => (
                <SelectItem key={workflow.workflowTypeId} value={workflow.workflowTypeId}>
                  {workflow.workflowName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draft.areaId || 'all'}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                areaId: value === 'all' ? '' : value,
              }))
            }
          >
            <SelectTrigger aria-label="Area">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as areas</SelectItem>
              {bootstrap.filterOptions.areas.map((area) => (
                <SelectItem key={area.areaId} value={area.areaId}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draft.slaState || 'all'}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                slaState: value === 'all' ? '' : value,
              }))
            }
          >
            <SelectTrigger aria-label="SLA">
              <SelectValue placeholder="SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer SLA</SelectItem>
              {Object.entries(MANAGEMENT_SLA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={draft.periodFrom}
            onChange={(event) =>
              setDraft((current) => ({ ...current, periodFrom: event.target.value }))
            }
            aria-label="Periodo inicial"
          />

          <Input
            type="date"
            value={draft.periodTo}
            onChange={(event) =>
              setDraft((current) => ({ ...current, periodTo: event.target.value }))
            }
            aria-label="Periodo final"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canReset}
            onClick={handleReset}
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
          >
            Aplicar filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
