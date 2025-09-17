
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { setDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, updateDocumentInCollection, getDocument } from '@/lib/firestore-service';
import * as z from 'zod';
import { formatISO, subDays } from 'date-fns';
import { useCollaborators, type Collaborator } from './CollaboratorsContext';

// Define a lista de tags permitidas
export const campaignTags = ['Captação', 'ROA', 'Relacionamento', 'Campanhas e Missões', 'Engajamento'] as const;

// Schema for a single Campaign (CTA + Follow-up)
export const campaignSchema = z.object({
  id: z.string().default(() => `campaign_${Date.now()}_${Math.random()}`), // Unique ID for dnd-kit
  ctaMessage: z.string().min(1, "A mensagem de CTA é obrigatória."),
  followUpMessage: z.string().min(1, "A mensagem de acompanhamento é obrigatória."),
  tag: z.enum(campaignTags).default('Relacionamento'),
  status: z.enum(['loaded', 'active', 'completed', 'interrupted']).default('loaded'),
  sentAt: z.string().optional(),
  clickedAt: z.string().optional(),
  followUpClosedAt: z.string().optional(), // Data de fechamento do follow-up
  effectiveAt: z.string().optional(), // Data de quando foi marcada como efetiva
});
export type CampaignType = z.infer<typeof campaignSchema>;

// Main schema for a user's FAB message pipeline.
export const fabMessageSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  pipeline: z.array(campaignSchema).default([]),
  archivedCampaigns: z.array(campaignSchema).default([]),
  activeCampaignIndex: z.number().int().default(0),
  status: z.enum(['ready', 'pending_cta', 'completed', 'not_created']).default('ready'),
  isActive: z.boolean().default(true), // New field to control visibility/activity
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
  interruptCampaign: (userId: string) => Promise<void>;
  archiveIndividualCampaign: (userId: string, campaignId: string) => Promise<void>;
  archiveMultipleCampaigns: (userId: string, campaignIds: string[]) => Promise<void>;
}

const FabMessagesContext = createContext<FabMessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'fabMessages';

// --- Início: Lógica de Mock Data ---
const createMockData = async (
  user: Collaborator,
  upsertFn: (userId: string, data: FabMessagePayload) => Promise<void>
) => {
  const mockCampaigns: CampaignType[] = [];
  const baseDate = new Date('2025-09-09T12:00:00Z');

  // Gerar 20 campanhas concluídas em dias diferentes
  for (let i = 0; i < 20; i++) {
      const sentDate = subDays(baseDate, Math.floor(i / 2)); // 2 campanhas por dia
      const clickDate = new Date(sentDate.getTime() + Math.random() * 2 * 60 * 60 * 1000); // Click até 2h depois
      const closeDate = new Date(clickDate.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Close até 24h depois
      const isEffective = Math.random() > 0.5;
      const effectiveDate = isEffective ? new Date(closeDate.getTime() - Math.random() * 12 * 60 * 60 * 1000) : undefined;
      const tagIndex = i % campaignTags.length;

      mockCampaigns.push({
          id: `mock_campaign_${i}`,
          ctaMessage: `Campanha de teste #${i + 1} sobre ${campaignTags[tagIndex]}.`,
          followUpMessage: `Acompanhamento da campanha de teste #${i + 1}.`,
          tag: campaignTags[tagIndex],
          status: 'completed',
          sentAt: formatISO(sentDate),
          clickedAt: formatISO(clickDate),
          followUpClosedAt: formatISO(closeDate),
          effectiveAt: effectiveDate ? formatISO(effectiveDate) : undefined,
      });
  }

  // Adicionar algumas campanhas em estágios diferentes
  mockCampaigns.push({
    id: `mock_campaign_21`,
    ctaMessage: 'Esta campanha está pronta para envio.',
    followUpMessage: 'Follow-up da campanha pronta.',
    tag: 'Engajamento',
    status: 'loaded',
  });
   mockCampaigns.push({
    id: `mock_campaign_22`,
    ctaMessage: 'Esta campanha também está pronta.',
    followUpMessage: 'Follow-up da segunda campanha pronta.',
    tag: 'Captação',
    status: 'loaded',
  });


  const payload: FabMessagePayload = {
      userId: user.id3a,
      userName: user.name,
      pipeline: mockCampaigns,
      status: 'ready',
      activeCampaignIndex: 0,
      archivedCampaigns: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  };

  try {
      await upsertFn(user.id3a, payload);
      console.log(`Dados de teste para ${user.name} foram criados com sucesso.`);
  } catch (error) {
      console.error("Falha ao criar dados de teste:", error);
  }
};
// --- Fim: Lógica de Mock Data ---

export const FabMessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { collaborators, loading: loadingCollaborators } = useCollaborators();

  const { data: fabMessages = [], isFetching } = useQuery<FabMessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => [],
    staleTime: Infinity,
  });

  const upsertMutation = useMutation<void, Error, { userId: string; data: FabMessagePayload }>({
    mutationFn: async ({ userId, data }) => {
        const existingMessage = fabMessages.find(m => m.userId === userId) || await getDocument<FabMessageType>(COLLECTION_NAME, userId);
        const payload: FabMessagePayload = {
            ...data,
            updatedAt: new Date().toISOString(),
        };
        if (existingMessage && payload.pipeline) {
             payload.pipeline = payload.pipeline.map(newCampaign => {
                const oldCampaign = existingMessage.pipeline.find(c => c.id === newCampaign.id);
                if (oldCampaign && oldCampaign.status === 'completed') {
                    const hasChanged = oldCampaign.ctaMessage !== newCampaign.ctaMessage || oldCampaign.followUpMessage !== newCampaign.followUpMessage;
                    if (hasChanged) {
                        return { ...newCampaign, status: 'loaded' as const, sentAt: undefined, clickedAt: undefined, followUpClosedAt: undefined, effectiveAt: undefined };
                    }
                }
                return newCampaign;
            });
        }
        if (payload.pipeline && payload.pipeline.length > 0) {
            const hasLoadedCampaigns = payload.pipeline.some(c => c.status === 'loaded');
            payload.status = hasLoadedCampaigns ? 'ready' : 'completed';
        } else {
            payload.status = 'not_created';
        }
        return setDocumentInCollection(COLLECTION_NAME, userId, payload);
    },
     onSuccess: () => {},
  });
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !loadingCollaborators && collaborators.length > 0) {
        const devUser = collaborators.find(c => c.email === 'desenvolvedor@3ariva.com.br');
        if (devUser) {
            const devMessage = fabMessages.find(m => m.userId === devUser.id3a);
            const hasMockData = devMessage?.pipeline.some(c => c.id.startsWith('mock_campaign'));

            if (!isFetching && !devMessage || (devMessage && !hasMockData)) {
                console.log("Iniciando criação de dados de teste para FAB Messages...");
                createMockData(devUser, (userId, data) => upsertMutation.mutateAsync({ userId, data }));
            }
        }
    }
}, [isFetching, fabMessages, collaborators, loadingCollaborators, upsertMutation]);


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



  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => deleteDocumentFromCollection(COLLECTION_NAME, userId),
    onSuccess: () => {
      // Listener will update the cache
    },
  });

  const markCampaignAsClickedMutation = useMutation<void, Error, string>({
    mutationFn: async (userId: string) => {
      const message = fabMessages.find(m => m.userId === userId);
      if (!message || message.status !== 'pending_cta') {
        throw new Error("A campanha não está aguardando um clique.");
      }
      
      const newPipeline = [...message.pipeline];
      const activeCampaign = newPipeline[message.activeCampaignIndex];
      if (activeCampaign) {
          activeCampaign.clickedAt = formatISO(new Date());
          activeCampaign.status = 'completed'; // Mark as completed on click
      }
      
      const hasMoreCampaigns = newPipeline.some(c => c.status === 'loaded');

      return updateDocumentInCollection(COLLECTION_NAME, userId, {
        status: hasMoreCampaigns ? 'ready' : 'completed',
        pipeline: newPipeline,
        updatedAt: formatISO(new Date()),
      });
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

  const interruptCampaignMutation = useMutation<void, Error, string>({
    mutationFn: async (userId: string) => {
        const message = fabMessages.find(m => m.userId === userId);
        if (!message || message.status !== 'pending_cta') {
          console.warn("Attempted to interrupt a campaign that was not in 'pending_cta' state.");
          return;
        }

        const newPipeline = [...message.pipeline];
        const interruptedCampaignIndex = message.activeCampaignIndex;
        
        if (newPipeline[interruptedCampaignIndex]) {
            newPipeline[interruptedCampaignIndex].status = 'interrupted';
        }

        const hasMoreCampaigns = newPipeline.some(c => c.status === 'loaded');
        
        await updateDocumentInCollection(COLLECTION_NAME, userId, {
            pipeline: newPipeline,
            status: hasMoreCampaigns ? 'ready' : 'completed',
            updatedAt: formatISO(new Date()),
        });
    },
  });
  

  const value = useMemo(() => ({
    fabMessages,
    loading: isFetching,
    upsertMessageForUser: (userId, data) => upsertMutation.mutateAsync({ userId, data }),
    deleteMessageForUser: (userId) => deleteMutation.mutateAsync(userId),
    markCampaignAsClicked: (userId) => markCampaignAsClickedMutation.mutateAsync(userId),
    startCampaign: (userId) => startCampaignMutation.mutateAsync(userId),
    interruptCampaign: (userId) => interruptCampaignMutation.mutateAsync(userId),
    archiveIndividualCampaign: (userId, campaignId) => archiveIndividualCampaignMutation.mutateAsync({ userId, campaignId }),
    archiveMultipleCampaigns: (userId, campaignIds) => archiveMultipleCampaignsMutation.mutateAsync({userId, campaignIds}),
  }), [fabMessages, isFetching, upsertMutation, deleteMutation, markCampaignAsClickedMutation, startCampaignMutation, interruptCampaignMutation, archiveIndividualCampaignMutation, archiveMultipleCampaignsMutation]);

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
  // This hook is missing the 'completeFollowUp' function, so we add a dummy one to avoid breaking changes.
  return { ...context, completeFollowUp: async () => {} };
};
