
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection, getSubcollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';
import * as z from 'zod';
import { RewardRule } from '@/lib/gamification-logics';

// Função para normalizar o nome do grupo
const normalizeGroupName = (name: string) => {
  return name
    .normalize("NFD") // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase() // Converte para maiúsculas
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/[^A-Z0-9_]/g, ''); // Remove caracteres não permitidos
};


// Zod schema for a single reward rule
const rewardRuleSchema = z.object({
    count: z.coerce.number().min(1, "A contagem deve ser no mínimo 1."),
    reward: z.coerce.number().min(0, "A recompensa deve ser um valor positivo."),
});

// Zod schema for a mission group
export const missionGroupSchema = z.object({
  name: z.string().min(1, "O nome do grupo é obrigatório.").transform(normalizeGroupName),
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
const PARENT_COLLECTION_NAME = 'opportunityTypes';
const SUBCOLLECTION_NAME = 'missionGroups';

export const MissionGroupsProvider = ({ children }: { children: ReactNode }) => {
  // This provider is a wrapper. The actual logic is now in the hook,
  // which is parameterized by the opportunityTypeId.
  return (
    <>{children}</>
  );
};

export const useMissionGroups = (opportunityTypeId: string): MissionGroupsContextType => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = [PARENT_COLLECTION_NAME, opportunityTypeId, SUBCOLLECTION_NAME];

  const { data: missionGroups = [], isFetching } = useQuery<MissionGroup[]>({
    queryKey,
    queryFn: () => getSubcollection<MissionGroup>(PARENT_COLLECTION_NAME, opportunityTypeId, SUBCOLLECTION_NAME),
    staleTime: 5 * 60 * 1000,
    enabled: !!user && !!opportunityTypeId,
  });

  React.useEffect(() => {
    if (!user || !opportunityTypeId) return;
    const unsubscribe = listenToCollection<MissionGroup>(
      `${PARENT_COLLECTION_NAME}/${opportunityTypeId}/${SUBCOLLECTION_NAME}`,
      (newData) => {
        queryClient.setQueryData(queryKey, newData);
      },
      (error) => {
        console.error(`Failed to listen to subcollection:`, error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, user, opportunityTypeId, queryKey]);

  const addMutation = useMutation<WithId<Omit<MissionGroup, 'id'>>, Error, Omit<MissionGroup, 'id'>>({
    mutationFn: (groupData) => addDocumentToCollection(`${PARENT_COLLECTION_NAME}/${opportunityTypeId}/${SUBCOLLECTION_NAME}`, groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation<void, Error, Partial<MissionGroup> & { id: string }>({
    mutationFn: (updatedGroup) => updateDocumentInCollection(`${PARENT_COLLECTION_NAME}/${opportunityTypeId}/${SUBCOLLECTION_NAME}`, updatedGroup.id, updatedGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (groupId) => deleteDocumentFromCollection(`${PARENT_COLLECTION_NAME}/${opportunityTypeId}/${SUBCOLLECTION_NAME}`, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return useMemo(() => ({
    missionGroups,
    loading: isFetching,
    addMissionGroup: (group) => addMutation.mutateAsync(group) as Promise<MissionGroup>,
    updateMissionGroup: (group) => updateMutation.mutateAsync(group),
    deleteMissionGroup: (groupId) => deleteMutation.mutateAsync(groupId),
  }), [missionGroups, isFetching, addMutation, updateMutation, deleteMutation]);
};
