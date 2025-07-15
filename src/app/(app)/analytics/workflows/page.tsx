
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as BarChartComponent, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useMemo } from 'react';
import { FileClock } from 'lucide-react';

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
                        <CardTitle>Solicitações por Tipo</CardTitle>
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
                                <Bar dataKey="value" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChartComponent>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Tempo Médio de Atendimento (SLA)</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Esta funcionalidade ainda não está implementada.
                        <br />
                        No futuro, esta área exibirá o tempo médio para conclusão de cada tipo de workflow.
                    </p>
                </CardContent>
            </Card>
        </section>
    </AdminGuard>
  );
}
