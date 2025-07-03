"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

const initialDocuments: DocumentType[] = [
  { id: 'doc1', name: "Relatório Anual 2023.pdf", category: "Relatórios", type: "pdf", size: "2.5MB", lastModified: "2024-07-01", downloadUrl: "#", dataAiHint: "annual report" },
  { id: 'doc2', name: "Manual do Colaborador.docx", category: "Manuais", type: "docx", size: "1.2MB", lastModified: "2024-06-15", downloadUrl: "#", dataAiHint: "employee handbook" },
  { id: 'doc3', name: "Apresentação Institucional.pptx", category: "Apresentações", type: "pptx", size: "5.8MB", lastModified: "2024-05-20", downloadUrl: "#", dataAiHint: "company presentation" },
  { id: 'doc4', name: "Política de Férias.pdf", category: "Políticas", type: "pdf", size: "300KB", lastModified: "2024-07-10", downloadUrl: "#", dataAiHint: "vacation policy" },
  { id: 'doc5', name: "Planilha de Orçamento Q3.xlsx", category: "Financeiro", type: "xlsx", size: "800KB", lastModified: "2024-07-05", downloadUrl: "#", dataAiHint: "budget spreadsheet" },
  { id: 'doc6', name: "Guia de Estilo da Marca.pdf", category: "Marketing", type: "pdf", size: "3.1MB", lastModified: "2024-06-01", downloadUrl: "#", dataAiHint: "brand guidelines" },
];


interface DocumentsContextType {
  documents: DocumentType[];
  addDocument: (doc: Omit<DocumentType, 'id'>) => void;
  updateDocument: (doc: DocumentType) => void;
  deleteDocument: (id: string) => void;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<DocumentType[]>(initialDocuments);

  const addDocument = (docData: Omit<DocumentType, 'id'>) => {
    const newDoc: DocumentType = { ...docData, id: `doc-${Date.now()}` };
    setDocuments(prev => [newDoc, ...prev].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()));
  };

  const updateDocument = (updatedDoc: DocumentType) => {
    setDocuments(prev => prev.map(doc => (doc.id === updatedDoc.id ? updatedDoc : doc)));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <DocumentsContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument }}>
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
