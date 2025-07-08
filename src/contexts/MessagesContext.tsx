
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface MessageType {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string; // ISO date string e.g. "2024-07-25"
  target: {
    type: 'all' | 'axis' | 'area' | 'city';
    value: string;
  };
  readBy: string[]; // Array of collaborator IDs
}

interface MessagesContextType {
  messages: MessageType[];
  loading: boolean;
  addMessage: (message: Omit<MessageType, 'id' | 'readBy'>) => Promise<WithId<Omit<MessageType, 'id' | 'readBy'>>>;
  updateMessage: (message: MessageType) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  markMessageAsRead: (messageId: string, collaboratorId: string) => void;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'messages';

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isFetching } = useQuery<MessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<MessageType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  });

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = message.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === message.target.value);
  }, []);

  const addMessageMutation = useMutation<WithId<Omit<MessageType, 'id' | 'readBy'>>, Error, Omit<MessageType, 'id' | 'readBy'>>({
    mutationFn: (messageData: Omit<MessageType, 'id' | 'readBy'>) => {
      const newMessageData = { ...messageData, readBy: [] };
      return addDocumentToCollection(COLLECTION_NAME, newMessageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateMessageMutation = useMutation<void, Error, MessageType>({
    mutationFn: (updatedMessage: MessageType) => updateDocumentInCollection(COLLECTION_NAME, updatedMessage.id, updatedMessage),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteMessageMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ messageId, collaboratorId }: { messageId: string; collaboratorId: string }) => {
      const message = messages.find(msg => msg.id === messageId);
      if (message && !message.readBy.includes(collaboratorId)) {
        const updatedReadBy = [...message.readBy, collaboratorId];
        return updateDocumentInCollection(COLLECTION_NAME, messageId, { readBy: updatedReadBy });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      // This is a less critical error, so we can just log it or show a subtle toast
      console.error("Failed to mark message as read:", error.message);
    },
  });
  
  const value = useMemo(() => ({
    messages,
    loading: isFetching,
    addMessage: (message) => addMessageMutation.mutateAsync(message),
    updateMessage: (message) => updateMessageMutation.mutateAsync(message),
    deleteMessage: (id) => deleteMessageMutation.mutateAsync(id),
    markMessageAsRead: (messageId, collaboratorId) => markAsReadMutation.mutate({ messageId, collaboratorId }),
    getMessageRecipients
  }), [messages, isFetching, getMessageRecipients, addMessageMutation, updateMessageMutation, deleteMessageMutation, markAsReadMutation]);

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
