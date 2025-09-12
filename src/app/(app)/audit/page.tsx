
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCollection, WithId, listenToCollection } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon, LogIn, BarChart as BarChartIcon, Users as UsersIcon, FileDown, ThumbsUp, ThumbsDown, Trophy } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, BarChart, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, compareAsc, endOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAudit } from '@/contexts/AuditContext';

type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { [key: string]: any };
}>;


export default function AuditPage() {
    const queryClient = useQueryClient();
    const { dateRange } = useAudit();
    
    React.useEffect(() => {
        const unsubscribe = listenToCollection<AuditLogEvent>(
            'audit_logs',
            (newData) => {
                queryClient.setQueryData(['audit_logs'], newData);
            },
            (error) => {
                console.error("Failed to listen to audit logs:", error);
            }
        );
        return () => unsubscribe();
    }, [queryClient]);
    
    const { data: allEvents = [], isLoading: isLoadingEvents } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs'],
        queryFn: () => getCollection<AuditLogEvent>('audit_logs'),
    });

    const { collaborators, loading: loadingCollaborators } = useCollaborators();

    const isLoading = isLoadingEvents || loadingCollaborators;

    const events = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);

        return allEvents.filter(e => {
             const isLoginEvent = e.eventType === 'login';
             const eventDate = parseISO(e.timestamp);
             return isLoginEvent && isWithinInterval(eventDate, { start: from, end: to });
        });
    }, [allEvents, dateRange]);
    
    const { userLoginStats } = useMemo(() => {
        if (isLoading || collaborators.length === 0) return { userLoginStats: [] };

        const loginCounts = events.reduce((acc, event) => {
            acc[event.userId] = (acc[event.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const allUserStats = collaborators.map(collab => ({
            id: collab.id3a,
            name: collab.name,
            photoURL: collab.photoURL,
            count: loginCounts[collab.id3a] || 0,
        })).sort((a,b) => b.count - a.count);
        
        return { userLoginStats: allUserStats };

    }, [events, collaborators, isLoading]);


    const cumulativeLogins = useMemo(() => {
        if (isLoading || events.length === 0 || !dateRange?.from || !dateRange.to) return [];
        
        const loginEvents = events
            .sort((a, b) => compareAsc(parseISO(a.timestamp), parseISO(b.timestamp)));
            
        if (loginEvents.length === 0) return [];

        const startDate = startOfDay(dateRange.from);
        const endDate = startOfDay(dateRange.to);
        
        const dateRangeInterval = eachDayOfInterval({ start: startDate, end: endDate });

        const loginsByDay: { [key: string]: number } = {};
        loginEvents.forEach(event => {
            const dayKey = format(startOfDay(parseISO(event.timestamp)), 'yyyy-MM-dd');
            loginsByDay[dayKey] = (loginsByDay[dayKey] || 0) + 1;
        });

        let accumulatedLogins = 0;
        const cumulativeData = dateRangeInterval.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            accumulatedLogins += (loginsByDay[dayKey] || 0);
            return {
                date: format(day, 'dd/MM'),
                'Logins Acumulados': accumulatedLogins,
            };
        });

        return cumulativeData;

    }, [events, isLoading, dateRange]);

    const loginsLast7Days = useMemo(() => {
        if (isLoading || events.length === 0 || !dateRange?.from || !dateRange.to) return [];
    
        const endDate = endOfDay(dateRange.to);
        const startDate = startOfDay(dateRange.from);
        
        const dateRangeInterval = eachDayOfInterval({ start: startDate, end: endDate });

        const loginsByDay: { [key: string]: { total: number, uniqueUsers: Set<string> } } = {};
        events.forEach(event => {
            const eventDate = parseISO(event.timestamp);
            if (isWithinInterval(eventDate, { start: startDate, end: endDate })) {
                const dayKey = format(startOfDay(eventDate), 'yyyy-MM-dd');
                if (!loginsByDay[dayKey]) {
                    loginsByDay[dayKey] = { total: 0, uniqueUsers: new Set() };
                }
                loginsByDay[dayKey].total += 1;
                loginsByDay[dayKey].uniqueUsers.add(event.userId);
            }
        });
    
        return dateRangeInterval.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            return {
                date: format(day, 'dd/MM'),
                'Logins Totais': loginsByDay[dayKey]?.total || 0,
                'Logins Únicos': loginsByDay[dayKey]?.uniqueUsers.size || 0,
            };
        });
    }, [events, isLoading, dateRange]);
    
    const uniqueLoginsThisMonth = useMemo(() => {
        if (isLoading || collaborators.length === 0 || events.length === 0) {
            return { uniqueCount: 0, totalCount: collaborators.length, percentage: 0 };
        }
        
        const uniqueUserIds = new Set(events.map(event => event.userId));
        
        return {
            uniqueCount: uniqueUserIds.size,
            totalCount: collaborators.length,
            percentage: collaborators.length > 0 ? (uniqueUserIds.size / collaborators.length) * 100 : 0,
        };
    }, [events, collaborators, isLoading]);


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
    
    const UserEngagementList = ({ users, title, icon: Icon }: { users: typeof userLoginStats, title: string, icon: React.ElementType }) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5"/>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead className="text-right">Logins</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium truncate">{user.name}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">{user.count}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
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
                            <CardDescription>Análise da frequência e do volume de acessos à plataforma no período selecionado.</CardDescription>
                        </div>
                        <Button onClick={handleExport} disabled={isLoading || events.length === 0} className="bg-admin-primary hover:bg-admin-primary/90">
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </CardHeader>
                </Card>
                
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UserEngagementList users={userLoginStats.slice(0, 20)} title="Mais Engajados (Top 20)" icon={ThumbsUp} />
                    <UserEngagementList users={[...userLoginStats].sort((a,b) => a.count - b.count).slice(0, 20)} title="Menos Engajados (Top 20)" icon={ThumbsDown} />
                </div>
                
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
                                    <Line type="monotone" dataKey="Logins Acumulados" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><BarChartIcon className="h-5 w-5"/>Logins no Período</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={loginsLast7Days}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Legend />
                                    <Bar dataKey="Logins Totais" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Logins Únicos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UsersIcon className="h-5 w-5" />
                            Logins Únicos (no Período)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <p className="text-2xl font-bold">
                                {uniqueLoginsThisMonth.uniqueCount} de {uniqueLoginsThisMonth.totalCount} colaboradores
                            </p>
                            <Progress value={uniqueLoginsThisMonth.percentage} className="h-3 [&>div]:bg-[hsl(var(--admin-primary))]"/>
                            <p className="text-sm text-muted-foreground">
                                {uniqueLoginsThisMonth.percentage.toFixed(1)}% dos colaboradores fizeram login pelo menos uma vez no período selecionado.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
