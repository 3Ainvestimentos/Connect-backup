
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminGuard from '@/components/auth/AdminGuard';
import { ManageCollaborators } from '@/components/admin/ManageCollaborators';
import { AllRequestsView } from '@/components/admin/AllRequestsView';
import PermissionsPageContent from '@/components/admin/PermissionsPageContent';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent } from '@/components/ui/card';


export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("collaborators");

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Administração do Sistema"
                    description="Gerencie colaboradores, permissões e visualize todas as solicitações."
                />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
                        <TabsTrigger value="requests">Solicitações</TabsTrigger>
                        <TabsTrigger value="permissions">Permissões</TabsTrigger>
                    </TabsList>
                     <TabsContent value="collaborators">
                        <Card>
                           <ManageCollaborators />
                        </Card>
                    </TabsContent>
                     <TabsContent value="requests">
                         <Card>
                            <AllRequestsView />
                        </Card>
                    </TabsContent>
                     <TabsContent value="permissions">
                        <Card>
                           <PermissionsPageContent />
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
