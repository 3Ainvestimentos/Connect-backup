"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageNews } from '@/components/admin/ManageNews';
import { ManageDocuments } from '@/components/admin/ManageDocuments';
import { ManageLabs } from '@/components/admin/ManageLabs';
import AdminGuard from '@/components/auth/AdminGuard';
import { ManageMessages } from '@/components/admin/ManageMessages';
import { ManageQuickLinks } from '@/components/admin/ManageQuickLinks';
import { ManagePolls } from '@/components/admin/ManagePolls';
import { ManageRankings } from '@/components/admin/ManageRankings';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState("news");
    const router = useRouter();

    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8 admin-panel">
                <PageHeader 
                    title="Gerenciamento de Conteúdo"
                    description="Gerencie as informações dinâmicas da intranet."
                    actions={
                        <Button 
                            className="bg-admin-primary hover:bg-admin-primary/90"
                            onClick={() => router.push('/admin/fab-messages')}
                        >
                           <MessageSquarePlus className="mr-2 h-4 w-4" />
                           Mensagens FAB
                        </Button>
                    }
                />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                        <TabsTrigger value="news">Notícias</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="labs">Labs</TabsTrigger>
                        <TabsTrigger value="messages">Mensagens</TabsTrigger>
                        <TabsTrigger value="quicklinks">Links Rápidos</TabsTrigger>
                        <TabsTrigger value="polls">Pesquisas</TabsTrigger>
                        <TabsTrigger value="rankings">Rankings</TabsTrigger>
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
                     <TabsContent value="quicklinks">
                        <ManageQuickLinks />
                    </TabsContent>
                    <TabsContent value="polls">
                        <ManagePolls />
                    </TabsContent>
                     <TabsContent value="rankings">
                        <ManageRankings />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
