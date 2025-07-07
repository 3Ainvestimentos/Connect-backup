"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export interface ApplicationLinkItem {
  id: string;
  label: string;
  subtext?: string;
  link?: string;
}
export interface Application {
  id: string;
  name: string;
  icon: string; // Lucide icon name as string
  type: 'modal' | 'external';
  modalId?: 'profile' | 'vacation' | 'support' | 'admin' | 'marketing' | 'generic';
  href?: string;
  content?: {
    title: string;
    description: string;
    items: ApplicationLinkItem[];
  };
}

interface ApplicationsContextType {
  applications: Application[];
  addApplication: (app: Omit<Application, 'id'>) => void;
  updateApplication: (app: Application) => void;
  deleteApplication: (id: string) => void;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

const initialApplications: Application[] = [
  { id: 'profile', name: 'Meu Perfil', icon: 'UserCircle', type: 'modal', modalId: 'profile' },
  { id: 'slack', name: 'Slack', icon: 'MessagesSquare', type: 'external', href: 'https://slack.com/intl/pt-br/' },
  { id: 'vacation', name: 'Férias', icon: 'Plane', type: 'modal', modalId: 'vacation' },
  { id: 'support', name: 'Suporte TI', icon: 'Headset', type: 'modal', modalId: 'support' },
  { id: 'admin', name: 'Administrativo', icon: 'Briefcase', type: 'modal', modalId: 'admin' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', type: 'modal', modalId: 'marketing' },
  {
    id: 'rh-links',
    name: 'Links RH',
    icon: 'Book',
    type: 'modal',
    modalId: 'generic',
    content: {
      title: 'Links Úteis de RH',
      description: 'Acesse rapidamente os formulários e informações de Recursos Humanos.',
      items: [
        { id: 'rh1', label: 'Formulário de Feedback', subtext: 'Compartilhe sua opinião anonimamente.', link: '#' },
        { id: 'rh2', label: 'Plano de Carreira', subtext: 'Veja as trilhas de desenvolvimento.', link: '#' },
      ],
    },
  },
];


export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', initialApplications);

  const addApplication = useCallback((appData: Omit<Application, 'id'>) => {
    const newApp: Application = { ...appData, id: `app-${Date.now()}` };
    setApplications(prev => [newApp, ...prev]);
  }, [setApplications]);

  const updateApplication = useCallback((updatedApp: Application) => {
    setApplications(prev => prev.map(app => (app.id === updatedApp.id ? updatedApp : app)));
  }, [setApplications]);

  const deleteApplication = useCallback((id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  }, [setApplications]);
  
  const value = useMemo(() => ({
      applications, 
      addApplication, 
      updateApplication, 
      deleteApplication 
  }), [applications, addApplication, updateApplication, deleteApplication]);

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
};

export const useApplications = (): ApplicationsContextType => {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
};
