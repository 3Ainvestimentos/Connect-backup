
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// For prototyping, we check a specific email.
// In a production app, this should be a role fetched from a secure backend.
const ADMIN_EMAIL = 'mock@example.com';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || user.email !== ADMIN_EMAIL) {
                // Redirect non-admin users to the dashboard or an unauthorized page
                router.replace('/dashboard'); 
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    // Show a loading spinner while checking auth status
    if (loading || !isAuthorized) {
        return (
            <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    // If authorized, render the children components (the admin page)
    return <>{children}</>;
}
