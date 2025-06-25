
"use client"; 

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users, CakeSlice, BrainCircuit, Wine, TrendingUp, Clock, 
  Megaphone, MessageSquare, CalendarDays
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

const whatsNewItems = [
  {
    title: 'Conferência de Felicidade do Colaborador',
    description: 'Inscrições abertas',
    imageUrl: 'https://i.ibb.co/nszMYNWJ/carreira-felicidade-corporativa.jpg',
    dataAiHint: 'conference team',
    link: '#',
  },
  {
    title: 'Novos pacotes de bem-estar',
    description: 'Descubra nossas novas ofertas',
    imageUrl: 'https://i.ibb.co/mrC2Tr5b/homem-correndo-na-estrada-contra-as-montanhas-durante-o-por-do-sol-1048944-7722076.jpg', 
    dataAiHint: 'wellness running',
    link: '#',
  },
  {
    title: 'O dia de trazer seu cão para o escritório está de volta!',
    description: 'Prepare-se para a fofura!',
    imageUrl: 'https://i.ibb.co/SpBph6N/1-photo-1535930749574-1399327ce78f-303764.jpg',
    dataAiHint: 'dog office',
    link: '#',
  },
];

const events: { title: string; time: string; icon: LucideIcon }[] = [
    { title: "Reunião de Alinhamento Semanal", time: "10:00 - 11:00", icon: Users },
    { title: "Aniversário da Empresa", time: "Dia Todo", icon: CakeSlice },
    { title: "Workshop de Design Thinking", time: "14:00 - 16:00", icon: BrainCircuit },
    { title: "Happy Hour de Fim de Mês", time: "A partir das 17:30", icon: Wine },
    { title: "Apresentação de Resultados Q2", time: "09:00 - 10:00", icon: TrendingUp },
];

const officialMessages = [
  { id: '1', title: 'Atualização da Política de Férias', content: 'Lembrete: A nova política de férias entrará em vigor a partir de 1º de Agosto.', sender: 'RH', date: '2024-07-25' },
  { id: '2', title: 'Confraternização de Fim de Mês', content: 'Não se esqueçam do nosso happy hour amanhã, às 17h30!', sender: 'Comunicação', date: '2024-07-24' },
  { id: '3', title: 'Manutenção Programada', content: 'O sistema de TI passará por uma manutenção no sábado, das 8h às 12h.', sender: 'Suporte TI', date: '2024-07-22' },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6 p-6 md:p-8">
      <section>
        <PageHeader
          title={<Link href="/news" className="hover:underline">O que há de novo</Link>}
          icon={Megaphone}
          description="Veja os últimos anúncios e destaques."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-3" style={{ minHeight: '450px' }}>
          
          <Link href={whatsNewItems[0].link} className="relative rounded-lg overflow-hidden group block">
            <Image
              src={whatsNewItems[0].imageUrl}
              alt={whatsNewItems[0].title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={whatsNewItems[0].dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[0].title}</h3>
              <p className="text-sm text-gray-200 font-body">{whatsNewItems[0].description}</p>
            </div>
          </Link>
          
          <Link href={whatsNewItems[1].link} className="relative md:row-span-2 rounded-lg overflow-hidden group block">
            <Image
              src={whatsNewItems[1].imageUrl}
              alt={whatsNewItems[1].title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={whatsNewItems[1].dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[1].title}</h3>
              <p className="text-sm text-gray-200 font-body">{whatsNewItems[1].description}</p>
            </div>
          </Link>

          <Link href={whatsNewItems[2].link} className="relative rounded-lg overflow-hidden group block">
            <Image
              src={whatsNewItems[2].imageUrl}
              alt={whatsNewItems[2].title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={whatsNewItems[2].dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <h3 className="text-xl font-headline font-bold text-white">{whatsNewItems[2].title}</h3>
              <p className="text-sm text-gray-200 font-body">{whatsNewItems[2].description}</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6"/>
              Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md p-0"
                month={date}
                onMonthChange={setDate}
              />
            </div>
            <div className="relative min-h-0">
              <ScrollArea className="absolute inset-0 pr-4">
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-muted/40 rounded-lg">
                      <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center h-10 w-10">
                        <event.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold font-body text-sm text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1.5" />
                          {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    {officialMessages.map((msg) => (
                        <div key={msg.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold font-body text-sm text-foreground">{msg.title}</h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(msg.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-body">{msg.content}</p>
                            <div className="flex justify-end">
                                <Badge variant="outline" className="font-body">{msg.sender}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
