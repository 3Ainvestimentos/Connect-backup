
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Fingerprint, LogIn, Eye } from 'lucide-react';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: {
        documentId?: string;
        documentName?: string;
        path?: string;
        message?: string;
    }
}>;

const eventTypeConfig = {
    login: {
        label: "Login",
        icon: LogIn,
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
    },
    page_view: {
        label: "Acesso de Página",
        icon: Eye,
        className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
    },
    document_download: {
        label: "Download",
        icon: Download,
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
    },
};

export function EventLogView() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
        select: (data) => data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    });

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    
    const renderEventDetails = (event: AuditLogEvent) => {
        switch (event.eventType) {
            case 'login':
                return `Usuário ${event.userName} entrou no sistema.`;
            case 'page_view':
                return `Acessou a página: ${event.details.path}`;
            case 'document_download':
                return `Baixou o documento: ${event.details.documentName}`;
            default:
                return JSON.stringify(event.details);
        }
    };
    
    const renderEventTypeBadge = (eventType: AuditLogEvent['eventType']) => {
        const config = eventTypeConfig[eventType] || {};
        const Icon = config.icon || Fingerprint;
        return (
            <Badge variant="outline" className={`font-semibold flex items-center gap-1.5 w-fit ${config.className}`}>
                <Icon className="h-3 w-3"/>
                {config.label || eventType}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-6 w-6" />
                    Registros de Eventos
                </CardTitle>
                <CardDescription>
                    Atividades de logins, acessos a páginas e downloads de documentos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? renderSkeleton() : (
                     <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo de Evento</TableHead>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {renderEventTypeBadge(event.eventType)}
                                        </TableCell>
                                        <TableCell className="font-medium">{event.userName}</TableCell>
                                        <TableCell>{renderEventDetails(event)}</TableCell>
                                        <TableCell>{format(parseISO(event.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                )}
                {!isLoading && events.length === 0 && (
                    <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                        <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum evento registrado</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ainda não há eventos para exibir.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
