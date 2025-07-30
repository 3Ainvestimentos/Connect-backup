
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase';
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ariva.com.br'];

const scopes = [
  'https://www.googleapis.com/auth/calendar',
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
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
    canViewBI: false,
    canViewCRM: false,
    canViewStrategicPanel: false,
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
                setAccessToken(null);
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
                setAccessToken(null);
                router.push('/login');
            }
        } else {
            setUser(null);
            setAccessToken(null);
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
                  canViewBI: true,
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
  }, [user, collaborators, loadingCollaborators]);

  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      const collaborator = collaborators.find(c => c.email === result.user.email);
      if (collaborator) {
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
          // Do not log "popup closed by user" as an error, it's a normal action.
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
      loading: loading || loadingCollaborators,
      isAdmin,
      isSuperAdmin,
      permissions,
      accessToken,
      signInWithGoogle,
      signOut,
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions, accessToken, signOut]);

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
