'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const parsedRequestId = /^\d+$/.test(requestId) && Number(requestId) > 0 ? Number(requestId) : undefined;

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

  React.useEffect(() => {
    setDraft(toDraftFilters(filters));
  }, [filters]);

  const hasActiveFilters = hasManagementActiveFilters(filters);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const handleReset = () => {
    setDraft(toDraftFilters({}));
    onResetFilters();
  };

  return (
    <Card className="border-border/70 bg-background/95">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-headline text-lg">Busca e filtros oficiais</CardTitle>
            <p className="text-sm text-muted-foreground">
              Busca, ownership e URL compartilham o mesmo contrato para deep-link, refresh e
              rollback seguro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">Ator: {bootstrap.actor.actorName || bootstrap.actor.actorUserId}</Badge>
            <Badge variant={bootstrap.ownership.hasOwnedScopes ? 'default' : 'outline'}>
              Ownership {bootstrap.ownership.hasOwnedScopes ? 'ativo' : 'nao identificado'}
            </Badge>
            <Badge variant={hasActiveFilters ? 'default' : 'outline'}>
              {hasActiveFilters ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            type="number"
            min={1}
            step={1}
            value={draft.requestId}
            onChange={(event) => setDraft((current) => ({ ...current, requestId: event.target.value }))}
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
            onChange={(event) => setDraft((current) => ({ ...current, periodFrom: event.target.value }))}
            aria-label="Periodo inicial"
          />

          <Input
            type="date"
            value={draft.periodTo}
            onChange={(event) => setDraft((current) => ({ ...current, periodTo: event.target.value }))}
            aria-label="Periodo final"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onApplyFilters(toWorkflowManagementFilters(draft))}>
            Aplicar filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters}
            onClick={handleReset}
          >
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
