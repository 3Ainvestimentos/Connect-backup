"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { useApplications, Application } from '@/contexts/ApplicationsContext';

// Import all modals
import VacationRequestModal from '@/components/applications/VacationRequestModal';
import SupportModal from '@/components/applications/SupportModal';
import AdminModal from '@/components/applications/AdminModal';
import MarketingModal from '@/components/applications/MarketingModal';
import ProfileModal from '@/components/applications/ProfileModal';
import GenericInfoModal from '@/components/applications/GenericInfoModal';

export default function ApplicationsPage() {
  const { applications } = useApplications();
  const [activeModal, setActiveModal] = React.useState<Application | null>(null);

  const handleAppClick = (app: Application) => {
    if (app.type === 'modal') {
      setActiveModal(app);
    }
  };
  
  const handleCloseModal = () => {
    setActiveModal(null);
  }

  const genericModalContent = React.useMemo(() => {
    if (activeModal?.modalId === 'generic' && activeModal.content) {
      return activeModal.content;
    }
    return null;
  }, [activeModal]);

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader 
          title="Aplicações" 
          icon={LayoutGrid}
          description="Acesse as ferramentas e serviços da empresa."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => {
            const Icon = getIcon(app.icon);
            const content = (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon className="mb-3 h-8 w-8 text-accent" />
                <span className="font-semibold font-body text-card-foreground">{app.name}</span>
              </div>
            );

            const cardProps = {
              className: "flex items-center justify-center p-6 h-36 hover:bg-muted/50 transition-colors cursor-pointer"
            };

            return app.type === 'modal' ? (
              <Card key={app.id} {...cardProps} onClick={() => handleAppClick(app)} onKeyDown={(e) => e.key === 'Enter' && handleAppClick(app)} tabIndex={0}>
                <CardContent className="p-0">{content}</CardContent>
              </Card>
            ) : (
              <Link 
                href={app.href || '#'} 
                key={app.id} 
                className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                {...(app.type === 'external' ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <Card {...cardProps}>
                   <CardContent className="p-0">{content}</CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Pre-built Modals */}
      <ProfileModal open={activeModal?.modalId === 'profile'} onOpenChange={handleCloseModal} />
      <VacationRequestModal open={activeModal?.modalId === 'vacation'} onOpenChange={handleCloseModal} />
      <SupportModal open={activeModal?.modalId === 'support'} onOpenChange={handleCloseModal} />
      <AdminModal open={activeModal?.modalId === 'admin'} onOpenChange={handleCloseModal} />
      <MarketingModal open={activeModal?.modalId === 'marketing'} onOpenChange={handleCloseModal} />
      
      {/* Generic Modal */}
      {genericModalContent && (
        <GenericInfoModal 
            open={!!genericModalContent}
            onOpenChange={handleCloseModal}
            content={genericModalContent}
        />
      )}
    </>
  );
}
