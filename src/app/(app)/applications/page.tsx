
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import VacationRequestModal from '@/components/applications/VacationRequestModal';
import SupportModal from '@/components/applications/SupportModal';
import AdminModal from '@/components/applications/AdminModal';
import MarketingModal from '@/components/applications/MarketingModal';
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
  Megaphone
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
  { id: 'contacts', name: 'Contatos', icon: BookUser, href: '/contacts' },
  { id: 'vacation', name: 'Férias', icon: Plane, href: '#' },
  { id: 'events', name: 'Eventos', icon: Calendar, href: '#' },
  { id: 'support', name: 'Suporte TI', icon: Headset, href: '#' },
  { id: 'admin', name: 'Administrativo', icon: Briefcase, href: '#' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, href: '#' },
];

export default function ApplicationsPage() {
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);

  return (
    <div className="p-6 md:p-8">
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
                    "flex flex-col items-center justify-center w-48 h-48 p-2 text-center font-body group bg-card",
                    !isPrimary && "hover:bg-primary/5 hover:text-primary",
                    "[&_svg]:w-16 [&_svg]:h-16"
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

            if (app.id === 'support') {
              return (
                <Button
                  key={app.name}
                  variant={isPrimary ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col items-center justify-center w-48 h-48 p-2 text-center font-body group bg-card",
                    !isPrimary && "hover:bg-primary/5 hover:text-primary",
                    "[&_svg]:w-16 [&_svg]:h-16"
                  )}
                  onClick={() => setIsSupportModalOpen(true)}
                >
                  <app.icon className={cn(
                    "mb-2 transition-colors",
                    isPrimary ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary"
                  )} />
                  <span className="text-lg font-bold">{app.name}</span>
                </Button>
              );
            }

            if (app.id === 'admin') {
              return (
                <Button
                  key={app.name}
                  variant={isPrimary ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col items-center justify-center w-48 h-48 p-2 text-center font-body group bg-card",
                    !isPrimary && "hover:bg-primary/5 hover:text-primary",
                    "[&_svg]:w-16 [&_svg]:h-16"
                  )}
                  onClick={() => setIsAdminModalOpen(true)}
                >
                  <app.icon className={cn(
                    "mb-2 transition-colors",
                    isPrimary ? "text-primary-foreground" : "text-primary/80 group-hover:text-primary"
                  )} />
                  <span className="text-lg font-bold">{app.name}</span>
                </Button>
              );
            }

            if (app.id === 'marketing') {
              return (
                <Button
                  key={app.name}
                  variant={isPrimary ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col items-center justify-center w-48 h-48 p-2 text-center font-body group bg-card",
                    !isPrimary && "hover:bg-primary/5 hover:text-primary",
                    "[&_svg]:w-16 [&_svg]:h-16"
                  )}
                  onClick={() => setIsMarketingModalOpen(true)}
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
                  "flex flex-col items-center justify-center w-48 h-48 p-2 text-center font-body group bg-card",
                  !isPrimary && "hover:bg-primary/5 hover:text-primary",
                  "[&_svg]:w-16 [&_svg]:h-16"
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
      <SupportModal 
        open={isSupportModalOpen} 
        onOpenChange={setIsSupportModalOpen} 
      />
      <AdminModal 
        open={isAdminModalOpen} 
        onOpenChange={setIsAdminModalOpen} 
      />
      <MarketingModal 
        open={isMarketingModalOpen} 
        onOpenChange={setIsMarketingModalOpen} 
      />
    </div>
  );
}
