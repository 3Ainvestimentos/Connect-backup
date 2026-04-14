'use client';

import * as React from 'react';
import { useMyRequests } from '@/hooks/use-requester-workflows';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useAuth } from '@/contexts/AuthContext';
import { resolveLegacyIdentity } from '@/lib/workflows/requester/legacy/resolve-legacy-identity';
import { legacyRequestToUnifiedListItem } from '@/lib/workflows/requester/adapters/legacy-to-unified-list-item';
import { v2ReadSummaryToUnifiedListItem } from '@/lib/workflows/requester/adapters/v2-to-unified-list-item';
import { compareUnifiedListItems } from '@/lib/workflows/requester/unified-sort';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';

export type RequesterUnifiedRequestsStatus = 'loading' | 'error' | 'partial' | 'success';

export interface RequesterUnifiedRequestsResult {
  items: RequesterUnifiedRequestListItem[];
  status: RequesterUnifiedRequestsStatus;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  legacyIdentityResolved: boolean;
}

/**
 * Combina chamados v2 (via useMyRequests) e chamados legados (via
 * useWorkflows + useApplications), filtra legado pelo usuario corrente
 * (useAuth + useCollaborators), normaliza para RequesterUnifiedRequestListItem
 * e ordena deterministicamente.
 *
 * Estados:
 * - loading: ainda nao ha snapshot suficiente para decidir a lista final.
 * - error: v2 falhou e nao existe nenhum item legado disponivel.
 * - partial: v2 falhou, mas existe ao menos um item legado para exibir.
 * - success: v2 OK; legado pode ter itens, estar vazio legitimamente, ou
 *   estar indisponivel por identidade nao resolvida.
 */
export function useRequesterUnifiedRequests(): RequesterUnifiedRequestsResult {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { workflowDefinitions, loading: defsLoading } = useApplications();
  const { workflowAreas, loading: areasLoading } = useWorkflowAreas();
  const { requests: legacyRequests, loading: legacyLoading } = useWorkflows();

  const v2Query = useMyRequests();

  const legacyIdentity = React.useMemo(
    () => resolveLegacyIdentity(user, collaborators),
    [user, collaborators],
  );

  const legacyItems = React.useMemo<RequesterUnifiedRequestListItem[]>(() => {
    if (legacyLoading || defsLoading || areasLoading) return [];
    if (!legacyIdentity.resolved || !legacyIdentity.id3a) return [];

    const mine = legacyRequests.filter(
      (req) => req.submittedBy?.userId === legacyIdentity.id3a,
    );
    return mine.map((req) => {
      const definition =
        workflowDefinitions.find((d) => d.name === req.type) ?? null;
      const workflowArea = definition
        ? workflowAreas.find((area) => area.id === definition.areaId) ?? null
        : null;
      return legacyRequestToUnifiedListItem(req, definition, workflowArea);
    });
  }, [
    legacyLoading,
    defsLoading,
    areasLoading,
    legacyIdentity,
    legacyRequests,
    workflowDefinitions,
    workflowAreas,
  ]);

  const v2Items = React.useMemo<RequesterUnifiedRequestListItem[]>(() => {
    const summaries = v2Query.data?.items ?? [];
    return summaries.map((s) => v2ReadSummaryToUnifiedListItem(s));
  }, [v2Query.data?.items]);

  const legacyStillLoading = legacyLoading || defsLoading || areasLoading;
  const v2StillLoading = v2Query.isLoading;
  const v2Errored = v2Query.isError;
  const hasLegacyItems = legacyItems.length > 0;

  let status: RequesterUnifiedRequestsStatus;
  if (legacyStillLoading || v2StillLoading) {
    status = 'loading';
  } else if (v2Errored && hasLegacyItems) {
    status = 'partial';
  } else if (v2Errored) {
    status = 'error';
  } else {
    status = 'success';
  }

  const items = React.useMemo(() => {
    const merged = [...v2Items, ...legacyItems];
    merged.sort(compareUnifiedListItems);
    return merged;
  }, [v2Items, legacyItems]);

  return {
    items,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    error: v2Query.error ?? null,
    legacyIdentityResolved: legacyIdentity.resolved,
  };
}
