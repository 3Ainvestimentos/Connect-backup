
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, addMultipleDocumentsToCollection } from '@/lib/firestore-service';

export interface Collaborator {
  id: string;
  id3a: string;      // ID interno da 3A RIVA
  name: string;
  email: string;
  photoURL?: string; // Link da imagem do colaborador
  axis: string;      // Eixo
  area: string;      // Área
  position: string;  // Cargo
  segment: string;   // Segmento
  leader: string;    // Líder
  city: string;      // Cidade
  isAdmin?: boolean; // Flag to indicate admin privileges
}

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  loading: boolean;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<WithId<Omit<Collaborator, 'id'>>>;
  addMultipleCollaborators: (collaborators: Omit<Collaborator, 'id'>[]) => Promise<void>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  updateCollaboratorAdminStatus: (id: string, isAdmin: boolean) => Promise<void>;
  deleteCollaboratorMutation: UseMutationResult<void, Error, string, unknown>;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: collaborators = [], isFetching } = useQuery<Collaborator[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Collaborator>(COLLECTION_NAME),
  });

  const addCollaboratorMutation = useMutation<WithId<Omit<Collaborator, 'id'>>, Error, Omit<Collaborator, 'id'>>({
    mutationFn: (collaboratorData: Omit<Collaborator, 'id'>) => addDocumentToCollection(COLLECTION_NAME, collaboratorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const addMultipleCollaboratorsMutation = useMutation<void, Error, Omit<Collaborator, 'id'>[]>({
    mutationFn: (collaboratorsData: Omit<Collaborator, 'id'>[]) => addMultipleDocumentsToCollection(COLLECTION_NAME, collaboratorsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorMutation = useMutation<void, Error, Collaborator>({
    mutationFn: (updatedCollaborator: Collaborator) => updateDocumentInCollection(COLLECTION_NAME, updatedCollaborator.id, updatedCollaborator),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorAdminStatusMutation = useMutation<void, Error, { id: string; isAdmin: boolean }>({
    mutationFn: ({ id, isAdmin }) => updateDocumentInCollection(COLLECTION_NAME, id, { isAdmin }),
    onSuccess: (_, variables) => {
        queryClient.setQueryData([COLLECTION_NAME], (oldData: Collaborator[] | undefined) => 
            oldData ? oldData.map(c => c.id === variables.id ? { ...c, isAdmin: variables.isAdmin } : c) : []
        );
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME, variables.id] });
    },
  });

  const deleteCollaboratorMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    collaborators,
    loading: isFetching,
    addCollaborator: (collaborator) => addCollaboratorMutation.mutateAsync(collaborator),
    addMultipleCollaborators: (collaborators) => addMultipleCollaboratorsMutation.mutateAsync(collaborators),
    updateCollaborator: (collaborator) => updateCollaboratorMutation.mutateAsync(collaborator),
    updateCollaboratorAdminStatus: (id, isAdmin) => updateCollaboratorAdminStatusMutation.mutateAsync({ id, isAdmin }),
    deleteCollaboratorMutation,
  }), [collaborators, isFetching, addCollaboratorMutation, addMultipleCollaboratorsMutation, updateCollaboratorMutation, updateCollaboratorAdminStatusMutation, deleteCollaboratorMutation]);

  return (
    <CollaboratorsContext.Provider value={value}>
      {children}
    </CollaboratorsContext.Provider>
  );
};

export const useCollaborators = (): CollaboratorsContextType => {
  const context = useContext(CollaboratorsContext);
  if (context === undefined) {
    throw new Error('useCollaborators must be used within a CollaboratorsProvider');
  }
  return context;
};
