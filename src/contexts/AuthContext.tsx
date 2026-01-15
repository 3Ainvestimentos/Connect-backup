
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase';
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Collaborator, CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection, getCollection, getDocument, updateDocumentInCollection as updateFirestoreDoc } from '@/lib/firestore-service';
import { useSystemSettings } from './SystemSettingsContext';
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import type { FirebaseError } from 'firebase/app';

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];
scopes.forEach(scope => googleProvider.addScope(scope));

interface AuthContextType {
  user: User | null;
  currentUserCollab: Collaborator | null;
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
  const [currentUserCollab, setCurrentUserCollab] = useState<Collaborator | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings();
  
  const app = getFirebaseApp(); 
  const auth = getAuth(app);

  const logAuthDebug = useCallback((label: string, extra?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const context = {
      origin: window.location.origin,
      referrer: document.referrer,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      pathname: window.location.pathname,
    };
    // eslint-disable-next-line no-console
    console.info(`[AuthDebug] ${label}`, { ...context, ...extra });
  }, []);

  const fetchAndSetCollaborator = useCallback(async (firebaseUser: User): Promise<Collaborator | null> => {
    const collaborators = await getCollection<Collaborator>('collaborators');
    let collaborator = collaborators.find(c => c.authUid === firebaseUser.uid);

    if (!collaborator) {
      const normalizedEmail = normalizeEmail(firebaseUser.email);
      const collaboratorByEmail = collaborators.find(c => normalizeEmail(c.email) === normalizedEmail);

      if (collaboratorByEmail) {
        console.log(`Associating authUid for ${normalizedEmail}...`);
        await updateFirestoreDoc('collaborators', collaboratorByEmail.id, { authUid: firebaseUser.uid });
        collaborator = { ...collaboratorByEmail, authUid: firebaseUser.uid };
      }
    }
    
    if (collaborator) {
        setCurrentUserCollab(collaborator);
        const userPermissions = { ...defaultPermissions, ...(collaborator.permissions || {}) };
        setPermissions(userPermissions);
        setIsAdmin(Object.values(userPermissions).some(p => p === true));
    } else {
        setCurrentUserCollab(null);
        setPermissions(defaultPermissions);
        setIsAdmin(false);
    }
    return collaborator;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
            const { maintenanceMode, maintenanceMessage, allowedUserIds, superAdminEmails } = systemSettings;
            const normalizedEmail = normalizeEmail(firebaseUser.email);
            // Normaliza também os emails da lista para comparar corretamente
            const normalizedAdminEmails = superAdminEmails.map(email => normalizeEmail(email)).filter((email): email is string => email !== null);
            const isSuper = !!normalizedEmail && (normalizedAdminEmails.includes(normalizedEmail) || superAdminEmails.includes(normalizedEmail));
            
            const collaborator = await fetchAndSetCollaborator(firebaseUser);

            const isAllowedDuringMaintenance = collaborator ? allowedUserIds.includes(collaborator.id3a) : false;

            if (maintenanceMode && !isSuper && !isAllowedDuringMaintenance) {
                await firebaseSignOut(auth);
                setUser(null);
                setCurrentUserCollab(null);
                toast({ title: "Manutenção", description: maintenanceMessage, duration: 9000 });
            } else if (!collaborator && !isSuper) {
                 await firebaseSignOut(auth);
                 setUser(null);
                 setCurrentUserCollab(null);
                 toast({ title: "Acesso Negado", description: "Seu perfil não foi encontrado na base de dados de colaboradores.", variant: 'destructive' });
            } else {
                setUser(firebaseUser);
                setIsSuperAdmin(isSuper);
                if (isSuper) {
                    const allPermissions = Object.keys(defaultPermissions).reduce((acc, key) => {
                        acc[key as keyof CollaboratorPermissions] = true;
                        return acc;
                    }, {} as CollaboratorPermissions);
                    setPermissions(allPermissions);
                    setIsAdmin(true);
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
        setCurrentUserCollab(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setPermissions(defaultPermissions);
      }
      setLoading(false); 
    });
    return () => unsubscribe();
  }, [auth, systemSettings, fetchAndSetCollaborator]);

  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { maintenanceMode, maintenanceMessage, allowedUserIds, superAdminEmails } = systemSettings;
      
      logAuthDebug('signInWithGoogle:start');
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const collaborator = await fetchAndSetCollaborator(firebaseUser);
      const normalizedEmail = normalizeEmail(firebaseUser.email);
      // Normaliza também os emails da lista para comparar corretamente
      const normalizedAdminEmails = superAdminEmails.map(email => normalizeEmail(email)).filter((email): email is string => email !== null);
      const isSuper = !!normalizedEmail && (normalizedAdminEmails.includes(normalizedEmail) || superAdminEmails.includes(normalizedEmail));

      if (maintenanceMode) {
          const isAllowedDuringMaintenance = !!collaborator && (allowedUserIds || []).includes(collaborator.id3a);
          if (!isSuper && !isAllowedDuringMaintenance) {
              await firebaseSignOut(auth);
              toast({ title: "Manutenção em Andamento", description: maintenanceMessage, duration: 9000 });
              setLoading(false);
              return;
          }
      }
      
      if (collaborator || isSuper) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setAccessToken(credential.accessToken);
        }
        
        await addDocumentToCollection('audit_logs', {
            eventType: 'login',
            userId: collaborator?.id3a || firebaseUser.uid,
            userName: collaborator?.name || firebaseUser.displayName || 'Super Admin',
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
      const firebaseError = error as FirebaseError | undefined;
      if (firebaseError?.code) {
        if (firebaseError.code !== 'auth/popup-closed-by-user' && firebaseError.code !== 'auth/cancelled-popup-request') {
          logAuthDebug('signInWithGoogle:error', {
            code: firebaseError.code,
            message: firebaseError.message,
            customData: firebaseError.customData,
          });
          // eslint-disable-next-line no-console
          console.error("Firebase Login Error:", firebaseError);
          toast({
            title: "Erro de Login",
            description: `Código: ${firebaseError.code}. Mensagem: ${firebaseError.message}`,
            variant: "destructive",
          });
        }
      } else {
        logAuthDebug('signInWithGoogle:unknown-error', { error });
        // eslint-disable-next-line no-console
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
      setCurrentUserCollab(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
  };
  
  const value = useMemo(() => ({
      user,
      currentUserCollab,
      loading: loading || settingsLoading,
      isAdmin,
      isSuperAdmin,
      permissions,
      accessToken,
      signInWithGoogle,
      signOut,
  }), [user, currentUserCollab, loading, settingsLoading, isAdmin, isSuperAdmin, permissions, accessToken, signInWithGoogle, signOut]);

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
