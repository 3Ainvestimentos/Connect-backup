"use client";

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function WorkflowConfigAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!permissions.canManageWorkflowsV2) {
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [loading, permissions.canManageWorkflowsV2, router, user]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
        <LoadingSpinner message="Carregando configurador de chamados v2" />
      </div>
    );
  }

  return <>{children}</>;
}
