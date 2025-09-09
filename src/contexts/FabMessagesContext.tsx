
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, updateDocumentInCollection } from '@/lib/firestore-service';
import * as z from 'zod';

// Define a lista de tags permitidas
export const campaignTags = ['Captação', 'ROA', 'Relacionamento', 'Campanhas e Missões', 'Engajamento'] as const;

// Schema for a single Campaign (CTA + Follow-up)
export const campaignSchema = z.object({
  id: z.string().default(() => `campaign_${Date.now()}_${Math.random()}`), // Unique ID for dnd-kit
  ctaMessage: z.string().min(1, "A mensagem de CTA é obrigatória."),
  followUpMessage: z.string().min(1, "A mensagem de acompanhamento é obrigatória."),
  tag: z.enum(campaignTags).default('Relacionamento'), // Adiciona o campo de tag
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
  status: z.enum(['ready', 'pending_cta', 'pending_follow_up', 'completed']).default('ready'),
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
  startCampaign: (userId: string) => Promise<void>;
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
        if (!completedCampaign) throw new Error("Campanha ativa inválida.");

        const newArchived = [...(message.archivedCampaigns || []), completedCampaign];
        
        // Correctly remove the completed campaign from the pipeline
        const newPipeline = message.pipeline.slice(); // Create a shallow copy
        newPipeline.splice(message.activeCampaignIndex, 1);

        const hasNextCampaign = newPipeline.length > 0;

        const updatePayload: FabMessagePayload = {
            pipeline: newPipeline,
            archivedCampaigns: newArchived,
            activeCampaignIndex: 0, // Always reset to 0 for the new (shorter) pipeline
            status: hasNextCampaign ? 'ready' : 'completed',
            isActive: hasNextCampaign,
            updatedAt: new Date().toISOString(),
        };

        return updateDocumentInCollection(COLLECTION_NAME, userId, updatePayload);
     },
  });

  const startCampaignMutation = useMutation<void, Error, string>({
      mutationFn: (userId: string) => {
          const message = fabMessages.find(m => m.userId === userId);
          if (!message) throw new Error("Campanha não encontrada para este usuário.");
          if (message.status !== 'ready') throw new Error("A campanha não está pronta para ser enviada.");
          
          return updateDocumentInCollection(COLLECTION_NAME, userId, {
              status: 'pending_cta',
              isActive: true,
              updatedAt: new Date().toISOString(),
          });
      },
  });
  

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    markCampaignAsClicked: (userId) => markAsClickedMutation.mutateAsync(userId),
    advanceToNextCampaign: (userId) => advanceCampaignMutation.mutateAsync(userId),
    startCampaign: (userId) => startCampaignMutation.mutateAsync(userId),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, markAsClickedMutation, advanceCampaignMutation, startCampaignMutation]);

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
