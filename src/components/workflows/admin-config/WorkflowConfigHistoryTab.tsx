'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWorkflowConfigHistory,
  fetchWorkflowConfigHistoryDetail,
  WorkflowConfigApiError,
} from '@/lib/workflows/admin-config/api-client';
import type {
  AdminHistoryFilters,
  AdminHistoryListData,
  AdminHistoryOrigin,
} from '@/lib/workflows/admin-config/types';
import { cn } from '@/lib/utils';
import { HistoryDetailDialog } from './history/HistoryDetailDialog';
import { HistoryFiltersBar } from './history/HistoryFiltersBar';
import { HistoryGrid } from './history/HistoryGrid';

type SelectedHistoryItem = {
  origin: AdminHistoryOrigin;
  requestKey: string;
} | null;

const INITIAL_FILTERS: AdminHistoryFilters = {
  limit: 50,
};

function hasActiveFilters(filters: AdminHistoryFilters): boolean {
  return countActiveFilters(filters) > 0;
}

function countActiveFilters(filters: AdminHistoryFilters): number {
  return [
    filters.origin,
    filters.areaId,
    filters.workflowTypeId,
    filters.statusCategory,
    filters.ownerUserId,
    filters.periodFrom,
    filters.periodTo,
    filters.query,
  ].filter(Boolean).length;
}

function buildEmptyStateCopy(data: AdminHistoryListData | undefined, activeFilters: boolean) {
  if (activeFilters) {
    return {
      title: 'Nenhum resultado para os filtros aplicados',
      description: 'Ajuste ou limpe os filtros para ampliar a busca nesta consulta administrativa.',
    };
  }

  if (data?.partialSources.includes('legacy') && !data?.items.length) {
    return {
      title: 'Historico indisponivel parcialmente',
      description: 'Nenhum item foi retornado neste momento e a compatibilidade legada esta degradada.',
    };
  }

  return {
    title: 'Nenhum chamado encontrado',
    description: 'Quando houver itens no historico global, eles aparecerao aqui para auditoria.',
  };
}

export function WorkflowConfigHistoryTab() {
  const { user } = useAuth();
  const [filters, setFilters] = React.useState<AdminHistoryFilters>(INITIAL_FILTERS);
  const [selectedItem, setSelectedItem] = React.useState<SelectedHistoryItem>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeFilters = hasActiveFilters(filters);
  const activeFilterCount = countActiveFilters(filters);

  const historyQuery = useQuery({
    queryKey: ['workflow-config-admin', user?.uid, 'history', filters],
    queryFn: async () => {
      if (!user) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      return fetchWorkflowConfigHistory(user, filters);
    },
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const detailQuery = useQuery({
    queryKey: ['workflow-config-admin', user?.uid, 'history-detail', selectedItem],
    queryFn: async () => {
      if (!user || !selectedItem) {
        throw new WorkflowConfigApiError('UNAUTHORIZED', 'Usuario nao autenticado.', 401);
      }

      return fetchWorkflowConfigHistoryDetail(user, selectedItem.origin, selectedItem.requestKey);
    },
    enabled: Boolean(user && selectedItem),
    staleTime: 30_000,
  });

  const emptyStateCopy = buildEmptyStateCopy(historyQuery.data, activeFilters);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>Historico Geral</CardTitle>
              <p className="text-sm text-muted-foreground">
                Consulta unificada de chamados `Legado + V2` em modo estritamente somente leitura.
              </p>
            </div>
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Abrir filtros do historico"
                  className={cn(
                    'w-full justify-between gap-3 border-border/70 bg-background/95 md:w-auto',
                    activeFilters &&
                      'border-admin-primary/30 bg-admin-primary/10 text-admin-primary hover:bg-admin-primary/15 hover:text-admin-primary',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </span>
                  {activeFilterCount > 0 ? (
                    <Badge className="bg-admin-primary text-primary-foreground hover:bg-admin-primary">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(92vw,30rem)] space-y-4 p-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Filtros da consulta</h2>
                  <p className="text-xs text-muted-foreground">
                    Ajuste o recorte do historico. As alteracoes sao aplicadas imediatamente.
                  </p>
                </div>

                <HistoryFiltersBar
                  filters={filters}
                  filterOptions={historyQuery.data?.filterOptions}
                  disabled={historyQuery.isLoading}
                  onChange={setFilters}
                  onClear={() => setFilters(INITIAL_FILTERS)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {historyQuery.data?.partialSources.length ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Degradacao parcial do historico</AlertTitle>
              <AlertDescription>
                A consulta continua disponivel, mas houve falha na fonte{' '}
                {historyQuery.data.partialSources.map((source) => (source === 'v2' ? 'V2' : 'Legado')).join(', ')}.
              </AlertDescription>
            </Alert>
          ) : null}

          {historyQuery.isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-lg border bg-card">
              <LoadingSpinner message="Carregando historico administrativo" />
            </div>
          ) : null}

          {!historyQuery.isLoading && historyQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao carregar o historico</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{historyQuery.error.message}</p>
                <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {!historyQuery.isLoading && !historyQuery.isError && historyQuery.data ? (
            <HistoryGrid
              items={historyQuery.data.items}
              totalVisible={historyQuery.data.totalVisible}
              emptyStateTitle={emptyStateCopy.title}
              emptyStateDescription={emptyStateCopy.description}
              onOpenDetail={(origin, requestKey) => setSelectedItem({ origin, requestKey })}
            />
          ) : null}
        </CardContent>
      </Card>

      <HistoryDetailDialog
        open={Boolean(selectedItem)}
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
        errorMessage={detailQuery.isError ? detailQuery.error.message : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    </div>
  );
}
