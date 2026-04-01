import { canAccessWorkflowManagementEntry } from '../navigation';

describe('canAccessWorkflowManagementEntry', () => {
  it('returns true when the user can manage requests', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: true,
        canViewTasks: false,
      }),
    ).toBe(true);
  });

  it('returns true when the user can view tasks even without request management', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: false,
        canViewTasks: true,
      }),
    ).toBe(true);
  });

  it('returns false when both transitional permissions are absent', () => {
    expect(
      canAccessWorkflowManagementEntry({
        canManageRequests: false,
        canViewTasks: false,
      }),
    ).toBe(false);
    expect(canAccessWorkflowManagementEntry()).toBe(false);
  });
});
