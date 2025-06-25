
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FlaskConical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const labVideos = [
  { title: 'HOME EQUITY', subtitle: 'com Victor Huerara | XP', href: '#' },
  { title: 'ESTRUTURAS DE PROTEÇÃO', subtitle: 'com Lucas Prado', href: '#' },
  { title: 'ESTRUTURADAS', subtitle: '(cases práticos)', href: '#' },
  { title: 'PAINEL PREVIDÊNCIA', subtitle: '', href: '#' },
  { title: 'PAINEL INTERNACIONAL', subtitle: '', href: '#' },
  { title: 'PAINEL PJ', subtitle: 'com Paulo Caus', href: '#' },
  { title: 'PAINEL CÂMBIO', subtitle: 'com Ágata Panoutsos', href: '#' },
  { title: 'ANÁLISE DE MERCADO', subtitle: 'Q3 2024', href: '#' },
];

export default function LabsPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Labs"
        icon={FlaskConical}
        description="Repositório de vídeos de treinamento, painéis e outros materiais de estudo."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {labVideos.map((video, index) => (
          <div key={index} className="flex flex-col text-center">
            <Link href={video.href} className="w-full group">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-900">
                <Image
                  src="https://placehold.co/400x533.png"
                  alt={video.title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="dark texture"
                  className="opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-white">
                  <h3 className="font-headline text-lg tracking-wider">
                    3A RIVA <span className="text-primary font-bold">LAB</span>
                  </h3>
                  <div className="flex-grow flex items-center">
                    <p className="font-bold text-xl mt-6 uppercase tracking-wide leading-tight">{video.title}</p>
                  </div>
                  {video.subtitle && <p className="text-sm mt-2 font-light">{video.subtitle}</p>}
                </div>
              </div>
            </Link>
            <Button asChild className="mt-4 w-full max-w-sm mx-auto">
              <Link href={video.href}>Acessar</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
