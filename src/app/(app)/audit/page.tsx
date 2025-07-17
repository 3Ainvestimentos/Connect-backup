
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Fingerprint, LineChart as LineChartIcon, User, Eye, Download, Search } from 'lucide-react';
import { Pie, ResponsiveContainer, Tooltip, Legend, Cell, Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { [key: string]: any };
}>;

const EVENT_TYPE_LABELS: { [key in AuditLogEvent['eventType']]: { label: string, icon: React.ElementType } } = {
    login: { label: 'Logins', icon: User },
    page_view: { label: 'Acessos de Página', icon: Eye },
    document_download: { label: 'Downloads', icon: Download },
    content_view: { label: 'Visualizações de Conteúdo', icon: Eye },
    search_term_used: { label: 'Buscas Realizadas', icon: Search },
};


export default function AuditPage() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
    });

    const eventCountsByType = useMemo(() => {
        if (isLoading) return [];
        const counts = events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({
            name: EVENT_TYPE_LABELS[name as keyof typeof EVENT_TYPE_LABELS]?.label || name,
            value,
        }));
    }, [events, isLoading]);

    const cumulativeLogins = useMemo(() => {
        if (isLoading || events.length === 0) return [];
        
        const loginEvents = events
            .filter(event => event.eventType === 'login')
            .sort((a, b) => compareAsc(parseISO(a.timestamp), parseISO(b.timestamp)));
            
        if (loginEvents.length === 0) return [];

        const startDate = startOfDay(parseISO(loginEvents[0].timestamp));
        const endDate = startOfDay(new Date());
        
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        const loginsByDay: { [key: string]: number } = {};
        loginEvents.forEach(event => {
            const dayKey = format(startOfDay(parseISO(event.timestamp)), 'yyyy-MM-dd');
            loginsByDay[dayKey] = (loginsByDay[dayKey] || 0) + 1;
        });

        let accumulatedLogins = 0;
        const cumulativeData = dateRange.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            accumulatedLogins += (loginsByDay[dayKey] || 0);
            return {
                date: format(day, 'dd/MM/yy'),
                'Logins Acumulados': accumulatedLogins,
            };
        });

        return cumulativeData;

    }, [events, isLoading]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    return (
        <SuperAdminGuard>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Fingerprint className="h-6 w-6"/>Visão Geral de Eventos</CardTitle>
                        <CardDescription>Análise da atividade geral registrada na plataforma.</CardDescription>
                    </CardHeader>
                </Card>
                
                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><LineChartIcon className="h-5 w-5"/>Total Acumulado de Logins</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={cumulativeLogins}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="Logins Acumulados" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tabela Sintética</CardTitle>
                        <CardDescription>Contagem total de cada tipo de evento registrado.</CardDescription>
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
                                    {eventCountsByType.map((event, index) => {
                                      const Icon = EVENT_TYPE_LABELS[Object.keys(EVENT_TYPE_LABELS).find(key => EVENT_TYPE_LABELS[key as keyof typeof EVENT_TYPE_LABELS].label === event.name) as keyof typeof EVENT_TYPE_LABELS]?.icon;
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

