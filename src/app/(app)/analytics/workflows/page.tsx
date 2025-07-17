
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as BarChartComponent, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflows, WorkflowRequest } from '@/contexts/WorkflowsContext';
import { useMemo } from 'react';
import { FileClock, Timer, Hourglass } from 'lucide-react';
import { differenceInBusinessDays, parseISO } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export default function WorkflowAnalyticsPage() {
  const { workflowDefinitions } = useApplications();
  const { requests, loading: loadingRequests } = useWorkflows();

  const requestsByStatus = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];
    const statusCounts: { [key: string]: number } = {};

    requests.forEach(req => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    });

    const allStatuses = new Map<string, string>();
    workflowDefinitions.forEach(def => def.statuses.forEach(s => allStatuses.set(s.id, s.label)));

    return Object.entries(statusCounts).map(([statusId, count]) => ({
      name: allStatuses.get(statusId) || statusId,
      value: count,
    }));
  }, [requests, loadingRequests, workflowDefinitions]);

  const requestsByType = useMemo(() => {
     if (loadingRequests) return [];
      const typeCounts: { [key: string]: number } = {};
      requests.forEach(req => {
          typeCounts[req.type] = (typeCounts[req.type] || 0) + 1;
      });
      return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [requests, loadingRequests]);

  const averageResolutionTime = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];
    
    const resolutionTimes: { [type: string]: { totalDays: number, count: number } } = {};

    requests.forEach(req => {
      const definition = workflowDefinitions.find(d => d.name === req.type);
      if (!definition) return;

      const finalStatusId = definition.statuses[definition.statuses.length - 1]?.id;
      if (req.status !== finalStatusId) return; // Only consider completed requests

      const submissionDate = parseISO(req.submittedAt);
      const completionDate = parseISO(req.lastUpdatedAt);
      const businessDays = differenceInBusinessDays(completionDate, submissionDate);
      
      if (!resolutionTimes[req.type]) {
        resolutionTimes[req.type] = { totalDays: 0, count: 0 };
      }
      resolutionTimes[req.type].totalDays += businessDays;
      resolutionTimes[req.type].count++;
    });

    return Object.entries(resolutionTimes).map(([name, data]) => ({
      name,
      'Tempo Médio (dias)': parseFloat((data.totalDays / data.count).toFixed(2))
    }));

  }, [requests, loadingRequests, workflowDefinitions]);
  
  const averageTimePerStatus = useMemo(() => {
    if (loadingRequests || !workflowDefinitions.length) return [];
    
    const timePerStatus: { [type: string]: { [statusId: string]: { totalDays: number, count: number } } } = {};

    requests.forEach(req => {
      if (!timePerStatus[req.type]) timePerStatus[req.type] = {};
      
      for (let i = 0; i < req.history.length - 1; i++) {
        const currentLog = req.history[i];
        const nextLog = req.history[i+1];

        const startDate = parseISO(currentLog.timestamp);
        const endDate = parseISO(nextLog.timestamp);
        const businessDays = differenceInBusinessDays(endDate, startDate);
        
        const statusId = currentLog.status;
        if (!timePerStatus[req.type][statusId]) {
            timePerStatus[req.type][statusId] = { totalDays: 0, count: 0 };
        }
        timePerStatus[req.type][statusId].totalDays += businessDays;
        timePerStatus[req.type][statusId].count++;
      }
    });

    const allStatuses = new Map<string, string>();
    workflowDefinitions.forEach(def => def.statuses.forEach(s => allStatuses.set(s.id, s.label)));
    
    const result: any[] = [];
    Object.entries(timePerStatus).forEach(([typeName, statuses]) => {
      const typeResult: {[key: string]: any} = { name: typeName };
      Object.entries(statuses).forEach(([statusId, data]) => {
        const statusLabel = allStatuses.get(statusId) || statusId;
        typeResult[statusLabel] = parseFloat((data.totalDays / data.count).toFixed(2));
      });
      result.push(typeResult);
    });

    return result;

  }, [requests, loadingRequests, workflowDefinitions]);


  return (
    <AdminGuard>
        <section className="space-y-4">
             <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                <FileClock className="h-6 w-6" />
                Analytics de Workflows
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
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
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Volume por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChartComponent data={requestsByType}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                />
                                <Bar dataKey="value" name="Total de Solicitações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChartComponent>
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
                                     formatter={(value: number) => `${value} dias`}
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
    </AdminGuard>
  );
}

