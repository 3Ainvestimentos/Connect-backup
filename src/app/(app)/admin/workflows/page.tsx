
"use client";

import React, { useState } from 'react';
import { useApplications, WorkflowDefinition } from '@/contexts/ApplicationsContext';
import AdminGuard from '@/components/auth/AdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/icons';
import { WorkflowDefinitionForm } from '@/components/admin/WorkflowDefinitionForm';

export default function ManageWorkflowsPage() {
    const { workflowDefinitions, loading, deleteWorkflowDefinitionMutation } = useApplications();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<WorkflowDefinition | null>(null);

    const handleOpenForm = (definition: WorkflowDefinition | null) => {
        setEditingDefinition(definition);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta definição de workflow? Todas as solicitações associadas permanecerão, mas não será possível criar novas.")) return;
        try {
            await deleteWorkflowDefinitionMutation.mutateAsync(id);
            toast({ title: "Sucesso!", description: "Definição de workflow excluída." });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            toast({ title: "Falha na Exclusão", description: errorMessage, variant: "destructive" });
        }
    };

    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Gerenciamento de Workflows"
                    description="Crie e gerencie os formulários e processos da área de Aplicações."
                />
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Definições de Workflow</CardTitle>
                            <CardDescription>
                                {workflowDefinitions.length} workflow(s) definido(s).
                            </CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm(null)} className="bg-admin-primary hover:bg-admin-primary/90">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Definição
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ícone</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Campos</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workflowDefinitions.map(def => {
                                        const Icon = getIcon(def.icon);
                                        return (
                                            <TableRow key={def.id}>
                                                <TableCell><Icon className="h-5 w-5 text-muted-foreground" /></TableCell>
                                                <TableCell className="font-medium">{def.name}</TableCell>
                                                <TableCell>{def.fields.length}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(def)} className="hover:bg-muted">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(def.id)} className="hover:bg-muted" disabled={deleteWorkflowDefinitionMutation.isPending && deleteWorkflowDefinitionMutation.variables === def.id}>
                                                        {deleteWorkflowDefinitionMutation.isPending && deleteWorkflowDefinitionMutation.variables === def.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {isFormOpen && (
                <WorkflowDefinitionForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    definition={editingDefinition}
                />
            )}
        </AdminGuard>
    );
}
