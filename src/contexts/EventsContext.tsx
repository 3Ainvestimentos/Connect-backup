
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';

export interface EventType {
  id: string;
  title: string;
  date: string; // ISO date string e.g. "2024-07-25"
  time: string;
  location: string;
  icon: string; // Storing icon name as string
  recipientIds: string[]; // Array of collaborator IDs
}

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

// Helper to generate a unique ID for mock items
const generateMockId = () => `mock_${Date.now()}_${Math.random()}`;

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  // Use local state to manage events, simulating a persistent store.
  const [events, setEvents] = useState<EventType[]>(mockEvents);
  const [loading, setLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
    // In a real scenario, you would fetch from Firestore here.
    // For this mock setup, we just use the initial mockEvents.
    setEvents(mockEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setLoading(false);
  }, []);

  const getEventRecipients = useCallback((event: EventType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (event.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => event.recipientIds.includes(c.id));
  }, []);

  const addEvent = async (eventData: Omit<EventType, 'id'>): Promise<EventType> => {
    setLoading(true);
    const newEvent: EventType = { id: generateMockId(), ...eventData };
    setEvents(prevEvents => [...prevEvents, newEvent].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setLoading(false);
    return newEvent;
  };

  const updateEvent = async (updatedEvent: EventType): Promise<void> => {
    setLoading(true);
    setEvents(prevEvents => 
      prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setLoading(false);
  };

  const deleteEvent = async (id: string): Promise<void> => {
    setLoading(true);
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    setLoading(false);
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
