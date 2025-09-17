
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';
import * as z from 'zod';

export const missionDefinitionSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  maxValue: z.string().min(1, "O valor máximo é obrigatório."),
  notes: z.string().optional(),
});

export type MissionDefinition = WithId<z.infer<typeof missionDefinitionSchema>>;

interface OpportunityMapMissionsContextType {
  missions: MissionDefinition[];
  loading: boolean;
  addMission: (mission: Omit<MissionDefinition, 'id'>) => Promise<MissionDefinition>;
  updateMission: (mission: Partial<MissionDefinition> & { id: string }) => Promise<void>;
  deleteMission: (missionId: string) => Promise<void>;
}

const OpportunityMapMissionsContext = createContext<OpportunityMapMissionsContextType | undefined>(undefined);
const COLLECTION_NAME = 'opportunityMapMissions';

export const OpportunityMapMissionsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: missions = [], isFetching } = useQuery<MissionDefinition[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<MissionDefinition>(COLLECTION_NAME),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<MissionDefinition>(
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

  const addMissionMutation = useMutation<WithId<Omit<MissionDefinition, 'id'>>, Error, Omit<MissionDefinition, 'id'>>({
    mutationFn: (missionData) => addDocumentToCollection(COLLECTION_NAME, missionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateMissionMutation = useMutation<void, Error, Partial<MissionDefinition> & { id: string }>({
    mutationFn: (updatedMission) => updateDocumentInCollection(COLLECTION_NAME, updatedMission.id, updatedMission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const deleteMissionMutation = useMutation<void, Error, string>({
    mutationFn: (missionId) => deleteDocumentFromCollection(COLLECTION_NAME, missionId),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    missions,
    loading: isFetching,
    addMission: (mission) => addMissionMutation.mutateAsync(mission) as Promise<MissionDefinition>,
    updateMission: (mission) => updateMissionMutation.mutateAsync(mission),
    deleteMission: (missionId) => deleteMissionMutation.mutateAsync(missionId),
  }), [missions, isFetching, addMissionMutation, updateMissionMutation, deleteMissionMutation]);

  return (
    <OpportunityMapMissionsContext.Provider value={value}>
      {children}
    </OpportunityMapMissionsContext.Provider>
  );
};

export const useOpportunityMapMissions = (): OpportunityMapMissionsContextType => {
  const context = useContext(OpportunityMapMissionsContext);
  if (context === undefined) {
    throw new Error('useOpportunityMapMissions must be used within an OpportunityMapMissionsProvider');
  }
  return context;
};
