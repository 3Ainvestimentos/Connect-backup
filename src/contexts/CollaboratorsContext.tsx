
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

// Mock collaborator for the admin user. This ensures the admin user can receive targeted messages/events for testing.
const mockAdminCollaborator: Collaborator = {
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
};

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  loading: boolean;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<WithId<Omit<Collaborator, 'id'>>>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  deleteCollaboratorMutation: UseMutationResult<void, Error, string, { previousData: Collaborator[] }>;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: collaborators = [], isFetching } = useQuery<Collaborator[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Collaborator>(COLLECTION_NAME),
    // We merge the mock admin user with the fetched data to ensure it's always available for testing.
    select: (fetchedData) => {
        const adminExists = fetchedData.some(c => c.email === mockAdminCollaborator.email);
        if (adminExists) {
            return fetchedData;
        }
        return [mockAdminCollaborator, ...fetchedData];
    }
  });

  const addCollaboratorMutation = useMutation<WithId<Omit<Collaborator, 'id'>>, Error, Omit<Collaborator, 'id'>>({
    mutationFn: (collaboratorData: Omit<Collaborator, 'id'>) => addDocumentToCollection(COLLECTION_NAME, collaboratorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorMutation = useMutation<void, Error, Collaborator>({
    mutationFn: (updatedCollaborator: Collaborator) => {
        // Prevent updating the mock user in Firestore
        if (updatedCollaborator.id === mockAdminCollaborator.id) {
            return Promise.resolve();
        }
        return updateDocumentInCollection(COLLECTION_NAME, updatedCollaborator.id, updatedCollaborator)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteCollaboratorMutation = useMutation<void, Error, string, { previousData: Collaborator[] }>({
    mutationFn: (id: string) => {
        // Prevent deleting the mock user from Firestore
        if (id === mockAdminCollaborator.id) {
            // We can throw an error here to notify the user, or just resolve.
            // Let's throw for clarity.
            return Promise.reject(new Error("O usuário administrador mock não pode ser excluído."));
        }
        return deleteDocumentFromCollection(COLLECTION_NAME, id);
    },
    onMutate: async (idToDelete) => {
      if (idToDelete === mockAdminCollaborator.id) return;
      await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
      const previousData = queryClient.getQueryData<Collaborator[]>([COLLECTION_NAME]) || [];
      queryClient.setQueryData<Collaborator[]>([COLLECTION_NAME], (old) => old?.filter(item => item.id !== idToDelete) ?? []);
      return { previousData };
    },
    onError: (err, id, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
        toast({
            title: "Erro ao excluir",
            description: err.message || "Não foi possível remover o colaborador. A lista foi restaurada.",
            variant: "destructive"
        });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
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
