
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection, WithId } from '@/lib/firestore-service';
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

const initialNewsItems: Omit<NewsItemType, 'id'>[] = [
  { title: "Dia do Pet no Escritório é um Sucesso", snippet: "A recente edição do 'Pet Day' promoveu a integração e o bem-estar entre as equipes, com a participação de dezenas de animais.", category: "Cultura", date: "2024-07-28", imageUrl: "https://i.ibb.co/SpBph6N/1-photo-1535930749574-1399327ce78f-303764.jpg", dataAiHint: "dog office", isHighlight: true, link: '#' },
  { title: "Inscrições Abertas para Conferência Anual", snippet: "Garanta sua vaga na conferência de felicidade corporativa que acontecerá no próximo mês. Palestras e workshops confirmados.", category: "Eventos", date: "2024-07-26", imageUrl: "https://i.ibb.co/nszMYNJ/carreira-felicidade-corporativa.jpg", dataAiHint: "conference team", isHighlight: true, link: '#' },
  { title: "Programa de Bem-Estar Lança Novos Benefícios", snippet: "Novos pacotes, incluindo assessoria esportiva e nutricional, já estão disponíveis para todos os colaboradores.", category: "RH", date: "2024-07-25", imageUrl: "https://i.ibb.co/mrC2Tr5b/homem-correndo-na-estrada-contra-as-montanhas-durante-o-por-do-sol-1048944-7722076.jpg", dataAiHint: "wellness running", isHighlight: true, link: '#' },
  { title: "Resultados Financeiros do Segundo Trimestre", snippet: "Análise detalhada do desempenho financeiro da empresa no Q2.", category: "Financeiro", date: "2024-07-10", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "financial report", isHighlight: false, link: '#' },
  { title: "Voluntariado Corporativo: Resultados da Campanha", snippet: "Veja o impacto positivo das nossas ações de voluntariado na comunidade.", category: "ESG", date: "2024-06-20", imageUrl: "https://placehold.co/300x200.png", dataAiHint: "corporate volunteering", isHighlight: false, link: '#' },
];


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
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: newsItems = [], isFetching, isSuccess } = useQuery<NewsItemType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<NewsItemType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  });
  
  useEffect(() => {
    if (isSuccess && newsItems.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialNewsItems)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, newsItems.length, hasSeeded, queryClient]);


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
