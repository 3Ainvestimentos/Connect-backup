import type { PilotCurrentQueueFilter } from './types';

export const pilotKeys = {
  root: (uid: string) => ['pilot', 'facilities', uid] as const,
  catalog: (uid: string, workflowTypeId: string) =>
    [...pilotKeys.root(uid), 'catalog', workflowTypeId] as const,
  currentRoot: (uid: string) => [...pilotKeys.root(uid), 'current'] as const,
  current: (uid: string, filter: PilotCurrentQueueFilter) =>
    [...pilotKeys.currentRoot(uid), filter] as const,
  assignments: (uid: string) => [...pilotKeys.root(uid), 'assignments'] as const,
  mine: (uid: string) => [...pilotKeys.root(uid), 'mine'] as const,
};
