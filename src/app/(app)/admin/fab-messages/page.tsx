"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ManageFabMessages } from "@/components/admin/ManageFabMessages";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FabMessagesAdminPage() {
    const router = useRouter();
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gerenciar Mensagens FAB"
                    description="Crie e monitore mensagens flutuantes para os usuários."
                />
                <ManageFabMessages />
            </div>
        </AdminGuard>
    );
}
