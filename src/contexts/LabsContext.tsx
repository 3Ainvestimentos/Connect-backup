
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface LabType {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  lastModified: string;
  videoUrl: string;
}

interface LabsContextType {
  labs: LabType[];
  loading: boolean;
  addLab: (lab: Omit<LabType, 'id'>) => Promise<WithId<Omit<LabType, 'id'>>>;
  updateLab: (lab: LabType) => Promise<void>;
  deleteLabMutation: UseMutationResult<void, Error, string, unknown>;
}

const LabsContext = createContext<LabsContextType | undefined>(undefined);
const COLLECTION_NAME = 'labs';

export const LabsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: labs = [], isFetching } = useQuery<LabType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<LabType>(COLLECTION_NAME),
  });

  const addLabMutation = useMutation<WithId<Omit<LabType, 'id'>>, Error, Omit<LabType, 'id'>>({
    mutationFn: (labData: Omit<LabType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, labData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateLabMutation = useMutation<void, Error, LabType>({
    mutationFn: (updatedLab: LabType) => updateDocumentInCollection(COLLECTION_NAME, updatedLab.id, updatedLab),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteLabMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
  });

  const value = useMemo(() => ({
    labs,
    loading: isFetching,
    addLab: (lab) => addLabMutation.mutateAsync(lab),
    updateLab: (lab) => updateLabMutation.mutateAsync(lab),
    deleteLabMutation,
  }), [labs, isFetching, addLabMutation, updateLabMutation, deleteLabMutation]);

  return (
    <LabsContext.Provider value={value}>
      {children}
    </LabsContext.Provider>
  );
};

export const useLabs = (): LabsContextType => {
  const context = useContext(LabsContext);
  if (context === undefined) {
    throw new Error('useLabs must be used within a LabsProvider');
  }
  return context;
};
