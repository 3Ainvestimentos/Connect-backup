"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

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
  addDocument: (doc: Omit<DocumentType, 'id'>) => Promise<void>;
  updateDocument: (doc: DocumentType) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);
const COLLECTION_NAME = 'documents';

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getCollection<DocumentType>(COLLECTION_NAME);
        if (data.length === 0) {
            await seedCollection(COLLECTION_NAME, initialDocuments);
            const seededData = await getCollection<DocumentType>(COLLECTION_NAME);
            setDocuments(seededData.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()));
        } else {
            setDocuments(data.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()));
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const addDocument = async (docData: Omit<DocumentType, 'id'>) => {
    const newDoc = await addDocumentToCollection(COLLECTION_NAME, docData);
    if (newDoc) {
        setDocuments(prev => [newDoc as DocumentType, ...prev].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()));
    }
  };

  const updateDocument = async (updatedDoc: DocumentType) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedDoc.id, updatedDoc);
    if(success) {
        setDocuments(prev => prev.map(doc => (doc.id === updatedDoc.id ? updatedDoc : doc)));
    }
  };

  const deleteDocument = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if(success) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const value = useMemo(() => ({
    documents,
    loading,
    addDocument,
    updateDocument,
    deleteDocument,
  }), [documents, loading]);


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
