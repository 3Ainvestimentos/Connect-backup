
"use client"; 

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Megaphone, MessageSquare, CalendarDays, MapPin, Link as LinkIcon, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useNews } from '@/contexts/NewsContext';
import { useEvents } from '@/contexts/EventsContext';
import { useMessages, type MessageType } from '@/contexts/MessagesContext';
import { getIcon } from '@/lib/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { isSameMonth, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { toast } from '@/hooks/use-toast';


export default function DashboardPage() {
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get global data from contexts
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { events, getEventRecipients } = useEvents();
  const { messages, markMessageAsRead, getMessageRecipients, markMessageAsDeleted } = useMessages();
  const { newsItems } = useNews();
  
  const currentUserCollab = useMemo(() => {
      if (!user || !collaborators) return null;
      return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const userMessages = useMemo(() => {
    if (!currentUserCollab) return [];
    const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    return sortedMessages.filter(msg => {
        // Don't show messages the user has soft-deleted
        if (msg.deletedBy && msg.deletedBy.includes(currentUserCollab.id)) {
            return false;
        }
        const recipients = getMessageRecipients(msg, collaborators);
        return recipients.some(r => r.id === currentUserCollab.id);
    });
  }, [messages, currentUserCollab, collaborators, getMessageRecipients]);
  
  const userEvents = useMemo(() => {
      if (!currentUserCollab) return [];
      
      return events.filter(event => {
          const recipients = getEventRecipients(event, collaborators);
          return recipients.some(r => r.id === currentUserCollab.id);
      });
  }, [events, currentUserCollab, collaborators, getEventRecipients]);

  const eventsForMonth = useMemo(() => {
    if (!displayedMonth) return [];
    const timeZone = 'America/Sao_Paulo';
    return userEvents.filter(event => {
      const eventDateInSaoPaulo = toZonedTime(parseISO(event.date), timeZone);
      const displayedMonthInSaoPaulo = toZonedTime(displayedMonth, timeZone);
      return isSameMonth(eventDateInSaoPaulo, displayedMonthInSaoPaulo);
    });
  }, [userEvents, displayedMonth]);
  
  const eventDates = useMemo(() => userEvents.map(e => toZonedTime(parseISO(e.date), 'UTC')), [userEvents]);

  const unreadCount = useMemo(() => {
    if (!currentUserCollab) return 0;
    return userMessages.filter(msg => !msg.readBy.includes(currentUserCollab.id)).length;
  }, [userMessages, currentUserCollab]);
  
  const unreadLabel = useMemo(() => {
    if (unreadCount === 0) return null;
    if (unreadCount === 1) return "1 mensagem não lida";
    return `${unreadCount} mensagens não lidas`;
  }, [unreadCount]);

  const activeHighlights = useMemo(() => newsItems.filter(item => item.isHighlight), [newsItems]);

  const handleViewMessage = (messageToView: MessageType) => {
    if (!currentUserCollab) return;
    // Mark as read in global state via context
    markMessageAsRead(messageToView.id, currentUserCollab.id);
    // Open the dialog to show the full message
    setSelectedMessage(messageToView);
  };
  
  const handleUserDeleteMessage = async () => {
    if (!selectedMessage || !currentUserCollab || isDeleting) return;
    setIsDeleting(true);
    try {
        await markMessageAsDeleted(selectedMessage.id, currentUserCollab.id);
        toast({ title: "Mensagem movida para a lixeira." });
        setSelectedMessage(null);
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível remover a mensagem.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
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

  const HighlightCard = ({ item, className = "" }: { item: any, className?: string }) => (
    <Link href={item.link || '#'} className={cn("relative rounded-lg overflow-hidden group block", className)}>
        <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint={item.dataAiHint} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
        <h3 className="text-xl font-headline font-bold text-white">{item.title}</h3>
        <p className="text-sm text-gray-200 font-body">{item.snippet}</p>
        </div>
    </Link>
  );

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        {activeHighlights.length > 0 && (
          <section>
            <PageHeader
              title={<Link href="/news" className="hover:underline">O que há de novo</Link>}
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
                    {unreadCount > 0 && (<Badge variant="secondary">{unreadLabel}</Badge>)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 relative">
                 <div className="absolute inset-0">
                    <ScrollArea className="h-full">
                        <div className="space-y-4 p-6 pt-0">
                            {userMessages.map((msg) => {
                                const isRead = currentUserCollab ? msg.readBy.includes(currentUserCollab.id) : false;
                                return (
                                <div key={msg.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewMessage(msg)}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <Checkbox checked={!isRead} aria-label={isRead ? "Mensagem lida" : "Mensagem não lida"} className={cn("pointer-events-none mt-0.5 flex-shrink-0", { 'border-muted-foreground data-[state=checked]:bg-muted-foreground/30 data-[state=checked]:border-muted-foreground': !isRead, 'border-input data-[state=checked]:bg-transparent': isRead })} />
                                            <p className={cn("font-body text-sm text-foreground truncate", { 'font-bold': !isRead })}>{msg.title}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap pl-1 flex-shrink-0">{new Date(msg.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <p className={cn("text-sm text-muted-foreground font-body pl-8", { 'font-bold text-foreground': !isRead, 'font-normal': isRead })}>
                                      {msg.content.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content}
                                      {msg.content.length > 80 && <span className={cn("text-black ml-1 hover:underline", { 'font-semibold': !isRead })}>Leia mais</span>}
                                    </p>
                                    <div className="flex justify-end mt-auto"><Badge variant="outline" className="font-body">{msg.sender}</Badge></div>
                                </div>
                            )})}
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
                          selected={undefined}
                          onSelect={undefined}
                          className="rounded-md border no-day-hover"
                          month={displayedMonth}
                          onMonthChange={setDisplayedMonth}
                          modifiers={{ event: eventDates }}
                          modifiersClassNames={{ event: 'bg-primary/20 rounded-full', day_today: '' }}
                      />
                  </div>
                  <div className="md:col-span-2 relative min-h-0">
                    <div className="absolute inset-0">
                      <ScrollArea className="h-full pr-4">
                          <div className="space-y-4">
                          {eventsForMonth.map((event, index) => {
                            const Icon = getIcon(event.icon) as LucideIcon;
                            return (
                              <div key={index} className="flex items-start gap-4 p-3 bg-muted/40 rounded-lg">
                                <div className="flex-shrink-0 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center h-10 w-10">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold font-body text-sm text-foreground">{event.title}</p>
                                    <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                                      <CalendarDays className="h-3 w-3 mr-1.5" />
                                      {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                                      <Clock className="h-3 w-3 mr-1.5" />
                                      {event.time}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-body flex items-center mt-1">
                                      <MapPin className="h-3 w-3 mr-1.5" />
                                      {event.location}
                                    </p>
                                </div>
                              </div>
                           )})}
                           {eventsForMonth.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <CalendarDays className="h-8 w-8 mb-2"/>
                                <p className="font-body text-sm">Nenhum evento para o mês selecionado.</p>
                            </div>
                           )}
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
                 {selectedMessage.mediaUrl && (
                  <div className="mb-4">
                    <Image src={selectedMessage.mediaUrl} alt="Mídia da mensagem" width={500} height={300} className="rounded-md object-cover w-full" />
                  </div>
                 )}
                 {selectedMessage.content.split('\n').map((line, index) => (<p key={index} className="mb-2 last:mb-0">{line || '\u00A0'}</p>))}
                 {selectedMessage.link && (
                    <div className="mt-4">
                       <Button variant="outline" asChild>
                         <a href={selectedMessage.link} target="_blank" rel="noopener noreferrer">
                           <LinkIcon className="mr-2 h-4 w-4" />
                           Acessar Link
                         </a>
                       </Button>
                    </div>
                 )}
              </div>
              <DialogFooter className="justify-between">
                <Button variant="destructive" onClick={handleUserDeleteMessage} disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Mover para lixeira
                </Button>
                <Button variant="secondary" onClick={() => setSelectedMessage(null)} className="hover:bg-muted">Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
