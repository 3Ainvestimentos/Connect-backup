
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';
import * as z from 'zod';
import { RewardRule } from '@/lib/gamification-logics';

// Zod schema for a single reward rule
const rewardRuleSchema = z.object({
    count: z.coerce.number().min(1, "A contagem deve ser no mínimo 1."),
    reward: z.coerce.number().min(0, "A recompensa deve ser um valor positivo."),
});

// Zod schema for a mission group
export const missionGroupSchema = z.object({
  name: z.string().min(1, "O nome do grupo é obrigatório.").regex(/^[A-Z0-9_]+$/, "O nome do grupo deve ser em maiúsculas, sem espaços (use underscore). Ex: GRUPO_X"),
  logicType: z.string().min(1, "O tipo de lógica é obrigatório."),
  rules: z.array(rewardRuleSchema).min(1, "Pelo menos uma regra de premiação é necessária."),
});

export type MissionGroup = WithId<z.infer<typeof missionGroupSchema>>;

interface MissionGroupsContextType {
  missionGroups: MissionGroup[];
  loading: boolean;
  addMissionGroup: (group: Omit<MissionGroup, 'id'>) => Promise<MissionGroup>;
  updateMissionGroup: (group: Partial<MissionGroup> & { id: string }) => Promise<void>;
  deleteMissionGroup: (groupId: string) => Promise<void>;
}

const MissionGroupsContext = createContext<MissionGroupsContextType | undefined>(undefined);
const COLLECTION_NAME = 'missionGroups';

export const MissionGroupsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: missionGroups = [], isFetching } = useQuery<MissionGroup[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<MissionGroup>(COLLECTION_NAME),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<MissionGroup>(
      COLLECTION_NAME,
      (newData) => {
        queryClient.setQueryData([COLLECTION_NAME], newData);
      },
      (error) => {
        console.error(`Failed to listen to ${COLLECTION_NAME} collection:`, error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, user]);

  const addMutation = useMutation<WithId<Omit<MissionGroup, 'id'>>, Error, Omit<MissionGroup, 'id'>>({
    mutationFn: (groupData) => addDocumentToCollection(COLLECTION_NAME, groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateMutation = useMutation<void, Error, Partial<MissionGroup> & { id: string }>({
    mutationFn: (updatedGroup) => updateDocumentInCollection(COLLECTION_NAME, updatedGroup.id, updatedGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (groupId) => deleteDocumentFromCollection(COLLECTION_NAME, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    missionGroups,
    loading: isFetching,
    addMissionGroup: (group) => addMutation.mutateAsync(group) as Promise<MissionGroup>,
    updateMissionGroup: (group) => updateMutation.mutateAsync(group),
    deleteMissionGroup: (groupId) => deleteMutation.mutateAsync(groupId),
  }), [missionGroups, isFetching, addMutation, updateMutation, deleteMutation]);

  return (
    <MissionGroupsContext.Provider value={value}>
      {children}
    </MissionGroupsContext.Provider>
  );
};

export const useMissionGroups = (): MissionGroupsContextType => {
  const context = useContext(MissionGroupsContext);
  if (context === undefined) {
    throw new Error('useMissionGroups must be used within a MissionGroupsProvider');
  }
  return context;
};
