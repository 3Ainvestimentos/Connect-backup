
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, AlertCircle } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

function SectionDisplay({ title, data }: { title: string, data: Record<string, string> | undefined }) {
    if (!data || Object.keys(data).length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum dado disponível para esta seção.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="bg-muted/50 p-3 rounded-lg">
                            <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                            <dd className="text-lg font-semibold text-foreground">{value}</dd>
                        </div>
                    ))}
                </dl>
            </CardContent>
        </Card>
    );
}


export default function OpportunityMapPage() {
    const { user } = useAuth();
    const { opportunityData, loading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();

    const currentUserCollab = React.useMemo(() => {
        if (!user || collabLoading) return null;
        return collaborators.find(c => c.email === user.email);
    }, [user, collaborators, collabLoading]);

    const userData = React.useMemo(() => {
        if (!currentUserCollab) return null;
        // Use the collaborator's document ID to find the correct opportunity data
        return opportunityData.find(d => d.id === currentUserCollab.id);
    }, [opportunityData, currentUserCollab]);

    if (loading || collabLoading) {
        return (
             <div className="space-y-6 p-6 md:p-8">
                <PageHeader title="Mapa de Oportunidades" description="Carregando seus resultados mensais..." />
                 <div className="space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!userData) {
         return (
             <div className="space-y-6 p-6 md:p-8 flex flex-col items-center justify-center text-center h-[calc(100vh-var(--header-height))]">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4"/>
                <PageHeader title="Dados Não Encontrados" description="Seu Mapa de Oportunidades ainda não foi configurado. Por favor, entre em contato com seu gestor." />
            </div>
        );
    }
    
    return (
        <div className="space-y-6 p-6 md:p-8">
            <PageHeader
                title="Mapa de Oportunidades"
                description={`Visualização do seu resultado mensal, ${userData.userName}.`}
            />
            
            <div className="space-y-6">
                <SectionDisplay title="Missões XP" data={userData.missionsXp} />
                <SectionDisplay title="PAP" data={userData.pap} />
            </div>
        </div>
    );
}
