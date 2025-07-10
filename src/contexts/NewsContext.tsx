
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

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
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => Promise<NewsItemType>;
  updateNewsItem: (item: NewsItemType) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;
  toggleNewsHighlight: (id: string) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);
const COLLECTION_NAME = 'news';

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: newsItems = [], isFetching } = useQuery<NewsItemType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<NewsItemType>(COLLECTION_NAME),
    initialData: [],
  });

  const addNewsItemMutation = useMutation<WithId<Omit<NewsItemType, 'id'>>, Error, Omit<NewsItemType, 'id'>>({
    mutationFn: (itemData) => addDocumentToCollection(COLLECTION_NAME, itemData),
    onSuccess: (newItem) => {
        queryClient.setQueryData<NewsItemType[]>([COLLECTION_NAME], (oldData = []) =>
            [...oldData, newItem].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
    },
  });

  const updateNewsItemMutation = useMutation<void, Error, NewsItemType>({
    mutationFn: (updatedItem) => {
        const { id, ...data } = updatedItem;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onMutate: async (updatedItem) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<NewsItemType[]>([COLLECTION_NAME]);
        queryClient.setQueryData<NewsItemType[]>([COLLECTION_NAME], (oldData = []) => 
            oldData.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteNewsItemMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
        await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
        const previousData = queryClient.getQueryData<NewsItemType[]>([COLLECTION_NAME]);
        queryClient.setQueryData<NewsItemType[]>([COLLECTION_NAME], (oldData = []) => 
            oldData.filter(item => item.id !== idToDelete)
        );
        return { previousData };
    },
    onError: (err, variables, context) => {
        if (context?.previousData) {
            queryClient.setQueryData([COLLECTION_NAME], context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
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
    deleteNewsItem: (id) => deleteNewsItemMutation.mutateAsync(id),
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
