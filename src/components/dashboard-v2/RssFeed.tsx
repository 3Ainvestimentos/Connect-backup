
"use client";

import React from 'react';
import type Parser from 'rss-parser';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import { Rss, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext';

// 1. URLs dos feeds
const feedUrls = [
  'https://www.infomoney.com.br/mercados/rss',
  'https://www.infomoney.com.br/economia/rss',
  'https://www.infomoney.com.br/business/rss',
];

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  creator?: string;
}

// 2. Função de busca que chama a NOSSA API INTERNA
const fetchFeeds = async (urls: string[]): Promise<FeedItem[]> => {
  // A requisição é feita para /api/rss, que está no mesmo domínio
  const response = await fetch(`/api/rss?urls=${encodeURIComponent(urls.join(','))}`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar os feeds de notícias.');
  }
  return response.json();
};

export default function RssFeed() {
  const { theme } = useTheme();
  
  // 3. O useQuery chama a função fetchFeeds, que é segura
  const { data: items, isLoading, isError } = useQuery<FeedItem[], Error>({
    queryKey: ['rssFeeds', feedUrls],
    queryFn: () => fetchFeeds(feedUrls),
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchInterval: 1000 * 60 * 60, // 1 hora
    refetchOnWindowFocus: false,
  });

  const logoUrl = theme === 'dark'
    ? 'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Finfomoney-logo%20branca.png?alt=media&token=4cc683ae-8d98-4ba8-bfa2-e965c8ae478f'
    : 'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Finfomoney-logo.png?alt=media&token=f94a25f3-116e-4b11-82db-5e65ecec3c6c';

  const renderSkeleton = () => (
    <div className="flex space-x-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 w-1/3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );

  // 4. Renderizar a UI com base no estado (loading, error, success)
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Image src={logoUrl} alt="InfoMoney Logo" width={150} height={40} />
            </div>
            <CardDescription>Feed de Notícias Externo</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && renderSkeleton()}
        {isError && <p className="text-center text-destructive">Erro ao carregar notícias do feed.</p>}
        {!isLoading && !isError && items && (
          <Carousel opts={{ align: "start", loop: true }} className="w-full px-10">
            <CarouselContent className="-ml-4">
              {items.map((item, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                    <Card className="h-full flex flex-col hover:border-primary transition-colors">
                      <CardHeader>
                        <CardTitle className="font-headline text-base line-clamp-3">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-4">{item.contentSnippet}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3 mt-auto">
                        <span>{item.creator || 'InfoMoney'}</span>
                        <span>{item.isoDate ? format(new Date(item.isoDate), "dd MMM, yyyy", { locale: ptBR }) : ''}</span>
                      </CardFooter>
                    </Card>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
}
