
"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '../ui/button';

interface FeedItem {
  title: string;
  link: string;
  contentSnippet?: string;
  isoDate?: string;
  creator?: string;
  sourceCategory?: string;
}

const feedUrls = [
  'https://www.infomoney.com.br/mercados/rss',
  'https://www.infomoney.com.br/economia/rss',
  'https://www.infomoney.com.br/business/rss',
];

const fetchFeeds = async (urls: string[]): Promise<FeedItem[]> => {
  const response = await fetch(`/api/rss?urls=${encodeURIComponent(urls.join(','))}`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar os feeds de notícias.');
  }
  return response.json();
};

export default function RssFeed() {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  
  const { data: items, isLoading, isError } = useQuery<FeedItem[], Error>({
    queryKey: ['rssFeeds', feedUrls],
    queryFn: () => fetchFeeds(feedUrls),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const logoUrl = theme === 'dark'
    ? 'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Finfomoney-logo%20branca.png?alt=media&token=4cc683ae-8d98-4ba8-bfa2-e965c8ae478f'
    : 'https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Finfomoney-logo.png?alt=media&token=f94a25f3-116e-4b11-82db-5e65ecec3c6c';

  const totalPages = items ? Math.ceil(items.length / ITEMS_PER_PAGE) : 0;
  const paginatedItems = items ? items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) : [];

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <Skeleton className="h-5 w-4/5" />
          </CardHeader>
          <CardContent className="flex-grow">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-1/2" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

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
        {!isLoading && !isError && paginatedItems && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paginatedItems.map((item, index) => (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full group" key={index}>
                <Card className="h-full flex flex-col w-full transition-colors">
                  <CardHeader>
                    <CardTitle className="font-headline text-base leading-tight break-words group-hover:underline">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-4 break-words">{item.contentSnippet}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3 mt-auto">
                    <span>{item.sourceCategory || 'InfoMoney'}</span>
                    <span>{item.isoDate ? format(new Date(item.isoDate), "dd MMM, yyyy", { locale: ptBR }) : ''}</span>
                  </CardFooter>
                </Card>
              </a>
            ))}
          </div>
        )}
      </CardContent>
       <CardFooter className="flex justify-between items-center pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
