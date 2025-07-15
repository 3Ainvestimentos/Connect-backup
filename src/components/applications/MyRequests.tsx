
"use client";

import React, { useState } from 'react';
import { useWorkflows, WorkflowRequest, WorkflowStatus } from '@/contexts/WorkflowsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileClock, Inbox, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { RequestDetailsModal } from './RequestDetailsModal';

export default function MyRequests() {
    const { user } = useAuth();
    const { requests, loading } = useWorkflows();
    const { collaborators } = useCollaborators();
    const { workflowDefinitions } = useApplications();
    const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);

    const myRequests = React.useMemo(() => {
        if (!user || !collaborators.length) return [];
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return [];
        return requests.filter(req => req.submittedBy.userId === currentUserCollab.id3a);
    }, [requests, user, collaborators]);

    const getStatusLabel = (request: WorkflowRequest) => {
        const definition = workflowDefinitions.find(d => d.name === request.type);
        const status = definition?.statuses.find(s => s.id === request.status);
        return status?.label || request.status;
    };

    const handleViewDetails = (request: WorkflowRequest) => {
        setSelectedRequest(request);
    };

    const renderSkeleton = () => (
        <Card>
            <CardHeader>
                <CardTitle>Minhas Solicitações</CardTitle>
                <CardDescription>Acompanhe o status das suas solicitações aqui.</CardDescription>
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
        return renderSkeleton();
    }
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileClock className="h-6 w-6" />
                        Minhas Solicitações
                    </CardTitle>
                    <CardDescription>
                        Acompanhe o status das suas solicitações aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {myRequests.length > 0 ? (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Data de Submissão</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.type}</TableCell>
                                            <TableCell>{format(parseISO(req.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-semibold">
                                                    {getStatusLabel(req)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetails(req)}>
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
                            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma solicitação encontrada</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Você ainda não fez nenhuma solicitação. Inicie uma nos cards acima.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <RequestDetailsModal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
            />
        </>
    );
}
