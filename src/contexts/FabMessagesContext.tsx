
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection } from '@/lib/firestore-service';
import * as z from 'zod';
import { arrayUnion } from 'firebase/firestore';

export const fabMessageSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  content: z.string().min(5, "O conteúdo deve ter pelo menos 5 caracteres."),
  icon: z.string().min(1, "Um ícone deve ser selecionado."),
  ctaLink: z.string().url("O link da ação deve ser uma URL válida."),
  ctaText: z.string().min(1, "O texto da ação é obrigatório."),
  targetUserIds: z.array(z.string()).min(1, "Ao menos um usuário deve ser selecionado."),
  status: z.enum(['draft', 'sent']).default('draft'),
  readByUserIds: z.array(z.string()).default([]),
  clickedByUserIds: z.array(z.string()).default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export type FabMessageType = WithId<z.infer<typeof fabMessageSchema>>;

interface FabMessagesContextType {
  fabMessages: FabMessageType[];
  loading: boolean;
  addFabMessage: (message: Omit<FabMessageType, 'id'>) => Promise<FabMessageType>;
  updateFabMessage: (message: Partial<FabMessageType> & { id: string }) => Promise<void>;
  deleteFabMessageMutation: UseMutationResult<void, Error, string, unknown>;
  markAsRead: (messageId: string, userId: string) => Promise<void>;
  markAsClicked: (messageId: string, userId: string) => Promise<void>;
}

const FabMessagesContext = createContext<FabMessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'fabMessages';

export const FabMessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: fabMessages = [], isFetching } = useQuery<FabMessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => [],
    staleTime: Infinity,
    select: (data) => data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });

  React.useEffect(() => {
    const unsubscribe = listenToCollection<FabMessageType>(
      COLLECTION_NAME,
      (newData) => {
        const sortedData = newData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        queryClient.setQueryData([COLLECTION_NAME], sortedData);
      },
      (error) => {
        console.error(`Failed to listen to ${COLLECTION_NAME} collection:`, error);
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  const addFabMessageMutation = useMutation<WithId<Omit<FabMessageType, 'id'>>, Error, Omit<FabMessageType, 'id'>>({
    mutationFn: (messageData) => addDocumentToCollection(COLLECTION_NAME, messageData),
  });

  const updateFabMessageMutation = useMutation<void, Error, Partial<FabMessageType> & { id: string }>({
    mutationFn: (updatedMessage) => {
      const { id, ...data } = updatedMessage;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
  });

  const deleteFabMessageMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
  });

  const markAsReadMutation = useMutation<void, Error, { messageId: string; userId: string }>({
    mutationFn: ({ messageId, userId }) => {
      return updateDocumentInCollection(COLLECTION_NAME, messageId, {
        readByUserIds: arrayUnion(userId)
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData([COLLECTION_NAME], (oldData: FabMessageType[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(msg => {
              if (msg.id === variables.messageId && !msg.readByUserIds.includes(variables.userId)) {
                  return { ...msg, readByUserIds: [...msg.readByUserIds, variables.userId] };
              }
              return msg;
          });
      });
    },
  });

  const markAsClickedMutation = useMutation<void, Error, { messageId: string; userId: string }>({
    mutationFn: ({ messageId, userId }) => {
      return updateDocumentInCollection(COLLECTION_NAME, messageId, {
        clickedByUserIds: arrayUnion(userId)
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData([COLLECTION_NAME], (oldData: FabMessageType[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(msg => {
              if (msg.id === variables.messageId && !msg.clickedByUserIds.includes(variables.userId)) {
                  return { ...msg, clickedByUserIds: [...msg.clickedByUserIds, variables.userId] };
              }
              return msg;
          });
      });
    },
  });

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    addFabMessage: (message) => addFabMessageMutation.mutateAsync(message) as Promise<FabMessageType>,
    updateFabMessage: (message) => updateFabMessageMutation.mutateAsync(message),
    deleteFabMessageMutation,
    markAsRead: (messageId, userId) => markAsReadMutation.mutateAsync({ messageId, userId }),
    markAsClicked: (messageId, userId) => markAsClickedMutation.mutateAsync({ messageId, userId }),
  }), [fabMessages, isFetching, addFabMessageMutation, updateFabMessageMutation, deleteFabMessageMutation, markAsReadMutation, markAsClickedMutation]);

  return (
    <FabMessagesContext.Provider value={value}>
      {children}
    </FabMessagesContext.Provider>
  );
};

export const useFabMessages = (): FabMessagesContextType => {
  const context = useContext(FabMessagesContext);
  if (context === undefined) {
    throw new Error('useFabMessages must be used within a FabMessagesProvider');
  }
  return context;
};
