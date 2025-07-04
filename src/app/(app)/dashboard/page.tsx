
"use client"; 

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Clock, 
  Megaphone, MessageSquare, CalendarDays, Check, Image as ImageIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useHighlights } from '@/contexts/HighlightsContext';
import { useEvents } from '@/contexts/EventsContext';
import { useMessages } from '@/contexts/MessagesContext';
import { getIcon } from '@/lib/icons';

// Define Message type for the component state, including the isRead property.
interface Message {
    id: string;
    title: string;
    content: string;
    sender: string;
    date: string;
    isRead: boolean;
}

const HighlightCard = ({ item, className = "" }: { item: any, className?: string }) => (
    <Link href={item.link} className={cn("relative rounded-lg overflow-hidden group block", className)}>
        <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={item.dataAiHint} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
        <h3 className="text-xl font-headline font-bold text-white">{item.title}</h3>
        <p className="text-sm text-gray-200 font-body">{item.description}</p>
        </div>
    </Link>
);


export default function DashboardPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  // Get global data from contexts
  const { events } = useEvents();
  const { messages: globalMessages } = useMessages();
  const { getActiveHighlights } = useHighlights();
  
  // Local state for messages with read status
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);

  // Initialize messages with read status from localStorage
  useEffect(() => {
    const getReadMessageIds = (): Set<string> => {
      if (typeof window === 'undefined') return new Set();
      try {
        const item = window.localStorage.getItem('readMessageIds_v1');
        return item ? new Set(JSON.parse(item)) : new Set();
      } catch (error) {
        console.error("Error reading from localStorage", error);
        return new Set();
      }
    };
    const readMessageIds = getReadMessageIds();
    const mergedMessages = globalMessages.map(msg => ({
      ...msg,
      isRead: readMessageIds.has(msg.id),
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMessages(mergedMessages);
  }, [globalMessages]);


  const activeHighlights = getActiveHighlights();
  
  const unreadCount = React.useMemo(() => messages.filter(msg => !msg.isRead).length, [messages]);

  const handleViewMessage = (messageToView: Message) => {
    const setReadMessageIds = (ids: Set<string>) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem('readMessageIds_v1', JSON.stringify(Array.from(ids)));
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    };

    // Mark as read in local state
    setMessages(currentMessages =>
      currentMessages.map(m =>
        m.id === messageToView.id ? { ...m, isRead: true } : m
      )
    );
    
    // Update local storage
    try {
        const item = window.localStorage.getItem('readMessageIds_v1');
        const currentReadIds = item ? new Set(JSON.parse(item)) : new Set();
        currentReadIds.add(messageToView.id);
        setReadMessageIds(currentReadIds);
    } catch (error) {
         console.error("Error accessing localStorage", error);
    }
    
    setSelectedMessage({ ...messageToView, isRead: true });
  };
  
  const renderHighlights = () => {
      switch (activeHighlights.length) {
          case 1:
              return <HighlightCard item={activeHighlights[0]} />;
          case 2:
              return (
                  <>
                      <HighlightCard item={activeHighlights[0]} />
                      <HighlightCard item={activeHighlights[1]} />
                  </>
              );
          case 3:
              return (
                  <>
                      <HighlightCard item={activeHighlights[0]} />
                      <HighlightCard item={activeHighlights[1]} className="md:row-span-2" />
                      <HighlightCard item={activeHighlights[2]} />
                  </>
              );
          default:
              return null;
      }
  };
  
  const getGridClass = () => {
    switch (activeHighlights.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 md:grid-rows-2";
      default:
        return "grid-cols-1";
    }
  }

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        {activeHighlights.length > 0 && (
          <section>
            <PageHeader
              title={<Link href="/news" className="hover:underline">O que há de novo</Link>}
              icon={Megaphone}
              description="Veja os últimos anúncios e destaques."
            />
            <div className={cn("grid gap-3", getGridClass())} style={{ minHeight: '450px' }}>
              {renderHighlights()}
            </div>
          </section>
        )}
        
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Messages Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm flex flex-col h-full">
              <CardHeader>
                <CardTitle className="font-headline text-foreground text-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <MessageSquare className="h-6 w-6 text-accent" />
                      <span>Mensagens</span>
                    </div>
                    {unreadCount > 0 && (<Badge variant="default">{unreadCount}</Badge>)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 relative">
                 <div className="absolute inset-0">
                    <ScrollArea className="h-full">
                        <div className="space-y-4 p-6 pt-0">
                            {messages.map((msg) => (
                                <div key={msg.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewMessage(msg)}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Checkbox checked={msg.isRead} disabled className="pointer-events-none" aria-label={msg.isRead ? "Mensagem lida" : "Mensagem não lida"} />
                                            <div className={cn("font-body text-sm text-foreground truncate", { 'font-bold': !msg.isRead })}>{msg.title}</div>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap pl-1">{new Date(msg.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <p className={cn("text-sm text-muted-foreground font-body pl-8", { 'font-bold text-foreground': !msg.isRead, 'font-normal': msg.isRead })}>
                                      {msg.content.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content}
                                      {msg.content.length > 80 && <span className="text-accent font-semibold ml-1">Leia mais</span>}
                                    </p>
                                    <div className="flex justify-end mt-auto"><Badge variant="outline" className="font-body">{msg.sender}</Badge></div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                  </div>
              </CardContent>
            </Card>
          </div>
            
          {/* Events Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm flex flex-col h-full">
              <CardHeader>
                <CardTitle className="font-headline text-foreground text-xl flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-accent"/>
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 grid md:grid-cols-5 gap-6 min-h-0">
                  <div className="md:col-span-3 flex items-start justify-center">
                      <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          className="rounded-md border"
                          month={date}
                          onMonthChange={setDate}
                      />
                  </div>
                  <div className="md:col-span-2 relative min-h-0">
                    <div className="absolute inset-0">
                      <ScrollArea className="h-full pr-4">
                          <div className="space-y-4">
                          {events.map((event, index) => {
                            const Icon = getIcon(event.icon) as LucideIcon;
                            return (
                              <div key={index} className="flex items-start gap-4 p-3 bg-muted/40 rounded-lg">
                              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center h-10 w-10">
                                  <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-grow">
                                  <p className="font-semibold font-body text-sm text-foreground">{event.title}</p>
                                  <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                                  <Clock className="h-3 w-3 mr-1.5" />
                                  {event.time}
                                  </p>
                              </div>
                              </div>
                           )})}
                          </div>
                      </ScrollArea>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(isOpen) => !isOpen && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{selectedMessage.title}</DialogTitle>
                <DialogDescription className="text-left pt-2">De: {selectedMessage.sender}<br />Data: {new Date(selectedMessage.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</DialogDescription>
              </DialogHeader>
              <div className="py-4 text-sm text-foreground max-h-[60vh] overflow-y-auto">
                {selectedMessage.content.split('\n').map((line, index) => (<p key={index} className="mb-2 last:mb-0">{line || '\u00A0'}</p>))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
