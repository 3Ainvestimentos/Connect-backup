
"use client";

import React, { useState, useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useCollaborators, Collaborator, CollaboratorPermissions } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Shield, Loader2, Search, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const permissionLabels: { key: keyof CollaboratorPermissions; label: string }[] = [
    { key: 'canManageContent', label: 'Conteúdo' },
    { key: 'canManageWorkflows', label: 'Workflows' },
    { key: 'canManageRequests', label: 'Solicitações' },
    { key: 'canViewTasks', label: 'Minhas Tarefas' },
    { key: 'canViewBI', label: 'Business Intelligence' },
    { key: 'canViewDra', label: 'DRA/Pagamentos' },
];

function PermissionsTable() {
    const { collaborators, loading, updateCollaboratorPermissions } = useCollaborators();
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCollaborators = useMemo(() => {
        const sortedByName = [...collaborators].sort((a, b) => a.name.localeCompare(b.name));
        if (!searchTerm) return sortedByName;
        
        return sortedByName.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [collaborators, searchTerm]);

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
                description: `${collaborator.name} ${newPermissions[permissionKey] ? 'agora tem acesso a' : 'não tem mais acesso a'} '${permissionLabels.find(p => p.key === permissionKey)?.label}'.`,
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Permissões de Administrador</CardTitle>
                        <CardDescription>
                            Ative ou desative o acesso aos painéis de controle para cada colaborador.
                        </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
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
                            {filteredCollaborators.map(collaborator => (
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
                                                    className="data-[state=checked]:bg-[hsl(170,60%,50%)]"
                                                />
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {filteredCollaborators.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">Nenhum colaborador encontrado para a busca "{searchTerm}".</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function PermissionsPageContent() {
    return (
        <SuperAdminGuard>
            <PermissionsTable />
        </SuperAdminGuard>
    );
}
