"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { addDocumentToCollection, updateDocumentInCollection, deleteDocumentFromCollection, seedCollection } from '@/lib/firestore-service';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

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
  const [snapshot, loading, error] = useCollection(collection(db, COLLECTION_NAME));

  const applications = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
  }, [snapshot]);
  
  // Seeding logic for first-time use
  useEffect(() => {
    const seedDataIfNeeded = async () => {
        // Only seed if loading is finished, there's a snapshot, and it's empty.
        if (!loading && snapshot && snapshot.empty) {
            console.log(`Seeding ${COLLECTION_NAME} collection...`);
            await seedCollection(COLLECTION_NAME, initialApplications);
        }
    };
    seedDataIfNeeded();
  }, [loading, snapshot]);
  
  useEffect(() => {
    if (error) {
        console.error("Error fetching applications:", error);
        toast({ title: 'Erro ao carregar aplicações', description: error.message, variant: 'destructive' });
    }
  }, [error]);

  // The functions no longer need to update local state.
  // react-firebase-hooks will do it automatically when Firestore changes.
  const addApplication = useCallback(async (appData: Omit<Application, 'id'>) => {
    await addDocumentToCollection(COLLECTION_NAME, appData);
  }, []);

  const updateApplication = useCallback(async (updatedApp: Application) => {
    await updateDocumentInCollection(COLLECTION_NAME, updatedApp.id, updatedApp);
  }, []);

  const deleteApplication = useCallback(async (id: string) => {
    await deleteDocumentFromCollection(COLLECTION_NAME, id);
  }, []);
  
  const value = useMemo(() => ({
      applications, 
      loading,
      addApplication, 
      updateApplication, 
      deleteApplication 
  }), [applications, loading, addApplication, updateApplication, deleteApplication]);

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
