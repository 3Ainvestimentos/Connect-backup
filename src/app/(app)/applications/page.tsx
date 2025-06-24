"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import VacationRequestModal from '@/components/applications/VacationRequestModal';
import Link from 'next/link';
import { 
  LayoutGrid, 
  UserCircle, 
  MessagesSquare, 
  BookUser, 
  Plane, 
  Calendar, 
  Headset, 
  Briefcase
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLink {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  primary?: boolean;
}

const applicationsList: AppLink[] = [
  { id: 'profile', name: 'Meu Perfil', icon: UserCircle, href: '#' },
  { id: 'slack', name: 'Slack', icon: MessagesSquare, href: '#' },
  { id: 'contacts', name: 'Contatos', icon: BookUser, href: '#' },
  { id: 'vacation', name: 'Férias', icon: Plane, href: '#' },
  { id: 'events', name: 'Eventos', icon: Calendar, href: '#' },
  { id: 'support', name: 'Suporte TI', icon: Headset, href: '#' },
  { id: 'admin', name: 'Administrativo', icon: Briefcase, href: '#' },
];

export default function ApplicationsPage() {
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Aplicações"
          icon={LayoutGrid}
          description="Acesse rapidamente os sistemas e serviços essenciais."
        />
        <div className="mx-auto grid max-w-max grid-cols-2 gap-6 sm:grid-cols-4">
          {applicationsList.map((app) => {
            const isPrimary = app.primary;

            if (app.id === 'vacation') {
              return (
                <Button
                  key={app.name}
                  variant={isPrimary ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col items-center justify-center w-60 h-60 p-2 text-center font-body group bg-card",
                    !isPrimary && "hover:bg-primary/5 hover:text-primary",
                    "[&_svg]:w-32 [&_svg]:h-32"
                  )}
                  onClick={() => setIsVacationModalOpen(true)}
                >
                  <app.icon className={cn(
                    "mb-2 transition-colors",
                    isPrimary ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary"
                  )} />
                  <span className="text-lg font-bold">{app.name}</span>
                </Button>
              );
            }

            return (
              <Button
                key={app.name}
                variant={isPrimary ? 'default' : 'outline'}
                className={cn(
                  "flex flex-col items-center justify-center w-60 h-60 p-2 text-center font-body group bg-card",
                  !isPrimary && "hover:bg-primary/5 hover:text-primary",
                  "[&_svg]:w-32 [&_svg]:h-32"
                )}
                asChild
              >
                <Link href={app.href}>
                  <app.icon className={cn(
                    "mb-2 transition-colors",
                    isPrimary ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary"
                  )} />
                  <span className="text-lg font-bold">{app.name}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
      <VacationRequestModal 
        open={isVacationModalOpen} 
        onOpenChange={setIsVacationModalOpen} 
      />
    </>
  );
}
