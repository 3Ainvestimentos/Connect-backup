
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ariva.com.br'];

// Define os escopos de API que a aplicação precisa.
const scopes = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];
scopes.forEach(scope => googleProvider.addScope(scope));


interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; 
  isSuperAdmin: boolean;
  permissions: CollaboratorPermissions;
  getAccessToken: () => Promise<string | null>;
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
            router.push('/dashboard-v2');
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

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      // Força a atualização do token para garantir que não está expirado.
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      // O 'token' no idTokenResult é o ID token, não o access token para APIs.
      // O access token precisa ser obtido a partir da credencial do login.
      // Esta é a maneira mais confiável: refazer o login silenciosamente para obter a credencial.
      const credential = GoogleAuthProvider.credential(idTokenResult.token);
       // A maneira mais direta de obter o access token não está disponível publicamente
       // no objeto do usuário. A forma mais segura é armazená-lo após o login.
       // No entanto, para fins de API, o ID Token pode ser suficiente ou precisaremos
       // do access token do resultado do popup/redirect.

       // Para o GAPI, precisamos do Access Token. Vamos tentar obtê-lo do resultado do login.
       // Como não armazenamos o resultado, vamos ter que reautenticar.
       // Isso não deve exigir interação do usuário se ele já estiver logado.
       const result = await signInWithPopup(auth, googleProvider);
       const credentialFromResult = GoogleAuthProvider.credentialFromResult(result);
       return credentialFromResult?.accessToken || null;

    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }, [auth]);

  
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
            router.push('/dashboard-v2');
          } else {
             await firebaseSignOut(auth);
             toast({
                title: "Acesso Negado",
                description: "Seu e-mail não foi encontrado na lista de colaboradores autorizados.",
                variant: "destructive"
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
      getAccessToken,
      signInWithGoogle,
      signOut
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions, getAccessToken, signInWithGoogle, signOut]);

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
