
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
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

const generateMockId = () => `mock_${Date.now()}_${Math.random()}`;

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [newsItems, setNewsItems] = useState<NewsItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNewsItems([]);
    setLoading(false);
  }, []);
  
  const addNewsItem = useCallback(async (itemData: Omit<NewsItemType, 'id'>): Promise<NewsItemType> => {
    setLoading(true);
    const newNewsItem = { id: generateMockId(), ...itemData };
    setNewsItems(prev => [newNewsItem, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
    return newNewsItem;
  }, []);

  const updateNewsItem = useCallback(async (updatedItem: NewsItemType): Promise<void> => {
    setLoading(true);
    setNewsItems(prev => prev
      .map(item => item.id === updatedItem.id ? updatedItem : item)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setLoading(false);
  }, []);

  const deleteNewsItem = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setNewsItems(prev => prev.filter(item => item.id !== id));
    setLoading(false);
  }, []);

  const toggleNewsHighlight = useCallback((id: string) => {
    setNewsItems(prevItems => {
        const targetNews = prevItems.find(n => n.id === id);
        if (!targetNews) return prevItems;

        const currentlyActive = prevItems.filter(n => n.isHighlight).length;
        if (!targetNews.isHighlight && currentlyActive >= 3) {
            toast({
                title: "Limite Atingido",
                description: "Você pode ter no máximo 3 destaques ativos.",
                variant: "destructive",
            });
            return prevItems; // Return original state if limit is reached
        }

        return prevItems.map(item => item.id === id ? { ...item, isHighlight: !item.isHighlight } : item);
    });
  }, []);

  const value = useMemo(() => ({
    newsItems,
    loading,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    toggleNewsHighlight,
  }), [newsItems, loading, addNewsItem, updateNewsItem, deleteNewsItem, toggleNewsHighlight]);

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
