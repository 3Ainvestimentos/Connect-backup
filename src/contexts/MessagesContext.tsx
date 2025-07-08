
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';
import { toast } from '@/hooks/use-toast';

export interface MessageType {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string; // ISO date string e.g. "2024-07-25"
  target: {
    type: 'all' | 'axis' | 'area' | 'city';
    value: string;
  };
  readBy: string[]; // Array of collaborator IDs
}

const initialMessages: Omit<MessageType, 'id'>[] = [
  { title: 'Atualização da Política de Férias', content: 'Lembrete: A nova política de férias entrará em vigor a partir de 1º de Agosto. Todos os colaboradores devem revisar o documento disponível na intranet para entender as mudanças nos processos de solicitação e aprovação. O documento detalha os novos períodos aquisitivos e as regras para venda de dias de férias. Qualquer dúvida, entre em contato com o departamento de RH.', sender: 'RH', date: '2024-07-25', target: { type: 'all', value: 'all' }, readBy: [] },
  { title: 'Confraternização de Fim de Mês', content: 'Não se esqueçam do nosso happy hour amanhã, às 17h30! Teremos petiscos, bebidas e música ao vivo no terraço. Contamos com a presença de todos!', sender: 'Comunicação', date: '2024-07-24', target: { type: 'all', value: 'all' }, readBy: [] },
  { title: 'Manutenção Programada (Somente TI)', content: 'O sistema de TI passará por uma manutenção no sábado, das 8h às 12h. Durante este período, o acesso aos servidores de arquivos e ao sistema de CRM poderá ficar indisponível.', sender: 'Suporte TI', date: '2024-07-22', target: { type: 'area', value: 'Desenvolvimento' }, readBy: [] },
  { title: 'Pesquisa de Clima Organizacional', content: 'Sua opinião é muito importante! Por favor, responda à pesquisa de clima até o final desta semana. O link foi enviado para o seu e-mail. A participação é anônima.', sender: 'RH', date: '2024-07-26', target: { type: 'all', value: 'all' }, readBy: [] },
  { title: 'Nova Máquina de Café na Copa', content: 'Boas notícias para os amantes de café! Instalamos uma nova máquina de café expresso na copa do 2º andar. Aproveitem!', sender: 'Administrativo', date: '2024-07-26', target: { type: 'all', value: 'all' }, readBy: [] },
];

interface MessagesContextType {
  messages: MessageType[];
  loading: boolean;
  addMessage: (message: Omit<MessageType, 'id' | 'readBy'>) => void;
  updateMessage: (message: MessageType) => void;
  deleteMessage: (id: string) => void;
  markMessageAsRead: (messageId: string, collaboratorId: string) => void;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'messages';

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [hasSeeded, setHasSeeded] = useState(false);

  const { data: messages = [], isLoading, isSuccess } = useQuery<MessageType[]>({
    queryKey: [COLLECTION_NAME],
    queryFn: () => getCollection<MessageType>(COLLECTION_NAME),
    select: (data) => data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  });

  useEffect(() => {
    if (isSuccess && messages.length === 0 && !hasSeeded) {
      setHasSeeded(true);
      console.log(`Seeding ${COLLECTION_NAME} collection...`);
      seedCollection(COLLECTION_NAME, initialMessages)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
        })
        .catch(err => {
          console.error(`Failed to seed ${COLLECTION_NAME}:`, err);
        });
    }
  }, [isSuccess, messages.length, hasSeeded, queryClient]);

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = message.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === message.target.value);
  }, []);

  const addMessageMutation = useMutation({
    mutationFn: (messageData: Omit<MessageType, 'id' | 'readBy'>) => {
      const newMessageData = { ...messageData, readBy: [] };
      return addDocumentToCollection(COLLECTION_NAME, newMessageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Adicionar", description: `Não foi possível enviar a mensagem: ${error.message}`, variant: "destructive" });
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: (updatedMessage: MessageType) => updateDocumentInCollection(COLLECTION_NAME, updatedMessage.id, updatedMessage),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar as alterações: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) => deleteDocumentFromCollection(COLLECTION_NAME, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Excluir", description: `Não foi possível remover a mensagem: ${error.message}`, variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ messageId, collaboratorId }: { messageId: string; collaboratorId: string }) => {
      const message = messages.find(msg => msg.id === messageId);
      if (message && !message.readBy.includes(collaboratorId)) {
        const updatedReadBy = [...message.readBy, collaboratorId];
        return updateDocumentInCollection(COLLECTION_NAME, messageId, { readBy: updatedReadBy });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME] });
    },
    onError: (error: Error) => {
      // This is a less critical error, so we can just log it or show a subtle toast
      console.error("Failed to mark message as read:", error.message);
    },
  });
  
  const value = useMemo(() => ({
    messages,
    loading: isLoading,
    addMessage: (message) => addMessageMutation.mutate(message),
    updateMessage: (message) => updateMessageMutation.mutate(message),
    deleteMessage: (id) => deleteMessageMutation.mutate(id),
    markMessageAsRead: (messageId, collaboratorId) => markAsReadMutation.mutate({ messageId, collaboratorId }),
    getMessageRecipients
  }), [messages, isLoading, getMessageRecipients, addMessageMutation, updateMessageMutation, deleteMessageMutation, markAsReadMutation]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = (): MessagesContextType => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
