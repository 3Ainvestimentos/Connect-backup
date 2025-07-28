
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase';
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ariva.com.br'];

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];
scopes.forEach(scope => googleProvider.addScope(scope));

// Adiciona o script GAPI ao cabeçalho do documento para que esteja disponível globalmente
const gapiScript = typeof window !== 'undefined' ? document.createElement('script') : null;
if (gapiScript) {
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    document.head.appendChild(gapiScript);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; 
  isSuperAdmin: boolean;
  permissions: CollaboratorPermissions;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { collaborators, loading: loadingCollaborators } = useCollaborators();
  
  const app = getFirebaseApp(); 
  const auth = getAuth(app);
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({
    canManageWorkflows: false,
    canManageRequests: false,
    canManageContent: false,
    canViewTasks: false,
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const collaborator = collaborators.find(c => c.email === user.email);
            if (!collaborator && collaborators.length > 0) { 
                await firebaseSignOut(auth);
                toast({
                    title: "Acesso Negado",
                    description: "Este e-mail não está na lista de colaboradores autorizados.",
                    variant: "destructive"
                });
                setUser(null);
                router.push('/login');
            } else if (collaborator) {
                setUser(user);
            } else if (collaborators.length === 0 && !loadingCollaborators) {
                 await firebaseSignOut(auth);
                 toast({
                    title: "Erro de Configuração",
                    description: "Não foi possível carregar a lista de colaboradores. Acesso negado.",
                    variant: "destructive"
                });
                setUser(null);
                router.push('/login');
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router, collaborators, loadingCollaborators]);


  useEffect(() => {
      if (user && !loadingCollaborators) {
          const isSuper = !!user.email && SUPER_ADMIN_EMAILS.includes(user.email);
          setIsSuperAdmin(isSuper);

          const currentUserCollab = collaborators.find(c => c.email === user.email);
          const userPermissions = currentUserCollab?.permissions || {};
          
          if (isSuper) {
              const allPermissions: CollaboratorPermissions = {
                  canManageWorkflows: true,
                  canManageRequests: true,
                  canManageContent: true,
                  canViewTasks: true,
              };
              setPermissions(allPermissions);
              setIsAdmin(true);
          } else {
              setPermissions(userPermissions);
              const hasAnyPermission = Object.values(userPermissions).some(p => p === true);
              setIsAdmin(hasAnyPermission);
          }
          
      }
  }, [user, collaborators, loadingCollaborators]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
        const idTokenResult = await auth.currentUser.getIdTokenResult(true); // Force refresh
        return idTokenResult.token;
    } catch(error) {
        console.error("Erro ao obter o token de acesso:", error);
        // Tenta reautenticar para obter a credencial
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credentialFromResult = GoogleAuthProvider.credentialFromResult(result);
            return credentialFromResult?.accessToken || null;
        } catch (reauthError) {
             console.error("Erro na tentativa de reautenticação:", reauthError);
             return null;
        }
    }
  }, [auth]);
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
       if (result && result.user) {
          const user = result.user;
          router.push('/dashboard-v2');
          
          const collaborator = collaborators.find(c => c.email === user.email);
          if (collaborator) {
             addDocumentToCollection('audit_logs', {
                eventType: 'login',
                userId: collaborator.id3a,
                userName: collaborator.name,
                timestamp: new Date().toISOString(),
                details: {
                    message: `${collaborator.name} logged in.`,
                }
            });
          }
        }
    } catch (error: unknown) {
      let description = "Ocorreu um problema durante o login. Por favor, tente novamente.";
      if (error instanceof Error && 'code' in error) {
          const firebaseError = error as { code: string; message: string };
          console.error("Firebase Login Error Code:", firebaseError.code);
          console.error("Firebase Login Error Message:", firebaseError.message);
          description = `Detalhe do erro: ${firebaseError.message} (${firebaseError.code})`;
      } else {
           console.error("Error signing in with Google: ", error);
      }
      toast({
            title: "Erro de Login",
            description: description,
            variant: "destructive",
            duration: 10000,
      });
    } finally {
        setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
  };
  
  const value = useMemo(() => ({
      user,
      loading: loading || loadingCollaborators,
      isAdmin,
      isSuperAdmin,
      permissions,
      signInWithGoogle,
      signOut,
      getAccessToken,
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions, signInWithGoogle, signOut, getAccessToken]);

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
