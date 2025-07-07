"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { getCollection, addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';

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
  loading: boolean;
  addApplication: (app: Omit<Application, 'id'>) => Promise<void>;
  updateApplication: (app: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

const initialApplications: Omit<Application, 'id'>[] = [
  { name: 'Meu Perfil', icon: 'UserCircle', type: 'modal', modalId: 'profile' },
  { name: 'Slack', icon: 'MessagesSquare', type: 'external', href: 'https://slack.com/intl/pt-br/' },
  { name: 'Férias', icon: 'Plane', type: 'modal', modalId: 'vacation' },
  { name: 'Suporte TI', icon: 'Headset', type: 'modal', modalId: 'support' },
  { name: 'Administrativo', icon: 'Briefcase', type: 'modal', modalId: 'admin' },
  { name: 'Marketing', icon: 'Megaphone', type: 'modal', modalId: 'marketing' },
  {
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

const COLLECTION_NAME = 'applications';

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getCollection<Application>(COLLECTION_NAME);
       if (data.length === 0) {
        await seedCollection(COLLECTION_NAME, initialApplications);
        const seededData = await getCollection<Application>(COLLECTION_NAME);
        setApplications(seededData);
      } else {
        setApplications(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const addApplication = async (appData: Omit<Application, 'id'>) => {
    const newApp = await addDocumentToCollection(COLLECTION_NAME, appData);
    if (newApp) {
        setApplications(prev => [newApp as Application, ...prev]);
    }
  };

  const updateApplication = async (updatedApp: Application) => {
    const success = await updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp);
    if(success) {
        setApplications(prev => prev.map(app => (app.id === updatedApp.id ? updatedApp : app)));
    }
  };

  const deleteApplication = async (id: string) => {
    const success = await deleteDocumentFromCollection(COLLECTION_NAME, id);
    if(success) {
        setApplications(prev => prev.filter(app => app.id !== id));
    }
  };
  
  const value = useMemo(() => ({
      applications, 
      loading,
      addApplication, 
      updateApplication, 
      deleteApplication 
  }), [applications, loading]);

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
