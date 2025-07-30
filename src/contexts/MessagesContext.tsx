
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection } from '@/lib/firestore-service';

export interface MessageType {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string; // ISO date string e.g. "2024-07-25"
  link?: string;
  mediaUrl?: string;
  recipientIds: string[]; // Array of collaborator 'id3a' values
  readBy: string[]; // Array of collaborator 'id3a' values who have read the message
  deletedBy: string[]; // Array of collaborator 'id3a' values who have soft-deleted the message
}

interface MessagesContextType {
  messages: MessageType[];
  loading: boolean;
  addMessage: (message: Omit<MessageType, 'id' | 'readBy' | 'deletedBy' | 'date'>) => Promise<WithId<Omit<MessageType, 'id' | 'readBy' | 'deletedBy' | 'date'>>>;
  updateMessage: (message: MessageType) => Promise<void>;
  deleteMessageMutation: UseMutationResult<void, Error, string, unknown>;
  markMessageAsRead: (messageId: string, collaboratorId3a: string) => void;
  markMessageAsDeleted: (messageId: string, collaboratorId3a: string) => Promise<void>;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'messages';

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isFetching } = useQuery<MessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => [],
    staleTime: Infinity,
    select: (data) => data.map(m => ({ ...m, readBy: m.readBy || [], deletedBy: m.deletedBy || [] })),
  });
  
  React.useEffect(() => {
    const unsubscribe = listenToCollection<MessageType>(
      COLLECTION_NAME,
      (newData) => {
        queryClient.setQueryData([COLLECTION_NAME], newData);
      },
      (error) => {
        console.error("Failed to listen to messages collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => message.recipientIds.includes(c.id3a));
  }, []);

  const addMessageMutation = useMutation<WithId<Omit<MessageType, 'id' | 'readBy' | 'deletedBy' | 'date'>>, Error, Omit<MessageType, 'id' | 'readBy' | 'deletedBy' | 'date'>>({
    mutationFn: (messageData) => addDocumentToCollection(COLLECTION_NAME, {...messageData, date: new Date().toISOString(), readBy: [], deletedBy: []}),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateMessageMutation = useMutation<void, Error, MessageType>({
    mutationFn: (updatedMessage) => {
        const { id, ...data } = updatedMessage;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: (_, variables) => {
      // Optimistic update for faster UI response
      queryClient.setQueryData([COLLECTION_NAME], (oldData: MessageType[] | undefined) => {
        return oldData ? oldData.map(msg => msg.id === variables.id ? variables : msg) : [];
      });
      // Listener will handle invalidation
    },
  });

  const deleteMessageMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      // Listener will handle invalidation
    },
  });

  const markMessageAsRead = useCallback((messageId: string, collaboratorId3a: string) => {
    const message = messages.find(m => m.id === messageId);
    if(message && !message.readBy.includes(collaboratorId3a)) {
        const updatedMessage = {
            ...message,
            readBy: [...message.readBy, collaboratorId3a]
        };
        updateMessageMutation.mutate(updatedMessage);
    }
  }, [messages, updateMessageMutation]);

  const markMessageAsDeleted = useCallback(async (messageId: string, collaboratorId3a: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && !(message.deletedBy || []).includes(collaboratorId3a)) {
        const updatedMessage = {
            ...message,
            deletedBy: [...(message.deletedBy || []), collaboratorId3a],
        };
        // Use mutateAsync to await the operation if needed
        await updateMessageMutation.mutateAsync(updatedMessage);
    }
  }, [messages, updateMessageMutation]);
  
  const value = useMemo(() => ({
    messages,
    loading: isFetching,
    addMessage: (msg) => addMessageMutation.mutateAsync(msg),
    updateMessage: (msg) => updateMessageMutation.mutateAsync(msg),
    deleteMessageMutation,
    markMessageAsRead,
    markMessageAsDeleted,
    getMessageRecipients
  }), [messages, isFetching, getMessageRecipients, addMessageMutation, updateMessageMutation, deleteMessageMutation, markMessageAsRead, markMessageAsDeleted]);

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
