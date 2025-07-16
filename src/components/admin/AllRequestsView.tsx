
"use client";

import React, { useState, useMemo } from 'react';
import { useWorkflows, WorkflowRequest } from '@/contexts/WorkflowsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ListChecks, User, Search, Filter, FileDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Papa from 'papaparse';

type SortKey = 'type' | 'status' | 'submittedBy' | 'assignee' | 'ownerEmail' | 'submittedAt' | '';
type SortDirection = 'asc' | 'desc';

export function AllRequestsView() {
    const { requests, loading } = useWorkflows();
    const { workflowDefinitions } = useApplications();
    const { collaborators } = useCollaborators();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const filteredAndSortedRequests = useMemo(() => {
        let items = [...requests];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(req =>
                req.type.toLowerCase().includes(lowercasedTerm) ||
                req.submittedBy.userName.toLowerCase().includes(lowercasedTerm) ||
                (req.assignee && req.assignee.name.toLowerCase().includes(lowercasedTerm)) ||
                (req.ownerEmail && req.ownerEmail.toLowerCase().includes(lowercasedTerm))
            );
        }
        
        if (sortKey) {
            items.sort((a, b) => {
                let valA: any, valB: any;

                switch (sortKey) {
                    case 'submittedBy':
                        valA = a.submittedBy.userName;
                        valB = b.submittedBy.userName;
                        break;
                    case 'assignee':
                        valA = a.assignee?.name || '';
                        valB = b.assignee?.name || '';
                        break;
                    case 'submittedAt':
                        valA = new Date(a.submittedAt).getTime();
                        valB = new Date(b.submittedAt).getTime();
                        break;
                    default:
                        valA = a[sortKey];
                        valB = b[sortKey];
                }

                let comparison = 0;
                if (valA > valB) {
                    comparison = 1;
                } else if (valA < valB) {
                    comparison = -1;
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return items;
    }, [requests, searchTerm, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const getStatusLabel = (request: WorkflowRequest) => {
        const definition = workflowDefinitions.find(d => d.name === request.type);
        const status = definition?.statuses.find(s => s.id === request.status);
        return status?.label || request.status;
    };
    
    const getOwnerName = (email: string) => {
        const owner = collaborators.find(c => c.email === email);
        return owner?.name || email;
    }

    const handleExportCSV = () => {
        const dataToExport = filteredAndSortedRequests.map(req => {
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
                Proprietario_Workflow: getOwnerName(req.ownerEmail),
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
        link.setAttribute('download', `relatorio_geral_solicitacoes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    
    const SortableHeader = ({ tkey, label }: { tkey: SortKey; label: string }) => (
      <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50">
          <div className="flex items-center gap-1">
              {label}
              {sortKey === tkey && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </div>
      </TableHead>
    );

    return (
        <div>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <ListChecks className="h-6 w-6" />
                           Visão Geral de Solicitações
                        </CardTitle>
                        <CardDescription>
                            {filteredAndSortedRequests.length} solicitação(ões) encontrada(s) em todo o sistema.
                        </CardDescription>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Buscar em todas as solicitações..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleExportCSV} disabled={filteredAndSortedRequests.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? renderSkeleton() : (
                     <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHeader tkey="type" label="Tipo" />
                                    <SortableHeader tkey="status" label="Status" />
                                    <SortableHeader tkey="submittedBy" label="Solicitante" />
                                    <SortableHeader tkey="assignee" label="Responsável" />
                                    <SortableHeader tkey="ownerEmail" label="Proprietário" />
                                    <SortableHeader tkey="submittedAt" label="Data" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.type}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-semibold">
                                                {getStatusLabel(req)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{req.submittedBy.userName}</TableCell>
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
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground"/>
                                                <span className="text-sm">{getOwnerName(req.ownerEmail)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(parseISO(req.submittedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                )}
                {!loading && filteredAndSortedRequests.length === 0 && (
                    <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma solicitação encontrada</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Não há solicitações que correspondam à sua busca.
                        </p>
                    </div>
                )}
            </CardContent>
        </div>
    );
}
