"use client";

import React from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Zap, CheckSquare } from 'lucide-react';
import { SectionManager } from '@/components/admin/opportunity-map/SectionManager';


export default function OpportunityMapAdminPage() {
    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gestão de Mapa de Oportunidades"
                    description="Gerencie os dados de resultado mensal dos colaboradores."
                />

                <Tabs defaultValue="missionsXp" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="missionsXp">
                            <Zap className="mr-2 h-4 w-4" />
                            Missões XP
                        </TabsTrigger>
                        <TabsTrigger value="pap">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            PAP
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="missionsXp" className="mt-6">
                        <SectionManager section="missionsXp" title="Missões XP" />
                    </TabsContent>
                    <TabsContent value="pap" className="mt-6">
                        <SectionManager section="pap" title="PAP (Plano de Ação Pessoal)" />
                    </TabsContent>
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
