"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';
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

const initialApplications: Omit<Application, 'id'>[] = [
  { name: 'Meu Perfil', icon: 'UserCircle', type: 'modal', modalId: 'profile' },
  { name: 'Slack', icon: 'MessagesSquare', type: 'external', href: 'https://slack.com/intl/pt-br/' },
  { name: 'Férias', icon: 'Plane', type: 'modal', modalId: 'vacation' },
  { name: 'Suporte TI', icon: 'Headset', type: 'modal', modalId: 'support' },
  { name: 'Administrativo', icon: 'Briefcase', type: 'modal', modalId: 'admin' },
  { name: 'Marketing', icon: 'Megaphone', type: 'modal', modalId: 'marketing' },
  {
    name: 'Links RH',
    icon: 'Book',
    type: 'modal',
    modalId: 'generic',
    content: {
      title: 'Links Úteis de RH',
      description: 'Acesse rapidamente os formulários e informações de Recursos Humanos.',
      items: [
        { id: 'rh1', label: 'Formulário de Feedback', subtext: 'Compartilhe sua opinião anonimamente.', link: '#' },
        { id: 'rh2', label: 'Plano de Carreira', subtext: 'Veja as trilhas de desenvolvimento.', link: '#' },
      ],
    },
  },
];

const COLLECTION_NAME = 'applications';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading, isError, error } = useQuery<Application[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => {
      const data = await getCollection<Application>(COLLECTION_NAME);
      // If the collection is empty, seed it with initial data and refetch.
      if (data.length === 0) {
        console.log(`Seeding ${COLLECTION_NAME} collection...`);
        await seedCollection(COLLECTION_NAME, initialApplications);
        return await getCollection<Application>(COLLECTION_NAME);
      }
      return data;
    },
  });

  React.useEffect(() => {
    if (isError) {
      console.error("Error fetching applications:", error);
      toast({ title: 'Erro ao carregar aplicações', description: (error as Error).message, variant: 'destructive' });
    }
  }, [isError, error]);

  const addApplicationMutation = useMutation({
    mutationFn: (appData: Omit<Application, 'id'>) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: () => {
      // When the mutation is successful, invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar aplicação', description: (error as Error).message, variant: 'destructive' });
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: (updatedApp: Application) => updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar aplicação', description: (error as Error).message, variant: 'destructive' });
    }
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir aplicação', description: (error as Error).message, variant: 'destructive' });
    }
  });

  const value = useMemo(() => ({
    applications,
    loading: isLoading,
    addApplication: (appData: Omit<Application, 'id'>) => addApplicationMutation.mutate(appData),
    updateApplication: (updatedApp: Application) => updateApplicationMutation.mutate(updatedApp),
    deleteApplication: (id: string) => deleteApplicationMutation.mutate(id),
  }), [applications, isLoading, addApplicationMutation, updateApplicationMutation, deleteApplicationMutation]);

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
