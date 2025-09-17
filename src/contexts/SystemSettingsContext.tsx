
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, setDocumentInCollection } from '@/lib/firestore-service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedUserIds: string[];
  termsUrl: string;
  termsVersion: number;
  privacyPolicyUrl: string;
  privacyPolicyVersion: number;
  superAdminEmails: string[];
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

const COLLECTION_NAME = 'systemSettings';
const DOC_ID = 'config'; // Use a single document for all settings

const defaultSettings: SystemSettings = {
    maintenanceMode: false,
    maintenanceMessage: 'A plataforma está temporariamente indisponível para manutenção. Voltaremos em breve.',
    allowedUserIds: [],
    termsUrl: '',
    termsVersion: 1,
    privacyPolicyUrl: '',
    privacyPolicyVersion: 1,
    superAdminEmails: ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ainvestimentos.com.br'],
};

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const auth = getAuth(getFirebaseApp());

  const { data: settings = defaultSettings, isFetching } = useQuery<SystemSettings>({
    queryKey: [COLLECTION_NAME, DOC_ID],
    queryFn: async () => {
      // This query now runs immediately, but its internal logic depends on the auth state.
      const currentUser = auth.currentUser;
      
      // If there's no user (e.g., on the login page), we can't fetch.
      // Return default settings to avoid permission errors. The query will refetch once auth state changes.
      if (!currentUser) {
        return defaultSettings;
      }
      
      const doc = await getDocument<SystemSettings>(COLLECTION_NAME, DOC_ID);
      if (!doc) {
          try {
              // Attempt to create the settings doc if it doesn't exist. This might fail if rules are strict.
              await setDocumentInCollection(COLLECTION_NAME, DOC_ID, defaultSettings);
              return defaultSettings;
          } catch(e) {
              console.warn("Could not create default system settings. This may be due to security rules.");
              return defaultSettings;
          }
      }
      return { ...defaultSettings, ...doc };
    },
    staleTime: 5 * 60 * 1000,
  });

  // This effect will re-trigger the query when the user logs in or out.
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_NAME, DOC_ID] });
    });
    return () => unsubscribe();
  }, [auth, queryClient]);


  const updateSettingsMutation = useMutation<void, Error, Partial<SystemSettings>>({
    mutationFn: (newSettings) => setDocumentInCollection(COLLECTION_NAME, DOC_ID, newSettings),
    onSuccess: (data, variables) => {
        queryClient.setQueryData([COLLECTION_NAME, DOC_ID], (old: SystemSettings | undefined) => ({
            ...(old || defaultSettings),
            ...variables,
        }));
    },
  });

  const value = useMemo(() => ({
    settings,
    loading: isFetching,
    updateSystemSettings: (newSettings) => updateSettingsMutation.mutateAsync(newSettings),
  }), [settings, isFetching, updateSettingsMutation]);

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = (): SystemSettingsContextType => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};
