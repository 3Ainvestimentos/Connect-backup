
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, DollarSign, TrendingUp, Sparkles, Server, Users, Container, FileArchive } from "lucide-react";
import { Progress } from '@/components/ui/progress';

// --- Mock Data ---
// In a real application, this would come from a backend service connected to the cloud billing API.
const costData = {
  currentMonth: "Agosto 2024",
  daysInMonth: 31,
  currentDay: 15,
  services: [
    { id: 'hosting', name: 'App Hosting', cost: 12.50, icon: Server },
    { id: 'firestore', name: 'Firestore', cost: 25.80, icon: Container },
    { id: 'storage', name: 'Cloud Storage', cost: 5.20, icon: FileArchive },
    { id: 'auth', name: 'Authentication', cost: 2.15, icon: Users },
    { id: 'genkit', name: 'Genkit / AI Models', cost: 45.75, icon: Sparkles },
  ],
};
// -----------------

export default function CustosInfraestruturaPage() {
    
    const { totalCost, projectedCost, mostExpensiveService, serviceCosts } = useMemo(() => {
        const total = costData.services.reduce((acc, service) => acc + service.cost, 0);
        const projectionFactor = costData.daysInMonth / costData.currentDay;
        const projected = total * projectionFactor;

        const sortedServices = [...costData.services].sort((a, b) => b.cost - a.cost);
        
        const costs = sortedServices.map(service => ({
            ...service,
            percentage: total > 0 ? (service.cost / total) * 100 : 0,
        }));

        return {
            totalCost: total,
            projectedCost: projected,
            mostExpensiveService: sortedServices[0] || null,
            serviceCosts: costs
        };

    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

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
                                {serviceCosts.map(service => (
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
                        Os dados exibidos são apenas para fins de demonstração. Para uma visualização real, conecte esta página a uma API de faturamento do seu provedor de nuvem.
                    </p>
                </div>
            </div>
        </SuperAdminGuard>
    );
}
