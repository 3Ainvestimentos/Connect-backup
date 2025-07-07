"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
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
  addEvent: (event: Omit<EventType, 'id'>) => Promise<void>;
  updateEvent: (event: EventType) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventRecipients: (event: EventType, allCollaborators: Collaborator[]) => Collaborator[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);
const COLLECTION_NAME = 'events';

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getCollection<EventType>(COLLECTION_NAME);
         if (data.length === 0) {
            await seedCollection(COLLECTION_NAME, initialEvents);
            const seededData = await getCollection<EventType>(COLLECTION_NAME);
            setEvents(seededData);
        } else {
            setEvents(data);
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = event.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === event.target.value);
  }, []);

  const addEvent = async (eventData: Omit<EventType, 'id'>) => {
    const newEvent = await addDocumentToCollection(COLLECTION_NAME, eventData);
    if(newEvent) {
        setEvents(prev => [...prev, newEvent as EventType]);
    }
  };

  const updateEvent = async (updatedEvent: EventType) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedEvent.id, updatedEvent);
    if(success) {
        setEvents(prev => prev.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt)));
    }
  };

  const deleteEvent = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if(success) {
        setEvents(prev => prev.filter(evt => evt.id !== id));
    }
  };

  const value = useMemo(() => ({
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventRecipients,
  }), [events, loading, getEventRecipients]);

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
