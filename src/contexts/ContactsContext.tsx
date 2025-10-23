"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, WithId, listenToCollection, getCollection } from '@/lib/firestore-service';
import * as z from 'zod';
import { useAuth } from './AuthContext';

export const contactSchema = z.object({
  area: z.string().min(1, "A área é obrigatória."),
  manager: z.string().min(1, "O nome do gestor é obrigatório."),
  slackUrl: z.string().url("A URL do Slack deve ser um link válido."),
  order: z.number().default(0),
});

export type ContactType = WithId<z.infer<typeof contactSchema>>;

interface ContactsContextType {
  contacts: ContactType[];
  loading: boolean;
  addContact: (contact: Omit<ContactType, 'id'>) => Promise<ContactType>;
  updateContact: (contact: Partial<ContactType> & { id: string }) => Promise<void>;
  deleteContactMutation: UseMutationResult<void, Error, string, unknown>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);
const COLLECTION_NAME = 'contacts';

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: contacts = [], isFetching } = useQuery<ContactType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<ContactType>(COLLECTION_NAME),
    staleTime: Infinity,
    enabled: !!user,
    select: (data) => data.sort((a, b) => (a.order || 0) - (b.order || 0)),
  });

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToCollection<ContactType>(
      COLLECTION_NAME,
      (newData) => {
        const sortedData = newData.sort((a, b) => (a.order || 0) - (b.order || 0));
        queryClient.setQueryData([COLLECTION_NAME], sortedData);
      },
      (error) => {
        console.error("Failed to listen to contacts collection:", error);
      }
    );
    return () => unsubscribe();
  }, [queryClient, user]);

  const addContactMutation = useMutation<WithId<Omit<ContactType, 'id'>>, Error, Omit<ContactType, 'id'>>({
    mutationFn: (contactData) => addDocumentToCollection(COLLECTION_NAME, contactData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updateContactMutation = useMutation<void, Error, Partial<ContactType> & { id: string }>({
    mutationFn: (updatedContact) => {
      const { id, ...data } = updatedContact;
      return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const deleteContactMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const value = useMemo(() => ({
    contacts,
    loading: isFetching,
    addContact: (contact) => addContactMutation.mutateAsync(contact) as Promise<ContactType>,
    updateContact: (contact) => updateContactMutation.mutateAsync(contact),
    deleteContactMutation,
  }), [contacts, isFetching, addContactMutation, updateContactMutation, deleteContactMutation]);

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = (): ContactsContextType => {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};
