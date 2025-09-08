
"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ManageFabMessages } from "@/components/admin/ManageFabMessages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, PieChart } from "lucide-react";

export default function FabMessagesAdminPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gerenciar Mensagens FAB"
                    description="Crie e monitore mensagens flutuantes para os usuários."
                />
                
                 <Tabs defaultValue="management" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="management">
                             <ListChecks className="mr-2 h-4 w-4" />
                             Gerenciamento
                        </TabsTrigger>
                        <TabsTrigger value="monitoring">
                            <PieChart className="mr-2 h-4 w-4" />
                            Monitoramento
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="management" className="mt-6">
                         <ManageFabMessages />
                    </TabsContent>
                    <TabsContent value="monitoring" className="mt-6">
                        {/* O conteúdo do gráfico será renderizado pelo ManageFabMessages */}
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
