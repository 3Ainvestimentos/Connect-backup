
"use client";

import React, { useState } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunityTypesManager } from '@/components/admin/opportunity-map/OpportunityTypesManager';
import { SectionManager } from '@/components/admin/opportunity-map/SectionManager';
import { MissionGroupsManager } from '@/components/admin/opportunity-map/MissionGroupsManager';
import { useOpportunityTypes } from '@/contexts/OpportunityMapMissionsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, SlidersHorizontal } from 'lucide-react';


export default function OpportunityMapAdminPage() {
    const { opportunityTypes, loading } = useOpportunityTypes();
    const [activeTab, setActiveTab] = useState('definitions');

    const handleTabChange = (value: string) => {
        // Se já está na aba, não faz nada
        if (value === activeTab) return;
        // Se for para a aba de definições
        if (value === 'definitions' || value === 'groups') {
            setActiveTab(value);
            return;
        }
        // Se clicar numa aba de tipo de oportunidade
        const selectedType = opportunityTypes.find(type => type.id === value);
        if (selectedType) {
            setActiveTab(selectedType.id);
        }
    };
    
    // Garante que se a aba ativa for deletada, voltamos para as definições
    React.useEffect(() => {
        if (!loading && activeTab !== 'definitions' && activeTab !== 'groups' && !opportunityTypes.find(type => type.id === activeTab)) {
            setActiveTab('definitions');
        }
    }, [opportunityTypes, activeTab, loading]);
    
    // Inicia na aba de definições
    React.useEffect(() => {
        if(opportunityTypes.length > 0 && activeTab === '') {
            setActiveTab('definitions');
        }
    }, [opportunityTypes, activeTab]);

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Gestão do Mapa de Oportunidades"
                    description="Gerencie os tipos de oportunidades, grupos de missões e insira os dados para os colaboradores."
                />
                
                <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="h-full">
                    <TabsList className="min-w-[200px] h-full">
                        <div className="p-2 w-full">
                            <TabsTrigger value="definitions" className="w-full justify-start text-base"><List className="mr-2 h-4 w-4"/>Definições</TabsTrigger>
                            <TabsTrigger value="groups" className="w-full justify-start text-base"><SlidersHorizontal className="mr-2 h-4 w-4"/>Grupos</TabsTrigger>
                        </div>
                        <div className="p-2 border-t w-full">
                             <p className="px-2 py-1.5 text-sm font-semibold">Tipos de Oportunidades</p>
                            <ScrollArea className="h-[calc(100vh-250px)]">
                                {opportunityTypes.map(type => (
                                    <TabsTrigger key={type.id} value={type.id} className="w-full justify-start">{type.name}</TabsTrigger>
                                ))}
                            </ScrollArea>
                        </div>
                    </TabsList>

                    <div className="pl-4 w-full">
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
                    </div>
                </Tabs>
            </div>
        </SuperAdminGuard>
    );
}
