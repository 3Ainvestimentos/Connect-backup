"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Users, CakeSlice, BrainCircuit, Wine, TrendingUp, type LucideIcon } from 'lucide-react';

export interface EventType {
  id: string;
  title: string;
  time: string;
  icon: string; // Storing icon name as string
}

const initialEvents: EventType[] = [
    { id: 'evt1', title: "Reunião de Alinhamento Semanal", time: "10:00 - 11:00", icon: "Users" },
    { id: 'evt2', title: "Aniversário da Empresa", time: "Dia Todo", icon: "CakeSlice" },
    { id: 'evt3', title: "Workshop de Design Thinking", time: "14:00 - 16:00", icon: "BrainCircuit" },
    { id: 'evt4', title: "Happy Hour de Fim de Mês", time: "A partir das 17:30", icon: "Wine" },
    { id: 'evt5', title: "Apresentação de Resultados Q2", time: "09:00 - 10:00", icon: "TrendingUp" },
];

interface EventsContextType {
  events: EventType[];
  addEvent: (event: Omit<EventType, 'id'>) => void;
  updateEvent: (event: EventType) => void;
  deleteEvent: (id: string) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<EventType[]>(initialEvents);

  const addEvent = useCallback((eventData: Omit<EventType, 'id'>) => {
    const newEvent: EventType = { ...eventData, id: `evt-${Date.now()}` };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const updateEvent = useCallback((updatedEvent: EventType) => {
    setEvents(prev => prev.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
  }, []);

  const value = useMemo(() => ({
    events,
    addEvent,
    updateEvent,
    deleteEvent,
  }), [events, addEvent, updateEvent, deleteEvent]);

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
