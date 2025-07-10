
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';

// Define a mock user structure that mimics the Firebase User object
// This ensures that all parts of the app that depend on the user object
// will continue to function without a real authentication flow.
const MOCK_USER: User = {
    uid: 'mock-admin-uid',
    email: 'mock@example.com',
    displayName: 'Admin Mock',
    photoURL: 'https://placehold.co/100x100.png',
    emailVerified: true,
    isAnonymous: false,
    providerData: [{
        providerId: 'google.com',
        uid: 'mock-admin-uid',
        displayName: 'Admin Mock',
        email: 'mock@example.com',
        photoURL: 'https://placehold.co/100x100.png',
    }],
    // Dummy implementations for other required User properties
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({
        token: 'mock-token',
        expirationTime: new Date().toISOString(),
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: 'google.com',
        claims: {},
    }),
    reload: async () => {},
    delete: async () => {},
    metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
    },
    providerId: 'firebase',
    tenantId: null,
    toJSON: () => ({}),
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This provider now simulates a logged-in admin user without any real authentication.
// It helps bypass the auth errors to focus on other parts of the application.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<User | null>(MOCK_USER);
  const [loading] = useState(false); // No longer loading, as auth is instant

  // Mock functions to prevent errors if they are called elsewhere.
  const signInWithGoogle = async () => {
    console.log("Mock Sign In called. No actual authentication is performed.");
  };

  const signOut = async () => {
    console.log("Mock Sign Out called. No actual state change will occur.");
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
