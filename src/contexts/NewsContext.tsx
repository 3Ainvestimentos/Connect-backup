
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection } from '@/lib/firestore-service';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  content: string; // Full content for modal view
  category: string;
  date: string;
  imageUrl: string;
  videoUrl?: string; // Optional video URL
  dataAiHint?: string;
  isHighlight: boolean;
  highlightType?: 'large' | 'small'; // New field for highlight size
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
    queryFn: async () => [],
    staleTime: Infinity,
  });

  React.useEffect(() => {
    const unsubscribe = listenToCollection<NewsItemType>(
      COLLECTION_NAME,
      (newData) => {
        queryClient.setQueryData([COLLECTION_NAME], newData);
      },
      (error) => {
        console.error("Failed to listen to news collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  const addNewsItemMutation = useMutation<WithId<Omit<NewsItemType, 'id'>>, Error, Omit<NewsItemType, 'id'>>({
    mutationFn: (itemData) => addDocumentToCollection(COLLECTION_NAME, itemData),
    onSuccess: () => {
        // Invalidation is not strictly needed due to the listener
    },
  });

  const updateNewsItemMutation = useMutation<void, Error, NewsItemType>({
    mutationFn: (updatedItem) => {
        const { id, ...data } = updatedItem;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
        // Listener will handle invalidation
    }
  });

  const deleteNewsItemMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      // Listener will handle invalidation
    },
  });

  const toggleNewsHighlight = useCallback((id: string) => {
    const targetNews = newsItems.find(n => n.id === id);
    if (!targetNews) return;

    // The logic to limit highlights to 3 is now managed in the form validation
    // and dashboard rendering, making this toggle simpler.
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
