
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  axis: string;      // Eixo
  area: string;      // Área
  position: string;  // Cargo
  leader: string;    // Líder
  segment: string;   // Segmento
  city: string;      // Cidade
}

const initialCollaborators: Omit<Collaborator, 'id'>[] = [
  { name: 'Ana Silva', email: 'ana.silva@example.com', axis: 'Comercial', area: 'Vendas', position: 'Gerente de Vendas', leader: 'Carlos Pereira', segment: 'Varejo', city: 'São Paulo' },
  { name: 'Bruno Costa', email: 'bruno.costa@example.com', axis: 'Operações', area: 'Logística', position: 'Analista de Logística', leader: 'Fernanda Lima', segment: 'Indústria', city: 'Rio de Janeiro' },
  { name: 'Carla Dias', email: 'carla.dias@example.com', axis: 'Tecnologia', area: 'Desenvolvimento', position: 'Desenvolvedora Sênior', leader: 'Ricardo Souza', segment: 'B2B', city: 'Belo Horizonte' },
  { name: 'Usuário de Teste', email: 'test.user@example.com', axis: 'Tecnologia', area: 'Desenvolvimento', position: 'Analista de Testes', leader: 'Ricardo Souza', segment: 'B2B', city: 'Belo Horizonte' },
];

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  loading: boolean;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (collaborator: Collaborator) => void;
  deleteCollaborator: (id: string) => void;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: collaborators = [], isLoading, isSuccess } = useQuery<Collaborator[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Collaborator>(COLLECTION_NAME),
  });

  useEffect(() => {
    if (isSuccess && collaborators.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialCollaborators)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, collaborators.length, hasSeeded, queryClient]);

  const addCollaboratorMutation = useMutation({
    mutationFn: (collaboratorData: Omit<Collaborator, 'id'>) => addDocumentToCollection(COLLECTION_NAME, collaboratorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: (updatedCollaborator: Collaborator) => updateDocumentInCollection(COLLECTION_NAME, updatedCollaborator.id, updatedCollaborator),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteCollaboratorMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    collaborators,
    loading: isLoading,
    addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => addCollaboratorMutation.mutate(collaborator),
    updateCollaborator: (collaborator: Collaborator) => updateCollaboratorMutation.mutate(collaborator),
    deleteCollaborator: (id: string) => deleteCollaboratorMutation.mutate(id),
  }), [collaborators, isLoading, addCollaboratorMutation, updateCollaboratorMutation, deleteCollaboratorMutation]);

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
