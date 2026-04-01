import type { WorkflowManagementFilters, ManagementCurrentQueueFilter } from './types';

export const managementKeys = {
  root: (uid: string) => ['workflow-management', uid] as const,
  bootstrap: (uid: string) => [...managementKeys.root(uid), 'bootstrap'] as const,
  currentRoot: (uid: string) => [...managementKeys.root(uid), 'current'] as const,
  assignmentsRoot: (uid: string) => [...managementKeys.root(uid), 'assignments'] as const,
  completedRoot: (uid: string) => [...managementKeys.root(uid), 'completed'] as const,
  detailRoot: (uid: string) => [...managementKeys.root(uid), 'detail'] as const,
  current: (uid: string, filter: ManagementCurrentQueueFilter, filters: WorkflowManagementFilters) =>
    [...managementKeys.currentRoot(uid), filter, filters] as const,
  assignments: (uid: string, filters: WorkflowManagementFilters) =>
    [...managementKeys.assignmentsRoot(uid), filters] as const,
  completed: (uid: string, filters: WorkflowManagementFilters) =>
    [...managementKeys.completedRoot(uid), filters] as const,
  detail: (uid: string, requestId: number | null) =>
    [...managementKeys.detailRoot(uid), requestId] as const,
};
