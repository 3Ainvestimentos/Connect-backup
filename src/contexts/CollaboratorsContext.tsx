
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, addMultipleDocumentsToCollection, listenToCollection, getCollection } from '@/lib/firestore-service';
import { useAuth } from './AuthContext';

export interface CollaboratorPermissions {
  canManageWorkflows: boolean;
  canManageRequests: boolean;
  canManageContent: boolean;
  canViewTasks: boolean;
  canViewBI: boolean;
  canViewRankings: boolean;
  canViewCRM: boolean;
  canViewStrategicPanel: boolean;
  canViewOpportunityMap: boolean;
}

export interface BILink {
  name: string;
  url: string;
}

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
  permissions: CollaboratorPermissions;
  googleDriveLinks?: string[]; // Array de links para pastas do Google Drive
  biLinks?: BILink[]; // Link para o painel de BI específico do usuário
  acceptedTermsVersion?: number; // Versão dos termos aceitos pelo usuário
  createdAt?: string; // ISO String for creation timestamp
}

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  loading: boolean;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<WithId<Omit<Collaborator, 'id'>>>;
  addMultipleCollaborators: (collaborators: Omit<Collaborator, 'id'>[]) => Promise<void>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  updateCollaboratorPermissions: (id: string, permissions: CollaboratorPermissions) => Promise<void>;
  deleteCollaboratorMutation: UseMutationResult<void, Error, string, unknown>;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

const defaultPermissions: CollaboratorPermissions = {
  canManageWorkflows: false,
  canManageRequests: false,
  canManageContent: false,
  canViewTasks: false,
  canViewBI: false,
  canViewRankings: false,
  canViewCRM: false,
  canViewStrategicPanel: false,
  canViewOpportunityMap: false,
};

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  // We can't use useAuth() here directly due to circular dependency.
  // Instead, we will rely on the query being enabled/disabled based on a prop or a separate auth check if needed.
  // For now, let's assume it should fetch when the provider is mounted by an authenticated user.
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  // This is a workaround to break the circular dependency. 
  // We manually check auth status instead of using the context.
  React.useEffect(() => {
    const { getAuth, onAuthStateChanged } = require('firebase/auth');
    const { getFirebaseApp } = require('@/lib/firebase');
    const auth = getAuth(getFirebaseApp());
    const unsubscribe = onAuthStateChanged(auth, user => {
        setIsAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);


  const { data: collaborators = [], isFetching } = useQuery<Collaborator[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Collaborator>(COLLECTION_NAME),
    staleTime: Infinity,
    enabled: isAuthReady, // Only fetch when auth state is resolved and we have a user
    select: (data) => data.map(c => ({
        ...c,
        permissions: { ...defaultPermissions, ...c.permissions }
    }))
  });
  
  React.useEffect(() => {
    if (!isAuthReady) return; 
    const unsubscribe = listenToCollection<Collaborator>(
      COLLECTION_NAME,
      (newData) => {
        queryClient.setQueryData([COLLECTION_NAME], newData);
      },
      (error) => {
        console.error("Failed to listen to collaborators collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, isAuthReady]);

  const addCollaboratorMutation = useMutation<WithId<Omit<Collaborator, 'id'>>, Error, Omit<Collaborator, 'id'>>({
    mutationFn: (collaboratorData: Omit<Collaborator, 'id'>) => addDocumentToCollection(COLLECTION_NAME, { ...collaboratorData, createdAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const addMultipleCollaboratorsMutation = useMutation<void, Error, Omit<Collaborator, 'id'>[]>({
    mutationFn: (collaboratorsData: Omit<Collaborator, 'id'>[]) => {
        const dataWithTimestamp = collaboratorsData.map(c => ({ ...c, createdAt: new Date().toISOString() }));
        return addMultipleDocumentsToCollection(COLLECTION_NAME, dataWithTimestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorMutation = useMutation<void, Error, Collaborator>({
    mutationFn: (updatedCollaborator: Collaborator) => {
        const { id, ...data } = updatedCollaborator;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateCollaboratorPermissionsMutation = useMutation<void, Error, { id: string; permissions: CollaboratorPermissions }>({
    mutationFn: ({ id, permissions }) => updateDocumentInCollection(COLLECTION_NAME, id, { permissions }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
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
    updateCollaboratorPermissions: (id, permissions) => updateCollaboratorPermissionsMutation.mutateAsync({ id, permissions }),
    deleteCollaboratorMutation,
  }), [collaborators, isFetching, addCollaboratorMutation, addMultipleCollaboratorsMutation, updateCollaboratorMutation, updateCollaboratorPermissionsMutation, deleteCollaboratorMutation]);

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
