
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

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
const COLLECTION_NAME = 'messages';

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isFetching } = useQuery<MessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<MessageType>(COLLECTION_NAME),
    initialData: [],
  });

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.recipientIds.includes('all')) {
      return allCollaborators;
    }
    return allCollaborators.filter(c => message.recipientIds.includes(c.id));
  }, []);

  const addMessageMutation = useMutation<WithId<Omit<MessageType, 'id'>>, Error, Omit<MessageType, 'id' | 'readBy'>>({
    mutationFn: (messageData) => addDocumentToCollection(COLLECTION_NAME, {...messageData, readBy: []}),
    onSuccess: (newMessage) => {
        queryClient.setQueryData<MessageType[]>([COLLECTION_NAME], (oldData = []) =>
            [...oldData, newMessage].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
    },
  });

  const updateMessageMutation = useMutation<void, Error, MessageType>({
    mutationFn: (updatedMessage) => {
        const { id, ...data } = updatedMessage;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onMutate: async (updatedMessage) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<MessageType[]>([COLLECTION_NAME]);
        queryClient.setQueryData<MessageType[]>([COLLECTION_NAME], (oldData = []) => 
            oldData.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteMessageMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<MessageType[]>([COLLECTION_NAME]);
        queryClient.setQueryData<MessageType[]>([COLLECTION_NAME], (oldData = []) => 
            oldData.filter(msg => msg.id !== idToDelete)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const markMessageAsRead = useCallback((messageId: string, collaboratorId: string) => {
    const message = messages.find(m => m.id === messageId);
    if(message && !message.readBy.includes(collaboratorId)) {
        const updatedMessage = {
            ...message,
            readBy: [...message.readBy, collaboratorId]
        };
        updateMessageMutation.mutate(updatedMessage);
    }
  }, [messages, updateMessageMutation]);
  
  const value = useMemo(() => ({
    messages,
    loading: isFetching,
    addMessage: (msg) => addMessageMutation.mutateAsync(msg),
    updateMessage: (msg) => updateMessageMutation.mutateAsync(msg),
    deleteMessage: (id) => deleteMessageMutation.mutateAsync(id),
    markMessageAsRead,
    getMessageRecipients
  }), [messages, isFetching, getMessageRecipients, addMessageMutation, updateMessageMutation, deleteMessageMutation, markMessageAsRead]);

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
