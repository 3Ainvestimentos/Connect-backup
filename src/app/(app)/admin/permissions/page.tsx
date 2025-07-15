
"use client";

import React, { useState, useEffect } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useCollaborators, Collaborator, CollaboratorPermissions } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const permissionLabels: { key: keyof CollaboratorPermissions; label: string }[] = [
    { key: 'canManageContent', label: 'Conteúdo' },
    { key: 'canManageWorkflows', label: 'Workflows' },
    { key: 'canManageRequests', label: 'Solicitações' },
    { key: 'canViewAnalytics', label: 'Analytics' },
];

function ManagePermissions() {
    const { collaborators, loading, updateCollaboratorPermissions } = useCollaborators();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handlePermissionToggle = async (collaborator: Collaborator, permissionKey: keyof CollaboratorPermissions) => {
        const newPermissions = {
            ...collaborator.permissions,
            [permissionKey]: !collaborator.permissions[permissionKey],
        };
        setUpdatingId(collaborator.id);
        try {
            await updateCollaboratorPermissions(collaborator.id, newPermissions);
            toast({
                title: "Permissão Atualizada",
                description: `${collaborator.name} ${newPermissions[permissionKey] ? 'agora pode' : 'não pode mais'} gerenciar '${permissionLabels.find(p => p.key === permissionKey)?.label}'.`,
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
                         <div className="flex gap-4">
                            <Skeleton className="h-6 w-11" />
                            <Skeleton className="h-6 w-11" />
                            <Skeleton className="h-6 w-11" />
                            <Skeleton className="h-6 w-11" />
                        </div>
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
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                {permissionLabels.map(p => <TableHead key={p.key}>{p.label}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collaborators.map(collaborator => (
                                <TableRow key={collaborator.id}>
                                    <TableCell className="font-medium">{collaborator.name}<br/><span className="text-xs text-muted-foreground">{collaborator.email}</span></TableCell>
                                    {permissionLabels.map(p => (
                                        <TableCell key={p.key}>
                                            {updatingId === collaborator.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Switch
                                                    checked={!!collaborator.permissions[p.key]}
                                                    onCheckedChange={() => handlePermissionToggle(collaborator, p.key)}
                                                    disabled={updatingId === collaborator.id}
                                                    aria-label={`Ativar/desativar permissão ${p.label} para ${collaborator.name}`}
                                                />
                                            )}
                                        </TableCell>
                                    ))}
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
