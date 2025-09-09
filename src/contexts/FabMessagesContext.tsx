
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, updateDocumentInCollection } from '@/lib/firestore-service';
import * as z from 'zod';
import { formatISO } from 'date-fns';

// Define a lista de tags permitidas
export const campaignTags = ['Captação', 'ROA', 'Relacionamento', 'Campanhas e Missões', 'Engajamento'] as const;

// Schema for a single Campaign (CTA + Follow-up)
export const campaignSchema = z.object({
  id: z.string().default(() => `campaign_${Date.now()}_${Math.random()}`), // Unique ID for dnd-kit
  ctaMessage: z.string().min(1, "A mensagem de CTA é obrigatória."),
  followUpMessage: z.string().min(1, "A mensagem de acompanhamento é obrigatória."),
  tag: z.enum(campaignTags).default('Relacionamento'),
  status: z.enum(['loaded', 'active', 'completed']).default('loaded'),
  sentAt: z.string().optional(),
  clickedAt: z.string().optional(),
  isEffective: z.boolean().optional().default(false),
});
export type CampaignType = z.infer<typeof campaignSchema>;

// Main schema for a user's FAB message pipeline.
export const fabMessageSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  pipeline: z.array(campaignSchema).default([]),
  archivedCampaigns: z.array(campaignSchema).default([]),
  activeCampaignIndex: z.number().int().default(0),
  status: z.enum(['ready', 'pending_cta', 'completed']).default('ready'),
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
  startCampaign: (userId: string) => Promise<void>;
  archiveIndividualCampaign: (userId: string, campaignId: string) => Promise<void>;
  archiveMultipleCampaigns: (userId: string, campaignIds: string[]) => Promise<void>;
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
    mutationFn: async (userId: string) => {
      const message = fabMessages.find(m => m.userId === userId);
      if (!message || message.status !== 'pending_cta') {
        throw new Error("A campanha não está aguardando um clique.");
      }

      const newPipeline = [...message.pipeline];
      const activeCampaign = newPipeline[message.activeCampaignIndex];

      if (activeCampaign) {
          activeCampaign.status = 'completed';
          activeCampaign.clickedAt = formatISO(new Date());
      }

      const hasMoreCampaigns = newPipeline.some(c => c.status === 'loaded');

      const updatePayload: FabMessagePayload = {
        pipeline: newPipeline,
        status: hasMoreCampaigns ? 'ready' : 'completed',
        updatedAt: formatISO(new Date()),
      };

      await updateDocumentInCollection(COLLECTION_NAME, userId, updatePayload);
    },
  });


  const archiveIndividualCampaignMutation = useMutation<void, Error, { userId: string; campaignId: string }>({
    mutationFn: ({ userId, campaignId }) => {
      const message = fabMessages.find(m => m.userId === userId);
      if (!message) throw new Error("Mensagem não encontrada para o usuário");
      
      const campaignToArchive = message.pipeline.find(c => c.id === campaignId);
      if (!campaignToArchive) {
        throw new Error("Campanha não encontrada no pipeline para arquivar.");
      }

      const newPipeline = message.pipeline.filter(c => c.id !== campaignId);
      const newArchived = [...(message.archivedCampaigns || []), campaignToArchive];
      
      const hasMoreCampaigns = newPipeline.some(c => c.status === 'loaded');

      return updateDocumentInCollection(COLLECTION_NAME, userId, {
        pipeline: newPipeline,
        archivedCampaigns: newArchived,
        status: hasMoreCampaigns ? 'ready' : 'completed',
        updatedAt: formatISO(new Date()),
      });
    },
  });
  
  const archiveMultipleCampaignsMutation = useMutation<void, Error, { userId: string; campaignIds: string[] }>({
    mutationFn: ({ userId, campaignIds }) => {
        const message = fabMessages.find(m => m.userId === userId);
        if (!message) throw new Error("Mensagem não encontrada para o usuário");

        const campaignsToArchive = message.pipeline.filter(c => campaignIds.includes(c.id));
        if (campaignsToArchive.length === 0) {
            throw new Error("Nenhuma campanha selecionada foi encontrada no pipeline.");
        }

        const newPipeline = message.pipeline.filter(c => !campaignIds.includes(c.id));
        const newArchived = [...(message.archivedCampaigns || []), ...campaignsToArchive];
        const hasMoreCampaigns = newPipeline.some(c => c.status === 'loaded');

        return updateDocumentInCollection(COLLECTION_NAME, userId, {
            pipeline: newPipeline,
            archivedCampaigns: newArchived,
            status: hasMoreCampaigns ? 'ready' : 'completed',
            updatedAt: formatISO(new Date()),
        });
    },
});


  const startCampaignMutation = useMutation<void, Error, string>({
      mutationFn: (userId: string) => {
          const message = fabMessages.find(m => m.userId === userId);
          if (!message) throw new Error("Campanha não encontrada para este usuário.");
          if (message.status !== 'ready') throw new Error("A campanha não está pronta para ser enviada.");
          
          const campaignToStart = message.pipeline.find(c => c.status === 'loaded');
          if (!campaignToStart) {
            throw new Error("Nenhuma campanha carregada para iniciar.");
          }

          const newPipeline = message.pipeline.map(p => 
            p.id === campaignToStart.id ? { ...p, status: 'active' as const, sentAt: formatISO(new Date()) } : p
          );
          
          const activeIndex = newPipeline.findIndex(p => p.id === campaignToStart.id);

          return updateDocumentInCollection(COLLECTION_NAME, userId, {
              pipeline: newPipeline,
              activeCampaignIndex: activeIndex,
              status: 'pending_cta',
              updatedAt: formatISO(new Date()),
          });
      },
  });
  

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    markCampaignAsClicked: (userId) => markAsClickedMutation.mutateAsync(userId),
    startCampaign: (userId) => startCampaignMutation.mutateAsync(userId),
    archiveIndividualCampaign: (userId, campaignId) => archiveIndividualCampaignMutation.mutateAsync({ userId, campaignId }),
    archiveMultipleCampaigns: (userId, campaignIds) => archiveMultipleCampaignsMutation.mutateAsync({userId, campaignIds}),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, markAsClickedMutation, startCampaignMutation, archiveIndividualCampaignMutation, archiveMultipleCampaignsMutation]);

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
