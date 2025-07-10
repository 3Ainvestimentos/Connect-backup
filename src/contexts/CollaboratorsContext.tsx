
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  photoURL?: string; // Link da imagem do colaborador
  axis: string;      // Eixo
  area: string;      // Área
  position: string;  // Cargo
  leader: string;    // Líder
  segment: string;   // Segmento
  city: string;      // Cidade
}

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  loading: boolean;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<WithId<Omit<Collaborator, 'id'>>>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  deleteCollaboratorMutation: UseMutationResult<void, Error, string, unknown>;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: collaboratorsFromDB = [], isFetching } = useQuery<Collaborator[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Collaborator>(COLLECTION_NAME),
  });

  const collaborators = useMemo(() => {
    // This ensures the mock admin user is always available for selection in UI components
    // without being written to the database.
    const adminExists = collaboratorsFromDB.some(c => c.email === 'mock@example.com');
    if (adminExists) {
        return collaboratorsFromDB;
    }
    return [
        ...collaboratorsFromDB,
        {
            id: 'mock-admin-user',
            name: 'Admin Mock',
            email: 'mock@example.com',
            photoURL: 'https://placehold.co/100x100.png',
            axis: 'Administrativo',
            area: 'Tecnologia',
            position: 'Desenvolvedor',
            leader: 'Liderança',
            segment: 'Todos',
            city: 'Remoto'
        }
    ];
  }, [collaboratorsFromDB]);


  const addCollaboratorMutation = useMutation<WithId<Omit<Collaborator, 'id'>>, Error, Omit<Collaborator, 'id'>>({
    mutationFn: (collaboratorData: Omit<Collaborator, 'id'>) => addDocumentToCollection(COLLECTION_NAME, collaboratorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorMutation = useMutation<void, Error, Collaborator>({
    mutationFn: (updatedCollaborator: Collaborator) => {
        // Prevent updating the mock user in Firestore
        if (updatedCollaborator.id === 'mock-admin-user') {
            return Promise.resolve();
        }
        return updateDocumentInCollection(COLLECTION_NAME, updatedCollaborator.id, updatedCollaborator)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteCollaboratorMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => {
        if (id === 'mock-admin-user') {
            return Promise.reject(new Error("O usuário administrador mock não pode ser excluído."));
        }
        return deleteDocumentFromCollection(COLLECTION_NAME, id);
    },
  });

  const value = useMemo(() => ({
    collaborators,
    loading: isFetching,
    addCollaborator: (collaborator) => addCollaboratorMutation.mutateAsync(collaborator),
    updateCollaborator: (collaborator) => updateCollaboratorMutation.mutateAsync(collaborator),
    deleteCollaboratorMutation,
  }), [collaborators, isFetching, addCollaboratorMutation, updateCollaboratorMutation, deleteCollaboratorMutation]);

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
