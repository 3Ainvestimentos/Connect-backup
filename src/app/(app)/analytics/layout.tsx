
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  // Determine the active tab based on the current path
  let activeTab = "/analytics";
  if (pathname.includes('/workflows')) {
    activeTab = "/analytics/workflows";
  }

  return (
    <AdminGuard>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Painel de Analytics" 
          description="Métricas de uso e engajamento da plataforma 3A RIVA Connect."
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="/analytics">Uso e Conteúdo</TabsTrigger>
                <TabsTrigger value="/analytics/workflows">Workflows</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="pt-4">
            {children}
        </div>
      </div>
    </AdminGuard>
  );
}
