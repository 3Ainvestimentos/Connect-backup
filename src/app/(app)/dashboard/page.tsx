
import { PageHeader } from '@/components/layout/PageHeader';
import NewsCarousel from '@/components/dashboard/NewsCarousel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart, Users } from 'lucide-react';
import Image from 'next/image';

const quickStats = [
  { title: "Novos Documentos", value: "12", icon: Activity, change: "+5%", changeType: "positive" },
  { title: "Notícias Publicadas", value: "8", icon: BarChart, change: "+2", changeType: "positive" },
  { title: "Usuários Ativos", value: "150", icon: Users, change: "-1%", changeType: "negative" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Painel Inicial" description="Bem-vindo ao 3A RIVA Hub." />
      
      <section>
        <h2 className="text-xl font-headline font-semibold mb-4 text-primary">Destaques e Anúncios</h2>
        <NewsCarousel />
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <p className={`text-xs font-body ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} desde o último mês
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Documentos Recentes</CardTitle>
            <CardDescription className="font-body">Acompanhe os últimos documentos adicionados.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 font-body">
              <li className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md"><span>Relatório Anual 2023.pdf</span><span className="text-xs text-muted-foreground">2 dias atrás</span></li>
              <li className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md"><span>Nova Política de Compliance.docx</span><span className="text-xs text-muted-foreground">5 dias atrás</span></li>
              <li className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md"><span>Apresentação Institucional.pptx</span><span className="text-xs text-muted-foreground">1 semana atrás</span></li>
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Links Rápidos</CardTitle>
            <CardDescription className="font-body">Acesse recursos importantes rapidamente.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 font-body">
            <a href="#" className="p-3 bg-accent/20 text-accent-foreground hover:bg-accent/30 rounded-md text-center transition-colors">Portal Interno</a>
            <a href="#" className="p-3 bg-accent/20 text-accent-foreground hover:bg-accent/30 rounded-md text-center transition-colors">Suporte TI</a>
            <a href="#" className="p-3 bg-accent/20 text-accent-foreground hover:bg-accent/30 rounded-md text-center transition-colors">Treinamentos</a>
            <a href="#" className="p-3 bg-accent/20 text-accent-foreground hover:bg-accent/30 rounded-md text-center transition-colors">FAQ</a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
