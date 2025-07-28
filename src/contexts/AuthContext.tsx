
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from './CollaboratorsContext';
import type { CollaboratorPermissions } from './CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';

const SUPER_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br', 'pedro.rosa@3ainvestimentos.com.br'];
const ALLOWED_TEST_USERS = [
  'alice.passos@3ainvestimentos.com.br',
  'anajulia.couto@3ariva.com.br',
  'atendimento91@3ainvestimentos.com.br',
  'barbara.fiche@3ainvestimentos.com.br',
  'barbara@3ainvestimentos.com.br',
  'daphne.clementoni@3ainvestimentos.com.br',
  'fernanda.adami@3ainvestimentos.com.br',
  'gente@3ariva.com.br',
  'leonardo@3ainvestimentos.com.br',
  'joao.pompeu@3ainvestimentos.com.br',
  'marcio.peixoto@3ariva.com.br',
  'infra@3ariva.com.br',
  'matheus@3ainvestimentos.com.br',
  'suzana.didier@3ainvestimentos.com.br',
  'ti@3ariva.com.br',
  'wallison.nunes@3ainvestimentos.com.br',
  'luanda.beatriz@3ainvestimentos.com.br',
  'gustavo.goudim@3ainvestimentos.com.br',
  'dalcion.franco@3ainvestimentos.com.br',
  'stefania.otoni@3ainvestimentos.com.br',
  'pablo.costa@3ainvestimentos.com.br',
  'pedro.rosa@3ainvestimentos.com.br'
];
const ALLOWED_DOMAINS = ['3ainvestimentos.com.br', '3ariva.com.br'];

// Add Google Calendar scopes
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const { collaborators, loading: loadingCollaborators } = useCollaborators();
  
  const app = getFirebaseApp(); 
  const auth = getAuth(app);
  
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(defaultPermissions);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setLoading(false);
        setAccessToken(null);
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
          
          setLoading(false);
      } else if (!user && !loading) {
          setLoading(false);
      }
  }, [user, collaborators, loadingCollaborators, loading]);

  const getAccessToken = async (): Promise<string | null> => {
    if (user) {
        const token = await user.getIdTokenResult();
        // This is Firebase ID token, not OAuth access token.
        // We need to handle OAuth token separately.
        // For simplicity in this context, we rely on the user object being present
        // and gapi will handle the token.
        return accessToken;
    }
    return null;
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      
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
      
      const collaborator = collaborators.find(c => c.email === userEmail);
      if (!collaborator) {
          await firebaseSignOut(auth);
          toast({
              title: "Usuário Não Autorizado",
              description: "Seu e-mail não está na lista de colaboradores autorizados. Por favor, contate o administrador.",
              variant: "destructive",
              duration: 10000,
          });
          setLoading(false);
          return;
      }

      await addDocumentToCollection('audit_logs', {
          eventType: 'login',
          userId: collaborator.id3a,
          userName: collaborator.name,
          timestamp: new Date().toISOString(),
          details: {
              message: `${collaborator.name} logged in.`,
          }
      });
      
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
      getAccessToken,
      signInWithGoogle,
      signOut
  }), [user, loading, loadingCollaborators, isAdmin, isSuperAdmin, permissions, accessToken]);

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
