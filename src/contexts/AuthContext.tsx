
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseApp, googleProvider } from '@/lib/firebase'; // Import getFirebaseApp
import { getAuth, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the user state update and redirect
    } catch (error) {
      console.error("Error signing in with Google: ", error);
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
