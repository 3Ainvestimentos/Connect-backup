"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

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
  addMessage: (message: Omit<MessageType, 'id' | 'readBy'>) => Promise<void>;
  updateMessage: (message: MessageType) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  markMessageAsRead: (messageId: string, collaboratorId: string) => Promise<void>;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);
const COLLECTION_NAME = 'messages';

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getCollection<MessageType>(COLLECTION_NAME);
        if (data.length === 0) {
            await seedCollection(COLLECTION_NAME, initialMessages);
            const seededData = await getCollection<MessageType>(COLLECTION_NAME);
            setMessages(seededData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            setMessages(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.target.type === 'all') {
      return allCollaborators;
    }
    const filterKey = message.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === message.target.value);
  }, []);

  const addMessage = async (messageData: Omit<MessageType, 'id' | 'readBy'>) => {
    const newMessageData = { ...messageData, readBy: [] };
    const newMessage = await addDocumentToCollection(COLLECTION_NAME, newMessageData);
    if(newMessage) {
        setMessages(prev => [newMessage as MessageType, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const updateMessage = async (updatedMessage: MessageType) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedMessage.id, updatedMessage);
    if (success) {
        setMessages(prev => prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg)));
    }
  };

  const deleteMessage = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if (success) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    }
  };

  const markMessageAsRead = async (messageId: string, collaboratorId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && !message.readBy.includes(collaboratorId)) {
        const updatedReadBy = [...message.readBy, collaboratorId];
        const success = await updateDocumentInCollection(COLLECTION_NAME, messageId, { readBy: updatedReadBy });
        if(success) {
            setMessages(prev =>
                prev.map(msg =>
                  msg.id === messageId ? { ...msg, readBy: updatedReadBy } : msg
                )
            );
        }
    }
  };

  const value = useMemo(() => ({
    messages,
    loading,
    addMessage,
    updateMessage,
    deleteMessage,
    markMessageAsRead,
    getMessageRecipients
  }), [messages, loading, getMessageRecipients]);

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
