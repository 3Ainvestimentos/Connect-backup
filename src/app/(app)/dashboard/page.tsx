
"use client"; 

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Link as LinkIcon, Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useNews, type NewsItemType } from '@/contexts/NewsContext';
import { useMessages, type MessageType } from '@/contexts/MessagesContext';
import { useQuickLinks } from '@/contexts/QuickLinksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { toast } from '@/hooks/use-toast';
import { addDocumentToCollection } from '@/lib/firestore-service';
import GoogleCalendar from '@/components/dashboard-v2/GoogleCalendar';
import GoogleDriveFiles from '@/components/dashboard-v2/GoogleDriveFiles';

export default function DashboardV2Page() {
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItemType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [greeting, setGreeting] = useState('');

  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { messages, markMessageAsRead, getMessageRecipients, markMessageAsDeleted } = useMessages();
  const { newsItems } = useNews();
  const { getVisibleLinksForUser } = useQuickLinks();
  
  const currentUserCollab = useMemo(() => {
      if (!user || !collaborators) return null;
      return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  useEffect(() => {
    const getGreeting = () => {
      if (typeof window === 'undefined') return '';
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'Bom dia';
      if (hour >= 12 && hour < 18) return 'Boa tarde';
      return 'Boa noite';
    };
    setGreeting(getGreeting());
  }, []);

  const pageTitle = useMemo(() => {
    if (!greeting || !user?.displayName) return "Bem-vindo(a)!";
    return `${greeting}, ${user.displayName.split(' ')[0]}!`;
  }, [greeting, user]);

  const userMessages = useMemo(() => {
    if (!currentUserCollab) return [];
    const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    return sortedMessages.filter(msg => {
        if (msg.deletedBy && msg.deletedBy.includes(currentUserCollab.id3a)) {
            return false;
        }
        const recipients = getMessageRecipients(msg, collaborators);
        return recipients.some(r => r.id3a === currentUserCollab.id3a);
    });
  }, [messages, currentUserCollab, collaborators, getMessageRecipients]);
  
  const quickLinks = useMemo(() => {
    return getVisibleLinksForUser(currentUserCollab, collaborators);
  }, [currentUserCollab, collaborators, getVisibleLinksForUser]);

  const unreadCount = useMemo(() => {
    if (!currentUserCollab) return 0;
    return userMessages.filter(msg => !msg.readBy.includes(currentUserCollab.id3a)).length;
  }, [userMessages, currentUserCollab]);
  
  const unreadLabel = useMemo(() => {
    if (unreadCount === 0) return null;
    if (unreadCount === 1) return "1 mensagem não lida";
    return `${unreadCount} mensagens não lidas`;
  }, [unreadCount]);

  const activeHighlights = useMemo(() => newsItems.filter(item => item.isHighlight), [newsItems]);

  const largeHighlight = useMemo(() => activeHighlights.find(h => h.highlightType === 'large'), [activeHighlights]);
  const smallHighlights = useMemo(() => activeHighlights.filter(h => h.highlightType === 'small' || !h.highlightType).slice(0, 2), [activeHighlights]);
  const hasHighlights = largeHighlight || smallHighlights.length > 0;

  const handleViewMessage = (messageToView: MessageType) => {
    if (!currentUserCollab) return;
    markMessageAsRead(messageToView.id, currentUserCollab.id3a);
    setSelectedMessage(messageToView);
  };

  const logContentView = (item: NewsItemType) => {
    if (!currentUserCollab) return;
    addDocumentToCollection('audit_logs', {
        eventType: 'content_view',
        userId: currentUserCollab.id3a,
        userName: currentUserCollab.name,
        timestamp: new Date().toISOString(),
        details: {
            contentId: item.id,
            contentTitle: item.title,
            contentType: 'news'
        }
    }).catch(console.error);
  };

  const handleViewNews = (item: NewsItemType) => {
      setSelectedNews(item);
      logContentView(item);
  };
  
  const handleUserDeleteMessage = async () => {
    if (!selectedMessage || !currentUserCollab || isDeleting) return;
    setIsDeleting(true);
    try {
        await markMessageAsDeleted(selectedMessage.id, currentUserCollab.id3a);
        toast({ title: "Mensagem movida para a lixeira." });
        setSelectedMessage(null);
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível remover a mensagem.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const HighlightCard = ({ item, className = "" }: { item: NewsItemType, className?: string }) => (
    <div 
        className={cn("relative rounded-lg overflow-hidden group block cursor-pointer bg-black h-full", className)}
        onClick={() => handleViewNews(item)}
        onKeyDown={(e) => e.key === 'Enter' && handleViewNews(item)}
        tabIndex={0}
        role="button"
        aria-label={`Ver notícia: ${item.title}`}
    >
        {item.videoUrl ? (
             <video
                src={item.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            >
                Seu navegador não suporta a tag de vídeo.
            </video>
        ) : (
             <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-end">
            <h3 className="text-xl font-headline font-bold text-white">{item.title}</h3>
            <p className="text-sm text-gray-200 font-body">{item.snippet}</p>
        </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <section>
          <PageHeader
            title={pageTitle}
            description="Veja os últimos anúncios e destaques da empresa."
          />
          {hasHighlights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ minHeight: '450px' }}>
              {smallHighlights.length > 0 && (
                <div className="md:col-span-1 flex flex-col gap-3">
                  {smallHighlights.map(item => (
                    <HighlightCard key={item.id} item={item} />
                  ))}
                </div>
              )}
              {largeHighlight && (
                <div className={cn(
                  "h-full",
                  smallHighlights.length > 0 ? "md:col-span-2" : "md:col-span-3"
                )}>
                  <HighlightCard item={largeHighlight} />
                </div>
              )}
            </div>
          )}
        </section>
        
        <section className="flex flex-col gap-6">
            <Card className="shadow-sm flex flex-col w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-foreground text-xl">Mensagens</CardTitle>
                      <CardDescription>Comunicados e alertas importantes direcionados a você.</CardDescription>
                    </div>
                    {unreadCount > 0 && (<Badge variant="secondary">{unreadLabel}</Badge>)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] relative">
                  {userMessages.length > 0 ? (
                      <div className="absolute inset-0">
                          <ScrollArea className="h-full">
                              <div className="space-y-4 p-6 pt-0">
                                  {userMessages.map((msg) => {
                                      const isRead = currentUserCollab ? msg.readBy.includes(currentUserCollab.id3a) : false;
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
                                            {msg.content.length > 80 && <span className={cn("text-black ml-1 hover:underline", { 'font-semibold': !isRead, 'font-normal': isRead })} >Leia mais</span>}
                                          </p>
                                          <div className="flex justify-end mt-auto"><Badge variant="outline" className="font-body">{msg.sender}</Badge></div>
                                      </div>
                                  )})}
                              </div>
                          </ScrollArea>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                          <MessageSquare className="h-10 w-10 mb-4" />
                          <p className="text-sm text-muted-foreground font-body">
                            Por enquanto nenhuma mensagem nova, {user?.displayName?.split(' ')[0]}!
                          </p>
                      </div>
                  )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoogleCalendar />
                <GoogleDriveFiles />
            </div>

            {quickLinks.length > 0 && (
                <Card className="shadow-sm w-full">
                    <CardHeader>
                        <CardTitle className="font-headline text-foreground text-xl">Links Rápidos</CardTitle>
                        <CardDescription>Acesse rapidamente sistemas e recursos externos.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="flex justify-center flex-wrap gap-3">
                          {quickLinks.map(link => (
                              <a 
                                 href={link.link} 
                                 key={link.id} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="block relative overflow-hidden rounded-lg transition-opacity hover:opacity-80 bg-card dark:bg-white aspect-video w-32"
                                 title={link.name || 'Link Rápido'}
                               >
                                  <Image
                                      src={link.imageUrl}
                                      alt={link.name || 'Quick Link'}
                                      layout="fill"
                                      objectFit="contain"
                                      className="p-2"
                                  />
                              </a>
                          ))}
                        </div>
                    </CardContent>
                </Card>
            )}
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

      <Dialog open={!!selectedNews} onOpenChange={(isOpen) => !isOpen && setSelectedNews(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNews && (
            <>
              <DialogHeader>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-black">
                    {selectedNews.videoUrl ? (
                         <video src={selectedNews.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                    ) : (
                        <Image
                            src={selectedNews.imageUrl}
                            alt={selectedNews.title}
                            layout="fill"
                            objectFit="cover"
                        />
                    )}
                </div>
                <DialogTitle className="font-headline text-2xl text-left">{selectedNews.title}</DialogTitle>
                <div className="text-left !mt-2">
                    <Badge variant="outline" className="font-body text-foreground">{selectedNews.category}</Badge>
                    <span className="text-xs text-muted-foreground font-body ml-2">
                        {new Date(selectedNews.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                </div>
              </DialogHeader>
              <ScrollArea className="max-h-[40vh] pr-4">
                <div className="py-4 text-sm text-foreground space-y-4">
                  {selectedNews.content && selectedNews.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="hover:bg-muted">Fechar</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
