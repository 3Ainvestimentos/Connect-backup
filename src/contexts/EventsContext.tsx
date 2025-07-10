
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, getDocument, setDocumentInCollection } from '@/lib/firestore-service';

export interface EventType {
  id: string;
  title: string;
  date: string; // ISO date string e.g. "2024-07-25"
  time: string;
  location: string;
  icon: string; // Storing icon name as string
  recipientIds: string[]; // Array of collaborator IDs
}

const mockEvents: EventType[] = [
    { id: "event_mock_1", title: "Festa Junina 2025", date: "2025-07-10T00:00:00.000Z", time: "18:30", location: "Prédio Algar", icon: 'Flame', recipientIds: ['all'] },
];

interface EventsContextType {
  events: EventType[];
  loading: boolean;
  addEvent: (event: Omit<EventType, 'id'>) => Promise<WithId<Omit<EventType, 'id'>>>;
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
    queryFn: () => getCollection<EventType>(COLLECTION_NAME),
    select: (fetchedData) => {
        const combined = [...mockEvents, ...fetchedData];
        const uniqueEvents = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return uniqueEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  });

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => event.recipientIds.includes(c.id));
  }, []);

  const addEventMutation = useMutation<WithId<Omit<EventType, 'id'>>, Error, Omit<EventType, 'id'>>({
    mutationFn: (eventData: Omit<EventType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateEventMutation = useMutation<void, Error, EventType>({
    mutationFn: async (updatedEvent: EventType) => {
        const { id, ...data } = updatedEvent;
        const docExists = await getDocument(COLLECTION_NAME, id);
        
        if (docExists) {
            return updateDocumentInCollection(COLLECTION_NAME, id, data);
        } else if (mockEvents.some(mock => mock.id === id)) {
            return setDocumentInCollection(COLLECTION_NAME, id, data);
        } else {
            throw new Error(`Document with id ${id} not found and is not a mock item.`);
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
        const docExists = await getDocument(COLLECTION_NAME, id);
        if(docExists) {
          return deleteDocumentFromCollection(COLLECTION_NAME, id);
        }
        // If it doesn't exist in Firestore (i.e., it's a mock item that was never edited),
        // we just resolve without erroring. The optimistic update will handle the UI.
        return Promise.resolve();
    },
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
