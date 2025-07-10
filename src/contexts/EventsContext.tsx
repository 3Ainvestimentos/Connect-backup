
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Using the mock service instead of the real Firestore service
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/mock-firestore-service';

export interface EventType {
  id: string;
  title: string;
  date: string; // ISO date string e.g. "2024-07-25"
  time: string;
  location: string;
  icon: string; // Storing icon name as string
  recipientIds: string[]; // Array of collaborator IDs
}

// Initial mock data to populate localStorage if it's empty
const mockEvents: EventType[] = [];

interface EventsContextType {
  events: EventType[];
  loading: boolean;
  addEvent: (event: Omit<EventType, 'id'>) => Promise<EventType>;
  updateEvent: (event: EventType) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventRecipients: (event: EventType, allCollaborators: Collaborator[]) => Collaborator[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);
const COLLECTION_NAME = 'events';

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: events = [], isFetching } = useQuery<EventType[]>({
    queryKey: [COLLECTION_NAME],
    // Pass mock data to initialize if localStorage is empty
    queryFn: () => getCollection<EventType>(COLLECTION_NAME, mockEvents),
  });

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => event.recipientIds.includes(c.id));
  }, []);

  const addEventMutation = useMutation<WithId<Omit<EventType, 'id'>>, Error, Omit<EventType, 'id'>>({
    mutationFn: (eventData) => addDocumentToCollection(COLLECTION_NAME, eventData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateEventMutation = useMutation<void, Error, EventType>({
    mutationFn: (updatedEvent) => {
        const { id, ...data } = updatedEvent;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    events,
    loading: isFetching,
    addEvent: (event) => addEventMutation.mutateAsync(event),
    updateEvent: (event) => updateEventMutation.mutateAsync(event),
    deleteEvent: (id) => deleteEventMutation.mutateAsync(id),
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
