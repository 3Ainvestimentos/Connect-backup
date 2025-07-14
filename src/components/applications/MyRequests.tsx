
"use client";

import React from 'react';
import { useWorkflows, WorkflowRequest, WorkflowStatus } from '@/contexts/WorkflowsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileClock, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusMap: { [key in WorkflowStatus]: { label: string; className: string } } = {
  pending: { label: 'Pendente', className: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30' },
  approved: { label: 'Aprovado', className: 'bg-green-400/20 text-green-700 border-green-400/30' },
  rejected: { label: 'Rejeitado', className: 'bg-red-400/20 text-red-700 border-red-400/30' },
  in_progress: { label: 'Em Andamento', className: 'bg-blue-400/20 text-blue-700 border-blue-400/30' },
  completed: { label: 'Concluído', className: 'bg-gray-400/20 text-gray-700 border-gray-400/30' },
};

export default function MyRequests() {
    const { user } = useAuth();
    const { requests, loading } = useWorkflows();
    const { collaborators } = useCollaborators();

    const myRequests = React.useMemo(() => {
        if (!user || !collaborators.length) return [];
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (!currentUserCollab) return [];
        return requests.filter(req => req.submittedBy.userId === currentUserCollab.id3a);
    }, [requests, user, collaborators]);

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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.type}</TableCell>
                                        <TableCell>{format(parseISO(req.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-semibold", statusMap[req.status]?.className)}>
                                                {statusMap[req.status]?.label || 'Desconhecido'}
                                            </Badge>
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
    );
}
