
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart as BarChartComponent, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflows, WorkflowRequest } from '@/contexts/WorkflowsContext';
import { useMemo } from 'react';
import { FileClock, Timer, Hourglass, ListChecks, Workflow as WorkflowIcon } from 'lucide-react';
import { differenceInBusinessDays, parseISO, compareAsc, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { useAudit } from '@/contexts/AuditContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export default function WorkflowAnalyticsPage() {
  const { workflowDefinitions } = useApplications();
  const { requests: allRequests, loading: loadingRequests } = useWorkflows();
  const { dateRange } = useAudit();

  const filteredRequests = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    
    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);

    return allRequests.filter(req => {
      const eventDate = parseISO(req.submittedAt);
      return isWithinInterval(eventDate, { start: from, end: to });
    });
  }, [allRequests, dateRange]);


  const requestsByStatus = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];
    
    const statusCounts = {
        'Em aberto': 0,
        'Em processamento': 0,
        'Finalizado': 0,
    };

    filteredRequests.forEach(req => {
        const definition = workflowDefinitions.find(d => d.name === req.type);
        if (!definition || !definition.statuses || definition.statuses.length === 0) {
            statusCounts['Em processamento']++;
            return;
        }

        const initialStatusId = definition.statuses[0].id;
        const finalStatusLabels = ['aprovado', 'reprovado', 'concluído', 'finalizado', 'cancelado'];
        const currentStatusDef = definition.statuses.find(s => s.id === req.status);
        
        if (req.status === initialStatusId && req.history.length <= 1) {
            statusCounts['Em aberto']++;
        } else if (currentStatusDef && finalStatusLabels.some(label => currentStatusDef.label.toLowerCase().includes(label))) {
            statusCounts['Finalizado']++;
        } else {
            statusCounts['Em processamento']++;
        }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredRequests, loadingRequests, workflowDefinitions]);


  const requestsByType = useMemo(() => {
     if (loadingRequests) return [];
      const typeCounts: { [key: string]: number } = {};
      filteredRequests.forEach(req => {
          typeCounts[req.type] = (typeCounts[req.type] || 0) + 1;
      });
      return Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredRequests, loadingRequests]);

  const averageResolutionTime = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];
    
    const resolutionTimes: { [type: string]: { totalDays: number, count: number } } = {};

    filteredRequests.forEach(req => {
      const definition = workflowDefinitions.find(d => d.name === req.type);
      if (!definition) return;

      const finalStatusLabels = ['aprovado', 'reprovado', 'concluído', 'finalizado', 'cancelado'];
      const currentStatusDef = definition.statuses.find(s => s.id === req.status);
      
      if (currentStatusDef && finalStatusLabels.some(label => currentStatusDef.label.toLowerCase().includes(label))) {
          const submissionDate = parseISO(req.submittedAt);
          const completionDate = parseISO(req.lastUpdatedAt);
          const businessDays = differenceInBusinessDays(completionDate, submissionDate);
          
          if (!resolutionTimes[req.type]) {
            resolutionTimes[req.type] = { totalDays: 0, count: 0 };
          }
          resolutionTimes[req.type].totalDays += businessDays;
          resolutionTimes[req.type].count++;
      }
    });

    return Object.entries(resolutionTimes)
        .map(([name, data]) => ({
            name,
            'Tempo Médio (dias)': parseFloat((data.totalDays / data.count).toFixed(2)),
        }))
        .filter(item => item['Tempo Médio (dias)'] >= 0);

  }, [filteredRequests, loadingRequests, workflowDefinitions]);
  
  const averageTimePerStatus = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];

    const timePerType: { [typeName: string]: { 'Em aberto': number[], 'Em processamento': number[], 'Finalizado': number[] } } = {};

    filteredRequests.forEach(req => {
        const definition = workflowDefinitions.find(d => d.name === req.type);
        if (!definition) return;
        if (!timePerType[req.type]) {
            timePerType[req.type] = { 'Em aberto': [], 'Em processamento': [], 'Finalizado': [] };
        }

        const initialStatusId = definition.statuses[0].id;
        const finalStatusLabels = ['aprovado', 'reprovado', 'concluído', 'finalizado', 'cancelado'];

        for (let i = 0; i < req.history.length; i++) {
            const currentLog = req.history[i];
            const nextLog = req.history[i + 1];
            const startDate = parseISO(currentLog.timestamp);
            const endDate = nextLog ? parseISO(nextLog.timestamp) : new Date();
            const businessDays = differenceInBusinessDays(endDate, startDate);

            const statusDef = definition.statuses.find(s => s.id === currentLog.status);
            
            if (currentLog.status === initialStatusId && i === 0) {
                timePerType[req.type]['Em aberto'].push(businessDays);
            } else if (statusDef && finalStatusLabels.some(label => statusDef.label.toLowerCase().includes(label))) {
                // This state is final, its duration is 0 for this graph. We are measuring time *in* a state.
            } else {
                 timePerType[req.type]['Em processamento'].push(businessDays);
            }
        }
    });

    return Object.entries(timePerType).map(([typeName, statusTimes]) => {
      const avgTimes: { [key: string]: any } = { name: typeName };
      Object.entries(statusTimes).forEach(([statusName, times]) => {
        if (times.length > 0) {
            const total = times.reduce((acc, curr) => acc + curr, 0);
            avgTimes[statusName] = parseFloat((total / times.length).toFixed(2));
        } else {
            avgTimes[statusName] = 0;
        }
      });
      return avgTimes;
    });

  }, [filteredRequests, loadingRequests, workflowDefinitions]);


  return (
    <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/>Tabela Sintética de Solicitações</CardTitle>
                    <CardDescription>Volume total de solicitações enviadas para cada workflow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo de Workflow</TableHead>
                                    <TableHead className="text-right">Total de Solicitações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requestsByType.map((item) => (
                                    <TableRow key={item.name}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">{item.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Solicitações por Status</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={requestsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {requestsByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Timer className="h-5 w-5" />
                       Tempo Médio de Resolução (Dias Úteis)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChartComponent data={averageResolutionTime}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="d"/>
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                cursor={{fill: 'hsl(var(--muted))'}}
                                formatter={(value: number) => `${value} dias`}
                            />
                            <Bar dataKey="Tempo Médio (dias)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChartComponent>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hourglass className="h-5 w-5" />
                        Tempo Médio por Etapa (Dias Úteis)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChartComponent data={averageTimePerStatus} layout="vertical">
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="d" />
                            <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={150} />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                 cursor={{fill: 'hsl(var(--muted))'}}
                                 formatter={(value: number) => `${value.toFixed(2)} dias`}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            {Object.keys(averageTimePerStatus[0] || {}).filter(k => k !== 'name').map((key, index) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                            ))}
                        </BarChartComponent>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
         </div>
    </section>
  );
}
