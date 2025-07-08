
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface ApplicationLinkItem {
  id: string;
  label: string;
  subtext?: string;
  link?: string;
}
export interface Application {
  id: string;
  name: string;
  icon: string; // Lucide icon name as string
  type: 'modal' | 'external';
  modalId?: 'profile' | 'vacation' | 'support' | 'admin' | 'marketing' | 'generic';
  href?: string;
  content?: {
    title: string;
    description: string;
    items: ApplicationLinkItem[];
  };
}

interface ApplicationsContextType {
  applications: Application[];
  loading: boolean;
  addApplication: (app: Omit<Application, 'id'>) => void;
  updateApplication: (app: Application) => void;
  deleteApplication: (id: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

const COLLECTION_NAME = 'applications';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: applications = [], isFetching, isError, error } = useQuery<Application[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Application>(COLLECTION_NAME),
  });

  useEffect(() => {
    if (isError) {
      console.error("Error fetching applications:", error);
      toast({ title: 'Erro ao carregar aplicações', description: 'Não foi possível buscar os dados.', variant: 'destructive' });
    }
  }, [isError, error]);

  const addApplicationMutation = useMutation<WithId<Omit<Application, 'id'>>, Error, Omit<Application, 'id'>>({
    mutationFn: (appData: Omit<Application, 'id'>) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Adicionar",
        description: `Não foi possível salvar a aplicação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp: Application) => updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Atualizar",
        description: `Não foi possível salvar as alterações: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteApplicationMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
     onError: (error) => {
      toast({
        title: "Erro ao Excluir",
        description: `Não foi possível remover a aplicação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const value = useMemo(() => ({
    applications,
    loading: isFetching,
    addApplication: (appData: Omit<Application, 'id'>) => addApplicationMutation.mutate(appData),
    updateApplication: (updatedApp: Application) => updateApplicationMutation.mutate(updatedApp),
    deleteApplication: (id: string) => deleteApplicationMutation.mutate(id),
  }), [applications, isFetching, addApplicationMutation, updateApplicationMutation, deleteApplicationMutation]);

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
};

export const useApplications = (): ApplicationsContextType => {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
};
