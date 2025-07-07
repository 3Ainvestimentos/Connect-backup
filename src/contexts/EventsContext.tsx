"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { useLocalStorage } from '@/hooks/use-local-storage';

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

const initialEvents: EventType[] = [
    { id: 'evt1', title: "Reunião de Alinhamento Semanal", time: "10:00 - 11:00", icon: "Users", target: { type: 'all', value: 'all' } },
    { id: 'evt2', title: "Aniversário da Empresa", time: "Dia Todo", icon: "CakeSlice", target: { type: 'all', value: 'all' } },
    { id: 'evt3', title: "Workshop de Design Thinking", time: "14:00 - 16:00", icon: "BrainCircuit", target: { type: 'area', value: 'Desenvolvimento' } },
    { id: 'evt4', title: "Happy Hour de Fim de Mês", time: "A partir das 17:30", icon: "Wine", target: { type: 'all', value: 'all' } },
    { id: 'evt5', title: "Apresentação de Resultados Q2", time: "09:00 - 10:00", icon: "TrendingUp", target: { type: 'axis', value: 'Comercial' } },
];

interface EventsContextType {
  events: EventType[];
  addEvent: (event: Omit<EventType, 'id'>) => void;
  updateEvent: (event: EventType) => void;
  deleteEvent: (id: string) => void;
  getEventRecipients: (event: EventType, allCollaborators: Collaborator[]) => Collaborator[];
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useLocalStorage<EventType[]>('events', initialEvents);

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = event.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === event.target.value);
  }, []);

  const addEvent = useCallback((eventData: Omit<EventType, 'id'>) => {
    const newEvent: EventType = { ...eventData, id: `evt-${Date.now()}` };
    setEvents(prev => [...prev, newEvent]);
  }, [setEvents]);

  const updateEvent = useCallback((updatedEvent: EventType) => {
    setEvents(prev => prev.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt)));
  }, [setEvents]);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
  }, [setEvents]);

  const value = useMemo(() => ({
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventRecipients,
  }), [events, addEvent, updateEvent, deleteEvent, getEventRecipients]);

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
