"use client";

import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DatePickerWithRange } from '@/shared/components/ui/date-picker-with-range';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { AuditProvider, useAudit } from '@/contexts/AuditContext';
import { usePathname, useRouter } from 'next/navigation';

function AuditLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dateRange, setDateRange } = useAudit();

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  // Determine the active tab based on the current path
  let activeTab = "/audit";
  if (pathname.includes('/content-interaction')) {
    activeTab = "/audit/content-interaction";
  } else if (pathname.includes('/workflow-analytics')) {
    activeTab = "/audit/workflow-analytics";
  }


  return (
    <SuperAdminGuard>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Painel de Auditoria" 
          description="Monitore eventos, uso e engajamento da plataforma."
          actions={<DatePickerWithRange date={dateRange} onDateChange={setDateRange} />}
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                <TabsTrigger value="/audit">Logins</TabsTrigger>
                <TabsTrigger value="/audit/content-interaction">Conteúdos</TabsTrigger>
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


export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <AuditProvider>
            <AuditLayoutContent>{children}</AuditLayoutContent>
        </AuditProvider>
    )
}
