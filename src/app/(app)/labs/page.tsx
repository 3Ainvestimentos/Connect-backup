
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FlaskConical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const labVideos = [
  { title: 'HOME EQUITY', subtitle: 'com Victor Huerara | XP', href: 'https://drive.google.com/file/d/1Ic8JAuB_QNwG7wp4Yrw8PQui4086Gs9A/view' },
  { title: 'ESTRUTURAS DE PROTEÇÃO', subtitle: 'com Lucas Prado', href: 'https://drive.google.com/file/d/1OtAD5ieAgs6ppxuWCChuLrqNpQExjln0/view' },
  { title: 'ESTRUTURADAS', subtitle: '(cases práticos)', href: 'https://drive.google.com/file/d/1SHV3zJNdejwSO0BhLwNyKozxv8ZEUeGo/view' },
  { title: 'PAINEL PREVIDÊNCIA', subtitle: '', href: 'https://drive.google.com/file/d/12Q1gS_faJpw7jYRBsRyHqyikEvVv6-hF/view' },
  { title: 'PAINEL INTERNACIONAL', subtitle: '', href: 'https://drive.google.com/file/d/1gJ4qrl7Pl5hlhkWmx03ZZAgyDdcphMDE/view' },
  { title: 'PAINEL PJ', subtitle: 'com Paulo Caus', href: 'https://drive.google.com/file/d/1uUUhjQ4FwDBMAluwFPzSSEce4xm81gQ0/view' },
  { title: 'PAINEL CÂMBIO', subtitle: 'com Ágata Panoutsos', href: 'https://drive.google.com/file/d/1cqTusqhlRw4laV1zdeBYlM8ja93l7hfE/view' },
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
            <Link href={video.href} className="w-full group" target="_blank" rel="noopener noreferrer">
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
              <Link href={video.href} target="_blank" rel="noopener noreferrer">Acessar</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
