"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { LayoutGrid, UserCircle, Briefcase, Plane, Headset, Megaphone as MarketingIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MessagesSquare as SlackIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Import modals
import VacationRequestModal from '@/components/applications/VacationRequestModal';
import SupportModal from '@/components/applications/SupportModal';
import AdminModal from '@/components/applications/AdminModal';
import MarketingModal from '@/components/applications/MarketingModal';

interface AppLink {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  isModal?: boolean;
}

const applicationsList: AppLink[] = [
  { id: 'profile', name: 'Meu Perfil', icon: UserCircle, href: '#' },
  { id: 'slack', name: 'Slack', icon: SlackIcon, href: '#' },
  { id: 'vacation', name: 'Férias', icon: Plane, href: '#', isModal: true },
  { id: 'support', name: 'Suporte TI', icon: Headset, href: '#', isModal: true },
  { id: 'admin', name: 'Administrativo', icon: Briefcase, href: '#', isModal: true },
  { id: 'marketing', name: 'Marketing', icon: MarketingIcon, href: '#', isModal: true },
];

export default function ApplicationsPage() {
  const [isVacationModalOpen, setIsVacationModalOpen] = React.useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = React.useState(false);

  const handleAppClick = (appId: string) => {
    switch (appId) {
      case 'vacation': setIsVacationModalOpen(true); break;
      case 'support': setIsSupportModalOpen(true); break;
      case 'admin': setIsAdminModalOpen(true); break;
      case 'marketing': setIsMarketingModalOpen(true); break;
      default: break;
    }
  };

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Aplicações" 
          icon={LayoutGrid}
          description="Acesse as ferramentas e serviços da empresa."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {applicationsList.map((app) => {
            const content = (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <app.icon className="mb-3 h-8 w-8 text-accent" />
                <span className="font-semibold font-body text-card-foreground">{app.name}</span>
              </div>
            );

            const cardProps = {
              className: "flex items-center justify-center p-6 h-36 hover:bg-muted/50 transition-colors cursor-pointer"
            };

            return app.isModal ? (
              <Card key={app.id} {...cardProps} onClick={() => handleAppClick(app.id)} onKeyDown={(e) => e.key === 'Enter' && handleAppClick(app.id)} tabIndex={0}>
                <CardContent className="p-0">{content}</CardContent>
              </Card>
            ) : (
              <Link href={app.href} key={app.id} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                <Card {...cardProps}>
                   <CardContent className="p-0">{content}</CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      
      <VacationRequestModal open={isVacationModalOpen} onOpenChange={setIsVacationModalOpen} />
      <SupportModal open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen} />
      <AdminModal open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen} />
      <MarketingModal open={isMarketingModalOpen} onOpenChange={setIsMarketingModalOpen} />
    </>
  );
}
