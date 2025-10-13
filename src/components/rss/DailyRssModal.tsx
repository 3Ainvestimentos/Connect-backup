
"use client";

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Rss, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface FeedItem {
  title: string;
  link: string;
  contentSnippet?: string;
  isoDate?: string;
  enclosure?: {
    url: string;
  };
}

const fetchFeed = async (url: string): Promise<FeedItem[]> => {
    if (!url) return [];
    const response = await fetch(`/api/rss?urls=${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error('Não foi possível carregar o feed de notícias.');
    }
    return response.json();
};

export function DailyRssModal() {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [lastSeen, setLastSeen] = useLocalStorage<string>('dailyRssLastSeen', '');
  const [hidePermanently, setHidePermanently] = useLocalStorage<boolean>('hideDailyRss', false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data: items, isLoading, isError } = useQuery<FeedItem[], Error>({
    queryKey: ['dailyRssFeed', settings.rssNewsletterUrl],
    queryFn: () => fetchFeed(settings.rssNewsletterUrl!),
    enabled: settings.isRssNewsletterActive && !!settings.rssNewsletterUrl,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  useEffect(() => {
    if (settingsLoading || !settings.isRssNewsletterActive || hidePermanently) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (lastSeen !== today) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500); // Delay opening the modal for a better user experience

      return () => clearTimeout(timer);
    }
  }, [settingsLoading, settings.isRssNewsletterActive, lastSeen, hidePermanently]);

  const handleClose = () => {
    const today = new Date().toISOString().split('T')[0];
    setLastSeen(today);
    if (dontShowAgain) {
      setHidePermanently(true);
    }
    setIsOpen(false);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Rss />
            Sua Newsletter Diária
          </DialogTitle>
          <DialogDescription>
            As principais notícias do mercado para começar o seu dia bem informado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading && renderSkeleton()}
            {isError && <p className="text-destructive text-center">Não foi possível carregar as notícias.</p>}
            {!isLoading && !isError && (
              <ul className="space-y-4">
                {items?.map((item, index) => (
                  <li key={index} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                      {item.enclosure?.url && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <Image src={item.enclosure.url} alt={item.title} layout="fill" objectFit="cover" className="rounded-md" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {item.isoDate ? format(new Date(item.isoDate), "dd MMM, HH:mm", { locale: ptBR }) : ''}
                        </p>
                        <h3 className="font-semibold text-foreground group-hover:underline">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.contentSnippet}</p>
                      </div>
                       <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4 border-t">
           <div className="flex items-center space-x-2">
             <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={(checked) => setDontShowAgain(!!checked)} />
             <Label htmlFor="dont-show-again" className="text-xs text-muted-foreground">
               Não mostrar novamente
             </Label>
           </div>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
