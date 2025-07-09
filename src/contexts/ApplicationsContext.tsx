
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

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
  addApplication: (app: Omit<Application, 'id'>) => Promise<WithId<Omit<Application, 'id'>>>;
  updateApplication: (app: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

const COLLECTION_NAME = 'applications';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: applications = [], isFetching } = useQuery<Application[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<Application>(COLLECTION_NAME),
  });

  const addApplicationMutation = useMutation<WithId<Omit<Application, 'id'>>, Error, Omit<Application, 'id'>>({
    mutationFn: (appData: Omit<Application, 'id'>) => {
        // The firestore-service now handles sanitization via converters.
        return addDocumentToCollection(COLLECTION_NAME, appData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp: Application) => {
        // The firestore-service now handles sanitization via converters.
        return updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp);
    },
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
    loading: isFetching,
    addApplication: (appData) => addApplicationMutation.mutateAsync(appData),
    updateApplication: (updatedApp) => updateApplicationMutation.mutateAsync(updatedApp),
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
