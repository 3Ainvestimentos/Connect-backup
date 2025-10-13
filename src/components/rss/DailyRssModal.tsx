
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FeedItem {
  title: string;
  link: string;
  contentSnippet?: string;
  content?: string; // HTML content
  isoDate?: string;
  enclosure?: {
    url: string;
  };
}

interface FeedResponse {
    title?: string;
    items: FeedItem[];
}

interface DailyRssModalProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}


const fetchFeed = async (url: string): Promise<FeedResponse> => {
    if (!url) return { items: [] };
    const response = await fetch(`/api/rss?urls=${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error('Não foi possível carregar o feed de notícias.');
    }
    return response.json();
};

export function DailyRssModal({ forceOpen = false, onOpenChange }: DailyRssModalProps) {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [lastSeen, setLastSeen] = useLocalStorage<string>('dailyRssLastSeen', '');
  const [hidePermanently, setHidePermanently] = useLocalStorage<boolean>('hideDailyRss', false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { data: feedData, isLoading, isError } = useQuery<FeedResponse, Error>({
    queryKey: ['dailyRssFeed', settings.rssNewsletterUrl],
    queryFn: () => fetchFeed(settings.rssNewsletterUrl!),
    enabled: (forceOpen || settings.isRssNewsletterActive) && !!settings.rssNewsletterUrl,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const items = feedData?.items || [];

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
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
  }, [settingsLoading, settings.isRssNewsletterActive, lastSeen, hidePermanently, forceOpen]);

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
        const today = new Date().toISOString().split('T')[0];
        setLastSeen(today);
        if (dontShowAgain) {
          setHidePermanently(true);
        }
    }
    setIsOpen(false);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
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
      <DialogContent className="sm:max-w-3xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline justify-center">
            {feedData?.title || 'Sua Newsletter Diária'}
          </DialogTitle>
          <DialogDescription className="text-center">
            As principais notícias do mercado para começar o seu dia bem informado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading && renderSkeleton()}
            {isError && <p className="text-destructive text-center">Não foi possível carregar as notícias.</p>}
            {!isLoading && !isError && (
              <div className="space-y-0 divide-y">
                {items?.map((item, index) => (
                  <article key={index}>
                    <div className="p-6">
                      <p className="text-sm text-muted-foreground mb-2">
                          {item.isoDate ? format(new Date(item.isoDate), "dd MMM, HH:mm", { locale: ptBR }) : ''}
                      </p>
                      <h3 className="text-2xl font-bold font-headline mb-4">{item.title}</h3>

                      {item.enclosure?.url && (
                        <div className="relative w-full aspect-video mb-4">
                            <Image src={item.enclosure.url} alt={item.title} layout="fill" objectFit="cover" className="rounded-md" />
                        </div>
                      )}
                      
                      <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.content || item.contentSnippet || '' }} />
                      
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          Ver matéria original <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4 border-t">
          {!forceOpen && (
             <div className="flex items-center space-x-2">
               <Checkbox id="dont-show-again" checked={dontShowAgain} onCheckedChange={(checked) => setDontShowAgain(!!checked)} />
               <Label htmlFor="dont-show-again" className="text-xs text-muted-foreground">
                 Não mostrar novamente hoje
               </Label>
             </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
