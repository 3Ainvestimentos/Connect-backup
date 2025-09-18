"use client";

import React, { useState } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunityTypesManager } from '@/components/admin/opportunity-map/OpportunityTypesManager';
import { SectionManager } from '@/components/admin/opportunity-map/SectionManager';
import { MissionGroupsManager } from '@/components/admin/opportunity-map/MissionGroupsManager';
import { useOpportunityTypes } from '@/contexts/OpportunityMapMissionsContext';
import { List, SlidersHorizontal, Compass } from 'lucide-react';

export default function OpportunityMapAdminPage() {
    const { opportunityTypes, loading } = useOpportunityTypes();
    const [activeTab, setActiveTab] = useState('definitions');

    // Garante que se a aba ativa for deletada, voltamos para as definições
    React.useEffect(() => {
        if (!loading && activeTab !== 'definitions' && !opportunityTypes.find(type => type.id === activeTab)) {
            setActiveTab('definitions');
        }
    }, [opportunityTypes, activeTab, loading]);

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gestão do Mapa de Oportunidades"
                    description="Gerencie os tipos de oportunidades, grupos de objetivos e insira os dados para os colaboradores."
                />
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mb-6">
                        <TabsTrigger value="definitions"><List className="mr-2 h-4 w-4"/>Definições de Oportunidades</TabsTrigger>
                        {opportunityTypes.map(type => (
                            <TabsTrigger key={type.id} value={type.id}><Compass className="mr-2 h-4 w-4"/>{type.name}</TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="definitions">
                        <OpportunityTypesManager />
                    </TabsContent>
                   
                    {opportunityTypes.map(type => (
                        <TabsContent key={type.id} value={type.id}>
                            <SectionManager
                                opportunityType={type}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
