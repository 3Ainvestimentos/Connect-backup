
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { getIcon } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { useApplications, Application } from '@/contexts/ApplicationsContext';
import { Separator } from '@/components/ui/separator';
import MyRequests from '@/components/applications/MyRequests';
import ProfileModal from '@/components/applications/ProfileModal';
import WorkflowSubmissionModal from '@/components/applications/WorkflowSubmissionModal';

export default function ApplicationsPage() {
  const { applications } = useApplications();
  const [activeWorkflow, setActiveWorkflow] = React.useState<Application | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = React.useState(false);

  const sortedApplications = React.useMemo(() => {
    return [...applications].sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);
  
  const handleAppClick = (app: Application) => {
    // Special handling for the profile modal
    if (app.name.toLowerCase().includes('perfil')) {
        setProfileModalOpen(true);
        return;
    }

    if (app.type === 'workflow') {
      setActiveWorkflow(app);
    }
  };

  const handleCloseModal = () => {
    setActiveWorkflow(null);
    setProfileModalOpen(false);
  }

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <PageHeader 
            title="Aplicações e Suporte" 
            description="Acesse as ferramentas e serviços da empresa."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            
             {/* Hardcoded Profile Card */}
             <Card 
                className="h-32 flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleAppClick({ id: 'profile', name: 'Meu Perfil', icon: 'UserCircle', type: 'workflow' })}
                onKeyDown={(e) => e.key === 'Enter' && handleAppClick({ id: 'profile', name: 'Meu Perfil', icon: 'UserCircle', type: 'workflow' })}
                tabIndex={0}
            >
                <CardContent className="p-0 h-full w-full">
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        {getIcon('UserCircle')({ className: "mb-2 h-7 w-7 text-muted-foreground" })}
                        <span className="font-semibold font-body text-sm text-card-foreground">Meu Perfil</span>
                    </div>
                </CardContent>
            </Card>

            {/* Dynamic applications */}
            {sortedApplications.map((app) => {
              // We already have a hardcoded "Meu Perfil" card, so we skip the dynamic one if it exists
              if (app.name.toLowerCase().includes('perfil')) return null;

              const Icon = getIcon(app.icon);
              const content = (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Icon className="mb-2 h-7 w-7 text-muted-foreground" />
                  <span className="font-semibold font-body text-sm text-card-foreground">{app.name}</span>
                </div>
              );

              const cardProps = {
                className: "h-32 flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
              };

              return app.type === 'workflow' ? (
                <Card key={app.id} {...cardProps} onClick={() => handleAppClick(app)} onKeyDown={(e) => e.key === 'Enter' && handleAppClick(app)} tabIndex={0}>
                  <CardContent className="p-0 h-full w-full">{content}</CardContent>
                </Card>
              ) : (
                <Link 
                  href={app.href || '#'} 
                  key={app.id} 
                  className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                  {...(app.type === 'external' ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <Card {...cardProps}>
                      <CardContent className="p-0 h-full w-full">{content}</CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
        
        <Separator />
        
        <MyRequests />

      </div>
      
      {/* Modals */}
      <ProfileModal open={isProfileModalOpen} onOpenChange={handleCloseModal} />

      {activeWorkflow && (
        <WorkflowSubmissionModal
            open={!!activeWorkflow}
            onOpenChange={handleCloseModal}
            workflowType={activeWorkflow}
        />
      )}
    </>
  );
}
