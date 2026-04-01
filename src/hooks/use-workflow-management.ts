'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getManagementAssignments,
  getManagementBootstrap,
  getManagementCompleted,
  getManagementCurrent,
} from '@/lib/workflows/management/api-client';
import { managementKeys } from '@/lib/workflows/management/query-keys';
import type { WorkflowManagementViewState } from '@/lib/workflows/management/types';

export function useWorkflowManagement(state: WorkflowManagementViewState) {
  const { user } = useAuth();
  const enabled = Boolean(user);
  const uid = user?.uid ?? 'anonymous';

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

  return {
    bootstrapQuery,
    currentQuery,
    assignmentsQuery,
    completedQuery,
  };
}
