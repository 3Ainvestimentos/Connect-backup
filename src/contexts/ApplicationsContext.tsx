
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Using the mock service instead of the real Firestore service
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/mock-firestore-service';

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

// Initial mock data to populate localStorage if it's empty
const mockApplications: Application[] = [
    { id: "app_mock_1", name: "Meu Perfil", icon: "UserCircle", type: "modal", modalId: "profile" },
    { id: "app_mock_2", name: "Solicitar Férias", icon: "Plane", type: "modal", modalId: "vacation" },
    { id: "app_mock_3", name: "Suporte T.I", icon: "Headset", type: "modal", modalId: "support" },
    { id: "app_mock_4", name: "Administrativo", icon: "Briefcase", type: "modal", modalId: "admin" },
    { id: "app_mock_5", name: "Marketing", icon: "Megaphone", type: "modal", modalId: "marketing" },
    { id: "app_mock_6", name: "Slack", icon: "MessagesSquare", type: "external", href: "https://slack.com" },
];

interface ApplicationsContextType {
  applications: Application[];
  loading: boolean;
  addApplication: (app: Omit<Application, 'id'>) => Promise<Application>;
  updateApplication: (app: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);
const COLLECTION_NAME = 'applications';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: applications = [], isFetching } = useQuery<Application[]>({
    queryKey: [COLLECTION_NAME],
    // Pass mock data to initialize if localStorage is empty
    queryFn: () => getCollection<Application>(COLLECTION_NAME, mockApplications),
  });

  const addApplicationMutation = useMutation<WithId<Omit<Application, 'id'>>, Error, Omit<Application, 'id'>>({
    mutationFn: (appData) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp) => {
      const { id, ...data } = updatedApp;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteApplicationMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const value = useMemo(() => ({
    applications,
    loading: isFetching,
    addApplication: (app) => addApplicationMutation.mutateAsync(app),
    updateApplication: (app) => updateApplicationMutation.mutateAsync(app),
    deleteApplication: (id) => deleteApplicationMutation.mutateAsync(id),
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
