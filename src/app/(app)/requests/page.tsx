
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { ManageRequests } from '@/components/requests/ManageRequests';
import { Mailbox } from 'lucide-react';

export default function RequestsPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Caixa de Entrada"
                    description="Gerencie as solicitações pendentes dos colaboradores."
                />
                <ManageRequests />
            </div>
        </AdminGuard>
    );
}
