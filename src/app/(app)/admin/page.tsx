
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { ManageCollaborators } from '@/components/admin/ManageCollaborators';
import PermissionsPageContent from '@/components/admin/PermissionsPageContent';
import { MaintenanceMode } from '@/components/admin/MaintenanceMode';


export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("collaborators");

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Administração do Sistema"
                    description="Gerencie colaboradores, permissões de acesso e o estado da plataforma."
                />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
                        <TabsTrigger value="permissions">Permissões</TabsTrigger>
                        <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
                    </TabsList>
                     <TabsContent value="collaborators">
                        <ManageCollaborators />
                    </TabsContent>
                     <TabsContent value="permissions">
                        <PermissionsPageContent />
                    </TabsContent>
                     <TabsContent value="maintenance">
                        <MaintenanceMode />
                    </TabsContent>
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
