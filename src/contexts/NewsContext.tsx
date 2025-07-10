
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
// Using the mock service instead of the real Firestore service
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/mock-firestore-service';

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

// Initial mock data to populate localStorage if it's empty
const mockNewsItems: NewsItemType[] = [
    { id: "news_mock_1", title: "Novo Recorde de Faturamento no Q2", snippet: "Atingimos um novo patamar de receita, superando as expectativas do mercado.", content: "Conteúdo completo sobre o novo recorde...", category: "Financeiro", date: "2024-07-28", imageUrl: "https://placehold.co/600x400.png", isHighlight: true, dataAiHint: "business growth" },
    { id: "news_mock_2", title: "Lançamento da Plataforma 3A RIVA Hub", snippet: "Nossa nova intranet está no ar, centralizando comunicação e ferramentas.", content: "Conteúdo completo sobre o lançamento...", category: "Tecnologia", date: "2024-07-25", imageUrl: "https://placehold.co/600x400.png", isHighlight: true, dataAiHint: "technology interface" },
    { id: "news_mock_3", title: "Confraternização de Final de Ano", snippet: "Reserve a data! Nossa festa anual será no dia 15 de Dezembro.", content: "Conteúdo completo sobre a festa...", category: "Eventos", date: "2024-07-22", imageUrl: "https://placehold.co/600x400.png", isHighlight: true, dataAiHint: "corporate party" },
    { id: "news_mock_4", title: "Programa de Saúde Mental", snippet: "Lançamos uma nova iniciativa para apoiar o bem-estar de nossos colaboradores.", content: "Conteúdo completo sobre o programa...", category: "RH", date: "2024-07-20", imageUrl: "https://placehold.co/600x400.png", isHighlight: false, dataAiHint: "mental health" },
];

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
    // Pass mock data to initialize if localStorage is empty
    queryFn: () => getCollection<NewsItemType>(COLLECTION_NAME, mockNewsItems),
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
    },
  });

  const deleteNewsItemMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
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
