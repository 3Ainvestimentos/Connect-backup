
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithRedirect, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ariva.com.br'];

// Add Google Calendar & Drive scopes
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');


const defaultPermissions: CollaboratorPermissions = {
    canManageWorkflows: false,
    canManageRequests: false,
    canManageContent: false,
    canViewTasks: false,
};

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
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if this is a redirect from Google login
            const credential = GoogleAuthProvider.credentialFromError(null);
            if (credential) {
                // This case handles the redirect result.
                // We don't need to do anything here because the onAuthStateChanged
                // listener already gives us the signed-in user object.
            }

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
                 await addDocumentToCollection('audit_logs', {
                  eventType: 'login',
                  userId: collaborator?.id3a || user.email,
                  userName: collaborator?.name || user.displayName || 'Usuário',
                  timestamp: new Date().toISOString(),
                  details: {
                      message: `${collaborator?.name || user.displayName} logged in.`,
                  }
              });
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, [auth, router, collaborators]);


  useEffect(() => {
      if (user && !loadingCollaborators) {
          const isSuper = !!user.email && SUPER_ADMIN_EMAILS.includes(user.email);
          setIsSuperAdmin(isSuper);

          const currentUserCollab = collaborators.find(c => c.email === user.email);
          const userPermissions = currentUserCollab?.permissions || defaultPermissions;
          
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
              setPermissions({ ...defaultPermissions, ...userPermissions });
              const hasAnyPermission = Object.values(userPermissions).some(p => p === true);
              setIsAdmin(hasAnyPermission);
          }
          
      } else if (!user && !loading) {
          // Do nothing, let the onAuthStateChanged handle it
      }
  }, [user, collaborators, loadingCollaborators, loading]);

  const getAccessToken = async (): Promise<string | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    try {
        const idTokenResult = await currentUser.getIdTokenResult(true); // force refresh
        const credential = GoogleAuthProvider.credential(idTokenResult.token);
        return credential?.accessToken || null;
    } catch(error) {
        console.error("Error getting access token:", error);
        return null;
    }
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      googleProvider.setCustomParameters({ 'hd': '3ainvestimentos.com.br' });
      await signInWithRedirect(auth, googleProvider);
      // The rest of the logic (redirecting, logging audit) is handled
      // by the onAuthStateChanged listener to ensure it runs after the redirect.
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
      getAccessToken,
      signInWithGoogle,
      signOut
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions]);

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
