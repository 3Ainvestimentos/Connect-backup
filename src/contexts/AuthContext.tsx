
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'matheus@3ainvestimentos.com.br';
const ALLOWED_DOMAINS = ['3ainvestimentos.com.br']; // Adicione outros domínios autorizados aqui

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const app = getFirebaseApp(); // Initialize Firebase
  const auth = getAuth(app);
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // Redirecionamento movido para a função de login para garantir a verificação de domínio primeiro
      }
    });

    return () => unsubscribe();
  }, [auth]);

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
      
      // Se o domínio for válido, onAuthStateChanged já terá definido o usuário
      // e podemos redirecionar com segurança.
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

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signOut }}>
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
