
"use client";

import React from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, HardHat } from 'lucide-react';

export default function WorkflowEfficiencyPage() {

    return (
        <SuperAdminGuard>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Wrench className="h-6 w-6" />
                            Eficiência dos Workflows
                        </CardTitle>
                        <CardDescription>
                            Análise de métricas de tempo e gargalos nos processos de workflow.
                        </CardDescription>
                    </CardHeader>
                </Card>
                
                <div className="flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed rounded-lg h-96 bg-card">
                    <HardHat className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-bold font-headline text-foreground">
                        Em Construção
                    </h3>
                    <p className="mt-2 text-lg text-muted-foreground max-w-md">
                        Esta seção está sendo desenvolvida para trazer analytics detalhados sobre os tempos de resolução e etapas dos seus workflows. Volte em breve!
                    </p>
                </div>
            </div>
        </SuperAdminGuard>
    );
}
