
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';

export interface MessageType {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string; // ISO date string e.g. "2024-07-25"
  recipientIds: string[]; // Array of collaborator IDs
  readBy: string[]; // Array of collaborator IDs who have read the message
}

interface MessagesContextType {
  messages: MessageType[];
  loading: boolean;
  addMessage: (message: Omit<MessageType, 'id' | 'readBy'>) => Promise<MessageType>;
  updateMessage: (message: MessageType) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  markMessageAsRead: (messageId: string, collaboratorId: string) => void;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

const generateMockId = () => `mock_${Date.now()}_${Math.random()}`;

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMessages([]);
    setLoading(false);
  }, []);

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => message.recipientIds.includes(c.id));
  }, []);

  const addMessage = useCallback(async (messageData: Omit<MessageType, 'id' | 'readBy'>): Promise<MessageType> => {
    setLoading(true);
    const newMessage = { ...messageData, id: generateMockId(), readBy: [] };
    setMessages(prev => [newMessage, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
    return newMessage;
  }, []);

  const updateMessage = useCallback(async (updatedMessage: MessageType): Promise<void> => {
    setLoading(true);
    setMessages(prev => prev
      .map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setLoading(false);
  }, []);

  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setMessages(prev => prev.filter(msg => msg.id !== id));
    setLoading(false);
  }, []);

  const markMessageAsRead = useCallback((messageId: string, collaboratorId: string) => {
    setMessages(prev => {
      return prev.map(msg => {
        if (msg.id === messageId && !msg.readBy.includes(collaboratorId)) {
          return { ...msg, readBy: [...msg.readBy, collaboratorId] };
        }
        return msg;
      });
    });
  }, []);
  
  const value = useMemo(() => ({
    messages,
    loading,
    addMessage,
    updateMessage,
    deleteMessage,
    markMessageAsRead,
    getMessageRecipients
  }), [messages, loading, getMessageRecipients, addMessage, updateMessage, deleteMessage, markMessageAsRead]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = (): MessagesContextType => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
