
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  uid: 'mock-user-uid',
  displayName: 'Usuário Mockado',
  email: 'mock@example.com',
  photoURL: 'https://placehold.co/100x100.png?text=Mock',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({
    token: 'mock-token',
    expirationTime: '',
    authTime: '',
    issuedAtTime: '',
    signInProvider: null,
    signInSecondFactor: null,
    claims: {},
  }),
  reload: async () => {},
  toJSON: () => ({}),
  providerId: 'mockProvider',
  phoneNumber: null,
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const useMockAuth = true; // Use mock auth by default for easier prototyping

  useEffect(() => {
    if (useMockAuth) {
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [useMockAuth]);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
       if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  const signInWithGoogle = async () => {
    if (useMockAuth) {
      setUser(mockUser);
      setLoading(false);
      router.push('/dashboard');
      return;
    }

    // Placeholder list of allowed emails. 
    // In a production app, fetch this from a secure backend.
    const allowedEmails = [
      'mock@example.com', // Included for mock user testing
      // 'colaborador1@suaempresa.com',
      // 'colaborador2@suaempresa.com',
    ];

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      if (userEmail && allowedEmails.includes(userEmail)) {
        router.push('/dashboard');
        // setLoading will be turned false by onAuthStateChanged triggering a re-render
      } else {
        // If email is not in the list, sign out immediately.
        await firebaseSignOut(auth); 
        toast({
          title: "Acesso não autorizado",
          description: "Seu e-mail não tem permissão para acessar esta aplicação. Por favor, contate o administrador.",
          variant: "destructive",
        });
        setLoading(false); // Stop the loading spinner on the button
      }
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      // Handle cases where the user closes the popup, etc.
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: "Erro de Autenticação",
            description: error.message || "Não foi possível fazer login com o Google.",
            variant: "destructive",
          });
      }
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (useMockAuth) {
      setUser(null);
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({
        title: "Erro ao Sair",
        description: error.message || "Não foi possível sair.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading && !useMockAuth && !['/login'].includes(pathname) && !user) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
     );
  }


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
