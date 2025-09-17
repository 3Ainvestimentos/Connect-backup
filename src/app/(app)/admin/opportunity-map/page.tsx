
"use client";

import React from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, CheckSquare, Settings } from 'lucide-react';
import { MissionsXpManager } from '@/components/admin/opportunity-map/MissionsXpManager';
import { PapManager } from '@/components/admin/opportunity-map/PapManager';
import { MissionDefinitionsManager } from '@/components/admin/opportunity-map/MissionDefinitionsManager';


export default function OpportunityMapAdminPage() {
    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gestão de Mapa de Oportunidades"
                    description="Gerencie os dados de resultado mensal dos colaboradores."
                />

                <Tabs defaultValue="missionsXp" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                         <TabsTrigger value="definitions">
                            <Settings className="mr-2 h-4 w-4" />
                            Definir Missões do Mês
                        </TabsTrigger>
                        <TabsTrigger value="missionsXp">
                            <Zap className="mr-2 h-4 w-4" />
                            Dados de Missões XP
                        </TabsTrigger>
                        <TabsTrigger value="pap">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Dados de PAP
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="definitions" className="mt-6">
                        <MissionDefinitionsManager />
                    </TabsContent>
                    <TabsContent value="missionsXp" className="mt-6">
                        <MissionsXpManager />
                    </TabsContent>
                    <TabsContent value="pap" className="mt-6">
                        <PapManager />
                    </TabsContent>
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
