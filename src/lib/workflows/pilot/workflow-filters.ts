import type { PilotMonthGroup, PilotRequestSummary, PilotWorkflowScope } from './types';

export function filterRequestsByWorkflow(
  items: PilotRequestSummary[],
  scope: PilotWorkflowScope,
  activeWorkflowTypeId: string,
) {
  if (scope === 'all') {
    return items;
  }

  return items.filter((item) => item.workflowTypeId === activeWorkflowTypeId);
}

export function filterMonthGroupsByWorkflow(
  groups: PilotMonthGroup[],
  scope: PilotWorkflowScope,
  activeWorkflowTypeId: string,
) {
  if (scope === 'all') {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.workflowTypeId === activeWorkflowTypeId),
    }))
    .filter((group) => group.items.length > 0);
}
