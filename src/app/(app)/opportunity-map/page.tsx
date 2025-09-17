
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOpportunityMap, MissionData } from '@/contexts/OpportunityMapContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, AlertCircle, TrendingUp, CheckSquare, Zap, Award } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};


function SectionDisplay({ title, data, isCurrency = false }: { title: string, data: Record<string, string | MissionData> | undefined, isCurrency?: boolean }) {
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
    
    const sortedKeys = React.useMemo(() => {
        return Object.keys(data).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
        });
    }, [data]);
    
    const { totalEstimado, totalPremiado } = React.useMemo(() => {
        if (!isCurrency) return { totalEstimado: 0, totalPremiado: 0 };
        
        let estimado = 0;
        let premiado = 0;

        Object.values(data).forEach(item => {
            const value = parseFloat((item as MissionData).value) || 0;
            estimado += value;
            if ((item as MissionData).status === 'premiado') {
                premiado += value;
            }
        });
        return { totalEstimado: estimado, totalPremiado: premiado };
    }, [data, isCurrency]);

    const chartData = [{ 
        name: 'Total', 
        'Total Estimado': totalEstimado,
        'Total Premiado': totalPremiado,
    }];


    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {sortedKeys.map((key) => {
                        const item = data[key];
                        const isMission = isCurrency && typeof item === 'object';
                        const value = isMission ? (item as MissionData).value : String(item);
                        const status = isMission ? (item as MissionData).status : null;

                        return (
                            <div key={key} className="bg-muted/50 p-3 rounded-lg flex-shrink-0 w-48 text-center">
                                <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                                <dd className="text-xl font-bold text-foreground">
                                    {isCurrency ? formatCurrency(parseFloat(value) || 0) : value}
                                </dd>
                                {status && (
                                     <dd className={`text-xs font-semibold mt-1 ${status === 'premiado' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {status === 'premiado' ? 'Premiado' : 'Elegível'}
                                    </dd>
                                )}
                            </div>
                        );
                    })}
                </div>
                 {isCurrency && totalEstimado > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-muted-foreground" />
                           Resultado Total
                        </h4>
                        <ResponsiveContainer width="100%" height={120}>
                           <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 120 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                />
                                 <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '1rem'}}/>
                                <Bar dataKey="Total Estimado" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={25}>
                                     <LabelList dataKey="Total Estimado" position="right" offset={10} formatter={(value: number) => formatCurrency(value)} className="font-semibold fill-foreground" />
                                </Bar>
                                 <Bar dataKey="Total Premiado" fill="hsl(var(--admin-primary))" radius={[4, 4, 4, 4]} barSize={25}>
                                     <LabelList dataKey="Total Premiado" position="right" offset={10} formatter={(value: number) => formatCurrency(value)} className="font-semibold fill-foreground" />
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
        // Use the collaborator's document ID to find the data
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
                     <SectionDisplay title="Missões XP" data={userData.missionsXp} isCurrency={true} />
                </TabsContent>
                <TabsContent value="pap" className="mt-6">
                    <SectionDisplay title="PAP (Plano de Ação Pessoal)" data={userData.pap} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
