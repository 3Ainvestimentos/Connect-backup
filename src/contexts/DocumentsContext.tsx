
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface DocumentType {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  lastModified: string;
  downloadUrl: string;
  dataAiHint?: string;
}

interface DocumentsContextType {
  documents: DocumentType[];
  loading: boolean;
  addDocument: (doc: Omit<DocumentType, 'id'>) => void;
  updateDocument: (doc: DocumentType) => void;
  deleteDocument: (id: string) => void;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);
const COLLECTION_NAME = 'documents';

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: documents = [], isFetching } = useQuery<DocumentType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<DocumentType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()),
  });

  const addDocumentMutation = useMutation<WithId<Omit<DocumentType, 'id'>>, Error, Omit<DocumentType, 'id'>>({
    mutationFn: (docData: Omit<DocumentType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, docData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Adicionar", description: `Não foi possível salvar o documento: ${error.message}`, variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: (updatedDoc: DocumentType) => updateDocumentInCollection(COLLECTION_NAME, updatedDoc.id, updatedDoc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar as alterações: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Excluir", description: `Não foi possível remover o documento: ${error.message}`, variant: "destructive" });
    },
  });

  const value = useMemo(() => ({
    documents,
    loading: isFetching,
    addDocument: (doc) => addDocumentMutation.mutate(doc),
    updateDocument: (doc) => updateDocumentMutation.mutate(doc),
    deleteDocument: (id) => deleteDocumentMutation.mutate(id),
  }), [documents, isFetching, addDocumentMutation, updateDocumentMutation, deleteDocumentMutation]);

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
};

export const useDocuments = (): DocumentsContextType => {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentsProvider');
  }
  return context;
};
