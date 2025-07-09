
"use client";

import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import type { WithId } from '@/lib/firestore-service';

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

// Mock data for local state management
const mockApplications: Application[] = [
    { id: 'app-1', name: 'Meu Perfil', icon: 'UserCircle', type: 'modal', modalId: 'profile' },
    { id: 'app-2', name: 'Solicitar Férias', icon: 'Plane', type: 'modal', modalId: 'vacation' },
    { id: 'app-3', name: 'Suporte T.I.', icon: 'Headset', type: 'modal', modalId: 'support' },
    { id: 'app-4', name: 'Administrativo', icon: 'Briefcase', type: 'modal', modalId: 'admin' },
    { id: 'app-5', name: 'Solicitações Marketing', icon: 'Megaphone', type: 'modal', modalId: 'marketing' },
    { id: 'app-6', name: 'Google', icon: 'Globe', type: 'external', href: 'https://google.com' },
];


interface ApplicationsContextType {
  applications: Application[];
  loading: boolean;
  addApplication: (app: Omit<Application, 'id'>) => Promise<Application>;
  updateApplication: (app: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [loading, setLoading] = useState(false);

  const addApplication = async (appData: Omit<Application, 'id'>): Promise<Application> => {
    setLoading(true);
    const newApplication: Application = {
        ...appData,
        id: `app-${Date.now()}` // Generate a simple unique ID for local state
    };
    setApplications(prev => [...prev, newApplication]);
    setLoading(false);
    return newApplication;
  };

  const updateApplication = async (updatedApp: Application): Promise<void> => {
    setLoading(true);
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
    setLoading(false);
  };

  const deleteApplication = async (id: string): Promise<void> => {
    setLoading(true);
    setApplications(prev => prev.filter(app => app.id !== id));
    setLoading(false);
  };

  const value = useMemo(() => ({
    applications,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
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
