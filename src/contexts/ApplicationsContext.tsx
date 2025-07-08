
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
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
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: applications = [], isLoading, isError, error, isSuccess } = useQuery<Application[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Application>(COLLECTION_NAME),
  });

  useEffect(() => {
    if (isSuccess && applications.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialApplications)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, applications.length, hasSeeded, queryClient]);

  useEffect(() => {
    if (isError) {
      console.error("Error fetching applications:", error);
      toast({ title: 'Erro ao carregar aplicações', description: 'Não foi possível buscar os dados.', variant: 'destructive' });
    }
  }, [isError, error]);

  const addApplicationMutation = useMutation<Application, Error, Omit<Application, 'id'>>({
    mutationFn: (appData: Omit<Application, 'id'>) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp: Application) => updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteApplicationMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
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
