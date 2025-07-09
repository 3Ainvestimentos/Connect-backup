"use client";

import { PageHeader } from '@/components/layout/PageHeader';
import { FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { useLabs, type LabType } from '@/contexts/LabsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function LabsPage() {
  const { labs, loading } = useLabs();

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Labs"
        icon={FlaskConical}
        description="Repositório de vídeos de treinamento, painéis e outros materiais de estudo."
      />
       {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : labs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {labs.map((video) => (
            <div key={video.id} className="flex flex-col text-center">
              <Link href={video.videoUrl} className="w-full group" target="_blank" rel="noopener noreferrer">
                <div
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted"
                  data-ai-hint="dark texture"
                >
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-muted-foreground dark:text-white">
                    <div className="flex-grow flex items-center">
                      <p className="font-bold text-xl uppercase tracking-wide leading-tight">{video.title}</p>
                    </div>
                    {video.subtitle && <p className="text-sm mt-2 font-light opacity-80">{video.subtitle}</p>}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground font-headline">Nenhum Lab encontrado.</p>
          <p className="text-muted-foreground font-body">Adicione vídeos de treinamento no painel de administração.</p>
        </div>
      )}
    </div>
  );
}

export type { LabType };