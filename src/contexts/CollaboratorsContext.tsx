"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
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
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);
const COLLECTION_NAME = 'collaborators';

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getCollection<Collaborator>(COLLECTION_NAME);
        if (data.length === 0) {
            await seedCollection(COLLECTION_NAME, initialCollaborators);
            const seededData = await getCollection<Collaborator>(COLLECTION_NAME);
            setCollaborators(seededData);
        } else {
            setCollaborators(data);
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const addCollaborator = async (collaboratorData: Omit<Collaborator, 'id'>) => {
    const newCollaborator = await addDocumentToCollection(COLLECTION_NAME, collaboratorData);
    if(newCollaborator) {
        setCollaborators(prev => [newCollaborator as Collaborator, ...prev]);
    }
  };

  const updateCollaborator = async (updatedCollaborator: Collaborator) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedCollaborator.id, updatedCollaborator);
    if(success) {
        setCollaborators(prev => prev.map(c => (c.id === updatedCollaborator.id ? updatedCollaborator : c)));
    }
  };

  const deleteCollaborator = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if(success) {
        setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  };

  const value = useMemo(() => ({
    collaborators,
    loading,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
  }), [collaborators, loading]);

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
