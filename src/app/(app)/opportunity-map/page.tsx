
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useOpportunityMap } from '@/contexts/OpportunityMapContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, CheckSquare, Zap, Award, CheckCircle2, CircleDashed } from 'lucide-react';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpportunityMapMissions } from '@/contexts/OpportunityMapMissionsContext';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

function PapSection({ data }: { data: Record<string, string> | undefined }) {
    if (!data || Object.keys(data).length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>PAP (Plano de Ação Pessoal)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum dado de PAP disponível para este período.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>PAP (Plano de Ação Pessoal)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 p-3 rounded-lg text-center">
                        <dt className="text-sm font-medium text-muted-foreground truncate">{key}</dt>
                        <dd className="text-2xl font-bold text-foreground">{value}</dd>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function MissionsXpSection({ userMissionsStatus }: { userMissionsStatus: Record<string, any> | undefined }) {
    const { missions: missionDefinitions, loading: loadingMissions } = useOpportunityMapMissions();

    const { eligibleMissions, totalEstimated, totalAwarded } = React.useMemo(() => {
        if (!userMissionsStatus || missionDefinitions.length === 0) {
            return { eligibleMissions: [], totalEstimated: 0, totalAwarded: 0 };
        }

        let estimated = 0;
        let awarded = 0;
        const missions = missionDefinitions
            .filter(def => userMissionsStatus[def.title]?.eligible)
            .map(def => {
                const status = userMissionsStatus[def.title];
                const value = parseFloat(def.maxValue) || 0;
                estimated += value;
                if (status.achieved) {
                    awarded += value;
                }
                return { ...def, isAchieved: !!status.achieved };
            });

        return { eligibleMissions: missions, totalEstimated: estimated, totalAwarded: awarded };
    }, [userMissionsStatus, missionDefinitions]);

    if (loadingMissions) return <Skeleton className="h-64 w-full" />;

    if (eligibleMissions.length === 0) {
         return (
            <Card>
                <CardHeader><CardTitle>Missões XP</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Você não está elegível para nenhuma Missão XP no momento.</p>
                </CardContent>
            </Card>
        );
    }

    const chartData = [{ name: 'Total', 'Total Premiado': totalAwarded, 'Total Estimado': totalEstimated }];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Missões XP</CardTitle>
                <CardDescription>Acompanhe suas metas e os valores que pode conquistar este mês.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eligibleMissions.map(mission => (
                        <div key={mission.id} className="border rounded-lg p-4 flex flex-col justify-between bg-background hover:bg-muted/50 transition-colors">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-foreground text-base pr-4">{mission.title}</h4>
                                    {mission.isAchieved ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <CircleDashed className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(parseFloat(mission.maxValue) || 0)}</p>
                                {mission.notes && <p className="text-xs text-muted-foreground mt-1">{mission.notes}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 border-t">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                       <TrendingUp className="h-5 w-5 text-muted-foreground" />
                       Resultado Geral das Missões
                    </h4>
                    <ResponsiveContainer width="100%" height={80}>
                       <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 120 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                formatter={(value: number) => formatCurrency(value)}
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
            </CardContent>
        </Card>
    );
}

export default function OpportunityMapPage() {
    const { user } = useAuth();
    const { opportunityData, loading } = useOpportunityMap();
    const { collaborators, loading: collabLoading } = useCollaborators();

    const currentUserData = React.useMemo(() => {
        if (!user || collabLoading || !collaborators.length) return null;
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return null;
        return opportunityData.find(d => d.id === currentUserCollab.id);
    }, [opportunityData, user, collaborators, collabLoading]);

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

    if (!currentUserData) {
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
                description={`Visualização do seu resultado mensal, ${currentUserData.userName}.`}
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
                     <MissionsXpSection userMissionsStatus={currentUserData.missionsXp as Record<string, any>} />
                </TabsContent>
                <TabsContent value="pap" className="mt-6">
                    <PapSection data={currentUserData.pap} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
