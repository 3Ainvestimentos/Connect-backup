import { canAccessWorkflowManagementEntry } from '../navigation';

describe('canAccessWorkflowManagementEntry', () => {
  it('returns true when the user has canManageRequestsV2', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequestsV2: true,
      }),
    ).toBe(true);
  });

  it('returns false when canManageRequestsV2 is false even if legacy permissions are true', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: true,
        canViewTasks: true,
        canManageRequestsV2: false,
      }),
    ).toBe(false);
  });

  it('returns false when canManageRequestsV2 is absent', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: true,
        canViewTasks: false,
      }),
    ).toBe(false);
  });

  it('returns false when all permissions are absent or false', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: false,
        canViewTasks: false,
        canManageRequestsV2: false,
      }),
    ).toBe(false);
    expect(canAccessWorkflowManagementEntry()).toBe(false);
  });
});
