"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NewsItemType {
  id: string;
  title: string;
  snippet: string;
  category: string;
  date: string;
  imageUrl: string;
  dataAiHint?: string;
}

const initialNewsItems: NewsItemType[] = [
  { id: '1', title: "Lançamento da Nova Intranet Corporativa", snippet: "Descubra as funcionalidades e benefícios da nova intranet...", category: "Tecnologia", date: "2024-07-15", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate communication" },
  { id: '2', title: "Resultados Financeiros do Segundo Trimestre", snippet: "Análise detalhada do desempenho financeiro da empresa no Q2.", category: "Financeiro", date: "2024-07-10", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "financial report" },
  { id: '3', title: "Programa de Bem-Estar: Novas Iniciativas", snippet: "Conheça as novas atividades e programas para promover o bem-estar...", category: "RH", date: "2024-07-05", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "employee wellness" },
  { id: '4', title: "Atualização da Política de Segurança de Dados", snippet: "Informações importantes sobre as novas diretrizes de segurança...", category: "Segurança", date: "2024-07-01", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "data privacy" },
  { id: '5', title: "Parceria Estratégica com Empresa X Anunciada", snippet: "Saiba mais sobre a nova parceria e suas implicações para o futuro.", category: "Estratégia", date: "2024-06-28", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "business partnership" },
  { id: '6', title: "Voluntariado Corporativo: Resultados da Campanha", snippet: "Veja o impacto positivo das nossas ações de voluntariado na comunidade.", category: "ESG", date: "2024-06-20", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate volunteering" },
];

interface NewsContextType {
  newsItems: NewsItemType[];
  addNewsItem: (item: Omit<NewsItemType, 'id'>) => void;
  updateNewsItem: (item: NewsItemType) => void;
  deleteNewsItem: (id: string) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [newsItems, setNewsItems] = useState<NewsItemType[]>(initialNewsItems);

  const addNewsItem = (itemData: Omit<NewsItemType, 'id'>) => {
    const newItem: NewsItemType = { ...itemData, id: `news-${Date.now()}` };
    setNewsItems(prev => [newItem, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateNewsItem = (updatedItem: NewsItemType) => {
    setNewsItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const deleteNewsItem = (id: string) => {
    setNewsItems(prev => prev.filter(item => item.id !== id));
  };

  const value = {
    newsItems,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
  };

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
