
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import * as z from 'zod';
import type { Collaborator } from './CollaboratorsContext';

export const quickLinkSchema = z.object({
  name: z.string().optional(),
  imageUrl: z.string().url("Por favor, insira uma URL de imagem válida."),
  link: z.string().min(1, "URL do Link é obrigatória.").refine(value => {
    try {
      new URL(value.includes('{') ? value.replace(/\{.*\}/, 'placeholder') : value);
      return true;
    } catch {
      return value.startsWith('/');
    }
  }, { message: "URL inválida." }),
  isUserSpecific: z.boolean().default(false),
  recipientIds: z.array(z.string()).min(1, "Selecione ao menos um destinatário.").default(['all']),
  order: z.number().default(0),
});


export type QuickLinkType = WithId<z.infer<typeof quickLinkSchema>>;

interface QuickLinksContextType {
  quickLinks: QuickLinkType[];
  loading: boolean;
  addQuickLink: (link: Omit<QuickLinkType, 'id'>) => Promise<QuickLinkType>;
  updateQuickLink: (link: QuickLinkType) => Promise<void>;
  deleteQuickLinkMutation: UseMutationResult<void, Error, string, unknown>;
  getVisibleLinksForUser: (user: Collaborator | null, allCollaborators: Collaborator[]) => QuickLinkType[];
}

const QuickLinksContext = createContext<QuickLinksContextType | undefined>(undefined);
const COLLECTION_NAME = 'quickLinks';

export const QuickLinksProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: quickLinks = [], isFetching } = useQuery<QuickLinkType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<QuickLinkType>(COLLECTION_NAME),
    select: (data) => data
      .map(link => ({ ...link, recipientIds: link.recipientIds || ['all'], order: link.order ?? 0 }))
      .sort((a, b) => a.order - b.order),
  });

  const getVisibleLinksForUser = useCallback((user: Collaborator | null, allCollaborators: Collaborator[]): QuickLinkType[] => {
    if (!user) return [];

    return quickLinks
      .filter(link => {
        if (link.recipientIds.includes('all')) return true;
        return link.recipientIds.includes(user.id3a);
      })
      .map(link => {
        if (link.isUserSpecific && link.link.includes('{userEmail}')) {
          return {
            ...link,
            link: link.link.replace('{userEmail}', user.email),
          };
        }
        return link;
      });
  }, [quickLinks]);


  const addQuickLinkMutation = useMutation<WithId<Omit<QuickLinkType, 'id'>>, Error, Omit<QuickLinkType, 'id'>>({
    mutationFn: async (linkData) => {
      const currentLinks = await queryClient.getQueryData<QuickLinkType[]>([COLLECTION_NAME]) || [];
      const maxOrder = currentLinks.reduce((max, link) => Math.max(max, link.order || 0), 0);
      const dataWithOrder = { ...linkData, order: maxOrder + 1 };
      return addDocumentToCollection(COLLECTION_NAME, dataWithOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateQuickLinkMutation = useMutation<void, Error, QuickLinkType>({
    mutationFn: (updatedLink) => {
      const { id, ...data } = updatedLink;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteQuickLinkMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    quickLinks,
    loading: isFetching,
    addQuickLink: (link) => addQuickLinkMutation.mutateAsync(link) as Promise<QuickLinkType>,
    updateQuickLink: (link) => updateQuickLinkMutation.mutateAsync(link),
    deleteQuickLinkMutation,
    getVisibleLinksForUser
  }), [quickLinks, isFetching, addQuickLinkMutation, updateQuickLinkMutation, deleteQuickLinkMutation, getVisibleLinksForUser]);

  return (
    <QuickLinksContext.Provider value={value}>
      {children}
    </QuickLinksContext.Provider>
  );
};

export const useQuickLinks = (): QuickLinksContextType => {
  const context = useContext(QuickLinksContext);
  if (context === undefined) {
    throw new Error('useQuickLinks must be used within a QuickLinksProvider');
  }
  return context;
};
