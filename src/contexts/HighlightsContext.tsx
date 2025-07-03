"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

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
  addHighlight: (highlight: Omit<Highlight, 'id' | 'isActive'>) => void;
  updateHighlight: (highlight: Highlight) => void;
  deleteHighlight: (id: string) => void;
  toggleHighlightActive: (id: string) => void;
  getActiveHighlights: () => Highlight[];
}

const HighlightsContext = createContext<HighlightsContextType | undefined>(undefined);

const initialHighlights: Highlight[] = [
  {
    id: 'h1',
    title: 'Conferência de Felicidade do Colaborador',
    description: 'Inscrições abertas',
    imageUrl: 'https://i.ibb.co/nszMYNJ/carreira-felicidade-corporativa.jpg',
    dataAiHint: 'conference team',
    link: '#',
    isActive: true,
  },
  {
    id: 'h2',
    title: 'Novos pacotes de bem-estar',
    description: 'Descubra nossas novas ofertas',
    imageUrl: 'https://i.ibb.co/mrC2Tr5b/homem-correndo-na-estrada-contra-as-montanhas-durante-o-por-do-sol-1048944-7722076.jpg',
    dataAiHint: 'wellness running',
    link: '#',
    isActive: true,
  },
  {
    id: 'h3',
    title: 'O dia de trazer seu cão para o escritório está de volta!',
    description: 'Prepare-se para a fofura!',
    imageUrl: 'https://i.ibb.co/SpBph6N/1-photo-1535930749574-1399327ce78f-303764.jpg',
    dataAiHint: 'dog office',
    link: '#',
    isActive: true,
  },
  {
    id: 'h4',
    title: 'Voluntariado: Limpeza da Praia',
    description: 'Junte-se a nós para um dia de impacto ambiental positivo.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'beach cleanup',
    link: '#',
    isActive: false,
  }
];

export const HighlightsProvider = ({ children }: { children: ReactNode }) => {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);

  const getActiveHighlights = useCallback(() => {
    return highlights.filter(h => h.isActive);
  }, [highlights]);

  const addHighlight = useCallback((highlightData: Omit<Highlight, 'id' | 'isActive'>) => {
    const newHighlight: Highlight = {
      ...highlightData,
      id: `h-${Date.now()}`,
      isActive: false,
    };
    setHighlights(prev => [newHighlight, ...prev]);
  }, []);

  const updateHighlight = useCallback((updatedHighlight: Highlight) => {
    setHighlights(prev => prev.map(h => (h.id === updatedHighlight.id ? updatedHighlight : h)));
  }, []);

  const deleteHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  const toggleHighlightActive = useCallback((id: string) => {
    setHighlights(prev => {
      const targetHighlight = prev.find(h => h.id === id);
      if (!targetHighlight) return prev;

      const currentlyActive = prev.filter(h => h.isActive).length;

      if (!targetHighlight.isActive && currentlyActive >= 3) {
        toast({
          title: "Limite Atingido",
          description: "Você pode ter no máximo 3 destaques ativos.",
          variant: "destructive",
        });
        return prev;
      }

      return prev.map(h =>
        h.id === id ? { ...h, isActive: !h.isActive } : h
      );
    });
  }, []);

  const value = useMemo(() => ({
    highlights,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    toggleHighlightActive,
    getActiveHighlights
  }), [highlights, addHighlight, updateHighlight, deleteHighlight, toggleHighlightActive, getActiveHighlights]);

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
