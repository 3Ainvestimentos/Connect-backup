
"use client";

import { PageHeader } from '@/components/layout/PageHeader';
import NewsFeedClient from '@/components/news/NewsFeedClient';
import { Newspaper } from 'lucide-react';
import { useNews } from '@/contexts/NewsContext';
import type { NewsItemType } from '@/contexts/NewsContext';

export default function NewsPage() {
  const { newsItems } = useNews();
  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader 
        title="Feed de Notícias" 
        description="Mantenha-se atualizado com as últimas notícias e comunicados."
      />
      <NewsFeedClient initialNewsItems={newsItems} />
    </div>
  );
}

export type { NewsItemType };
