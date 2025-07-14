
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { getIcon } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { useApplications, Application } from '@/contexts/ApplicationsContext';
import { Separator } from '@/components/ui/separator';
import MyRequests from '@/components/applications/MyRequests';
import WorkflowSubmissionModal from '@/components/applications/WorkflowSubmissionModal';

export default function ApplicationsPage() {
  const { applications } = useApplications();
  const [activeWorkflow, setActiveWorkflow] = React.useState<Application | null>(null);

  const sortedApplications = React.useMemo(() => {
    // Filtra o "Meu perfil" e ordena o restante
    return applications
      .filter(app => app.name.toLowerCase() !== 'meu perfil')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);
  
  const handleAppClick = (app: Application) => {
    if (app.type === 'workflow') {
      setActiveWorkflow(app);
    }
  };

  const handleCloseModal = () => {
    setActiveWorkflow(null);
  }

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <PageHeader 
            title="Aplicações" 
            description="Inicie processos e acesse as ferramentas da empresa."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            
            {/* Dynamic applications */}
            {sortedApplications.map((app) => {
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

              if (app.type === 'workflow') {
                return (
                  <Card key={app.id} {...cardProps} onClick={() => handleAppClick(app)} onKeyDown={(e) => e.key === 'Enter' && handleAppClick(app)} tabIndex={0}>
                    <CardContent className="p-0 h-full w-full">{content}</CardContent>
                  </Card>
                );
              }

              return (
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
