'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchRequesterCatalog,
  fetchPublishedWorkflow,
  openRequesterWorkflow,
  fetchMyRequests,
  fetchRequestDetail,
} from '@/lib/workflows/requester/api-client';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import type { OpenRequesterWorkflowInput } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowGroupedReadData, WorkflowRequestDetailData } from '@/lib/workflows/read/types';

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['workflows', 'requester', 'mine'],
      });
    },
  });

  return mutation;
}

export function useMyRequests() {
  const { user } = useAuth();

  const query = useQuery<WorkflowGroupedReadData>({
    queryKey: ['workflows', 'requester', 'mine'],
    queryFn: async () => {
      if (!user) throw new Error('Usuario nao autenticado');
      return fetchMyRequests(user);
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  return query;
}

export function useRequestDetail(requestId: number | null, enabled: boolean) {
  const { user } = useAuth();
  const lastSuccessfulRef = React.useRef<Map<number, WorkflowRequestDetailData>>(new Map());

  const query = useQuery<WorkflowRequestDetailData>({
    queryKey: ['workflows', 'requester', 'detail', requestId],
    queryFn: async () => {
      if (!user || requestId == null) throw new Error('Parametros invalidos');
      return fetchRequestDetail(user, requestId);
    },
    enabled: !!user && enabled && requestId != null,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (requestId != null && query.data) {
      lastSuccessfulRef.current.set(requestId, query.data);
    }
  }, [requestId, query.data]);

  const stableData =
    requestId != null ? (query.data ?? lastSuccessfulRef.current.get(requestId)) : undefined;

  return {
    ...query,
    stableData,
    hasStableData: Boolean(stableData),
  };
}
