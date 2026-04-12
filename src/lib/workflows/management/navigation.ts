type WorkflowManagementEntryPermissions = {
  canManageRequests?: boolean;
  canManageRequestsV2?: boolean;
  canViewTasks?: boolean;
};

export function canAccessWorkflowManagementEntry(
  permissions: WorkflowManagementEntryPermissions = {},
): boolean {
  return Boolean(permissions.canManageRequestsV2);
}
