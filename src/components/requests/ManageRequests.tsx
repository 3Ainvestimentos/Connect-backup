
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
import { Mailbox, Eye, Filter, FileDown, User, Users } from 'lucide-react';
import { RequestApprovalModal } from './RequestApprovalModal';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Papa from 'papaparse';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function ManageRequests() {
    const { requests, loading } = useWorkflows();
    const { workflowDefinitions } = useApplications();
    const { collaborators } = useCollaborators();
    const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);
    const [assigneeFilter, setAssigneeFilter] = useState('all'); // 'all', 'unassigned', or collaborator id3a
    
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
        let filtered = requests;
        if (statusFilter.length > 0) {
            filtered = filtered.filter(req => statusFilter.includes(req.status));
        }
        if (assigneeFilter === 'unassigned') {
            filtered = filtered.filter(req => !req.assignee);
        } else if (assigneeFilter !== 'all') {
            filtered = filtered.filter(req => req.assignee?.id === assigneeFilter);
        }
        return filtered;
    }, [requests, statusFilter, assigneeFilter]);

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

    const handleExportCSV = () => {
        const dataToExport = filteredRequests.map(req => {
            const flatFormData = Object.entries(req.formData).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
                    return { [key]: `${value.from} a ${value.to}` };
                }
                return { [key]: value };
            }).reduce((acc, current) => ({ ...acc, ...current }), {});

            return {
                ID: req.id,
                Tipo: req.type,
                Status: getStatusLabel(req),
                Responsavel: req.assignee?.name || 'Não atribuído',
                Solicitante: req.submittedBy.userName,
                Email_Solicitante: req.submittedBy.userEmail,
                Data_Submissao: format(parseISO(req.submittedAt), "dd/MM/yyyy HH:mm:ss"),
                ...flatFormData
            };
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_solicitacoes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    
    const getAssigneeFilterLabel = () => {
        if (assigneeFilter === 'all') return 'Todos';
        if (assigneeFilter === 'unassigned') return 'Não Atribuídos';
        const collab = collaborators.find(c => c.id3a === assigneeFilter);
        return collab ? collab.name : 'Desconhecido';
    }


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
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Users className="mr-2 h-4 w-4" />
                                        Responsável: {getAssigneeFilterLabel()}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filtrar por Responsável</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={assigneeFilter} onValueChange={setAssigneeFilter}>
                                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="unassigned">Não Atribuídos</DropdownMenuRadioItem>
                                        <DropdownMenuSeparator />
                                        {collaborators.map(c => (
                                            <DropdownMenuRadioItem key={c.id} value={c.id3a}>
                                                {c.name}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                             <Button variant="secondary" onClick={handleExportCSV} disabled={filteredRequests.length === 0}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar CSV
                            </Button>
                        </div>
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
                                        <TableHead>Responsável</TableHead>
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
                                            <TableCell>
                                                {req.assignee ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback className="text-xs">
                                                                {req.assignee.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">{req.assignee.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Não atribuído</span>
                                                )}
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
