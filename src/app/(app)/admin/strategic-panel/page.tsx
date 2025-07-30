
"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target } from "lucide-react";
import React from 'react';

export default function StrategicPanelPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Painel Estratégico"
                    description="Visualização de dados e métricas para decisões estratégicas."
                />
                <Card>
                    <CardHeader>
                       <CardTitle>Em desenvolvimento</CardTitle>
                        <CardDescription>
                            O painel estratégico está sendo construído e será disponibilizado em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-16">
                        <div className="text-center text-muted-foreground">
                            <Target className="mx-auto h-12 w-12" />
                            <p className="mt-4 text-lg font-medium">Painel Estratégico</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    );
}
