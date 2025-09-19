"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banknote } from "lucide-react";
import React from 'react';

export default function CustosInfraestruturaPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
            title="Custos e Infraestrutura"
            description="Análise detalhada dos custos operacionais e da infraestrutura da aplicação."
        />
        <Card>
            <CardHeader>
                <CardTitle>Em desenvolvimento</CardTitle>
                <CardDescription>
                    O painel de custos está sendo preparado e será incorporado nesta página em breve.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-16">
                <div className="text-center text-muted-foreground">
                    <Banknote className="mx-auto h-12 w-12" />
                    <p className="mt-4 text-lg font-medium">Painel de Custos</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
