
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ainvestimentos.com.br'];
const ALLOWED_DOMAINS = ['3ainvestimentos.com.br']; // Adicione outros domínios autorizados aqui

const defaultPermissions: CollaboratorPermissions = {
    canViewAnalytics: false,
    canManageWorkflows: false,
    canManageRequests: false,
    canManageContent: false,
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // General flag: true if any permission is granted or is super admin
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
  
  const app = getFirebaseApp(); // Initialize Firebase
  const auth = getAuth(app);
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setLoading(false);
        setPermissions(defaultPermissions);
        setIsSuperAdmin(false);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
      if (user && !loadingCollaborators) {
          const isSuper = SUPER_ADMIN_EMAILS.includes(user.email || '');
          setIsSuperAdmin(isSuper);

          const currentUserCollab = collaborators.find(c => c.email === user.email);
          const userPermissions = currentUserCollab?.permissions || defaultPermissions;
          
          if (isSuper) {
              // Super admin has all permissions
              const allPermissions: CollaboratorPermissions = {
                  canViewAnalytics: true,
                  canManageWorkflows: true,
                  canManageRequests: true,
                  canManageContent: true,
              };
              setPermissions(allPermissions);
              setIsAdmin(true);
          } else {
              setPermissions(userPermissions);
              // User is an admin if they have at least one specific permission
              const hasAnyPermission = Object.values(userPermissions).some(p => p === true);
              setIsAdmin(hasAnyPermission);
          }
          
          setLoading(false); // Stop loading only after all checks are done
      } else if (!user && !loading) {
          // If there's no user and auth is not loading anymore, we're done.
          setLoading(false);
      }
  }, [user, collaborators, loadingCollaborators, loading]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      if (!userEmail) {
        await firebaseSignOut(auth);
        toast({
            title: "Erro de Login",
            description: "Não foi possível verificar seu e-mail. Tente novamente.",
            variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const domain = userEmail.split('@')[1];
      if (!ALLOWED_DOMAINS.includes(domain)) {
        await firebaseSignOut(auth);
        toast({
            title: "Acesso Negado",
            description: "Este e-mail não pertence a um domínio autorizado para acessar esta aplicação.",
            variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      router.push('/dashboard');

    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
            title: "Erro de Login",
            description: "Ocorreu um problema durante o login. Por favor, tente novamente.",
            variant: "destructive"
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
