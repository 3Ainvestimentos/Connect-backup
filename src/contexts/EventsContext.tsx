
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

export interface EventType {
  id: string;
  title: string;
  time: string;
  icon: string; // Storing icon name as string
  target: {
    type: 'all' | 'axis' | 'area' | 'city';
    value: string;
  };
}

const initialEvents: Omit<EventType, 'id'>[] = [
    { title: "Reunião de Alinhamento Semanal", time: "10:00 - 11:00", icon: "Users", target: { type: 'all', value: 'all' } },
    { title: "Aniversário da Empresa", time: "Dia Todo", icon: "CakeSlice", target: { type: 'all', value: 'all' } },
    { title: "Workshop de Design Thinking", time: "14:00 - 16:00", icon: "BrainCircuit", target: { type: 'area', value: 'Desenvolvimento' } },
    { title: "Happy Hour de Fim de Mês", time: "A partir das 17:30", icon: "Wine", target: { type: 'all', value: 'all' } },
    { title: "Apresentação de Resultados Q2", time: "09:00 - 10:00", icon: "TrendingUp", target: { type: 'axis', value: 'Comercial' } },
];

interface EventsContextType {
  events: EventType[];
  loading: boolean;
  addEvent: (event: Omit<EventType, 'id'>) => void;
  updateEvent: (event: EventType) => void;
  deleteEvent: (id: string) => void;
  getEventRecipients: (event: EventType, allCollaborators: Collaborator[]) => Collaborator[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);
const COLLECTION_NAME = 'events';

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: events = [], isLoading, isSuccess } = useQuery<EventType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<EventType>(COLLECTION_NAME),
  });

  useEffect(() => {
    if (isSuccess && events.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialEvents)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, events.length, hasSeeded, queryClient]);

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = event.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === event.target.value);
  }, []);

  const addEventMutation = useMutation({
    mutationFn: (eventData: Omit<EventType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: (updatedEvent: EventType) => updateDocumentInCollection(COLLECTION_NAME, updatedEvent.id, updatedEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    events,
    loading: isLoading,
    addEvent: (event) => addEventMutation.mutate(event),
    updateEvent: (event) => updateEventMutation.mutate(event),
    deleteEvent: (id) => deleteEventMutation.mutate(id),
    getEventRecipients,
  }), [events, isLoading, getEventRecipients, addEventMutation, updateEventMutation, deleteEventMutation]);

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
