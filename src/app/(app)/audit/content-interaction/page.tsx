
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, FileText, Newspaper, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: {
        documentId?: string;
        documentName?: string;
        path?: string;
        message?: string;
        contentId?: string;
        contentTitle?: string;
        contentType?: 'news' | 'document';
    }
}>;

export default function ContentInteractionPage() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
    });

    const contentInteractionData = useMemo(() => {
        if (isLoading || !events.length) return [];

        const viewEvents = events.filter(e => e.eventType === 'content_view' || e.eventType === 'document_download');

        const contentStats: { [contentId: string]: { title: string; type: string; totalViews: number; uniqueViewers: Set<string> } } = {};

        viewEvents.forEach(event => {
            const contentId = event.details.contentId || event.details.documentId;
            if (!contentId) return;
            
            if (!contentStats[contentId]) {
                contentStats[contentId] = {
                    title: event.details.contentTitle || event.details.documentName || 'Título desconhecido',
                    type: event.eventType === 'content_view' ? 'Notícia' : 'Documento',
                    totalViews: 0,
                    uniqueViewers: new Set(),
                };
            }

            contentStats[contentId].totalViews += 1;
            contentStats[contentId].uniqueViewers.add(event.userId);
        });

        return Object.entries(contentStats)
          .map(([id, stats]) => ({ id, ...stats, uniqueViews: stats.uniqueViewers.size }))
          .sort((a, b) => b.uniqueViews - a.uniqueViews);

    }, [events, isLoading]);
    
    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );

    return (
        <SuperAdminGuard>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-6 w-6" />
                        Interação com Conteúdo
                    </CardTitle>
                    <CardDescription>
                        Análise de visualizações e downloads de notícias e documentos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? renderSkeleton() : (
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Conteúdo</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Total de Visualizações</TableHead>
                                        <TableHead>Visualizadores Únicos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contentInteractionData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                                                    {item.type === 'Notícia' ? <Newspaper className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                   <Eye className="h-4 w-4 text-muted-foreground" />
                                                   {item.totalViews}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                   <User className="h-4 w-4 text-muted-foreground" />
                                                   {item.uniqueViews}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!isLoading && contentInteractionData.length === 0 && (
                        <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
                            <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma interação registrada</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ainda não há dados de visualização de conteúdo para exibir.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </SuperAdminGuard>
    );
}
