
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Fingerprint, PieChart, LineChart as LineChartIcon, User, Eye, Download, Search } from 'lucide-react';
import { Pie, ResponsiveContainer, Tooltip, Legend, Cell, Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfToday, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { [key: string]: any };
}>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
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

    const activityOverTime = useMemo(() => {
        if (isLoading) return [];
        const today = startOfToday();
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
        
        const countsByDay = last7Days.map(day => ({
            date: format(day, 'dd/MM'),
            count: 0,
        }));

        events.forEach(event => {
            const eventDay = startOfDay(parseISO(event.timestamp));
            const dayIndex = last7Days.findIndex(d => d.getTime() === eventDay.getTime());
            if (dayIndex !== -1) {
                countsByDay[dayIndex].count++;
            }
        });
        
        return countsByDay;
    }, [events, isLoading]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full rounded-full" /></CardContent></Card>
                    <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
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
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><PieChart className="h-5 w-5"/>Distribuição de Eventos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={eventCountsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {eventCountsByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }} />
                                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><LineChartIcon className="h-5 w-5"/>Atividade nos Últimos 7 Dias</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={activityOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}/>
                                    <Line type="monotone" dataKey="count" name="Eventos" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }}/>
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
