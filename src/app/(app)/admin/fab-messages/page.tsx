
"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ManageFabMessages } from "@/components/admin/ManageFabMessages";
import { Separator } from "@/components/ui/separator";
import { ManageIdleFabMessages } from "@/components/admin/ManageIdleFabMessages";

export default function FabMessagesAdminPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gerenciar Mensagens FAB"
                    description="Crie e monitore mensagens flutuantes para os usuários."
                />
                
                <ManageIdleFabMessages />
                
                <Separator />
                
                <ManageFabMessages />
            </div>
        </AdminGuard>
    );
}
