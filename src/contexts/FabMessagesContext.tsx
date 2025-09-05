
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, updateDocumentInCollection } from '@/lib/firestore-service';
import * as z from 'zod';

// Schemas for the individual messages within a Campaign
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

// Schema for a single Campaign (CTA + Follow-up)
export const campaignSchema = z.object({
  id: z.string().default(() => `campaign_${Date.now()}_${Math.random()}`), // Unique ID for dnd-kit
  ctaMessage: ctaMessageSchema,
  followUpMessage: followUpMessageSchema,
});
export type CampaignType = z.infer<typeof campaignSchema>;

// Main schema for a user's FAB message pipeline.
export const fabMessageSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  pipeline: z.array(campaignSchema).default([]),
  archivedCampaigns: z.array(campaignSchema).default([]),
  isActive: z.boolean().default(true),
  activeCampaignIndex: z.number().int().default(0),
  status: z.enum(['pending_cta', 'pending_follow_up', 'completed']).default('pending_cta'),
  // Timestamps
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export type FabMessageType = WithId<z.infer<typeof fabMessageSchema>>;
export type FabMessagePayload = Partial<Omit<FabMessageType, 'id'>>;

interface FabMessagesContextType {
  fabMessages: FabMessageType[];
  loading: boolean;
  upsertMessageForUser: (userId: string, data: FabMessagePayload) => Promise<void>;
  deleteMessageForUser: (userId: string) => Promise<void>;
  markCampaignAsClicked: (userId: string) => Promise<void>;
  advanceToNextCampaign: (userId: string) => Promise<void>;
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

  const upsertMutation = useMutation<void, Error, { userId: string; data: FabMessagePayload }>({
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
    mutationFn: (userId: string) => {
      return updateDocumentInCollection(COLLECTION_NAME, userId, {
        status: 'pending_follow_up',
        updatedAt: new Date().toISOString(),
      });
    },
  });

  const advanceCampaignMutation = useMutation<void, Error, string>({
     mutationFn: (userId: string) => {
        const message = fabMessages.find(m => m.userId === userId);
        if (!message) throw new Error("Mensagem não encontrada para o usuário");
        
        const completedCampaign = message.pipeline[message.activeCampaignIndex];
        const newArchived = [...(message.archivedCampaigns || []), completedCampaign];
        
        const nextIndex = message.activeCampaignIndex + 1;
        const hasNextCampaign = nextIndex < message.pipeline.length;

        const updatePayload: FabMessagePayload = {
            status: hasNextCampaign ? 'pending_cta' : 'completed',
            activeCampaignIndex: nextIndex,
            archivedCampaigns: newArchived,
            updatedAt: new Date().toISOString(),
        };

        return updateDocumentInCollection(COLLECTION_NAME, userId, updatePayload);
     },
  });
  

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    markCampaignAsClicked: (userId) => markAsClickedMutation.mutateAsync(userId),
    advanceToNextCampaign: (userId) => advanceCampaignMutation.mutateAsync(userId),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, markAsClickedMutation, advanceCampaignMutation]);

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
