
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, listenToCollection, WithId, getCollection, getSubcollection } from '@/lib/firestore-service';
import * as z from 'zod';
import { useAuth } from './AuthContext';

export const pollSchema = z.object({
  question: z.string().min(1, "A pergunta é obrigatória."),
  options: z.array(z.object({ value: z.string().min(1, "A opção não pode ser vazia.") })).min(2, "São necessárias pelo menos duas opções."),
  targetPage: z.string().min(1, "A página alvo é obrigatória."),
  recipientIds: z.array(z.string()).min(1, "Selecione ao menos um destinatário."),
  isActive: z.boolean().default(true),
});

export type PollType = WithId<Omit<z.infer<typeof pollSchema>, 'options'> & { options: string[] }>;

export interface PollResponseType {
  id: string;
  userId: string;
  userName: string;
  answer: string;
  answeredAt: string; // ISO Date String
}

interface PollsContextType {
  polls: PollType[];
  pollResponses: { [key: string]: PollResponseType[] };
  loadingPolls: boolean;
  loadingResponses: boolean;
  addPoll: (poll: Omit<PollType, 'id'>) => Promise<PollType>;
  updatePoll: (poll: PollType) => Promise<void>;
  deletePollMutation: UseMutationResult<void, Error, string, unknown>;
  submitResponse: (pollId: string, response: Omit<PollResponseType, 'id'>) => Promise<void>;
}

const PollsContext = createContext<PollsContextType | undefined>(undefined);
const COLLECTION_NAME = 'polls';
const RESPONSES_SUBCOLLECTION = 'responses';

export const PollsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: polls = [], isFetching: loadingPolls } = useQuery<PollType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<PollType>(COLLECTION_NAME),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: pollResponses = {}, isFetching: loadingResponses } = useQuery<{ [key: string]: PollResponseType[] }>({
    queryKey: ['pollResponses', polls.map(p => p.id).join(',')],
    queryFn: async () => {
      const allResponses: { [key: string]: PollResponseType[] } = {};
      if (!polls || polls.length === 0) return {};
      for (const poll of polls) {
        const responses = await getSubcollection<PollResponseType>(COLLECTION_NAME, poll.id, RESPONSES_SUBCOLLECTION);
        allResponses[poll.id] = responses;
      }
      return allResponses;
    },
    enabled: !!user && polls.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const addPollMutation = useMutation<WithId<Omit<PollType, 'id'>>, Error, Omit<PollType, 'id'>>({
    mutationFn: (pollData) => addDocumentToCollection(COLLECTION_NAME, pollData),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });

  const updatePollMutation = useMutation<void, Error, PollType>({
    mutationFn: (updatedPoll) => {
        const { id, ...data } = updatedPoll;
        return updateDocumentInCollection(COLLECTION_NAME, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
  });
  
  const deletePollMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
      queryClient.removeQueries({ queryKey: ['pollResponses'] });
    },
  });

  const submitResponseMutation = useMutation<void, Error, { pollId: string; response: Omit<PollResponseType, 'id'> }>({
    mutationFn: ({ pollId, response }) => addDocumentToCollection(`${COLLECTION_NAME}/${pollId}/${RESPONSES_SUBCOLLECTION}`, response),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pollResponses'] });
    },
  });

  const value = useMemo(() => ({
    polls,
    pollResponses,
    loadingPolls,
    loadingResponses,
    addPoll: (poll) => addPollMutation.mutateAsync(poll) as Promise<PollType>,
    updatePoll: (poll) => updatePollMutation.mutateAsync(poll),
    deletePollMutation,
    submitResponse: (pollId, response) => submitResponseMutation.mutateAsync({ pollId, response }),
  }), [polls, pollResponses, loadingPolls, loadingResponses, addPollMutation, updatePollMutation, deletePollMutation, submitResponseMutation]);

  return (
    <PollsContext.Provider value={value}>
      {children}
    </PollsContext.Provider>
  );
};

export const usePolls = (): PollsContextType => {
  const context = useContext(PollsContext);
  if (context === undefined) {
    throw new Error('usePolls must be used within a PollsProvider');
  }
  return context;
};
