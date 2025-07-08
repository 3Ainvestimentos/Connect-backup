
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection, WithId } from '@/lib/firestore-service';
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

const initialDocuments: Omit<DocumentType, 'id'>[] = [
  { name: "Relatório Anual 2023.pdf", category: "Relatórios", type: "pdf", size: "2.5MB", lastModified: "2024-07-01", downloadUrl: "#", dataAiHint: "annual report" },
  { name: "Manual do Colaborador.docx", category: "Manuais", type: "docx", size: "1.2MB", lastModified: "2024-06-15", downloadUrl: "#", dataAiHint: "employee handbook" },
  { name: "Apresentação Institucional.pptx", category: "Apresentações", type: "pptx", size: "5.8MB", lastModified: "2024-05-20", downloadUrl: "#", dataAiHint: "company presentation" },
  { name: "Política de Férias.pdf", category: "Políticas", type: "pdf", size: "300KB", lastModified: "2024-07-10", downloadUrl: "#", dataAiHint: "vacation policy" },
  { name: "Planilha de Orçamento Q3.xlsx", category: "Financeiro", type: "xlsx", size: "800KB", lastModified: "2024-07-05", downloadUrl: "#", dataAiHint: "budget spreadsheet" },
  { name: "Guia de Estilo da Marca.pdf", category: "Marketing", type: "pdf", size: "3.1MB", lastModified: "2024-06-01", downloadUrl: "#", dataAiHint: "brand guidelines" },
];

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
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: documents = [], isFetching, isSuccess } = useQuery<DocumentType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<DocumentType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()),
  });

  useEffect(() => {
    if (isSuccess && documents.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialDocuments)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, documents.length, hasSeeded, queryClient]);

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
