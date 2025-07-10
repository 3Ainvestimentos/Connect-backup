
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
    queryFn: () => getCollection<Application>(COLLECTION_NAME),
    initialData: [],
  });

  const addApplicationMutation = useMutation<WithId<Omit<Application, 'id'>>, Error, Omit<Application, 'id'>>({
    mutationFn: (appData) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: (newItem) => {
        queryClient.setQueryData<Application[]>([COLLECTION_NAME], (oldData = []) => [...oldData, newItem]);
    },
  });
  
  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp) => {
      const { id, ...data } = updatedApp;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onMutate: async (updatedApp) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<Application[]>([COLLECTION_NAME]);
        queryClient.setQueryData<Application[]>([COLLECTION_NAME], (oldData = []) => 
            oldData.map(app => app.id === updatedApp.id ? updatedApp : app)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteApplicationMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<Application[]>([COLLECTION_NAME]);
        queryClient.setQueryData<Application[]>([COLLECTION_NAME], (oldData = []) =>
            oldData.filter(app => app.id !== idToDelete)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
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
