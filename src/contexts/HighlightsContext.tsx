"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

export interface Highlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  dataAiHint: string;
  isActive: boolean;
}

interface HighlightsContextType {
  highlights: Highlight[];
  loading: boolean;
  addHighlight: (highlight: Omit<Highlight, 'id' | 'isActive'>) => Promise<void>;
  updateHighlight: (highlight: Highlight) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
  toggleHighlightActive: (id: string) => Promise<void>;
  getActiveHighlights: () => Highlight[];
}

const HighlightsContext = createContext<HighlightsContextType | undefined>(undefined);

const initialHighlights: Omit<Highlight, 'id'>[] = [
  {
    title: 'Conferência de Felicidade do Colaborador',
    description: 'Inscrições abertas. Participe e conecte-se!',
    imageUrl: 'https://i.ibb.co/nszMYNJ/carreira-felicidade-corporativa.jpg',
    dataAiHint: 'conference team',
    link: '#',
    isActive: true,
  },
  {
    title: 'Novos pacotes de bem-estar corporativo',
    description: 'Descubra nossas novas ofertas para seu equilíbrio.',
    imageUrl: 'https://i.ibb.co/mrC2Tr5b/homem-correndo-na-estrada-contra-as-montanhas-durante-o-por-do-sol-1048944-7722076.jpg',
    dataAiHint: 'wellness running',
    link: '#',
    isActive: true,
  },
  {
    title: 'O dia de trazer seu pet para o escritório!',
    description: 'Prepare-se para um dia de muita fofura e integração.',
    imageUrl: 'https://i.ibb.co/SpBph6N/1-photo-1535930749574-1399327ce78f-303764.jpg',
    dataAiHint: 'dog office',
    link: '#',
    isActive: true,
  },
  {
    title: 'Voluntariado: Limpeza da Praia',
    description: 'Junte-se a nós para um dia de impacto ambiental positivo.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'beach cleanup',
    link: '#',
    isActive: false,
  }
];

const COLLECTION_NAME = 'highlights';

export const HighlightsProvider = ({ children }: { children: ReactNode }) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      setLoading(true);
      const data = await getCollection<Highlight>(COLLECTION_NAME);
      if (data.length === 0) {
        // Seed the database if it's empty
        await seedCollection(COLLECTION_NAME, initialHighlights);
        const seededData = await getCollection<Highlight>(COLLECTION_NAME);
        setHighlights(seededData.sort((a,b) => b.title.localeCompare(a.title)));
      } else {
        setHighlights(data.sort((a,b) => b.title.localeCompare(a.title)));
      }
      setLoading(false);
    };
    fetchHighlights();
  }, []);

  const getActiveHighlights = useCallback(() => {
    return highlights.filter(h => h.isActive);
  }, [highlights]);

  const addHighlight = async (highlightData: Omit<Highlight, 'id' | 'isActive'>) => {
    const newHighlightData = { ...highlightData, isActive: false };
    const newHighlight = await addDocumentToCollection(COLLECTION_NAME, newHighlightData);
    if(newHighlight) {
      setHighlights(prev => [newHighlight as Highlight, ...prev]);
    }
  };

  const updateHighlight = async (updatedHighlight: Highlight) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedHighlight.id, updatedHighlight);
    if (success) {
      setHighlights(prev => prev.map(h => (h.id === updatedHighlight.id ? updatedHighlight : h)));
    }
  };

  const deleteHighlight = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if (success) {
      setHighlights(prev => prev.filter(h => h.id !== id));
    }
  };

  const toggleHighlightActive = async (id: string) => {
    const targetHighlight = highlights.find(h => h.id === id);
    if (!targetHighlight) return;

    const currentlyActive = highlights.filter(h => h.isActive).length;

    if (!targetHighlight.isActive && currentlyActive >= 3) {
      toast({
        title: "Limite Atingido",
        description: "Você pode ter no máximo 3 destaques ativos.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedHighlight = { ...targetHighlight, isActive: !targetHighlight.isActive };
    await updateHighlight(updatedHighlight);
  };

  const value = useMemo(() => ({
    highlights,
    loading,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    toggleHighlightActive,
    getActiveHighlights
  }), [highlights, loading, getActiveHighlights]);

  return (
    <HighlightsContext.Provider value={value}>
      {children}
    </HighlightsContext.Provider>
  );
};

export const useHighlights = (): HighlightsContextType => {
  const context = useContext(HighlightsContext);
  if (context === undefined) {
    throw new Error('useHighlights must be used within a HighlightsProvider');
  }
  return context;
};
