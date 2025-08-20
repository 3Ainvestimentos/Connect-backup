
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  addDocumentToCollection,
  updateDocumentInCollection,
  deleteDocumentFromCollection,
  WithId,
  listenToCollection,
  writeBatch,
  doc,
  getFirestore
} from '@/lib/firestore-service';
import { getFirebaseApp } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

// --- Types and Schemas ---
export interface KanbanCardType {
  id: string;
  columnId: string;
  order: number;
  title: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'pdf';
  tags?: string[];
  assignedTo?: string[]; // Array of collaborator IDs
  dueDate?: string; // ISO String
}

export interface KanbanColumnType {
  id: string;
  title: string;
  order: number;
}

interface KanbanContextType {
  columns: KanbanColumnType[];
  cards: KanbanCardType[];
  loading: boolean;
  addColumn: (title: string) => Promise<void>;
  updateColumn: (id: string, title: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  addCard: (cardData: Omit<KanbanCardType, 'id' | 'order'>) => Promise<void>;
  updateCard: (id: string, cardData: Partial<Omit<KanbanCardType, 'id'>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, sourceColumnId: string, destColumnId: string, newOrder: number) => Promise<void>;
  reorderColumn: (columnId: string, newOrder: number) => Promise<void>;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

const COLUMNS_COLLECTION = 'content_kanban_columns';
const CARDS_COLLECTION = 'content_kanban_cards';

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // --- Queries ---
  const { data: columns = [], isFetching: loadingColumns } = useQuery<KanbanColumnType[]>({
    queryKey: [COLUMNS_COLLECTION],
    queryFn: async () => [], // Listener will populate
    staleTime: Infinity,
    select: data => data.sort((a, b) => a.order - b.order),
  });

  const { data: cards = [], isFetching: loadingCards } = useQuery<KanbanCardType[]>({
    queryKey: [CARDS_COLLECTION],
    queryFn: async () => [], // Listener will populate
    staleTime: Infinity,
  });

  // --- Listeners ---
  React.useEffect(() => {
    const unsubscribeColumns = listenToCollection<KanbanColumnType>(
      COLUMNS_COLLECTION,
      (data) => queryClient.setQueryData([COLUMNS_COLLECTION], data.sort((a,b) => a.order - b.order)),
      (error) => console.error("Failed to listen to Kanban columns:", error)
    );
    const unsubscribeCards = listenToCollection<KanbanCardType>(
      CARDS_COLLECTION,
      (data) => queryClient.setQueryData([CARDS_COLLECTION], data),
      (error) => console.error("Failed to listen to Kanban cards:", error)
    );
    return () => {
      unsubscribeColumns();
      unsubscribeCards();
    };
  }, [queryClient]);

  // --- Mutations ---
  const addColumnMutation = useMutation<void, Error, { title: string }>({
    mutationFn: async ({ title }) => {
      const currentMaxOrder = columns.reduce((max, col) => Math.max(max, col.order), -1);
      const newColumn: Omit<KanbanColumnType, 'id'> = { title, order: currentMaxOrder + 1 };
      await addDocumentToCollection(COLUMNS_COLLECTION, newColumn);
    },
  });

  const updateColumnMutation = useMutation<void, Error, { id: string; title: string }>({
    mutationFn: ({ id, title }) => updateDocumentInCollection(COLUMNS_COLLECTION, id, { title }),
  });

  const deleteColumnMutation = useMutation<void, Error, string>({
    mutationFn: async (columnId) => {
        const db = getFirestore(getFirebaseApp());
        const batch = writeBatch(db);
        
        // Delete the column itself
        const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
        batch.delete(columnRef);

        // Delete all cards within that column
        const cardsToDelete = cards.filter(c => c.columnId === columnId);
        cardsToDelete.forEach(card => {
            const cardRef = doc(db, CARDS_COLLECTION, card.id);
            batch.delete(cardRef);
        });
        
        await batch.commit();
    },
  });

  const addCardMutation = useMutation<void, Error, Omit<KanbanCardType, 'id' | 'order'>>({
    mutationFn: async (cardData) => {
      const cardsInColumn = cards.filter(c => c.columnId === cardData.columnId);
      const newOrder = cardsInColumn.length;
      const newCard: Omit<KanbanCardType, 'id'> = { ...cardData, order: newOrder };
      await addDocumentToCollection(CARDS_COLLECTION, newCard);
    },
  });

  const updateCardMutation = useMutation<void, Error, { id: string, data: Partial<Omit<KanbanCardType, 'id'>> }>({
    mutationFn: ({ id, data }) => updateDocumentInCollection(CARDS_COLLECTION, id, data),
  });
  
  const deleteCardMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(CARDS_COLLECTION, id),
  });

  const moveCardMutation = useMutation<void, Error, { cardId: string, sourceColumnId: string, destColumnId: string, newOrder: number }>({
    mutationFn: async ({ cardId, sourceColumnId, destColumnId, newOrder }) => {
        const db = getFirestore(getFirebaseApp());
        const batch = writeBatch(db);
        
        // Update the moved card
        const movedCardRef = doc(db, CARDS_COLLECTION, cardId);
        batch.update(movedCardRef, { columnId: destColumnId, order: newOrder });

        // Update order of cards in the destination column
        cards.filter(c => c.columnId === destColumnId && c.order >= newOrder).forEach(card => {
            const cardRef = doc(db, CARDS_COLLECTION, card.id);
            batch.update(cardRef, { order: card.order + 1 });
        });

        // Update order of cards in the source column
        cards.filter(c => c.columnId === sourceColumnId && c.order > cards.find(c => c.id === cardId)!.order).forEach(card => {
             const cardRef = doc(db, CARDS_COLLECTION, card.id);
             batch.update(cardRef, { order: card.order - 1 });
        });

        await batch.commit();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CARDS_COLLECTION] }),
  });
  
   const reorderColumnMutation = useMutation<void, Error, { columnId: string, newOrder: number }>({
        mutationFn: async ({ columnId, newOrder }) => {
            // Simplified logic: This would need a more complex batch write to shift other columns correctly.
            // For now, we just update the one column's order. A full implementation would re-order siblings.
            await updateDocumentInCollection(COLUMNS_COLLECTION, columnId, { order: newOrder });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [COLUMNS_COLLECTION] }),
    });


  const value = useMemo(() => ({
    columns,
    cards,
    loading: loadingColumns || loadingCards,
    addColumn: (title) => addColumnMutation.mutateAsync({ title }).then(() => toast({title: "Coluna criada"})),
    updateColumn: (id, title) => updateColumnMutation.mutateAsync({ id, title }).then(() => toast({title: "Coluna atualizada"})),
    deleteColumn: (id) => deleteColumnMutation.mutateAsync(id).then(() => toast({title: "Coluna e seus cartões foram excluídos"})),
    addCard: (cardData) => addCardMutation.mutateAsync(cardData).then(() => toast({title: "Cartão adicionado"})),
    updateCard: (id, cardData) => updateCardMutation.mutateAsync({ id, data: cardData }),
    deleteCard: (id) => deleteCardMutation.mutateAsync(id).then(() => toast({title: "Cartão excluído"})),
    moveCard: (cardId, sourceColumnId, destColumnId, newOrder) => moveCardMutation.mutateAsync({ cardId, sourceColumnId, destColumnId, newOrder }),
    reorderColumn: (columnId, newOrder) => reorderColumnMutation.mutateAsync({ columnId, newOrder }),
  }), [columns, cards, loadingColumns, loadingCards, addColumnMutation, updateColumnMutation, deleteColumnMutation, addCardMutation, updateCardMutation, deleteCardMutation, moveCardMutation, reorderColumnMutation]);

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = (): KanbanContextType => {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};
