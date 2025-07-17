
"use client";

import React, { useState, useRef } from 'react';
import { useApplications, WorkflowDefinition, workflowDefinitionSchema } from '@/contexts/ApplicationsContext';
import AdminGuard from '@/components/auth/AdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Upload, Timer, User, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/icons';
import { WorkflowDefinitionForm } from '@/components/admin/WorkflowDefinitionForm';
import { ZodError } from 'zod';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Badge } from '@/components/ui/badge';

export default function ManageWorkflowsPage() {
    const { workflowDefinitions, loading, deleteWorkflowDefinitionMutation, addWorkflowDefinition } = useApplications();
    const { collaborators } = useCollaborators();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<WorkflowDefinition | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                let jsonData = JSON.parse(text);

                // Compatibility for old "slaDays"
                if (jsonData.slaDays && !jsonData.defaultSlaDays) {
                    jsonData.defaultSlaDays = jsonData.slaDays;
                    delete jsonData.slaDays;
                }

                // Pre-process and filter out empty routing rules
                if (jsonData.routingRules && Array.isArray(jsonData.routingRules)) {
                    jsonData.routingRules = jsonData.routingRules.filter(
                        (rule: any) => rule && rule.field && rule.value
                    );
                }
                
                // Pre-process and filter out empty SLA rules
                if (jsonData.slaRules && Array.isArray(jsonData.slaRules)) {
                    jsonData.slaRules = jsonData.slaRules.filter(
                        (rule: any) => rule && rule.field && rule.value && rule.days !== undefined
                    );
                }
                
                // Ensure allowedUserIds exists, default to ['all'] if not present
                if (!jsonData.allowedUserIds) {
                    jsonData.allowedUserIds = ['all'];
                }

                // Validate the cleaned JSON data using the Zod schema
                const parsedData = workflowDefinitionSchema.parse(jsonData);

                await addWorkflowDefinition(parsedData);

                toast({
                    title: "Importação Concluída!",
                    description: `O workflow '${parsedData.name}' foi adicionado com sucesso.`,
                });
            } catch (error) {
                console.error("Erro na importação de Workflow:", error);
                let description = "Ocorreu um erro desconhecido.";
                if (error instanceof SyntaxError) {
                    description = "O arquivo JSON possui um formato inválido.";
                } else if (error instanceof ZodError) {
                    description = `Erro de validação: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
                } else if (error instanceof Error) {
                    description = error.message;
                }
                toast({
                    title: "Erro na Importação",
                    description: description,
                    variant: "destructive",
                });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset file input
                }
            }
        };
        
        reader.onerror = () => {
             toast({
                title: "Erro de Leitura",
                description: "Não foi possível ler o arquivo selecionado.",
                variant: "destructive",
            });
            setIsImporting(false);
        };

        reader.readAsText(file);
    };
    
    const getOwnerName = (email: string) => {
        const owner = collaborators.find(c => c.email === email);
        return owner?.name || email;
    }
    
    const getAccessDescription = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Ninguém';
        if (ids.includes('all')) return 'Todos';
        return `${ids.length} Colaborador(es)`;
    };


    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Gerenciamento de Workflows"
                    description="Crie e gerencie os formulários e processos da área de Aplicações."
                />
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle>Definições de Workflow</CardTitle>
                            <CardDescription>
                                {workflowDefinitions.length} workflow(s) definido(s).
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isImporting}>
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                {isImporting ? 'Importando...' : 'Importar JSON'}
                            </Button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFileImport}
                            />
                            <Button onClick={() => handleOpenForm(null)} className="bg-admin-primary hover:bg-admin-primary/90">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nova Definição
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ícone</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Proprietário</TableHead>
                                        <TableHead>Acesso</TableHead>
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
                                                <TableCell>
                                                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                                                      <User className="h-3 w-3" />
                                                      {getOwnerName(def.ownerEmail)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={def.allowedUserIds?.includes('all') ? 'default' : 'secondary'} className="flex items-center gap-1.5 w-fit">
                                                      <Users className="h-3 w-3" />
                                                      {getAccessDescription(def.allowedUserIds || ['all'])}
                                                    </Badge>
                                                </TableCell>
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
