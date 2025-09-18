"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';
import * as z from 'zod';
import { formatISO } from 'date-fns';

export const opportunityTypeSchema = z.object({
  name: z.string().min(1, "O nome da oportunidade é obrigatório."),
  description: z.string().optional(),
  recipientIds: z.array(z.string()).min(1, "É necessário selecionar um público-alvo."),
  createdAt: z.string().optional(),
});

export type OpportunityType = WithId<z.infer<typeof opportunityTypeSchema>>;

interface OpportunityTypesContextType {
  opportunityTypes: OpportunityType[];
  loading: boolean;
  addOpportunityType: (opportunityType: Omit<OpportunityType, 'id'>) => Promise<OpportunityType>;
  updateOpportunityType: (opportunityType: Partial<OpportunityType> & { id: string }) => Promise<void>;
  deleteOpportunityType: (opportunityTypeId: string) => Promise<void>;
}

const OpportunityTypesContext = createContext<OpportunityTypesContextType | undefined>(undefined);
const COLLECTION_NAME = 'opportunityTypes';

export const OpportunityTypesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: opportunityTypes = [], isFetching } = useQuery<OpportunityType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<OpportunityType>(COLLECTION_NAME),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<OpportunityType>(
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

  const addMutation = useMutation<WithId<Omit<OpportunityType, 'id'>>, Error, Omit<OpportunityType, 'id'>>({
    mutationFn: (opportunityTypeData) => {
      const dataWithTimestamp = { ...opportunityTypeData, createdAt: formatISO(new Date()) };
      return addDocumentToCollection(COLLECTION_NAME, dataWithTimestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateMutation = useMutation<void, Error, Partial<OpportunityType> & { id: string }>({
    mutationFn: (updatedData) => updateDocumentInCollection(COLLECTION_NAME, updatedData.id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (opportunityTypeId) => deleteDocumentFromCollection(COLLECTION_NAME, opportunityTypeId),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    opportunityTypes,
    loading: isFetching,
    addOpportunityType: (data) => addMutation.mutateAsync(data) as Promise<OpportunityType>,
    updateOpportunityType: (data) => updateMutation.mutateAsync(data),
    deleteOpportunityType: (id) => deleteMutation.mutateAsync(id),
  }), [opportunityTypes, isFetching, addMutation, updateMutation, deleteMutation]);

  return (
    <OpportunityTypesContext.Provider value={value}>
      {children}
    </OpportunityTypesContext.Provider>
  );
};

export const useOpportunityTypes = (): OpportunityTypesContextType => {
  const context = useContext(OpportunityTypesContext);
  if (context === undefined) {
    throw new Error('useOpportunityTypes must be used within a OpportunityTypesProvider');
  }
  return context;
};
