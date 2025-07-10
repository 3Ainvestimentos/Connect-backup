
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { cleanDataForFirestore } from '@/lib/data-sanitizer';

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
  addApplication: (app: Omit<Application, 'id'>) => Promise<Application>;
  updateApplication: (app: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

// Helper to generate a unique ID for mock items
const generateMockId = () => `mock_${Date.now()}_${Math.random()}`;

export const ApplicationsProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate initial data loading from a "database"
  useEffect(() => {
    // In a real app, this would be a fetch call.
    // For now, we initialize with an empty array or could use mock data.
    setApplications([]); 
    setLoading(false);
  }, []);

  const addApplication = useCallback(async (appData: Omit<Application, 'id'>): Promise<Application> => {
    setLoading(true);
    const cleanedData = cleanDataForFirestore(appData);
    const newApplication: Application = { id: generateMockId(), ...cleanedData };
    setApplications(prev => [...prev, newApplication]);
    setLoading(false);
    return newApplication;
  }, []);

  const updateApplication = useCallback(async (updatedApp: Application): Promise<void> => {
    setLoading(true);
    const cleanedData = cleanDataForFirestore(updatedApp);
    setApplications(prev => prev.map(app => app.id === cleanedData.id ? cleanedData : app));
    setLoading(false);
  }, []);

  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setApplications(prev => prev.filter(app => app.id !== id));
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    applications,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
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
