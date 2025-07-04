
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { useCollaborators, type Collaborator } from '@/contexts/CollaboratorsContext';

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

const initialMessages: MessageType[] = [
  { id: '1', title: 'Atualização da Política de Férias', content: 'Lembrete: A nova política de férias entrará em vigor a partir de 1º de Agosto. Todos os colaboradores devem revisar o documento disponível na intranet para entender as mudanças nos processos de solicitação e aprovação. O documento detalha os novos períodos aquisitivos e as regras para venda de dias de férias. Qualquer dúvida, entre em contato com o departamento de RH.', sender: 'RH', date: '2024-07-25', target: { type: 'all', value: 'all' }, readBy: [] },
  { id: '2', title: 'Confraternização de Fim de Mês', content: 'Não se esqueçam do nosso happy hour amanhã, às 17h30! Teremos petiscos, bebidas e música ao vivo no terraço. Contamos com a presença de todos!', sender: 'Comunicação', date: '2024-07-24', target: { type: 'all', value: 'all' }, readBy: [] },
  { id: '3', title: 'Manutenção Programada (Somente TI)', content: 'O sistema de TI passará por uma manutenção no sábado, das 8h às 12h. Durante este período, o acesso aos servidores de arquivos e ao sistema de CRM poderá ficar indisponível.', sender: 'Suporte TI', date: '2024-07-22', target: { type: 'area', value: 'Desenvolvimento' }, readBy: [] },
  { id: '4', title: 'Pesquisa de Clima Organizacional', content: 'Sua opinião é muito importante! Por favor, responda à pesquisa de clima até o final desta semana. O link foi enviado para o seu e-mail. A participação é anônima.', sender: 'RH', date: '2024-07-26', target: { type: 'all', value: 'all' }, readBy: [] },
  { id: '5', title: 'Nova Máquina de Café na Copa', content: 'Boas notícias para os amantes de café! Instalamos uma nova máquina de café expresso na copa do 2º andar. Aproveitem!', sender: 'Administrativo', date: '2024-07-26', target: { type: 'all', value: 'all' }, readBy: [] },
];

interface MessagesContextType {
  messages: MessageType[];
  addMessage: (message: Omit<MessageType, 'id' | 'readBy'>) => void;
  updateMessage: (message: MessageType) => void;
  deleteMessage: (id: string) => void;
  markMessageAsRead: (messageId: string, collaboratorId: string) => void;
  getMessageRecipients: (message: MessageType, allCollaborators: Collaborator[]) => Collaborator[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const { collaborators } = useCollaborators();

  const getMessageRecipients = useCallback((message: MessageType, allCollaborators: Collaborator[]): Collaborator[] => {
    if (message.target.type === 'all') {
      return allCollaborators;
    }
    // The key needs to be asserted as a key of Collaborator
    const filterKey = message.target.type as keyof Collaborator;
    return allCollaborators.filter(c => c[filterKey] === message.target.value);
  }, []);

  const addMessage = useCallback((messageData: Omit<MessageType, 'id' | 'readBy'>) => {
    const newMessage: MessageType = { ...messageData, id: `msg-${Date.now()}`, readBy: [] };
    setMessages(prev => [newMessage, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const updateMessage = useCallback((updatedMessage: MessageType) => {
    setMessages(prev => prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg)));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const markMessageAsRead = useCallback((messageId: string, collaboratorId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && !msg.readBy.includes(collaboratorId)) {
          return { ...msg, readBy: [...msg.readBy, collaboratorId] };
        }
        return msg;
      })
    );
  }, []);

  const value = useMemo(() => ({
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    markMessageAsRead,
    getMessageRecipients
  }), [messages, addMessage, updateMessage, deleteMessage, markMessageAsRead, getMessageRecipients]);

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
