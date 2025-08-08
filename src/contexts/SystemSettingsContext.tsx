
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocument, setDocumentInCollection } from '@/lib/firestore-service';

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedUserIds: string[];
  termsUrl: string;
  termsVersion: number;
  privacyPolicyUrl: string;
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
};

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: settings = defaultSettings, isFetching } = useQuery<SystemSettings>({
    queryKey: [COLLECTION_NAME, DOC_ID],
    queryFn: async () => {
        const doc = await getDocument<SystemSettings>(COLLECTION_NAME, DOC_ID);
        if (!doc) {
            // If the config doesn't exist, create it with defaults.
            await setDocumentInCollection(COLLECTION_NAME, DOC_ID, defaultSettings);
            return defaultSettings;
        }
        // Merge fetched doc with defaults to ensure all keys are present
        return { ...defaultSettings, ...doc };
    },
    staleTime: Infinity,
  });

  const updateSettingsMutation = useMutation<void, Error, Partial<SystemSettings>>({
    mutationFn: (newSettings) => setDocumentInCollection(COLLECTION_NAME, DOC_ID, newSettings),
    onSuccess: (data, variables) => {
        // Optimistically update the cache
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
