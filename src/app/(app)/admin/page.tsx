
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageNews } from '@/components/admin/ManageNews';
import { ManageDocuments } from '@/components/admin/ManageDocuments';
import { ManageLabs } from '@/components/admin/ManageLabs';
import AdminGuard from '@/components/auth/AdminGuard';
import { ManageMessages } from '@/components/admin/ManageMessages';
import { ManageEvents } from '@/components/admin/ManageEvents';
import { ManageCollaborators } from '@/components/admin/ManageCollaborators';
import { AllRequestsView } from '@/components/admin/AllRequestsView';
import PermissionsPageContent from '@/components/admin/PermissionsPageContent';


export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("news");

    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8 admin-panel">
                <PageHeader 
                    title="Painel de Administração"
                    description="Gerencie o conteúdo e as permissões da intranet."
                />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                        <TabsTrigger value="news">Notícias</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="labs">Labs</TabsTrigger>
                        <TabsTrigger value="messages">Mensagens</TabsTrigger>
                        <TabsTrigger value="events">Eventos</TabsTrigger>
                        <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
                        <TabsTrigger value="requests">Solicitações</TabsTrigger>
                        <TabsTrigger value="permissions">Permissões</TabsTrigger>
                    </TabsList>
                    <TabsContent value="news">
                        <ManageNews />
                    </TabsContent>
                    <TabsContent value="documents">
                        <ManageDocuments />
                    </TabsContent>
                    <TabsContent value="labs">
                        <ManageLabs />
                    </TabsContent>
                    <TabsContent value="messages">
                        <ManageMessages />
                    </TabsContent>
                    <TabsContent value="events">
                        <ManageEvents />
                    </TabsContent>
                     <TabsContent value="collaborators">
                        <ManageCollaborators />
                    </TabsContent>
                     <TabsContent value="requests">
                        <AllRequestsView />
                    </TabsContent>
                     <TabsContent value="permissions">
                        <PermissionsPageContent />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
