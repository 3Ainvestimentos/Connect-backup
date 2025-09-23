
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase';
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Collaborator, CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection, getDocument, getCollection } from '@/lib/firestore-service';

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];
scopes.forEach(scope => googleProvider.addScope(scope));

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; 
  isSuperAdmin: boolean;
  permissions: CollaboratorPermissions;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeEmail = (email: string | null | undefined): string | null => {
    if (!email) return null;
    return email.replace(/@3ariva\.com\.br$/, '@3ainvestimentos.com.br');
}

const defaultPermissions: CollaboratorPermissions = {
  canManageWorkflows: false,
  canManageRequests: false,
  canManageContent: false,
  canViewTasks: false,
  canViewBI: false,
  canViewRankings: false,
  canViewCRM: false,
  canViewStrategicPanel: false,
  canViewOpportunityMap: false,
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const app = getFirebaseApp(); 
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
            const systemConfig = await getDocument<{ maintenanceMode: boolean, maintenanceMessage: string, allowedUserIds: string[], superAdminEmails: string[] }>('systemSettings', 'config');
            const maintenanceMode = systemConfig?.maintenanceMode ?? false;
            const maintenanceMessage = systemConfig?.maintenanceMessage ?? 'Manutenção em andamento.';
            const allowedUserIds = systemConfig?.allowedUserIds ?? [];
            const superAdminEmails = systemConfig?.superAdminEmails || [];

            const normalizedEmail = normalizeEmail(firebaseUser.email);
            const collaborators = await getCollection<Collaborator>('collaborators');
            const collaborator = collaborators.find(c => normalizeEmail(c.email) === normalizedEmail);

            const isSuper = !!normalizedEmail && superAdminEmails.includes(normalizedEmail);
            const isAllowedDuringMaintenance = !!collaborator && allowedUserIds.includes(collaborator.id3a);

            if (maintenanceMode && !isSuper && !isAllowedDuringMaintenance) {
                await firebaseSignOut(auth);
                setUser(null);
                toast({ title: "Manutenção", description: maintenanceMessage, duration: 9000 });
            } else if (!collaborator && !isSuper) {
                 await firebaseSignOut(auth);
                 setUser(null);
                 toast({ title: "Acesso Negado", description: "Seu e-mail não foi encontrado na lista de colaboradores.", variant: 'destructive' });
            } else {
                setUser(firebaseUser);
                setIsSuperAdmin(isSuper);
                const userPermissions = { ...defaultPermissions, ...(collaborator?.permissions || {}) };

                if (isSuper) {
                    const allPermissions: CollaboratorPermissions = {
                        canManageWorkflows: true,
                        canManageRequests: true,
                        canManageContent: true,
                        canViewTasks: true,
                        canViewBI: true,
                        canViewRankings: true,
                        canViewCRM: true,
                        canViewStrategicPanel: true,
                        canViewOpportunityMap: true,
                    };
                    setPermissions(allPermissions);
                    setIsAdmin(true);
                } else {
                    setPermissions(userPermissions);
                    setIsAdmin(Object.values(userPermissions).some(p => p === true));
                }
            }
        } catch (e) {
             console.error("Error during auth state change verification:", e);
             await firebaseSignOut(auth);
             setUser(null);
             toast({ title: "Erro de Configuração", description: "Não foi possível verificar as configurações do sistema.", variant: 'destructive' });
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setPermissions(defaultPermissions);
      }
      setLoading(false); 
    });
    return () => unsubscribe();
  }, [auth]);

  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const systemConfig = await getDocument<{ maintenanceMode: boolean, maintenanceMessage: string, allowedUserIds: string[], superAdminEmails?: string[] }>('systemSettings', 'config')
        .catch(err => {
          console.warn("Could not fetch system config, assuming maintenance is off.", err);
          return { maintenanceMode: false, maintenanceMessage: 'Manutenção em andamento.' };
        });

      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      const normalizedEmail = normalizeEmail(email);

      const superAdminEmails = systemConfig?.superAdminEmails || [];
      const isSuper = !!normalizedEmail && superAdminEmails.includes(normalizedEmail);
      
      const collaborators = await getCollection<Collaborator>('collaborators');
      const collaborator = collaborators.find(c => normalizeEmail(c.email) === normalizedEmail);

      if (systemConfig?.maintenanceMode) {
          const isAllowedDuringMaintenance = !!collaborator && (systemConfig?.allowedUserIds || []).includes(collaborator.id3a);
          if (!isSuper && !isAllowedDuringMaintenance) {
              await firebaseSignOut(auth);
              toast({ title: "Manutenção em Andamento", description: systemConfig.maintenanceMessage, duration: 9000 });
              setLoading(false);
              return;
          }
      }
      
      if (collaborator || isSuper) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setAccessToken(credential.accessToken);
        }
        
        const userToLog = collaborator || { 
            id3a: result.user.uid, 
            name: result.user.displayName || 'Super Admin' 
        };

        await addDocumentToCollection('audit_logs', {
            eventType: 'login',
            userId: userToLog.id3a,
            userName: userToLog.name,
            timestamp: new Date().toISOString(),
            details: {}
        });
        
        router.push('/dashboard');
      } else {
        await firebaseSignOut(auth);
        toast({
            title: "Acesso Negado",
            description: "Seu e-mail não foi encontrado na lista de colaboradores.",
            variant: "destructive"
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
          const firebaseError = error as { code: string; message: string };
          if (firebaseError.code !== 'auth/popup-closed-by-user' && firebaseError.code !== 'auth/cancelled-popup-request') {
            console.error("Firebase Login Error:", firebaseError);
            toast({
              title: "Erro de Login",
              description: `Ocorreu um problema desconhecido durante o login.`,
              variant: "destructive",
            });
          }
      } else {
           console.error("Error signing in with Google: ", error);
           toast({
                title: "Erro de Login",
                description: "Ocorreu um problema desconhecido durante o login.",
                variant: "destructive",
           });
      }
    } finally {
        setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAccessToken(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
  };
  
  const value = useMemo(() => ({
      user,
      loading,
      isAdmin,
      isSuperAdmin,
      permissions,
      accessToken,
      signInWithGoogle,
      signOut,
  }), [user, loading, isAdmin, isSuperAdmin, permissions, accessToken, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
