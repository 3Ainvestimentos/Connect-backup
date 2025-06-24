
"use client";

import React from 'react';
import type { NewsItemType } from '@/app/(app)/news/page';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Search, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';

interface NewsFeedClientProps {
  initialNewsItems: NewsItemType[];
}

export default function NewsFeedClient({ initialNewsItems }: NewsFeedClientProps) {
  // Sort by most recent by default
  const sortedNews = [...initialNewsItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      {/* Filter and sort controls removed */}
      {sortedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNews.map(item => (
            <Card key={item.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="relative w-full h-48">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={item.dataAiHint || "news article"}
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
                 <div className="flex items-center text-xs text-muted-foreground pt-1 space-x-2">
                    <Badge variant="outline" className="font-body text-accent border-accent">{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.snippet}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1 font-body">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <Button variant="link" size="sm" className="font-body text-accent p-0 h-auto">Ler Mais</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground font-headline">Nenhuma notícia encontrada.</p>
          <p className="text-muted-foreground font-body">Não há notícias disponíveis no momento.</p>
        </div>
      )}
    </div>
  );
}
