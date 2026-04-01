import type { WorkflowManagementFilters, ManagementCurrentQueueFilter } from './types';

export const managementKeys = {
  root: (uid: string) => ['workflow-management', uid] as const,
  bootstrap: (uid: string) => [...managementKeys.root(uid), 'bootstrap'] as const,
  currentRoot: (uid: string) => [...managementKeys.root(uid), 'current'] as const,
  current: (uid: string, filter: ManagementCurrentQueueFilter, filters: WorkflowManagementFilters) =>
    [...managementKeys.currentRoot(uid), filter, filters] as const,
  assignments: (uid: string, filters: WorkflowManagementFilters) =>
    [...managementKeys.root(uid), 'assignments', filters] as const,
  completed: (uid: string, filters: WorkflowManagementFilters) =>
    [...managementKeys.root(uid), 'completed', filters] as const,
};
