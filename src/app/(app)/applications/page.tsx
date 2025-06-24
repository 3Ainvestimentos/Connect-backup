
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  LayoutGrid, 
  UserCircle, 
  MessagesSquare, 
  BookUser, 
  Plane, 
  Calendar, 
  Headset, 
  Briefcase,
  Plus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLink {
  name: string;
  icon: LucideIcon;
  href: string;
  primary?: boolean;
}

const applicationsList: AppLink[] = [
  { name: 'Meu Perfil', icon: UserCircle, href: '#' },
  { name: 'Slack', icon: MessagesSquare, href: '#' },
  { name: 'Contatos', icon: BookUser, href: '#' },
  { name: 'Férias', icon: Plane, href: '#' },
  { name: 'Eventos', icon: Calendar, href: '#' },
  { name: 'Suporte TI', icon: Headset, href: '#' },
  { name: 'Administrativo', icon: Briefcase, href: '#' },
  { name: 'Adicionar App', icon: Plus, href: '#', primary: true },
];

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Aplicações"
        icon={LayoutGrid}
        description="Acesse rapidamente os sistemas e serviços essenciais."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {applicationsList.map((app) => {
          const isPrimary = app.primary;
          return (
            <Button
              key={app.name}
              variant={isPrimary ? 'default' : 'outline'}
              className={cn(
                "flex flex-col items-center justify-center h-32 p-4 text-center font-body group",
                !isPrimary && "hover:bg-primary/5 hover:text-primary"
              )}
              asChild
            >
              <Link href={app.href}>
                <app.icon className={cn(
                  "h-10 w-10 mb-2 transition-colors",
                  isPrimary ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary"
                )} />
                <span className="text-sm">{app.name}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  );
}
