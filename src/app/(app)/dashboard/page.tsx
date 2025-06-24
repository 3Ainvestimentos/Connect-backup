
"use client"; 

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, Users, CakeSlice, BrainCircuit, Wine, TrendingUp, Clock, 
  ArrowRightLeft, Handshake, Landmark, MousePointerClick, Target, Move, 
  Wrench, Receipt, Banknote, Gavel, Megaphone, Network, ShieldCheck 
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
    gridClass: 'md:col-span-1 md:row-span-2',
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

const contacts = [
  { name: 'Martin Coles', phone: '+000 111 222 333', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man portrait' },
  { name: 'Adrien Wilson', phone: '+000 444 555 666', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman portrait' },
];

const teams: { name: string, icon: LucideIcon }[] = [
  { name: 'Alocação', icon: ArrowRightLeft },
  { name: 'Business Intelligence', icon: BrainCircuit },
  { name: 'Canal MFC', icon: Users },
  { name: 'Comercial', icon: Handshake },
  { name: 'Corporate', icon: Landmark },
  { name: 'Digital', icon: MousePointerClick },
  { name: 'Estratégia', icon: Target },
  { name: 'Expansão', icon: Move },
  { name: 'Facilities e Serviços', icon: Wrench },
  { name: 'Fee Fixo e Variável', icon: Receipt },
  { name: 'Financeiro', icon: Banknote },
  { name: 'Gente e Gestão', icon: Users },
  { name: 'Investors', icon: TrendingUp },
  { name: 'Jurídico', icon: Gavel },
  { name: 'Marketing', icon: Megaphone },
  { name: 'Middle', icon: Network },
  { name: 'Private Solutions', icon: ShieldCheck },
];


export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8">
      <section>
        <PageHeader
          title="O que há de novo"
          icon={Megaphone}
          description="Veja os últimos anúncios e destaques."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:grid-rows-2" style={{ minHeight: '450px' }}>
          
          <div className="flex flex-col gap-3">
            <Link href={whatsNewItems[0].link} className="relative h-full rounded-lg overflow-hidden group block">
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
            <Link href={whatsNewItems[2].link} className="relative h-full rounded-lg overflow-hidden group block">
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
          
          <Link href={whatsNewItems[1].link} className={`${whatsNewItems[1].gridClass} relative rounded-lg overflow-hidden group block`}>
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
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Eventos</CardTitle>
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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Contatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.name} className="flex items-center gap-2 p-2.5 hover:bg-muted/40 rounded-lg transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint={contact.dataAiHint} />
                  <AvatarFallback>{contact.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold font-body text-sm text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center">
                    <Phone className="h-3 w-3 mr-1.5"/>
                    {contact.phone}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-primary text-xl">Equipes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 w-full">
              <div className="space-y-1 pr-4">
                {teams.map((team) => (
                  <Link key={team.name} href="#" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-2">
                        <team.icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold font-body text-sm text-foreground">{team.name}</p>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
