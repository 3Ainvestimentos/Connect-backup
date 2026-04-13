'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  archivePilotRequest,
  assignPilotResponsible,
  finalizePilotRequest,
  getPilotAssignments,
  getPilotCatalog,
  getPilotCompleted,
  getPilotCurrentQueue,
  getPilotMine,
  openPilotRequest,
} from '@/lib/workflows/pilot/api-client';
import { pilotKeys } from '@/lib/workflows/pilot/query-keys';
import type {
  ArchivePilotRequestInput,
  AssignPilotResponsibleInput,
  FinalizePilotRequestInput,
  OpenPilotRequestInput,
  PilotCurrentQueueFilter,
} from '@/lib/workflows/pilot/types';

type UseFacilitiesPilotOptions = {
  includeCurrent?: boolean;
};

export function useFacilitiesPilot(
  workflowTypeId: string,
  currentFilter: PilotCurrentQueueFilter,
  options?: UseFacilitiesPilotOptions,
) {
  const { user, currentUserCollab } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user);
  const uid = user?.uid ?? 'anonymous';
  const actorUserId = currentUserCollab?.id3a ?? '';
  const actorName = currentUserCollab?.name ?? user?.displayName ?? '';
  const includeCurrent = options?.includeCurrent ?? true;

  const catalogQuery = useQuery({
    queryKey: pilotKeys.catalog(uid, workflowTypeId),
    queryFn: () => getPilotCatalog(user!, workflowTypeId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: pilotKeys.current(uid, currentFilter),
    queryFn: () => getPilotCurrentQueue(user!, currentFilter),
    enabled: enabled && includeCurrent,
  });

  const assignmentsQuery = useQuery({
    queryKey: pilotKeys.assignments(uid),
    queryFn: () => getPilotAssignments(user!),
    enabled,
  });

  const completedQuery = useQuery({
    queryKey: pilotKeys.completed(uid),
    queryFn: () => getPilotCompleted(user!),
    enabled,
  });

  const mineQuery = useQuery({
    queryKey: pilotKeys.mine(uid),
    queryFn: () => getPilotMine(user!),
    enabled,
  });

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pilotKeys.currentRoot(uid) }),
      queryClient.invalidateQueries({ queryKey: pilotKeys.assignments(uid) }),
      queryClient.invalidateQueries({ queryKey: pilotKeys.completed(uid) }),
      queryClient.invalidateQueries({ queryKey: pilotKeys.mine(uid) }),
    ]);
  };

  const openMutation = useMutation({
    mutationFn: (payload: OpenPilotRequestInput) => openPilotRequest(user!, payload),
    onSuccess: invalidateOperationalQueries,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: AssignPilotResponsibleInput) =>
      assignPilotResponsible(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  const finalizeMutation = useMutation({
    mutationFn: (payload: FinalizePilotRequestInput) =>
      finalizePilotRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  const archiveMutation = useMutation({
    mutationFn: (payload: ArchivePilotRequestInput) =>
      archivePilotRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  return {
    actorName,
    actorUserId,
    catalogQuery,
    currentQuery,
    assignmentsQuery,
    completedQuery,
    mineQuery,
    openMutation,
    assignMutation,
    finalizeMutation,
    archiveMutation,
  };
}
