
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase';
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Collaborator, CollaboratorPermissions } from './CollaboratorsContext';
import { useSystemSettings } from './SystemSettingsContext';
import { addDocumentToCollection, getCollection } from '@/lib/firestore-service';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { settings, loading: loadingSettings } = useSystemSettings();
  
  const app = getFirebaseApp(); 
  const auth = getAuth(app);
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({
    canManageWorkflows: false,
    canManageRequests: false,
    canManageContent: false,
    canViewTasks: false,
    canViewBI: false,
    canViewRankings: false,
    canViewCRM: false,
    canViewStrategicPanel: false,
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Fetch collaborators here directly since this provider is now at the top level
        const collaborators = await getCollection<Collaborator>('collaborators');
        const normalizedEmail = normalizeEmail(firebaseUser.email);
        const collaborator = collaborators.find(c => normalizeEmail(c.email) === normalizedEmail);
        const isSuper = !!firebaseUser.email && settings.superAdminEmails.includes(firebaseUser.email);
        
        const isAllowedDuringMaintenance = !!collaborator && settings.allowedUserIds?.includes(collaborator.id3a);

        if (settings.maintenanceMode && !isSuper && !isAllowedDuringMaintenance) {
            await firebaseSignOut(auth);
            setUser(null);
        } else if (!collaborator && !isSuper && pathname !== '/login') {
            await firebaseSignOut(auth);
            setUser(null);
        } else {
            setUser(firebaseUser);
            setIsSuperAdmin(isSuper);
            const userPermissions = collaborator?.permissions || {};
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
                };
                setPermissions(allPermissions);
                setIsAdmin(true);
            } else {
                setPermissions(userPermissions);
                const hasAnyPermission = Object.values(userPermissions).some(p => p === true);
                setIsAdmin(hasAnyPermission);
            }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setPermissions({
            canManageWorkflows: false, canManageRequests: false, canManageContent: false,
            canViewTasks: false, canViewBI: false, canViewRankings: false,
            canViewCRM: false, canViewStrategicPanel: false,
        });
      }
      setLoading(false); 
    });
    return () => unsubscribe();
  }, [auth, settings.maintenanceMode, settings.superAdminEmails, settings.allowedUserIds, pathname, settings]);

  
  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      
      const email = result.user.email;
      const normalizedEmail = normalizeEmail(email);

      const isSuperAdminLogin = !!email && settings.superAdminEmails.includes(email);
      const collaborators = await getCollection<Collaborator>('collaborators');
      const collaborator = collaborators.find(c => normalizeEmail(c.email) === normalizedEmail);
      const isAllowedDuringMaintenance = !!collaborator && settings.allowedUserIds?.includes(collaborator.id3a);

      if (settings.maintenanceMode && !isSuperAdminLogin && !isAllowedDuringMaintenance) {
         await firebaseSignOut(auth);
         toast({
            title: "Manutenção em Andamento",
            description: settings.maintenanceMessage,
            variant: "default",
            duration: 10000,
         });
         setLoading(false);
         return;
      }
      
      if (collaborator || isSuperAdminLogin) {
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
              description: `Detalhe do erro: ${firebaseError.message}`,
              variant: "destructive",
              duration: 10000,
            });
          }
      } else {
           console.error("Error signing in with Google: ", error);
           toast({
                title: "Erro de Login",
                description: "Ocorreu um problema desconhecido durante o login.",
                variant: "destructive",
                duration: 10000,
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
      loading: loading || loadingSettings,
      isAdmin,
      isSuperAdmin,
      permissions,
      accessToken,
      signInWithGoogle,
      signOut,
  }), [user, loading, loadingSettings, isAdmin, isSuperAdmin, permissions, accessToken, signInWithGoogle, signOut]);

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
