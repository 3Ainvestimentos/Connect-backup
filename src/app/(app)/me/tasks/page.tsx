
"use client";

import React, { useState, useMemo } from 'react';
import { useWorkflows, WorkflowRequest } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, ListTodo, Inbox } from 'lucide-react';
import { RequestApprovalModal } from '@/components/requests/RequestApprovalModal';
import { useApplications } from '@/contexts/ApplicationsContext';

export default function MyTasksPage() {
    const { user, loading: userLoading } = useAuth();
    const { requests, loading: requestsLoading } = useWorkflows();
    const { collaborators, loading: collabLoading } = useCollaborators();
    const { workflowDefinitions } = useApplications();
    const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);

    const loading = userLoading || requestsLoading || collabLoading;

    const myAssignedTasks = useMemo(() => {
        if (loading || !user) return [];
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return [];
        
        return requests.filter(req => 
            !req.isArchived && // <-- FIX: Only show non-archived requests
            req.assignee && 
            req.assignee.id === currentUserCollab.id3a
        );
    }, [requests, user, collaborators, loading]);

    const getStatusLabel = (request: WorkflowRequest) => {
        const definition = workflowDefinitions.find(d => d.name === request.type);
        const status = definition?.statuses.find(s => s.id === request.status);
        return status?.label || request.status;
    };

    const renderSkeleton = () => (
         <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
             <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Minhas Tarefas"
                    description="Gerencie as solicitações que foram atribuídas a você."
                />
                {renderSkeleton()}
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader 
                    title="Minhas Tarefas"
                    description="Gerencie as solicitações que foram atribuídas a você."
                />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListTodo className="h-6 w-6" />
                            Tarefas Atribuídas
                        </CardTitle>
                        <CardDescription>
                            {myAssignedTasks.length} tarefa(s) atribuída(s) a você.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {myAssignedTasks.length > 0 ? (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Solicitante</TableHead>
                                            <TableHead>Data de Submissão</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myAssignedTasks.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-mono text-muted-foreground text-xs">{req.requestId}</TableCell>
                                                <TableCell className="font-medium">{req.type}</TableCell>
                                                <TableCell>{req.submittedBy.userName}</TableCell>
                                                <TableCell>{format(parseISO(req.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-semibold">
                                                        {getStatusLabel(req)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(req)}>
                                                        <Eye className="h-5 w-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma tarefa encontrada</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Você não possui nenhuma solicitação atribuída no momento.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <RequestApprovalModal
                request={selectedRequest}
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </>
    );
}
