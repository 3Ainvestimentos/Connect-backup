type WorkflowManagementEntryPermissions = {
  canManageRequests?: boolean;
  canViewTasks?: boolean;
};

export function canAccessWorkflowManagementEntry(
  permissions: WorkflowManagementEntryPermissions = {},
): boolean {
  return Boolean(permissions.canManageRequests || permissions.canViewTasks);
}
