
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ariva.com.br'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; 
  isSuperAdmin: boolean;
  permissions: CollaboratorPermissions;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
            if (!collaborator) {
                await firebaseSignOut(auth);
                toast({
                    title: "Acesso Negado",
                    description: "Este e-mail não está na lista de colaboradores autorizados.",
                    variant: "destructive"
                });
                setUser(null);
                router.push('/login');
            } else {
                setUser(user);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router, collaborators]);

  // Handle redirect result (useful if we ever switch back to redirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          const user = result.user;
          const collaborator = collaborators.find(c => c.email === user.email);
          if (collaborator) {
             addDocumentToCollection('audit_logs', {
                eventType: 'login',
                userId: collaborator?.id3a || user.email,
                userName: collaborator?.name || user.displayName || 'Usuário',
                timestamp: new Date().toISOString(),
                details: {
                    message: `${collaborator?.name || user.displayName} logged in.`,
                }
            });
            router.push('/dashboard');
          }
        }
      }).catch((error) => {
          console.error("Firebase Redirect Error:", error);
      });
  }, [auth, collaborators, router]);


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

  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
       if (result && result.user) {
          const user = result.user;
          const collaborator = collaborators.find(c => c.email === user.email);
          if (collaborator) {
             addDocumentToCollection('audit_logs', {
                eventType: 'login',
                userId: collaborator?.id3a || user.email,
                userName: collaborator?.name || user.displayName || 'Usuário',
                timestamp: new Date().toISOString(),
                details: {
                    message: `${collaborator?.name || user.displayName} logged in.`,
                }
            });
            router.push('/dashboard');
          } else {
             // This case is important for when a non-authorized user signs in.
             await firebaseSignOut(auth);
             toast({
                title: "Acesso Negado",
                description: "Seu e-mail não foi encontrado na lista de colaboradores autorizados.",
                variant: "destructive"
             });
             setLoading(false);
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
      signOut
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions, signInWithGoogle, signOut]);

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
