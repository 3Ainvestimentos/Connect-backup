
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, AlertCircle, TrendingUp } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};


function SectionDisplay({ title, data, isCurrency = false }: { title: string, data: Record<string, string> | undefined, isCurrency?: boolean }) {
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
    
    const totalValue = isCurrency
        ? Object.values(data).reduce((sum, value) => {
            const num = parseFloat(value.replace(/[^0-9,-]+/g,"").replace(",","."));
            return sum + (isNaN(num) ? 0 : num);
        }, 0)
        : 0;

    const chartData = [{ name: 'Total', value: totalValue }];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="bg-muted/50 p-3 rounded-lg flex-shrink-0 w-48 text-center">
                            <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                            <dd className="text-xl font-bold text-foreground">
                                {isCurrency ? formatCurrency(parseFloat(value) || 0) : value}
                            </dd>
                        </div>
                    ))}
                </div>
                 {isCurrency && totalValue > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-muted-foreground" />
                           Total Estimado de Missões
                        </h4>
                        <ResponsiveContainer width="100%" height={80}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 50 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={40}>
                                    <LabelList 
                                        dataKey="value" 
                                        position="right" 
                                        offset={10}
                                        formatter={(value: number) => formatCurrency(value)}
                                        className="font-bold text-lg fill-foreground"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
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
                <SectionDisplay title="Missões XP" data={userData.missionsXp} isCurrency={true} />
                <SectionDisplay title="PAP" data={userData.pap} />
            </div>
        </div>
    );
}
