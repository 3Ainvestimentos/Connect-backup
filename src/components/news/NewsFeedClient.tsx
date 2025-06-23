
"use client";

import React, { useState, useMemo } from 'react';
import type { NewsItemType } from '@/app/(app)/news/page';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Search, CalendarDays, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';

interface NewsFeedClientProps {
  initialNewsItems: NewsItemType[];
  categories: string[];
}

export default function NewsFeedClient({ initialNewsItems, categories }: NewsFeedClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('date_desc');

  const filteredAndSortedNews = useMemo(() => {
    let items = initialNewsItems;

    if (searchTerm) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.snippet.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    return [...items].sort((a, b) => {
        switch (sortBy) {
            case 'date_asc':
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'title_asc':
                return a.title.localeCompare(b.title);
            case 'title_desc':
                return b.title.localeCompare(a.title);
            case 'date_desc':
            default:
                return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });
  }, [initialNewsItems, searchTerm, selectedCategory, sortBy]);

  return (
    <div>
      <div className="mb-6 p-4 bg-card rounded-lg shadow sticky top-[var(--header-height)] z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar notícias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-body"
              aria-label="Pesquisar notícias"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="font-body" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-body">Todas as Categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="font-body">{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="font-body" aria-label="Ordenar por">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc" className="font-body">Mais Recentes</SelectItem>
              <SelectItem value="date_asc" className="font-body">Mais Antigas</SelectItem>
              <SelectItem value="title_asc" className="font-body">Título (A-Z)</SelectItem>
              <SelectItem value="title_desc" className="font-body">Título (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedNews.map(item => (
            <Card key={item.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
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
          <p className="text-muted-foreground font-body">Tente ajustar seus filtros ou termos de pesquisa.</p>
        </div>
      )}
    </div>
  );
}
