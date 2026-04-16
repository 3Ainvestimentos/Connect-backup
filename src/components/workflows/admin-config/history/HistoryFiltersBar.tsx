'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminHistoryFilters, AdminHistoryListData } from '@/lib/workflows/admin-config/types';

type HistoryFiltersBarProps = {
  filters: AdminHistoryFilters;
  filterOptions?: AdminHistoryListData['filterOptions'];
  disabled?: boolean;
  onChange: (filters: AdminHistoryFilters) => void;
  onClear: () => void;
  onApply: () => void;
};

function updateFilter(
  filters: AdminHistoryFilters,
  key: keyof AdminHistoryFilters,
  value: string,
): AdminHistoryFilters {
  return {
    ...filters,
    [key]: value || undefined,
  };
}

export function HistoryFiltersBar({
  filters,
  filterOptions,
  disabled = false,
  onChange,
  onClear,
  onApply,
}: HistoryFiltersBarProps) {
  return (
    <div className="space-y-4">
      <label className="space-y-1 text-sm">
        <span className="font-medium">Busca</span>
        <Input
          aria-label="Busca"
          placeholder="Chamado, workflow, owner..."
          value={filters.query ?? ''}
          disabled={disabled}
          onChange={(event) => onChange(updateFilter(filters, 'query', event.target.value))}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Origem</span>
          <select
            aria-label="Origem"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
            value={filters.origin ?? ''}
            onChange={(event) => onChange(updateFilter(filters, 'origin', event.target.value))}
          >
            <option value="">Todas</option>
            {filterOptions?.origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin === 'v2' ? 'V2' : 'Legado'}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Workflow</span>
          <select
            aria-label="Workflow"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
            value={filters.workflowTypeId ?? ''}
            onChange={(event) => onChange(updateFilter(filters, 'workflowTypeId', event.target.value))}
          >
            <option value="">Todos</option>
            {filterOptions?.workflows.map((workflow) => (
              <option key={workflow.value} value={workflow.value}>
                {workflow.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            aria-label="Status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
            value={filters.statusCategory ?? ''}
            onChange={(event) => onChange(updateFilter(filters, 'statusCategory', event.target.value))}
          >
            <option value="">Todos</option>
            {filterOptions?.statusCategories.map((statusCategory) => (
              <option key={statusCategory} value={statusCategory}>
                {statusCategory}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Owner</span>
          <select
            aria-label="Owner"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
            value={filters.ownerUserId ?? ''}
            onChange={(event) => onChange(updateFilter(filters, 'ownerUserId', event.target.value))}
          >
            <option value="">Todos</option>
            {filterOptions?.owners.map((owner) => (
              <option key={owner.value} value={owner.value}>
                {owner.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Area</span>
          <select
            aria-label="Area"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
            value={filters.areaId ?? ''}
            onChange={(event) => onChange(updateFilter(filters, 'areaId', event.target.value))}
          >
            <option value="">Todas</option>
            {filterOptions?.areas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Periodo de</span>
          <Input
            aria-label="Periodo de"
            type="date"
            value={filters.periodFrom ?? ''}
            disabled={disabled}
            onChange={(event) => onChange(updateFilter(filters, 'periodFrom', event.target.value))}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Periodo ate</span>
          <Input
            aria-label="Periodo ate"
            type="date"
            value={filters.periodTo ?? ''}
            disabled={disabled}
            onChange={(event) => onChange(updateFilter(filters, 'periodTo', event.target.value))}
          />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClear} disabled={disabled}>
          Limpar
        </Button>
        <Button
          type="button"
          className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
          onClick={onApply}
          disabled={disabled}
        >
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
