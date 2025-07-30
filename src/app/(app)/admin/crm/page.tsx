
"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import React from 'react';

export default function CrmPage() {
    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="CRM Interno"
                    description="Ferramenta para gerenciamento de relacionamento com o cliente."
                />
                <Card>
                    <CardHeader>
                       <CardTitle>Em desenvolvimento</CardTitle>
                        <CardDescription>
                            A integração com o CRM está sendo preparada e será disponibilizada em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-16">
                        <div className="text-center text-muted-foreground">
                            <Briefcase className="mx-auto h-12 w-12" />
                            <p className="mt-4 text-lg font-medium">CRM Interno</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminGuard>
    );
}
