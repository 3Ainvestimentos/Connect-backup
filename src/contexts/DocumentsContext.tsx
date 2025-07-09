
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId } from '@/lib/firestore-service';

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

const mockDocuments: DocumentType[] = [
    { id: "doc_mock_1", name: "Política de Home Office", category: "RH", type: "pdf", size: "1.2MB", lastModified: "2024-07-20", downloadUrl: "#" },
    { id: "doc_mock_2", name: "Manual de Marca", category: "Marketing", type: "pdf", size: "5.4MB", lastModified: "2024-06-15", downloadUrl: "#" },
    { id: "doc_mock_3", name: "Relatório de Vendas Q2", category: "Financeiro", type: "xlsx", size: "850KB", lastModified: "2024-07-05", downloadUrl: "#" },
    { id: "doc_mock_4", name: "Apresentação Institucional", category: "Marketing", type: "pptx", size: "12.3MB", lastModified: "2024-05-30", downloadUrl: "#" },
    { id: "doc_mock_5", name: "Código de Conduta", category: "Compliance", type: "pdf", size: "980KB", lastModified: "2024-01-10", downloadUrl: "#" },
    { id: "doc_mock_6", name: "Formulário de Reembolso", category: "RH", type: "docx", size: "300KB", lastModified: "2024-07-18", downloadUrl: "#" },
];


interface DocumentsContextType {
  documents: DocumentType[];
  loading: boolean;
  addDocument: (doc: Omit<DocumentType, 'id'>) => Promise<WithId<Omit<DocumentType, 'id'>>>;
  updateDocument: (doc: DocumentType) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);
const COLLECTION_NAME = 'documents';

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: documents = [], isFetching } = useQuery<DocumentType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<DocumentType>(COLLECTION_NAME),
    select: (fetchedData) => {
        const combined = [...mockDocuments, ...fetchedData];
        const uniqueDocs = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return uniqueDocs.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    },
  });

  const addDocumentMutation = useMutation<WithId<Omit<DocumentType, 'id'>>, Error, Omit<DocumentType, 'id'>>({
    mutationFn: (docData: Omit<DocumentType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, docData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateDocumentMutation = useMutation<void, Error, DocumentType>({
    mutationFn: (updatedDoc: DocumentType) => {
        if(mockDocuments.some(d => d.id === updatedDoc.id)) {
            return Promise.resolve();
        }
        return updateDocumentInCollection(COLLECTION_NAME, updatedDoc.id, updatedDoc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteDocumentMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => {
        if(mockDocuments.some(d => d.id === id)) {
            return Promise.resolve();
        }
        return deleteDocumentFromCollection(COLLECTION_NAME, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    documents,
    loading: isFetching,
    addDocument: (doc) => addDocumentMutation.mutateAsync(doc),
    updateDocument: (doc) => updateDocumentMutation.mutateAsync(doc),
    deleteDocument: (id) => deleteDocumentMutation.mutateAsync(id),
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
