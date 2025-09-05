
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, setDocumentInCollection } from '@/lib/firestore-service';
import * as z from 'zod';
import { arrayUnion } from 'firebase/firestore';

// Nested schemas for the two types of messages
const ctaMessageSchema = z.object({
  title: z.string().min(1, "Título do CTA é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
  ctaText: z.string().min(1, "Texto do botão é obrigatório."),
  ctaLink: z.string().url("Link do CTA deve ser uma URL válida."),
});

const followUpMessageSchema = z.object({
  title: z.string().min(1, "Título do acompanhamento é obrigatório."),
  content: z.string().min(1, "Conteúdo do acompanhamento é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
});


// Main schema for a user's FAB message campaign. The document ID will be the user's ID.
export const fabMessageSchema = z.object({
  userId: z.string(), // This will be the document ID
  userName: z.string(),
  ctaMessage: ctaMessageSchema,
  followUpMessage: followUpMessageSchema,
  status: z.enum(['draft', 'sent', 'clicked']).default('draft'),
  isActive: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export type FabMessageType = WithId<z.infer<typeof fabMessageSchema>>;
export type FabMessagePayload = z.infer<typeof fabMessageSchema>;

interface FabMessagesContextType {
  fabMessages: FabMessageType[];
  loading: boolean;
  upsertMessageForUser: (userId: string, data: Partial<FabMessagePayload>) => Promise<void>;
  deleteMessageForUser: (userId: string) => Promise<void>;
  markAsClicked: (userId: string) => Promise<void>;
  updateMessageStatus: (userId: string, status: 'draft' | 'sent' | 'clicked', isActive: boolean) => Promise<void>;
}

const FabMessagesContext = createContext<FabMessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'fabMessages';

export const FabMessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: fabMessages = [], isFetching } = useQuery<FabMessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => [],
    staleTime: Infinity,
  });

  React.useEffect(() => {
    const unsubscribe = listenToCollection<FabMessageType>(
      COLLECTION_NAME,
      (newData) => {
        queryClient.setQueryData([COLLECTION_NAME], newData);
      },
      (error) => {
        console.error(`Failed to listen to ${COLLECTION_NAME} collection:`, error);
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  const upsertMutation = useMutation<void, Error, { userId: string; data: Partial<FabMessagePayload> }>({
    mutationFn: ({ userId, data }) => {
        const payload = { ...data, updatedAt: new Date().toISOString() };
        return setDocumentInCollection(COLLECTION_NAME, userId, payload);
    },
     onSuccess: () => {
      // Listener will update the cache
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => deleteDocumentFromCollection(COLLECTION_NAME, userId),
    onSuccess: () => {
      // Listener will update the cache
    },
  });

  const markAsClickedMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => updateDocumentInCollection(COLLECTION_NAME, userId, { 
        status: 'clicked',
        updatedAt: new Date().toISOString(),
    }),
     onSuccess: () => {
      // Listener will update the cache
    },
  });

  const updateStatusMutation = useMutation<void, Error, { userId: string, status: 'draft' | 'sent' | 'clicked', isActive: boolean }>({
    mutationFn: ({ userId, status, isActive }) => updateDocumentInCollection(COLLECTION_NAME, userId, { 
        status, 
        isActive,
        updatedAt: new Date().toISOString(),
    }),
     onSuccess: () => {
      // Listener will update the cache
    },
  });


  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    markAsClicked: (userId) => markAsClickedMutation.mutateAsync(userId),
    updateMessageStatus: (userId, status, isActive) => updateStatusMutation.mutateAsync({ userId, status, isActive }),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, markAsClickedMutation, updateStatusMutation]);

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
