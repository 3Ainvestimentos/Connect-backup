
"use client";

import React, { useState } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunityTypesManager } from '@/components/admin/opportunity-map/OpportunityTypesManager';
import { SectionManager } from '@/components/admin/opportunity-map/SectionManager';
import { MissionGroupsManager } from '@/components/admin/opportunity-map/MissionGroupsManager';
import { useOpportunityTypes } from '@/contexts/OpportunityMapMissionsContext';
import { List, SlidersHorizontal } from 'lucide-react';

export default function OpportunityMapAdminPage() {
    const { opportunityTypes, loading } = useOpportunityTypes();
    const [activeTab, setActiveTab] = useState('definitions');

    // Garante que se a aba ativa for deletada, voltamos para as definições
    React.useEffect(() => {
        if (!loading && activeTab !== 'definitions' && activeTab !== 'groups' && !opportunityTypes.find(type => type.id === activeTab)) {
            setActiveTab('definitions');
        }
    }, [opportunityTypes, activeTab, loading]);

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gestão do Mapa de Oportunidades"
                    description="Gerencie os tipos de oportunidades, grupos de missões e insira os dados para os colaboradores."
                />
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-6">
                        <TabsTrigger value="definitions"><List className="mr-2 h-4 w-4"/>Definições</TabsTrigger>
                        <TabsTrigger value="groups"><SlidersHorizontal className="mr-2 h-4 w-4"/>Grupos</TabsTrigger>
                        {opportunityTypes.map(type => (
                            <TabsTrigger key={type.id} value={type.id}>{type.name}</TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="definitions">
                        <OpportunityTypesManager />
                    </TabsContent>
                    <TabsContent value="groups">
                        <MissionGroupsManager />
                    </TabsContent>
                    {opportunityTypes.map(type => (
                        <TabsContent key={type.id} value={type.id}>
                            <SectionManager
                                section={type.id as any} // Passa o ID como a "seção" a ser gerenciada
                                title={type.name}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
