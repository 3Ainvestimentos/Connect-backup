
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Objeto de usuário simulado para desenvolvimento
// Este usuário será considerado logado em toda a aplicação.
// O email corresponde ao email de admin definido em AdminGuard.
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


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false); // O carregamento está sempre concluído
  const router = useRouter();

  // Funções de login/logout não fazem nada no modo simulado
  const signInWithGoogle = async () => {
    setLoading(true);
    // Em um app real, aqui você chamaria a função de login do Firebase
    // await signInWithPopup(auth, googleProvider);
    // Por enquanto, apenas definimos o usuário mock
    setUser(MOCK_USER);
    // router.push('/dashboard'); // Removido para teste
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    // Em um app real, aqui você chamaria a função de logout do Firebase
    // await firebaseSignOut(auth);
    setUser(null);
    router.push('/login');
    setLoading(false);
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
