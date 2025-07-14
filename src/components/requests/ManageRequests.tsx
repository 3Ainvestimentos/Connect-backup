
"use client";

import React, { useState, useMemo } from 'react';
import { useWorkflows, WorkflowRequest, WorkflowStatus } from '@/contexts/WorkflowsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mailbox, Eye, Filter } from 'lucide-react';
import { RequestApprovalModal } from './RequestApprovalModal';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ManageRequests() {
    const { requests, loading } = useWorkflows();
    const { workflowDefinitions } = useApplications();
    const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);
    
    // Create a flat list of all possible statuses from all definitions
    const allStatuses = useMemo(() => {
        const statusMap = new Map<string, string>();
        workflowDefinitions.forEach(def => {
            def.statuses.forEach(status => {
                if (!statusMap.has(status.id)) {
                    statusMap.set(status.id, status.label);
                }
            });
        });
        return Array.from(statusMap.entries()).map(([id, label]) => ({ id, label }));
    }, [workflowDefinitions]);
    
    const [statusFilter, setStatusFilter] = useState<WorkflowStatus[]>(['pending']);

    const filteredRequests = useMemo(() => {
        if (statusFilter.length === 0) return requests;
        return requests.filter(req => statusFilter.includes(req.status));
    }, [requests, statusFilter]);

    const handleStatusFilterChange = (statusId: WorkflowStatus) => {
        setStatusFilter(prev => 
            prev.includes(statusId) 
                ? prev.filter(s => s !== statusId) 
                : [...prev, statusId]
        );
    };

    const getStatusLabel = (request: WorkflowRequest) => {
        const definition = workflowDefinitions.find(d => d.name === request.type);
        const status = definition?.statuses.find(s => s.id === request.status);
        return status?.label || request.status;
    };

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Caixa de Entrada</CardTitle>
                            <CardDescription>
                                {filteredRequests.length} solicitação(ões) encontrada(s).
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrar por Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {allStatuses.map(status => (
                                    <DropdownMenuCheckboxItem
                                        key={status.id}
                                        checked={statusFilter.includes(status.id)}
                                        onCheckedChange={() => handleStatusFilterChange(status.id)}
                                    >
                                        {status.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? renderSkeleton() : (
                         <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Data de Submissão</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((req) => (
                                        <TableRow key={req.id}>
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
                    )}
                    {!loading && filteredRequests.length === 0 && (
                        <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                            <Mailbox className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium text-foreground">Caixa de entrada vazia</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Nenhuma solicitação corresponde aos filtros selecionados.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <RequestApprovalModal
                request={selectedRequest}
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </>
    );
}
