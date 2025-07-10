
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  content: string; // Full content for modal view
  category: string;
  date: string;
  imageUrl: string;
  dataAiHint?: string;
  isHighlight: boolean;
  link?: string;
}

interface NewsContextType {
  newsItems: NewsItemType[];
  loading: boolean;
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => Promise<WithId<Omit<NewsItemType, 'id'>>>;
  updateNewsItem: (item: NewsItemType) => Promise<void>;
  deleteNewsItemMutation: UseMutationResult<void, Error, string, unknown>;
  toggleNewsHighlight: (id: string) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);
const COLLECTION_NAME = 'newsItems';

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: newsItems = [], isFetching } = useQuery<NewsItemType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<NewsItemType>(COLLECTION_NAME),
  });

  const addNewsItemMutation = useMutation<WithId<Omit<NewsItemType, 'id'>>, Error, Omit<NewsItemType, 'id'>>({
    mutationFn: (itemData) => addDocumentToCollection(COLLECTION_NAME, itemData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateNewsItemMutation = useMutation<void, Error, NewsItemType>({
    mutationFn: (updatedItem) => {
        const { id, ...data } = updatedItem;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    }
  });

  const deleteNewsItemMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      toast({ title: "Notícia excluída com sucesso." });
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleNewsHighlight = useCallback((id: string) => {
    const targetNews = newsItems.find(n => n.id === id);
    if (!targetNews) return;

    const currentlyActive = newsItems.filter(n => n.isHighlight).length;
    if (!targetNews.isHighlight && currentlyActive >= 3) {
        toast({
            title: "Limite Atingido",
            description: "Você pode ter no máximo 3 destaques ativos.",
            variant: "destructive",
        });
        return;
    }
    updateNewsItemMutation.mutate({ ...targetNews, isHighlight: !targetNews.isHighlight });
  }, [newsItems, updateNewsItemMutation]);

  const value = useMemo(() => ({
    newsItems,
    loading: isFetching,
    addNewsItem: (item) => addNewsItemMutation.mutateAsync(item),
    updateNewsItem: (item) => updateNewsItemMutation.mutateAsync(item),
    deleteNewsItemMutation,
    toggleNewsHighlight,
  }), [newsItems, isFetching, addNewsItemMutation, updateNewsItemMutation, deleteNewsItemMutation, toggleNewsHighlight]);

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = (): NewsContextType => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};
