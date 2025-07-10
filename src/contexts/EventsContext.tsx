
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface EventType {
  id: string;
  title: string;
  date: string; // ISO date string e.g. "2024-07-25"
  time: string;
  location: string;
  icon: string; // Storing icon name as string
  recipientIds: string[]; // Array of collaborator IDs
}

interface EventsContextType {
  events: EventType[];
  loading: boolean;
  addEvent: (event: Omit<EventType, 'id'>) => Promise<WithId<Omit<EventType, 'id'>>>;
  updateEvent: (event: EventType) => Promise<void>;
  deleteEventMutation: UseMutationResult<void, Error, string, { previousData: EventType[] | undefined }>;
  getEventRecipients: (event: EventType, allCollaborators: Collaborator[]) => Collaborator[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);
const COLLECTION_NAME = 'events';

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: events = [], isFetching } = useQuery<EventType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<EventType>(COLLECTION_NAME),
  });

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => event.recipientIds.includes(c.id));
  }, []);

  const addEventMutation = useMutation<WithId<Omit<EventType, 'id'>>, Error, Omit<EventType, 'id'>>({
    mutationFn: (eventData) => addDocumentToCollection(COLLECTION_NAME, eventData),
    onSuccess: (newItem) => {
        queryClient.setQueryData([COLLECTION_NAME], (oldData: EventType[] = []) => [...oldData, newItem]);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateEventMutation = useMutation<void, Error, EventType>({
    mutationFn: (updatedEvent) => {
        const { id, ...data } = updatedEvent;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData([COLLECTION_NAME], (oldData: EventType[] = []) =>
        oldData.map((item) => (item.id === variables.id ? variables : item))
      );
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteEventMutation = useMutation<void, Error, string, { previousData: EventType[] | undefined }>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
      await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
      const previousData = queryClient.getQueryData<EventType[]>([COLLECTION_NAME]);
      queryClient.setQueryData<EventType[]>([COLLECTION_NAME], (old) => old?.filter(item => item.id !== idToDelete) ?? []);
      return { previousData };
    },
    onError: (err, id, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
        toast({
            title: "Erro ao excluir",
            description: err instanceof Error ? err.message : "Não foi possível remover o evento.",
            variant: "destructive"
        });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    events,
    loading: isFetching,
    addEvent: (event) => addEventMutation.mutateAsync(event),
    updateEvent: (event) => updateEventMutation.mutateAsync(event),
    deleteEventMutation,
    getEventRecipients,
  }), [events, isFetching, getEventRecipients, addEventMutation, updateEventMutation, deleteEventMutation]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
