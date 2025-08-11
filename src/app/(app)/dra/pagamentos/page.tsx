
"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banknote } from "lucide-react";
import React from 'react';
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";

export default function CustosInfraestruturaPage() {
    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Custos e Infraestrutura"
                    description="Análise de custos operacionais e gerenciamento de infraestrutura."
                />
                <Card>
                    <CardHeader>
                       <CardTitle>Em desenvolvimento</CardTitle>
                        <CardDescription>
                            Este painel está sendo construído e será disponibilizado em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-16">
                        <div className="text-center text-muted-foreground">
                            <Banknote className="mx-auto h-12 w-12" />
                            <p className="mt-4 text-lg font-medium">Custos e Infraestrutura</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
