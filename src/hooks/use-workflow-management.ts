'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  archiveManagementRequest,
  assignManagementResponsible,
  finalizeManagementRequest,
  getManagementAssignments,
  getManagementBootstrap,
  getManagementCompleted,
  getManagementCurrent,
  getManagementRequestDetail,
} from '@/lib/workflows/management/api-client';
import { managementKeys } from '@/lib/workflows/management/query-keys';
import type {
  WorkflowManagementArchiveInput,
  WorkflowManagementAssignResponsibleInput,
  WorkflowManagementFinalizeInput,
  WorkflowManagementViewState,
} from '@/lib/workflows/management/types';

export function useWorkflowManagement(
  state: WorkflowManagementViewState,
  selectedRequestId: number | null = null,
) {
  const { user, currentUserCollab } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user);
  const uid = user?.uid ?? 'anonymous';
  const actorName = currentUserCollab?.name ?? user?.displayName ?? '';

  const bootstrapQuery = useQuery({
    queryKey: managementKeys.bootstrap(uid),
    queryFn: () => getManagementBootstrap(user!),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: managementKeys.current(uid, state.currentFilter, state.filters),
    queryFn: () => getManagementCurrent(user!, state.currentFilter, state.filters),
    enabled:
      enabled &&
      bootstrapQuery.data?.capabilities.canViewCurrentQueue === true &&
      state.activeTab === 'current',
  });

  const assignmentsQuery = useQuery({
    queryKey: managementKeys.assignments(uid, state.filters),
    queryFn: () => getManagementAssignments(user!, state.filters),
    enabled: enabled && state.activeTab === 'assignments',
  });

  const completedQuery = useQuery({
    queryKey: managementKeys.completed(uid, state.filters),
    queryFn: () => getManagementCompleted(user!, state.filters),
    enabled: enabled && state.activeTab === 'completed',
  });

  const detailQuery = useQuery({
    queryKey: managementKeys.detail(uid, selectedRequestId),
    queryFn: () => getManagementRequestDetail(user!, selectedRequestId!),
    enabled: enabled && Boolean(selectedRequestId),
  });

  const refetchActiveTab = async () => {
    if (state.activeTab === 'current') {
      return currentQuery.refetch();
    }

    if (state.activeTab === 'completed') {
      return completedQuery.refetch();
    }

    return assignmentsQuery.refetch();
  };

  const refetchDetail = async () => {
    if (!selectedRequestId) {
      return Promise.resolve();
    }

    return detailQuery.refetch();
  };

  const invalidateOperationalQueries = async (requestId: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: managementKeys.currentRoot(uid) }),
      queryClient.invalidateQueries({ queryKey: managementKeys.assignmentsRoot(uid) }),
      queryClient.invalidateQueries({ queryKey: managementKeys.completedRoot(uid) }),
      queryClient.invalidateQueries({ queryKey: managementKeys.detail(uid, requestId) }),
    ]);
  };

  const assignMutation = useMutation({
    mutationFn: (payload: WorkflowManagementAssignResponsibleInput) =>
      assignManagementResponsible(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: async (_, variables) => invalidateOperationalQueries(variables.requestId),
  });

  const finalizeMutation = useMutation({
    mutationFn: (payload: WorkflowManagementFinalizeInput) =>
      finalizeManagementRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: async (_, variables) => invalidateOperationalQueries(variables.requestId),
  });

  const archiveMutation = useMutation({
    mutationFn: (payload: WorkflowManagementArchiveInput) =>
      archiveManagementRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: async (_, variables) => invalidateOperationalQueries(variables.requestId),
  });

  return {
    bootstrapQuery,
    currentQuery,
    assignmentsQuery,
    completedQuery,
    detailQuery,
    refetchActiveTab,
    refetchDetail,
    assignMutation,
    finalizeMutation,
    archiveMutation,
  };
}
