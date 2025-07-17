
"use client";

import SuperAdminGuard from '@/components/auth/SuperAdminGuard';

export default function WorkflowAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="space-y-6 p-6 md:p-8">
          {children}
      </div>
    </SuperAdminGuard>
  );
}
