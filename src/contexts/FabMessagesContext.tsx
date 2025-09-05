
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, updateDocumentInCollection } from '@/lib/firestore-service';
import * as z from 'zod';

// Schemas for the individual messages within a pipeline step
const ctaMessageSchema = z.object({
  title: z.string().min(1, "Título do CTA é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
});

const followUpMessageSchema = z.object({
  title: z.string().min(1, "Título do acompanhamento é obrigatório."),
  content: z.string().min(1, "Conteúdo do acompanhamento é obrigatório."),
  icon: z.string().min(1, "Ícone é obrigatório."),
  ctaText: z.string().min(1, "Texto do botão é obrigatório."),
  ctaLink: z.string().url("Link do botão deve ser uma URL válida."),
});

// Schema for a single step in the message pipeline
const pipelineStepSchema = z.object({
  day: z.number().int().positive("O dia deve ser um número positivo."),
  ctaMessage: ctaMessageSchema,
  followUpMessage: followUpMessageSchema,
});
export type PipelineStep = z.infer<typeof pipelineStepSchema>;

// Main schema for a user's FAB message campaign.
export const fabMessageSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  pipeline: z.array(pipelineStepSchema).min(1, "O pipeline deve ter pelo menos uma mensagem."),
  isActive: z.boolean().default(true),
  // Tracking fields
  currentDay: z.number().int().default(1),
  status: z.enum(['pending_cta', 'pending_follow_up', 'completed']).default('pending_cta'),
  sequenceStartDate: z.string().optional(), // ISO Date string, set on first click.
  lastInteractionDate: z.string().optional(), // ISO Date string of the last click
  // Timestamps
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
  advanceUserSequence: (userId: string) => Promise<void>;
  startUserSequence: (userId: string) => Promise<void>;
  resetUserSequence: (userId: string) => Promise<void>;
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

  const startSequenceMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => updateDocumentInCollection(COLLECTION_NAME, userId, { 
      status: 'pending_follow_up',
      sequenceStartDate: new Date().toISOString(),
      lastInteractionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
        // Listener will handle update
    }
  });

  const advanceSequenceMutation = useMutation<void, Error, string>({
     mutationFn: (userId: string) => {
        const message = fabMessages.find(m => m.userId === userId);
        if (!message) throw new Error("Mensagem não encontrada para o usuário");
        
        const nextDay = message.currentDay + 1;
        
        const updatePayload: Partial<FabMessageType> = {
            status: 'pending_cta',
            currentDay: nextDay,
            lastInteractionDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return updateDocumentInCollection(COLLECTION_NAME, userId, updatePayload);
     },
     onSuccess: () => {
        // Listener will handle update
     }
  });
  
  const resetSequenceMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => updateDocumentInCollection(COLLECTION_NAME, userId, { 
      status: 'pending_cta',
      currentDay: 1,
      sequenceStartDate: undefined, // remove field
      lastInteractionDate: undefined, // remove field
      updatedAt: new Date().toISOString(),
    }),
     onSuccess: () => {
      // Listener will handle update
    }
  });

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    advanceUserSequence: (userId) => advanceSequenceMutation.mutateAsync(userId),
    startUserSequence: (userId) => startSequenceMutation.mutateAsync(userId),
    resetUserSequence: (userId) => resetSequenceMutation.mutateAsync(userId),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, advanceSequenceMutation, startSequenceMutation, resetSequenceMutation]);

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
