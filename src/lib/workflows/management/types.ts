export type ManagementShellTabId = 'current' | 'assignments' | 'completed';

export type ManagementShellPlaceholderContent = {
  tab: ManagementShellTabId;
  title: string;
  description: string;
  nextStepLabel: string;
};
