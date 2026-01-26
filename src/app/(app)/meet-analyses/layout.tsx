
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MeetAnalysesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!permissions.canViewMeetAnalyses) {
        router.replace('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, permissions.canViewMeetAnalyses, router]);

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

  return (
    <div className="flex-grow h-[calc(100vh-var(--header-height))]">
        {children}
    </div>
  );
}
