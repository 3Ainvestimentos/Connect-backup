
"use client";

import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname, useRouter } from 'next/navigation';

export default function AuditLayout({
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
  let activeTab = "/audit";
  if (pathname.includes('/content-interaction')) {
    activeTab = "/audit/content-interaction";
  } else if (pathname.includes('/usability')) {
    activeTab = "/audit/usability";
  } else if (pathname.includes('/workflow-analytics')) {
    activeTab = "/audit/workflow-analytics";
  }

  return (
    <SuperAdminGuard>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Painel de Auditoria" 
          description="Monitore eventos, uso e engajamento da plataforma."
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="/audit">Logins</TabsTrigger>
                <TabsTrigger value="/audit/content-interaction">Conteúdos</TabsTrigger>
                <TabsTrigger value="/audit/usability">Busca e Usabilidade</TabsTrigger>
                <TabsTrigger value="/audit/workflow-analytics">Workflows</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="pt-4">
            {children}
        </div>
      </div>
    </SuperAdminGuard>
  );
}
