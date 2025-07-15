
"use client";

import AdminGuard from '@/components/auth/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Newspaper, FolderOpen, Activity, Eye, Workflow } from 'lucide-react';
import { BarChart as BarChartComponent, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useNews } from '@/contexts/NewsContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useApplications } from '@/contexts/ApplicationsContext';

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

export default function UsageAnalyticsPage() {
  const { collaborators } = useCollaborators();
  const { newsItems } = useNews();
  const { documents } = useDocuments();
  const { workflowDefinitions } = useApplications();
  
  const kpiData = [
    { title: "Colaboradores", value: collaborators.length, icon: Users },
    { title: "Notícias Ativas", value: newsItems.length, icon: Newspaper },
    { title: "Documentos", value: documents.length, icon: FolderOpen },
    { title: "Workflows Definidos", value: workflowDefinitions.length, icon: Workflow },
  ];

  return (
    <AdminGuard>
      <div className="space-y-6">
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

        {/* General Analytics Section */}
        <section className="space-y-4 pt-6">
             <h2 className="text-xl font-headline font-bold">Analytics Gerais de Uso</h2>
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
}
