
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Fingerprint } from 'lucide-react';

type AuditLogEvent = WithId<{
    eventType: 'document_download';
    userId: string;
    userName: string;
    timestamp: string;
    details: {
        documentId: string;
        documentName: string;
    }
}>;

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
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-6 w-6" />
                    Registros de Download de Documentos
                </CardTitle>
                <CardDescription>
                    Eventos de download de documentos por colaborador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? renderSkeleton() : (
                     <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-semibold flex items-center gap-1.5 w-fit">
                                                <Download className="h-3 w-3"/>
                                                Download
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{event.userName}</TableCell>
                                        <TableCell>{event.details.documentName}</TableCell>
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
                            Ainda não há eventos de download para exibir.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
