
"use client";

import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import AdminGuard from '@/components/auth/AdminGuard';


export default function BILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex-grow h-[calc(100vh-var(--header-height))]">
          {children}
      </div>
    </AdminGuard>
  );
}
