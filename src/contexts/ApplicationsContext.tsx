
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
  });

  const addApplicationMutation = useMutation<WithId<Omit<Application, 'id'>>, Error, Omit<Application, 'id'>>({
    mutationFn: (appData) => addDocumentToCollection(COLLECTION_NAME, appData),
    onSuccess: (newItem) => {
        // Optimistically update the cache
        queryClient.setQueryData([COLLECTION_NAME], (oldData: Application[] = []) => [...oldData, newItem]);
    },
    onSettled: () => {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const updateApplicationMutation = useMutation<void, Error, Application>({
    mutationFn: (updatedApp) => {
      const { id, ...data } = updatedApp;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
     onSuccess: (_, variables) => {
      // Optimistically update to the new value
      queryClient.setQueryData([COLLECTION_NAME], (oldData: Application[] = []) =>
        oldData.map((item) => (item.id === variables.id ? variables : item))
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteApplicationMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
  
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Application[]>([COLLECTION_NAME]);
  
      // Optimistically update to the new value
      queryClient.setQueryData<Application[]>([COLLECTION_NAME], (old = []) =>
        old.filter((item) => item.id !== idToDelete)
      );
  
      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([COLLECTION_NAME], context.previousData);
      }
    },
    // Always refetch after error or success:
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
