
"use client";

import React from 'react';
import Parser from 'rss-parser';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import { Rss, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 1. Definir as URLs dos feeds
const feedUrls = [
  'https://www.infomoney.com.br/mercados/rss',
  'https://www.infomoney.com.br/economia/rss',
  'https://www.infomoney.com.br/business/rss',
];

// Interface para um item de feed combinado
interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  creator?: string;
}

// 2. Definir a função de busca e parsing
const fetchFeeds = async (urls: string[]): Promise<FeedItem[]> => {
  // URL da nossa Cloud Function que atua como proxy.
  const PROXY_URL = `https://rssproxy-k5q5p2x37a-uc.a.run.app/?url=`;
  const parser = new Parser();
  
  // Buscar todos os feeds em paralelo
  const promises = urls.map(url =>
    fetch(`${PROXY_URL}${encodeURIComponent(url)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch ${url}, status: ${res.status}`);
        return res.text();
      })
      .then(str => parser.parseString(str))
      .catch(error => {
        console.error(`Error fetching or parsing feed ${url}:`, error);
        return null; // Retorna nulo em caso de erro para não quebrar o Promise.all
      })
  );
  
  const feeds = await Promise.all(promises);
  
  // Combinar, ordenar e limitar os itens
  let combinedItems: FeedItem[] = feeds
    .filter((feed): feed is Parser.Output<{ [key: string]: any; }> => feed !== null) // Filtra os feeds que falharam
    .flatMap(feed => feed?.items || []);
    
  combinedItems.sort((a, b) => {
    const dateA = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const dateB = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return dateB - dateA;
  });
  
  return combinedItems.slice(0, 20); // Limita a 20 notícias mais recentes
};

export default function RssFeed() {
  // 3. Usar o useQuery para gerenciar o estado
  const { data: items, isLoading, isError } = useQuery<FeedItem[], Error>({
    queryKey: ['rssFeeds', feedUrls],
    queryFn: () => fetchFeeds(feedUrls),
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchInterval: 1000 * 60 * 60, // 1 hora
    refetchOnWindowFocus: false,
  });

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
                <Image src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2FInfoMoney-logo.png?alt=media&token=c19c3230-0d94-411a-b52b-232115162464" alt="InfoMoney Logo" width={150} height={40} />
            </div>
            <CardDescription>Feed de Notícias Externo</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && renderSkeleton()}
        {isError && <p className="text-center text-destructive">Erro ao carregar notícias do feed.</p>}
        {!isLoading && !isError && items && (
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
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
            <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2" />
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
}
