
"use client";

import React, { useMemo } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon, LogIn, BarChart as BarChartIcon, Users as UsersIcon, FileDown } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, BarChart, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, compareAsc, endOfDay, subDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { [key: string]: any };
}>;


export default function AuditPage() {
    const { data: events = [], isLoading } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
        select: (data) => data.filter(e => e.eventType === 'login'),
    });
    const { collaborators, loading: loadingCollaborators } = useCollaborators();

    const cumulativeLogins = useMemo(() => {
        if (isLoading || events.length === 0) return [];
        
        const loginEvents = events
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

    const loginsLast7Days = useMemo(() => {
        if (isLoading || events.length === 0) return [];
        
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 6)); // Last 7 days including today
        
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        const loginsByDay: { [key: string]: number } = {};
        events.forEach(event => {
            const eventDate = parseISO(event.timestamp);
            if (isWithinInterval(eventDate, { start: startDate, end: endDate })) {
                const dayKey = format(startOfDay(eventDate), 'yyyy-MM-dd');
                loginsByDay[dayKey] = (loginsByDay[dayKey] || 0) + 1;
            }
        });

        return dateRange.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            return {
                date: format(day, 'EEE', { locale: ptBR }),
                Logins: loginsByDay[dayKey] || 0,
            };
        });
    }, [events, isLoading]);
    
    const uniqueLoginsThisMonth = useMemo(() => {
        if (isLoading || loadingCollaborators || events.length === 0 || collaborators.length === 0) {
            return { uniqueCount: 0, totalCount: 0, percentage: 0 };
        }

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const monthlyLogins = events.filter(event => {
            const eventDate = parseISO(event.timestamp);
            return isWithinInterval(eventDate, { start, end });
        });

        const uniqueUserIds = new Set(monthlyLogins.map(event => event.userId));
        
        return {
            uniqueCount: uniqueUserIds.size,
            totalCount: collaborators.length,
            percentage: (uniqueUserIds.size / collaborators.length) * 100,
        };
    }, [events, collaborators, isLoading, loadingCollaborators]);

    const handleExport = () => {
        const dataForCsv = events.map(event => ({
            'Nome do Colaborador': event.userName,
            'ID do Colaborador': event.userId,
            'Data e Hora do Login': format(parseISO(event.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        }));

        const csv = Papa.unparse(dataForCsv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_logins_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || loadingCollaborators) {
        return (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    return (
        <SuperAdminGuard>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2"><LogIn className="h-6 w-6"/>Análise de Logins</CardTitle>
                            <CardDescription>Análise da frequência e do volume de acessos à plataforma.</CardDescription>
                        </div>
                        <Button onClick={handleExport} disabled={isLoading || events.length === 0} className="bg-admin-primary hover:bg-admin-primary/90">
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </CardHeader>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    <Line type="monotone" dataKey="Logins Acumulados" stroke="hsl(var(--admin-primary))" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><BarChartIcon className="h-5 w-5"/>Logins nos Últimos 7 Dias</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={loginsLast7Days}>
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey="Logins" fill="hsl(var(--admin-primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UsersIcon className="h-5 w-5" />
                            Logins Únicos (Mês Atual)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <p className="text-2xl font-bold">
                                {uniqueLoginsThisMonth.uniqueCount} de {uniqueLoginsThisMonth.totalCount} colaboradores
                            </p>
                            <Progress value={uniqueLoginsThisMonth.percentage} className="h-3 [&>div]:bg-admin-primary"/>
                            <p className="text-sm text-muted-foreground">
                                {uniqueLoginsThisMonth.percentage.toFixed(1)}% dos colaboradores fizeram login pelo menos uma vez este mês.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
