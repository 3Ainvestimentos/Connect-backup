
"use client";

import React, { useState, useMemo } from 'react';
import type { LabType } from '@/app/(app)/labs/page';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronDown, ChevronUp, Folder, ExternalLink, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '../ui/skeleton';

interface LabsRepositoryClientProps {
  initialLabs: LabType[];
  categories: string[];
  loading: boolean;
}

type SortKey = keyof LabType | '';
type SortDirection = 'asc' | 'desc';

export default function LabsRepositoryClient({ initialLabs, categories, loading }: LabsRepositoryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedLabs = useMemo(() => {
    let items = initialLabs;

    if (searchTerm) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategories.length > 0) {
      items = items.filter(item => selectedCategories.includes(item.category));
    }

    if (sortKey) {
      items.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          if (sortKey === 'lastModified') {
            comparison = new Date(valA).getTime() - new Date(b.lastModified).getTime();
          } else {
            comparison = valA.localeCompare(valB);
          }
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return items;
  }, [initialLabs, searchTerm, selectedCategories, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const renderSkeleton = () => (
    <Card className="shadow-sm">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Modificado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </Card>
  );

  return (
    <div>
      <div className="mb-6 p-4 bg-card rounded-lg sticky top-[var(--header-height)] z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar labs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-body"
              aria-label="Pesquisar labs"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-between font-body hover:bg-background hover:text-foreground">
                Categorias ({selectedCategories.length || 'Todas'}) <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 font-body">
              <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? renderSkeleton() : filteredAndSortedLabs.length > 0 ? (
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead onClick={() => handleSort('title')} className="cursor-pointer hover:bg-muted/50 font-body">
                  Título {sortKey === 'title' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead className="font-body">
                  Categoria
                </TableHead>
                <TableHead onClick={() => handleSort('lastModified')} className="cursor-pointer hover:bg-muted/50 font-body">
                  Modificado em {sortKey === 'lastModified' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
                </TableHead>
                <TableHead className="text-right font-body">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLabs.map((lab) => (
                <TableRow key={lab.id} className="hover:bg-muted/30">
                  <TableCell><Video className="h-5 w-5 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium font-body">
                    {lab.title}
                    {lab.subtitle && <p className="text-xs text-muted-foreground">{lab.subtitle}</p>}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-body">{lab.category}</Badge></TableCell>
                  <TableCell className="font-body">
                    {new Date(lab.lastModified).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild aria-label="Abrir vídeo" className="hover:bg-muted">
                      <a href={lab.videoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
         <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground font-headline">Nenhum Lab encontrado.</p>
          <p className="text-muted-foreground font-body">Tente ajustar seus filtros ou termos de pesquisa.</p>
        </div>
      )}
    </div>
  );
}
