'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchRequesterCatalog,
  fetchPublishedWorkflow,
  openRequesterWorkflow,
} from '@/lib/workflows/requester/api-client';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import type { OpenRequesterWorkflowInput } from '@/lib/workflows/requester/catalog-types';

export function useRequesterCatalog() {
  const { user } = useAuth();

  const query = useQuery<RequesterCatalogArea[]>({
    queryKey: ['workflows', 'requester', 'catalog'],
    queryFn: async () => {
      if (!user) throw new Error('Usuario nao autenticado');
      return fetchRequesterCatalog(user);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return query;
}

export function usePublishedWorkflow(workflowTypeId: string | null) {
  const { user } = useAuth();

  const query = useQuery<WorkflowPublishedMetadata>({
    queryKey: ['workflows', 'published', workflowTypeId],
    queryFn: async () => {
      if (!user || !workflowTypeId) throw new Error('Parametros invalidos');
      return fetchPublishedWorkflow(user, workflowTypeId);
    },
    enabled: !!user && !!workflowTypeId,
  });

  return query;
}

export function useOpenRequesterWorkflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: OpenRequesterWorkflowInput) => {
      if (!user) throw new Error('Usuario nao autenticado');
      return openRequesterWorkflow(user, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', 'requester', 'catalog'] });
    },
  });

  return mutation;
}
