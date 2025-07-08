
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

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

  const { data: events = [], isFetching } = useQuery<EventType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<EventType>(COLLECTION_NAME),
  });

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = event.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === event.target.value);
  }, []);

  const addEventMutation = useMutation<WithId<Omit<EventType, 'id'>>, Error, Omit<EventType, 'id'>>({
    mutationFn: (eventData: Omit<EventType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Adicionar", description: `Não foi possível salvar o evento: ${error.message}`, variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: (updatedEvent: EventType) => updateDocumentInCollection(COLLECTION_NAME, updatedEvent.id, updatedEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar as alterações: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Excluir", description: `Não foi possível remover o evento: ${error.message}`, variant: "destructive" });
    },
  });

  const value = useMemo(() => ({
    events,
    loading: isFetching,
    addEvent: (event) => addEventMutation.mutate(event),
    updateEvent: (event) => updateEventMutation.mutate(event),
    deleteEvent: (id) => deleteEventMutation.mutate(id),
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
