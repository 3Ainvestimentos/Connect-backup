
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Newspaper, FolderOpen, LayoutGrid, Activity, Eye, FileClock, Workflow } from 'lucide-react';
import { Bar, BarChart as BarChartComponent, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useNews } from '@/contexts/NewsContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

// Dados de exemplo para os gráficos
const contentPopularityData = [
  { name: 'Política de Férias', views: 125, type: 'documento' },
  { name: 'Novo Plano de Saúde', views: 210, type: 'noticia' },
  { name: 'Guia de Home Office', views: 98, type: 'documento' },
  { name: 'Festa de Fim de Ano', views: 180, type: 'noticia' },
  { name: 'Reembolso de Despesas', views: 75, type: 'aplicacao' },
];

const engagementData = [
    { month: 'Jan', logins: 150 },
    { month: 'Fev', logins: 180 },
    { month: 'Mar', logins: 220 },
    { month: 'Abr', logins: 210 },
    { month: 'Mai', logins: 230 },
    { month: 'Jun', logins: 250 },
];

export default function AnalyticsPage() {
  const { collaborators } = useCollaborators();
  const { newsItems } = useNews();
  const { documents } = useDocuments();
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
  
  const kpiData = [
    { title: "Colaboradores", value: collaborators.length, icon: Users },
    { title: "Notícias Ativas", value: newsItems.length, icon: Newspaper },
    { title: "Documentos", value: documents.length, icon: FolderOpen },
    { title: "Workflows Definidos", value: workflowDefinitions.length, icon: Workflow },
  ];

  return (
    <AdminGuard>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Painel de Analytics" 
          description="Métricas de uso e engajamento da plataforma 3A RIVA Connect."
        />
        
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>
        
        <Separator />
        
        {/* Workflow Analytics Section */}
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

        <Separator />

        {/* General Analytics Section */}
        <section className="space-y-4">
             <h2 className="text-xl font-headline font-bold">Analytics Gerais</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Engajamento de Usuários (Logins/Mês)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChartComponent data={engagementData}>
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                      <Tooltip
                        contentStyle={{ 
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                        cursor={{fill: 'hsl(var(--muted))'}}
                      />
                      <Legend wrapperStyle={{fontSize: "14px"}}/>
                      <Bar dataKey="logins" name="Logins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChartComponent>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Popularidade de Conteúdo (Visualizações)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChartComponent data={contentPopularityData} layout="vertical">
                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={150}/>
                        <Tooltip
                            contentStyle={{ 
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                            cursor={{fill: 'hsl(var(--muted))'}}
                        />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Bar dataKey="views" name="Visualizações" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]}/>
                    </BarChartComponent>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
        </section>
      </div>
    </AdminGuard>
  );
