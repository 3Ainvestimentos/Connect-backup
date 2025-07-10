
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
  });

  const addDocumentMutation = useMutation<WithId<Omit<DocumentType, 'id'>>, Error, Omit<DocumentType, 'id'>>({
    mutationFn: (docData: Omit<DocumentType, 'id'>) => addDocumentToCollection(COLLECTION_NAME, docData),
    onSuccess: (newItem) => {
        queryClient.setQueryData([COLLECTION_NAME], (oldData: DocumentType[] = []) => [...oldData, newItem]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateDocumentMutation = useMutation<void, Error, DocumentType>({
    mutationFn: (updatedDoc: DocumentType) => updateDocumentInCollection(COLLECTION_NAME, updatedDoc.id, updatedDoc),
     onSuccess: (_, variables) => {
      queryClient.setQueryData([COLLECTION_NAME], (oldData: DocumentType[] = []) =>
        oldData.map((item) => (item.id === variables.id ? variables : item))
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteDocumentMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onMutate: async (idToDelete) => {
      await queryClient.cancelQueries({ queryKey: [COLLECTION_NAME] });
      const previousData = queryClient.getQueryData<DocumentType[]>([COLLECTION_NAME]);
      queryClient.setQueryData<DocumentType[]>([COLLECTION_NAME], (old = []) =>
        old.filter((item) => item.id !== idToDelete)
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([COLLECTION_NAME], context.previousData);
      }
    },
    onSettled: () => {
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
