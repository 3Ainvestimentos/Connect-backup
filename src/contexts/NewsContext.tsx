
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection } from '@/lib/firestore-service';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  content: string;
  category: string;
  date: string; // ISO string
  imageUrl: string;
  videoUrl?: string;
  isHighlight: boolean;
  highlightType?: 'large' | 'small';
  link?: string;
  order: number;
}

interface NewsContextType {
  newsItems: NewsItemType[];
  loading: boolean;
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => Promise<WithId<Omit<NewsItemType, 'id'>>>;
  updateNewsItem: (item: Partial<NewsItemType> & { id: string }) => Promise<void>;
  deleteNewsItemMutation: UseMutationResult<void, Error, string, unknown>;
  toggleNewsHighlight: (id: string) => void;
  updateHighlightType: (id: string, type: 'large' | 'small') => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);
const COLLECTION_NAME = 'newsItems';

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: newsItems = [], isFetching } = useQuery<NewsItemType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: async () => [], // The listener will populate the data
    staleTime: Infinity,
    select: (data) => data.sort((a, b) => (a.order || 0) - (b.order || 0)),
  });

  React.useEffect(() => {
    const unsubscribe = listenToCollection<NewsItemType>(
      COLLECTION_NAME,
      (newData) => {
        const processedData = newData.map(item => ({
          ...item,
          order: item.order ?? 0, // Ensure order exists
        })).sort((a, b) => a.order - b.order);
        queryClient.setQueryData([COLLECTION_NAME], processedData);
      },
      (error) => {
        console.error("Failed to listen to news collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  const addNewsItemMutation = useMutation<WithId<Omit<NewsItemType, 'id'>>, Error, Omit<NewsItemType, 'id'>>({
    mutationFn: (itemData) => {
        const currentMaxOrder = newsItems.reduce((max, item) => Math.max(max, item.order || 0), 0);
        const dataWithOrder = { ...itemData, order: currentMaxOrder + 1 };
        return addDocumentToCollection(COLLECTION_NAME, dataWithOrder);
    },
    onSuccess: () => {},
  });

  const updateNewsItemMutation = useMutation<void, Error, Partial<NewsItemType> & { id: string }>({
    mutationFn: (updatedItem) => {
        const { id, ...data } = updatedItem;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {}
  });

  const deleteNewsItemMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {},
  });

  const toggleNewsHighlight = useCallback((id: string) => {
    const targetNews = newsItems.find(n => n.id === id);
    if (!targetNews) return;

    const currentlyActiveCount = newsItems.filter(n => n.isHighlight && n.id !== id).length;
    if (!targetNews.isHighlight && currentlyActiveCount >= 3) {
      toast({
        title: "Limite de destaques atingido",
        description: "Você pode ter no máximo 3 notícias em destaque.",
        variant: "destructive"
      });
      return;
    }
    
    updateNewsItemMutation.mutate({ id, isHighlight: !targetNews.isHighlight });
  }, [newsItems, updateNewsItemMutation]);

  const updateHighlightType = useCallback((id: string, type: 'large' | 'small') => {
    const targetNews = newsItems.find(n => n.id === id);
    if (!targetNews) return;

    if(type === 'large') {
      const hasAnotherLarge = newsItems.some(n => n.id !== id && n.isHighlight && n.highlightType === 'large');
      if (hasAnotherLarge) {
        toast({
          title: "Atenção",
          description: "Já existe um destaque grande ativo. Altere o outro para 'pequeno' primeiro.",
          variant: "destructive"
        });
        return;
      }
    }
    
    updateNewsItemMutation.mutate({ id, highlightType: type });
  }, [newsItems, updateNewsItemMutation]);


  const value = useMemo(() => ({
    newsItems,
    loading: isFetching,
    addNewsItem: (item) => addNewsItemMutation.mutateAsync(item) as Promise<any>,
    updateNewsItem: (item) => updateNewsItemMutation.mutateAsync(item),
    deleteNewsItemMutation,
    toggleNewsHighlight,
    updateHighlightType,
  }), [newsItems, isFetching, addNewsItemMutation, updateNewsItemMutation, deleteNewsItemMutation, toggleNewsHighlight, updateHighlightType]);

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
