"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  category: string;
  date: string;
  imageUrl: string;
  dataAiHint?: string;
}

const initialNewsItems: Omit<NewsItemType, 'id'>[] = [
  { title: "Lançamento da Nova Intranet Corporativa", snippet: "Descubra as funcionalidades e benefícios da nova intranet...", category: "Tecnologia", date: "2024-07-15", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate communication" },
  { title: "Resultados Financeiros do Segundo Trimestre", snippet: "Análise detalhada do desempenho financeiro da empresa no Q2.", category: "Financeiro", date: "2024-07-10", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "financial report" },
  { title: "Programa de Bem-Estar: Novas Iniciativas", snippet: "Conheça as novas atividades e programas para promover o bem-estar...", category: "RH", date: "2024-07-05", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "employee wellness" },
  { title: "Atualização da Política de Segurança de Dados", snippet: "Informações importantes sobre as novas diretrizes de segurança...", category: "Segurança", date: "2024-07-01", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "data privacy" },
  { title: "Parceria Estratégica com Empresa X Anunciada", snippet: "Saiba mais sobre a nova parceria e suas implicações para o futuro.", category: "Estratégia", date: "2024-06-28", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "business partnership" },
  { title: "Voluntariado Corporativo: Resultados da Campanha", snippet: "Veja o impacto positivo das nossas ações de voluntariado na comunidade.", category: "ESG", date: "2024-06-20", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate volunteering" },
];

interface NewsContextType {
  newsItems: NewsItemType[];
  loading: boolean;
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => Promise<void>;
  updateNewsItem: (item: NewsItemType) => Promise<void>;
  deleteNewsItem: (id: string) => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);
const COLLECTION_NAME = 'newsItems';

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [newsItems, setNewsItems] = useState<NewsItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getCollection<NewsItemType>(COLLECTION_NAME);
         if (data.length === 0) {
            await seedCollection(COLLECTION_NAME, initialNewsItems);
            const seededData = await getCollection<NewsItemType>(COLLECTION_NAME);
            setNewsItems(seededData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            setNewsItems(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const addNewsItem = async (itemData: Omit<NewsItemType, 'id'>) => {
    const newItem = await addDocumentToCollection(COLLECTION_NAME, itemData);
    if(newItem) {
        setNewsItems(prev => [newItem as NewsItemType, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const updateNewsItem = async (updatedItem: NewsItemType) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedItem.id, updatedItem);
    if(success) {
        setNewsItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    }
  };

  const deleteNewsItem = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if(success) {
        setNewsItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const value = useMemo(() => ({
    newsItems,
    loading,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
  }), [newsItems, loading]);

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
