
"use client";

import React, { useMemo } from 'react';
import useSWR from 'swr';
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, DollarSign, TrendingUp, Sparkles, Server, Users, Container, FileArchive, AlertTriangle } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CustosInfraestruturaPage() {
    const { data: costData, error, isLoading } = useSWR('/api/billing', fetcher, {
        refreshInterval: 60 * 60 * 1000 // Revalida a cada hora
    });

    const { totalCost, projectedCost, mostExpensiveService, serviceCosts } = useMemo(() => {
        if (!costData) return { totalCost: 0, projectedCost: 0, mostExpensiveService: null, serviceCosts: [] };
        
        const total = costData.services.reduce((acc: number, service: any) => acc + service.cost, 0);
        const projectionFactor = costData.daysInMonth / costData.currentDay;
        const projected = total * projectionFactor;

        const sortedServices = [...costData.services].sort((a: any, b: any) => b.cost - a.cost);
        
        const costs = sortedServices.map((service: any) => ({
            ...service,
            icon: {
                'App Hosting': Server,
                'Firestore': Container,
                'Cloud Storage': FileArchive,
                'Authentication': Users,
                'Genkit / AI Models': Sparkles,
            }[service.name] || Banknote,
            percentage: total > 0 ? (service.cost / total) * 100 : 0,
        }));

        return {
            totalCost: total,
            projectedCost: projected,
            mostExpensiveService: sortedServices[0] || null,
            serviceCosts: costs
        };

    }, [costData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    if (isLoading) {
        return (
             <SuperAdminGuard>
                <div className="space-y-6 p-6 md:p-8">
                    <PageHeader 
                        title="Custos e Infraestrutura"
                        description="Carregando análise de custos operacionais..."
                    />
                     <div className="grid gap-4 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                             <Card key={i}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-4 w-1/3" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-1/2 mb-2" />
                                    <Skeleton className="h-3 w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card>
                        <CardHeader>
                           <Skeleton className="h-6 w-1/4" />
                           <Skeleton className="h-4 w-2/5" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </CardContent>
                    </Card>
                </div>
            </SuperAdminGuard>
        )
    }
    
    if (error) {
        return (
             <SuperAdminGuard>
                 <div className="space-y-6 p-6 md:p-8">
                      <PageHeader 
                        title="Custos e Infraestrutura"
                        description="Análise de custos operacionais."
                      />
                      <Card className="border-destructive">
                        <CardHeader className="text-center">
                            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4"/>
                            <CardTitle className="text-destructive">Erro ao Carregar Custos</CardTitle>
                            <CardDescription className="text-destructive/80">
                                Não foi possível buscar os dados de faturamento. Verifique o console para mais detalhes ou tente novamente mais tarde.
                            </CardDescription>
                        </CardHeader>
                      </Card>
                 </div>
            </SuperAdminGuard>
        )
    }

    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Custos e Infraestrutura"
                    description={`Análise de custos operacionais para ${costData.currentMonth}.`}
                />
                
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Atual (Mês)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
                            <p className="text-xs text-muted-foreground">Custo acumulado até o dia {costData.currentDay}.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projeção para o Final do Mês</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(projectedCost)}</div>
                            <p className="text-xs text-muted-foreground">Estimativa baseada no uso atual.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Principal Custo</CardTitle>
                            {mostExpensiveService && <mostExpensiveService.icon className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{mostExpensiveService?.name || 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                                {mostExpensiveService ? `${formatCurrency(mostExpensiveService.cost)} do total.` : 'Sem dados.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                       <CardTitle>Detalhamento de Custos por Serviço</CardTitle>
                        <CardDescription>
                            Distribuição dos custos entre os diferentes serviços da aplicação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Serviço</TableHead>
                                    <TableHead>Custo</TableHead>
                                    <TableHead className="w-[200px]">Distribuição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceCosts.map((service: any) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <service.icon className="h-4 w-4 text-muted-foreground" />
                                            {service.name}
                                        </TableCell>
                                        <TableCell>{formatCurrency(service.cost)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={service.percentage} className="w-full h-2 [&>div]:bg-admin-primary" aria-label={`Distribuição de custo de ${service.name}`} />
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {service.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <div className="p-4 rounded-lg bg-muted/50 border text-center">
                    <p className="text-sm text-muted-foreground">
                        Os dados exibidos são para fins de demonstração. Para conectar com dados reais, configure o <a href="https://cloud.google.com/billing/docs/how-to/export-data-bigquery" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">export de faturamento do Google Cloud para o BigQuery</a> e implemente a lógica de busca na rota <code className="font-mono text-xs bg-muted p-1 rounded-sm">/api/billing</code>.
                    </p>
                </div>
            </div>
        </SuperAdminGuard>
    );
}

    