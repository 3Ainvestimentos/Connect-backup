
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';
import { getIcon } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { useApplications, WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { Separator } from '@/components/ui/separator';
import MyRequests from '@/components/applications/MyRequests';
import WorkflowSubmissionModal from '@/components/applications/WorkflowSubmissionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { workflowDefinitions } = useApplications();
  const [activeWorkflow, setActiveWorkflow] = React.useState<WorkflowDefinition | null>(null);

  const currentUserCollab = React.useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const sortedWorkflows = React.useMemo(() => {
    if (!currentUserCollab) return [];
    
    const accessibleWorkflows = workflowDefinitions.filter(def => {
      // If allowedUserIds is not defined, or includes 'all', it's public
      if (!def.allowedUserIds || def.allowedUserIds.includes('all')) {
        return true;
      }
      // Otherwise, check if the current user's ID is in the list
      return def.allowedUserIds.includes(currentUserCollab.id3a);
    });

    return [...accessibleWorkflows].sort((a, b) => a.name.localeCompare(b.name));
  }, [workflowDefinitions, currentUserCollab]);
  
  const handleAppClick = (workflow: WorkflowDefinition) => {
    setActiveWorkflow(workflow);
  };

  const handleCloseModal = () => {
    setActiveWorkflow(null);
  }

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <PageHeader 
            title="Workflows" 
            description="Inicie processos e acesse as ferramentas da empresa."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            
            {/* Dynamic applications */}
            {sortedWorkflows.map((workflow) => {
              const Icon = getIcon(workflow.icon);
              const content = (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Icon className="mb-2 h-7 w-7 text-muted-foreground" />
                  <span className="font-semibold font-body text-sm text-card-foreground">{workflow.name}</span>
                </div>
              );

              return (
                <Card 
                  key={workflow.id}
                  className="h-32 flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAppClick(workflow)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAppClick(workflow)}
                  tabIndex={0}
                >
                  <CardContent className="p-0 h-full w-full">{content}</CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        <Separator />
        
        <MyRequests />

      </div>
      
      {activeWorkflow && (
        <WorkflowSubmissionModal
            open={!!activeWorkflow}
            onOpenChange={handleCloseModal}
            workflowDefinition={activeWorkflow}
        />
      )}
    </>
  );
}
