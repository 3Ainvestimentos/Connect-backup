
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';
import * as z from 'zod';

// Zod schema for a section, allowing dynamic keys
export const sectionSchema = z.record(z.string(), z.string());

// Zod schema for the entire opportunity map data for a user
export const opportunityMapSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    missionsXp: sectionSchema.default({}),
    pap: sectionSchema.default({}),
    // Allows other dynamic sections to be added
}).catchall(sectionSchema);

export type OpportunityMapData = WithId<z.infer<typeof opportunityMapSchema>>;

interface OpportunityMapContextType {
  opportunityData: OpportunityMapData[];
  loading: boolean;
  upsertOpportunityData: (userId: string, data: Partial<Omit<OpportunityMapData, 'id' | 'userId'>>) => Promise<void>;
}

const OpportunityMapContext = createContext<OpportunityMapContextType | undefined>(undefined);

const COLLECTION_NAME = 'opportunityMap';

export const OpportunityMapProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: opportunityData = [], isFetching } = useQuery<OpportunityMapData[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<OpportunityMapData>(COLLECTION_NAME),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<OpportunityMapData>(
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

  const upsertMutation = useMutation<void, Error, { userId: string; data: Partial<Omit<OpportunityMapData, 'id' | 'userId'>> }>({
    mutationFn: async ({ userId, data }) => {
      // The document ID in Firestore will be the user's ID for easy lookup
      return setDocumentInCollection(COLLECTION_NAME, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    opportunityData,
    loading: isFetching,
    upsertOpportunityData: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
  }), [opportunityData, isFetching, upsertMutation]);

  return (
    <OpportunityMapContext.Provider value={value}>
      {children}
    </OpportunityMapContext.Provider>
  );
};

export const useOpportunityMap = (): OpportunityMapContextType => {
  const context = useContext(OpportunityMapContext);
  if (context === undefined) {
    throw new Error('useOpportunityMap must be used within an OpportunityMapProvider');
  }
  return context;
};
