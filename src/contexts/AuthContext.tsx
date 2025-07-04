"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (role?: 'user' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for the admin
const adminUser: User = {
  uid: 'mock-admin-uid',
  displayName: 'Admin Mock',
  email: 'mock@example.com',
  photoURL: 'https://placehold.co/100x100.png?text=Adm',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-admin-token',
  getIdTokenResult: async () => ({
    token: 'mock-admin-token',
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

// Mock user for a standard test user
const testUser: User = {
    uid: 'mock-test-user-uid',
    displayName: 'Usuário de Teste',
    email: 'test.user@example.com',
    photoURL: 'https://placehold.co/100x100.png?text=Test',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-user-token',
    getIdTokenResult: async () => ({
      token: 'mock-user-token',
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

  // In this version, mock auth is always on.
  // The useEffect for onAuthStateChanged is kept for easy switching back to Firebase.
  useEffect(() => {
    setLoading(false);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // This part is for real firebase auth, will not run if we only use mock
      if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'true') {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
       if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  const signInWithGoogle = async (role: 'user' | 'admin' = 'user') => {
    setLoading(true);
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (role === 'admin') {
      setUser(adminUser);
      router.push('/admin'); // Admins go straight to admin panel
    } else {
      setUser(testUser);
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    router.push('/login');
    setLoading(false);
  };

  if (loading && !['/login'].includes(pathname) && !user) {
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
