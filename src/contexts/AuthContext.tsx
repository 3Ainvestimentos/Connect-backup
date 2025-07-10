
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase'; // Import real auth
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Objeto de usuário simulado foi desativado para usar a autenticação real.
/*
const MOCK_USER: User = {
  uid: 'mock-user-uid',
  email: 'mock@example.com',
  displayName: 'Admin Mock',
  photoURL: 'https://placehold.co/100x100.png',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  providerId: 'mock',
  // Funções vazias para satisfazer o tipo User
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({ token: 'mock-token', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
  reload: async () => {},
  toJSON: () => ({}),
};
*/

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Começa como true para verificar o estado de auth
  const router = useRouter();

  useEffect(() => {
    // Observa mudanças no estado de autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpa o observador quando o componente é desmontado
    return () => unsubscribe();
  }, []);


  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // O onAuthStateChanged vai lidar com a atualização do usuário e o loading.
      // O redirecionamento pode ser feito aqui ou em um useEffect que observa o usuário.
      router.push('/dashboard');
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // O onAuthStateChanged vai atualizar o usuário para null e o loading.
      router.push('/login');
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
