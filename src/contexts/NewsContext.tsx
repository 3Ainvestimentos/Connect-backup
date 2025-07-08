
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
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
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => void;
  updateNewsItem: (item: NewsItemType) => void;
  deleteNewsItem: (id: string) => void;
  toggleNewsHighlight: (id: string) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);
const COLLECTION_NAME = 'newsItems';

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: newsItems = [], isFetching } = useQuery<NewsItemType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<NewsItemType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  });
  
  const addNewsItemMutation = useMutation<WithId<Omit<NewsItemType, 'id'>>, Error, Omit<NewsItemType, 'id'>>({
    mutationFn: (itemData: Omit<NewsItemType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Adicionar", description: `Não foi possível salvar a notícia: ${error.message}`, variant: "destructive" });
    },
  });

  const updateNewsItemMutation = useMutation({
    mutationFn: (updatedItem: NewsItemType) => updateDocumentInCollection(COLLECTION_NAME, updatedItem.id, updatedItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar as alterações: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteNewsItemMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Excluir", description: `Não foi possível remover a notícia: ${error.message}`, variant: "destructive" });
    },
  });

  const toggleHighlightMutation = useMutation({
    mutationFn: async (id: string) => {
      const targetNews = newsItems.find(n => n.id === id);
      if (!targetNews) return;

      const currentlyActive = newsItems.filter(n => n.isHighlight).length;
      if (!targetNews.isHighlight && currentlyActive >= 3) {
        toast({
          title: "Limite Atingido",
          description: "Você pode ter no máximo 3 destaques ativos.",
          variant: "destructive",
        });
        return Promise.reject(new Error("Highlight limit reached"));
      }
      
      const updatedNews = { ...targetNews, isHighlight: !targetNews.isHighlight };
      await updateDocumentInCollection(COLLECTION_NAME, id, { isHighlight: updatedNews.isHighlight });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      if (error.message !== "Highlight limit reached") {
        toast({ title: "Erro ao Atualizar Destaque", description: error.message, variant: "destructive" });
      }
    },
  });

  const value = useMemo(() => ({
    newsItems,
    loading: isFetching,
    addNewsItem: (item) => addNewsItemMutation.mutate(item),
    updateNewsItem: (item) => updateNewsItemMutation.mutate(item),
    deleteNewsItem: (id) => deleteNewsItemMutation.mutate(id),
    toggleNewsHighlight: (id) => toggleHighlightMutation.mutate(id),
  }), [newsItems, isFetching, addNewsItemMutation, updateNewsItemMutation, deleteNewsItemMutation, toggleHighlightMutation]);

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
