"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

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

const initialCollaborators: Collaborator[] = [
  { id: 'collab1', name: 'Ana Silva', email: 'ana.silva@example.com', axis: 'Comercial', area: 'Vendas', position: 'Gerente de Vendas', leader: 'Carlos Pereira', segment: 'Varejo', city: 'São Paulo' },
  { id: 'collab2', name: 'Bruno Costa', email: 'bruno.costa@example.com', axis: 'Operações', area: 'Logística', position: 'Analista de Logística', leader: 'Fernanda Lima', segment: 'Indústria', city: 'Rio de Janeiro' },
  { id: 'collab3', name: 'Carla Dias', email: 'carla.dias@example.com', axis: 'Tecnologia', area: 'Desenvolvimento', position: 'Desenvolvedora Sênior', leader: 'Ricardo Souza', segment: 'B2B', city: 'Belo Horizonte' },
  { id: 'collab4', name: 'Usuário de Teste', email: 'test.user@example.com', axis: 'Tecnologia', area: 'Desenvolvimento', position: 'Analista de Testes', leader: 'Ricardo Souza', segment: 'B2B', city: 'Belo Horizonte' },
];

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (collaborator: Collaborator) => void;
  deleteCollaborator: (id: string) => void;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>('collaborators', initialCollaborators);

  const addCollaborator = useCallback((collaboratorData: Omit<Collaborator, 'id'>) => {
    const newCollaborator: Collaborator = { ...collaboratorData, id: `collab-${Date.now()}` };
    setCollaborators(prev => [newCollaborator, ...prev]);
  }, [setCollaborators]);

  const updateCollaborator = useCallback((updatedCollaborator: Collaborator) => {
    setCollaborators(prev => prev.map(c => (c.id === updatedCollaborator.id ? updatedCollaborator : c)));
  }, [setCollaborators]);

  const deleteCollaborator = useCallback((id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  }, [setCollaborators]);

  const value = useMemo(() => ({
    collaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
  }), [collaborators, addCollaborator, updateCollaborator, deleteCollaborator]);

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
