
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, FileText, Newspaper, User, Medal, Bomb, Download, Fingerprint, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { format } from 'date-fns';

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

const EVENT_TYPE_CONFIG: { [key in AuditLogEvent['eventType']]?: { label: string, icon: React.ElementType } } = {
    content_view: { label: 'Visualização de Conteúdo', icon: Newspaper },
    document_download: { label: 'Download de Documento', icon: Download },
    page_view: { label: 'Acesso de Página', icon: Eye },
};


export default function ContentInteractionPage() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
        select: (data) => data.filter(e => e.eventType !== 'login' && e.eventType !== 'search_term_used')
    });

    const { contentStats, mostViewed, leastViewed, eventCounts } = useMemo(() => {
        if (isLoading || !events.length) return { contentStats: [], mostViewed: null, leastViewed: null, eventCounts: [] };

        const viewEvents = events.filter(e => e.eventType === 'content_view' || e.eventType === 'document_download');

        const stats: { [contentId: string]: { title: string; type: string; totalViews: number; uniqueViewers: Set<string> } } = {};

        viewEvents.forEach(event => {
            const contentId = event.details.contentId || event.details.documentId;
            if (!contentId) return;
            
            if (!stats[contentId]) {
                stats[contentId] = {
                    title: event.details.contentTitle || event.details.documentName || 'Título desconhecido',
                    type: event.eventType === 'content_view' ? 'Notícia' : 'Documento',
                    totalViews: 0,
                    uniqueViewers: new Set(),
                };
            }

            stats[contentId].totalViews += 1;
            stats[contentId].uniqueViewers.add(event.userId);
        });
        
        const counts = events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const eventCounts = Object.entries(counts).map(([name, value]) => ({
            name: EVENT_TYPE_CONFIG[name as keyof typeof EVENT_TYPE_CONFIG]?.label || name,
            value,
            icon: EVENT_TYPE_CONFIG[name as keyof typeof EVENT_TYPE_CONFIG]?.icon || Fingerprint,
        }));

        const contentStats = Object.entries(stats)
          .map(([id, s]) => ({ id, ...s, uniqueViews: s.uniqueViewers.size }))
          .sort((a, b) => b.uniqueViews - a.uniqueViews);
          
        const mostViewed = contentStats.length > 0 ? contentStats[0] : null;
        const leastViewed = contentStats.length > 1 ? contentStats[contentStats.length - 1] : null;

        return { contentStats, mostViewed, leastViewed, eventCounts };

    }, [events, isLoading]);

    const handleExport = () => {
        const dataForCsv = contentStats.map(item => ({
            'Conteúdo': item.title,
            'Tipo': item.type,
            'Total de Visualizações': item.totalViews,
            'Visualizadores Únicos': item.uniqueViews,
        }));

        const csv = Papa.unparse(dataForCsv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_interacao_conteudo_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );

    return (
        <SuperAdminGuard>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Eye className="h-6 w-6"/>Interação com Conteúdo</CardTitle>
                            <CardDescription>Análise de visualizações, downloads e acessos para entender o engajamento.</CardDescription>
                        </div>
                        <Button onClick={handleExport} disabled={isLoading || contentStats.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conteúdo Mais Popular</CardTitle>
                            <Medal className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-3/4" /> : mostViewed ? (
                                <>
                                    <p className="text-xl font-bold">{mostViewed.title}</p>
                                    <p className="text-xs text-muted-foreground">{mostViewed.uniqueViews} visualizadores únicos</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sem dados.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conteúdo Menos Popular</CardTitle>
                            <Bomb className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-3/4" /> : leastViewed ? (
                                <>
                                    <p className="text-xl font-bold">{leastViewed.title}</p>
                                    <p className="text-xs text-muted-foreground">{leastViewed.uniqueViews} visualizadores únicos</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sem dados.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tabela Sintética de Conteúdo</CardTitle>
                        <CardDescription>Lista de todo o conteúdo consumido, ordenado por visualizadores únicos.</CardDescription>
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
                                        {contentStats.map((item) => (
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
                        {!isLoading && contentStats.length === 0 && (
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
                
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tabela Sintética de Eventos</CardTitle>
                        <CardDescription>Contagem total de cada tipo de evento de interação.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo de Evento</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eventCounts.map((event, index) => {
                                      const Icon = event.icon;
                                      return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                                {event.name}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">{event.value}</TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
