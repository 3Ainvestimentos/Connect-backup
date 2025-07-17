
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
  } else if (pathname.includes('/workflow-efficiency')) {
    activeTab = "/audit/workflow-efficiency";
  } else if (pathname.includes('/usability')) {
    activeTab = "/audit/usability";
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
                <TabsTrigger value="/audit">Registro de Eventos</TabsTrigger>
                <TabsTrigger value="/audit/content-interaction">Interação com Conteúdo</TabsTrigger>
                <TabsTrigger value="/audit/workflow-efficiency">Eficiência dos Workflows</TabsTrigger>
                <TabsTrigger value="/audit/usability">Busca e Usabilidade</TabsTrigger>
            </TabsList>
        </Tabs>
        <div className="pt-4">
            {children}
        </div>
      </div>
    </SuperAdminGuard>
  );
}
