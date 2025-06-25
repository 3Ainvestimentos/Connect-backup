"use client"; 

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, CakeSlice, BrainCircuit, Wine, TrendingUp, Clock, 
  Megaphone, MessageSquare, Send, Loader2, CalendarDays
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

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setMessage('');
    toast({
      title: "Mensagem Enviada!",
      description: "Seu comunicado foi enviado para todos os colaboradores.",
    });
  };

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

        <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Mensagens
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSendMessage} className="space-y-4">
                    <Textarea
                        placeholder="Escreva seu comunicado oficial aqui..."
                        className="resize-none font-body"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit" className="w-full font-body" disabled={isSending}>
                        {isSending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Enviar Comunicado
                    </Button>
                </form>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
