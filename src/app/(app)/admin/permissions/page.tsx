
"use client";

import React, { useState } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useCollaborators, Collaborator } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function ManagePermissions() {
    const { collaborators, loading, updateCollaboratorAdminStatus } = useCollaborators();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleAdminToggle = async (collaborator: Collaborator) => {
        const newStatus = !collaborator.isAdmin;
        setUpdatingId(collaborator.id);
        try {
            await updateCollaboratorAdminStatus(collaborator.id, newStatus);
            toast({
                title: "Permissão Atualizada",
                description: `${collaborator.name} agora ${newStatus ? 'é' : 'não é'} um administrador.`,
            });
        } catch (error) {
            toast({
                title: "Erro ao atualizar permissão",
                description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-6 w-11" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Permissões de Administrador</CardTitle>
                <CardDescription>
                    Ative ou desative o acesso aos painéis de controle para cada colaborador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Acesso de Administrador</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collaborators.map(collaborator => (
                                <TableRow key={collaborator.id}>
                                    <TableCell className="font-medium">{collaborator.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{collaborator.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={!!collaborator.isAdmin}
                                            onCheckedChange={() => handleAdminToggle(collaborator)}
                                            disabled={updatingId === collaborator.id}
                                            aria-label={`Ativar/desativar admin para ${collaborator.name}`}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PermissionsPage() {
    return (
        <SuperAdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Administração"
                    description="Gerencie as permissões de acesso da plataforma."
                    icon={Shield}
                />
                <ManagePermissions />
            </div>
        </SuperAdminGuard>
    );
}
