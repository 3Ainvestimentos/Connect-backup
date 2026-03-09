
"use client";

import React, { useMemo, useState } from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { useQuery } from '@tanstack/react-query';
import { getCollection, WithId } from '@/lib/firestore-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { LineChart as LineChartIcon, LogIn, BarChart as BarChartIcon, Users as UsersIcon, FileDown, ThumbsUp, ThumbsDown, Trophy, Filter } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, BarChart, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, compareAsc, endOfDay, isWithinInterval, startOfMonth, endOfMonth, subMonths, getDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import Papa from 'papaparse';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { useAudit } from '@/contexts/AuditContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { ScrollArea } from '@/shared/components/ui/scroll-area';


type AuditLogEvent = WithId<{
    eventType: 'document_download' | 'login' | 'page_view' | 'content_view' | 'search_term_used';
    userId: string;
    userName: string;
    timestamp: string; // ISO String
    details: { [key: string]: any };
}>;


export default function AuditPage() {
    const { dateRange } = useAudit();
    const { settings, loading: loadingSettings } = useSystemSettings();
    const [loginView, setLoginView] = useState<'total' | 'unique'>('total');
    const [axisFilter, setAxisFilter] = useState<string[]>([]);
    
    // Busca todos os eventos de login (filtra no cliente para evitar necessidade de índice)
    const { data: allLoginEvents = [], isLoading: isLoadingAllEvents } = useQuery<AuditLogEvent[]>({
        queryKey: ['audit_logs', 'login', 'all'],
        queryFn: async () => {
            const allEvents = await getCollection<AuditLogEvent>('audit_logs');
            return allEvents
                .filter(e => e.eventType === 'login')
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // Filtra eventos do período selecionado no cliente
    const periodEvents = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);
        
        return allLoginEvents.filter(e => {
            const eventDate = parseISO(e.timestamp);
            return isWithinInterval(eventDate, { start: from, end: to });
        });
    }, [allLoginEvents, dateRange]);

    // Filtra eventos dos últimos 6 meses no cliente
    const historicalEvents = useMemo(() => {
        const sixMonthsAgo = startOfDay(subMonths(new Date(), 6));
        const today = endOfDay(new Date());
        
        return allLoginEvents.filter(e => {
            const eventDate = parseISO(e.timestamp);
            return isWithinInterval(eventDate, { start: sixMonthsAgo, end: today });
        });
    }, [allLoginEvents]);

    const isLoadingPeriodEvents = isLoadingAllEvents;
    const isLoadingHistorical = isLoadingAllEvents;

    const { collaborators, loading: loadingCollaborators } = useCollaborators();

    const isLoading = isLoadingPeriodEvents || loadingCollaborators || loadingSettings;
    const events = periodEvents; // Já filtrado pela query
    
    const uniqueAxes = useMemo(() => {
        return [...new Set(collaborators.map(c => c.axis))].sort();
    }, [collaborators]);

    const { userLoginStats } = useMemo(() => {
        if (isLoading || collaborators.length === 0) return { userLoginStats: [] };

        const loginCounts = events.reduce((acc, event) => {
            acc[event.userId] = (acc[event.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const filteredCollaborators = axisFilter.length > 0 
            ? collaborators.filter(c => axisFilter.includes(c.axis))
            : collaborators;

        const allUserStats = filteredCollaborators.map(collab => ({
            id: collab.id3a,
            name: collab.name,
            photoURL: collab.photoURL,
            count: loginCounts[collab.id3a] || 0,
        })).sort((a,b) => b.count - a.count);
        
        return { userLoginStats: allUserStats };

    }, [events, collaborators, isLoading, axisFilter]);


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

    // Métricas de frequência
    const frequencyStats = useMemo(() => {
        const goal = settings?.loginFrequencyGoal || 12;
        
        if (isLoading || events.length === 0) {
            return { 
                averageLoginsPerUser: 0, 
                goal,
                percentage: 0,
            };
        }
        
        const uniqueUserIds = new Set(events.map(event => event.userId));
        const totalLogins = events.length;
        const averageLoginsPerUser = uniqueUserIds.size > 0 ? totalLogins / uniqueUserIds.size : 0;
        
        return {
            averageLoginsPerUser,
            goal,
            percentage: goal > 0 ? Math.min((averageLoginsPerUser / goal) * 100, 100) : 0,
        };
    }, [events, isLoading, settings?.loginFrequencyGoal]);

    // Métricas de horário (00h-23h)
    const loginsByHour = useMemo(() => {
        if (isLoading || events.length === 0) return [];
        
        const hourCounts: { [key: number]: number } = {};
        for (let i = 0; i < 24; i++) {
            hourCounts[i] = 0;
        }
        
        events.forEach(event => {
            const eventDate = parseISO(event.timestamp);
            const hour = getHours(eventDate);
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}h`,
            logins: hourCounts[i] || 0,
        }));
    }, [events, isLoading]);

    // Métricas de dia da semana
    const loginsByDayOfWeek = useMemo(() => {
        if (isLoading || events.length === 0) return [];
        
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayCounts: { [key: number]: number } = {};
        for (let i = 0; i < 7; i++) {
            dayCounts[i] = 0;
        }
        
        events.forEach(event => {
            const eventDate = parseISO(event.timestamp);
            const dayOfWeek = getDay(eventDate);
            dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
        });
        
        return dayNames.map((name, index) => ({
            day: name,
            logins: dayCounts[index] || 0,
        }));
    }, [events, isLoading]);

    // Histórico de 6 meses
    const monthlyHistory = useMemo(() => {
        if (isLoadingHistorical || historicalEvents.length === 0) return [];
        
        const monthData: { [key: string]: { uniqueUsers: Set<string>, totalLogins: number } } = {};
        
        historicalEvents.forEach(event => {
            const eventDate = parseISO(event.timestamp);
            const monthKey = format(eventDate, 'yyyy-MM');
            
            if (!monthData[monthKey]) {
                monthData[monthKey] = { uniqueUsers: new Set(), totalLogins: 0 };
            }
            
            monthData[monthKey].uniqueUsers.add(event.userId);
            monthData[monthKey].totalLogins += 1;
        });
        
        // Pegar últimos 6 meses
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            months.push(format(subMonths(new Date(), i), 'yyyy-MM'));
        }
        
        return months.map(monthKey => {
            const monthName = format(parseISO(`${monthKey}-01`), 'MMM', { locale: ptBR });
            return {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                'Logins Únicos': monthData[monthKey]?.uniqueUsers.size || 0,
                'Logins Totais': monthData[monthKey]?.totalLogins || 0,
            };
        });
    }, [historicalEvents, isLoadingHistorical]);


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
    
    const UserEngagementList = ({ users, title, icon: Icon, onFilterChange }: { users: typeof userLoginStats, title: string, icon: React.ElementType, onFilterChange: (axis: string) => void }) => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5"/>{title}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrar Eixo ({axisFilter.length || 'Todos'})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Filtrar por Eixo</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <ScrollArea className="max-h-60">
                                {uniqueAxes.map(axis => (
                                    <DropdownMenuCheckboxItem
                                        key={axis}
                                        checked={axisFilter.includes(axis)}
                                        onCheckedChange={() => onFilterChange(axis)}
                                    >
                                        {axis}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
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
                    <UserEngagementList 
                        users={userLoginStats.slice(0, 20)} 
                        title="Mais Engajados (Top 20)" 
                        icon={ThumbsUp} 
                        onFilterChange={(axis) => setAxisFilter(prev => prev.includes(axis) ? prev.filter(a => a !== axis) : [...prev, axis])}
                    />
                    <UserEngagementList 
                        users={[...userLoginStats].sort((a,b) => a.count - b.count).slice(0, 20)} 
                        title="Menos Engajados (Top 20)" 
                        icon={ThumbsDown} 
                        onFilterChange={(axis) => setAxisFilter(prev => prev.includes(axis) ? prev.filter(a => a !== axis) : [...prev, axis])}
                    />
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
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2 text-lg"><BarChartIcon className="h-5 w-5"/>Logins no Período</CardTitle>
                                <Tabs defaultValue="total" onValueChange={(v) => setLoginView(v as 'total' | 'unique')}>
                                    <TabsList className="h-8">
                                        <TabsTrigger value="total" className="text-xs h-6">Total</TabsTrigger>
                                        <TabsTrigger value="unique" className="text-xs h-6">Único</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={loginsLast7Days}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Legend />
                                    {loginView === 'total' && <Bar dataKey="Logins Totais" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />}
                                    {loginView === 'unique' && <Bar dataKey="Logins Únicos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Trophy className="h-5 w-5" />
                                Frequência Média de Logins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-2xl font-bold">
                                    {(frequencyStats?.averageLoginsPerUser ?? 0).toFixed(1)} logins/usuário
                                </p>
                                <Progress value={frequencyStats?.percentage ?? 0} className="h-3 [&>div]:bg-[hsl(var(--admin-primary))]"/>
                                <p className="text-sm text-muted-foreground">
                                    Meta: {frequencyStats?.goal ?? 12} logins/mês por usuário ({(frequencyStats?.percentage ?? 0).toFixed(1)}% da meta)
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChartIcon className="h-5 w-5" />
                                Logins por Hora do Dia
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={loginsByHour}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey="logins" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChartIcon className="h-5 w-5" />
                                Logins por Dia da Semana
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={loginsByDayOfWeek}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Bar dataKey="logins" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <LineChartIcon className="h-5 w-5" />
                            Histórico de Aderência (Últimos 6 Meses)
                        </CardTitle>
                        <CardDescription>
                            Evolução mensal de logins únicos e totais para acompanhar a aderência da plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingHistorical ? (
                            <Skeleton className="h-64 w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="Logins Únicos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                                    <Line type="monotone" dataKey="Logins Totais" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SuperAdminGuard>
    );
}
