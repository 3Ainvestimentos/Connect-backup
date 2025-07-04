"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export interface MessageType {
  id: string;
  title: string;
  content: string;
  sender: string;
  date: string; // ISO date string e.g. "2024-07-25"
}

const initialMessages: MessageType[] = [
  { id: '1', title: 'Atualização da Política de Férias', content: 'Lembrete: A nova política de férias entrará em vigor a partir de 1º de Agosto. Todos os colaboradores devem revisar o documento disponível na intranet para entender as mudanças nos processos de solicitação e aprovação. O documento detalha os novos períodos aquisitivos e as regras para venda de dias de férias. Qualquer dúvida, entre em contato com o departamento de RH.', sender: 'RH', date: '2024-07-25' },
  { id: '2', title: 'Confraternização de Fim de Mês', content: 'Não se esqueçam do nosso happy hour amanhã, às 17h30! Teremos petiscos, bebidas e música ao vivo no terraço. Contamos com a presença de todos!', sender: 'Comunicação', date: '2024-07-24' },
  { id: '3', title: 'Manutenção Programada', content: 'O sistema de TI passará por uma manutenção no sábado, das 8h às 12h. Durante este período, o acesso aos servidores de arquivos e ao sistema de CRM poderá ficar indisponível.', sender: 'Suporte TI', date: '2024-07-22' },
  { id: '4', title: 'Pesquisa de Clima Organizacional', content: 'Sua opinião é muito importante! Por favor, responda à pesquisa de clima até o final desta semana. O link foi enviado para o seu e-mail. A participação é anônima.', sender: 'RH', date: '2024-07-26' },
  { id: '5', title: 'Nova Máquina de Café na Copa', content: 'Boas notícias para os amantes de café! Instalamos uma nova máquina de café expresso na copa do 2º andar. Aproveitem!', sender: 'Administrativo', date: '2024-07-26' },
  { id: '6', title: 'Exercício de Evacuação de Emergência', content: 'Realizaremos um exercício de evacuação de emergência na próxima quarta-feira, às 15h. A participação de todos é obrigatória. Por favor, familiarize-se com as rotas de fuga mais próximas da sua estação de trabalho. Mais instruções serão dadas pelos líderes de cada andar no dia do exercício.', sender: 'Segurança', date: '2024-07-27' },
  { id: '7', title: 'Resultados do Q2', content: 'Apresentação dos resultados do segundo trimestre será na sexta-feira às 10h na sala de reuniões principal. Venha conferir o crescimento da empresa e os próximos passos.', sender: 'Diretoria', date: '2024-07-28' },
  { id: '8', title: 'Campanha do Agasalho', content: 'A campanha do agasalho está na reta final! As doações podem ser entregues na caixa da recepção até amanhã. Sua contribuição faz a diferença!', sender: 'Comunicação', date: '2024-07-29' },
];

interface MessagesContextType {
  messages: MessageType[];
  addMessage: (message: Omit<MessageType, 'id'>) => void;
  updateMessage: (message: MessageType) => void;
  deleteMessage: (id: string) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);

  const addMessage = useCallback((messageData: Omit<MessageType, 'id'>) => {
    const newMessage: MessageType = { ...messageData, id: `msg-${Date.now()}` };
    setMessages(prev => [newMessage, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const updateMessage = useCallback((updatedMessage: MessageType) => {
    setMessages(prev => prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg)));
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const value = useMemo(() => ({
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
  }), [messages, addMessage, updateMessage, deleteMessage]);

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
