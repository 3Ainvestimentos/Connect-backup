"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOpportunityMap, OpportunityMapData } from '@/contexts/OpportunityMapContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, CheckSquare, Zap, CheckCircle2, CircleDashed, Compass } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpportunityTypes, OpportunityType } from '@/contexts/OpportunityMapMissionsContext';
import { useMissionGroups } from '@/contexts/MissionGroupsContext';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

function OpportunitySection({ opportunityType, userData }: { opportunityType: OpportunityType, userData: OpportunityMapData | undefined }) {
    const sectionData = userData?.[opportunityType.id] || {};
    
    if (!sectionData || Object.keys(sectionData).length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{opportunityType.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum dado disponível para esta oportunidade no momento.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{opportunityType.name}</CardTitle>
                <CardDescription>{opportunityType.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(sectionData).map(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                         const status = (value as any).status;
                         const val = (value as any).value;
                         return (
                            <div key={key} className="bg-muted/50 p-3 rounded-lg text-center">
                                <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                                <dd className="text-2xl font-bold text-foreground">{val}</dd>
                                {status && <span className={`text-xs font-semibold ${status === 'premiado' ? 'text-green-500' : 'text-blue-500'}`}>({status})</span>}
                            </div>
                         )
                    }
                    return (
                        <div key={key} className="bg-muted/50 p-3 rounded-lg text-center">
                            <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                            <dd className="text-2xl font-bold text-foreground">{String(value)}</dd>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default function OpportunityMapPage() {
    const { user } = useAuth();
    const { opportunityData, loading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const { opportunityTypes } = useOpportunityTypes();

    const currentUserData = React.useMemo(() => {
        if (!user || collabLoading || !collaborators.length) return null;
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return null;
        return opportunityData.find(d => d.id === currentUserCollab.id);
    }, [opportunityData, user, collaborators, collabLoading]);

    const visibleOpportunities = React.useMemo(() => {
        if (!user || collabLoading || !currentUserData) return [];
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return [];
        
        return opportunityTypes.filter(op => {
            if (op.recipientIds.includes('all')) return true;
            return op.recipientIds.includes(currentUserCollab.id3a);
        });
    }, [opportunityTypes, user, collaborators, collabLoading, currentUserData]);

    if (loading || collabLoading) {
        return (
             <div className="space-y-6 p-6 md:p-8">
                <PageHeader title="Mapa de Oportunidades" description="Carregando seus resultados mensais..." />
                 <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (!currentUserData || visibleOpportunities.length === 0) {
         return (
             <div className="space-y-6 p-6 md:p-8 flex flex-col items-center justify-center text-center h-[calc(100vh-var(--header-height))]">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4"/>
                <PageHeader title="Nenhuma Oportunidade Encontrada" description="Nenhuma oportunidade foi configurada para você no momento. Por favor, entre em contato com seu gestor." />
            </div>
        );
    }
    
    return (
        <div className="space-y-6 p-6 md:p-8">
            <PageHeader
                title="Mapa de Oportunidades"
                description={`Visualização do seu resultado mensal, ${currentUserData.userName}.`}
            />
            
            <Tabs defaultValue={visibleOpportunities[0]?.id} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                     {visibleOpportunities.map(op => (
                        <TabsTrigger key={op.id} value={op.id}>
                            <Compass className="mr-2 h-4 w-4" />
                            {op.name}
                        </TabsTrigger>
                     ))}
                </TabsList>
                 {visibleOpportunities.map(op => (
                     <TabsContent key={op.id} value={op.id} className="mt-6">
                        <OpportunitySection opportunityType={op} userData={currentUserData} />
                    </TabsContent>
                 ))}
            </Tabs>
        </div>
    );
}
