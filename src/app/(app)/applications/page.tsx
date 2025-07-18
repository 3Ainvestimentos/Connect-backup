
"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getIcon } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { useApplications, WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { Separator } from '@/components/ui/separator';
import MyRequests from '@/components/applications/MyRequests';
import WorkflowSubmissionModal from '@/components/applications/WorkflowSubmissionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { WorkflowGroupModal } from '@/components/applications/WorkflowGroupModal';

interface GroupedWorkflows {
  [area: string]: WorkflowDefinition[];
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { workflowDefinitions } = useApplications();

  const [activeWorkflow, setActiveWorkflow] = React.useState<WorkflowDefinition | null>(null);
  const [activeGroup, setActiveGroup] = React.useState<WorkflowDefinition[] | null>(null);

  const currentUserCollab = React.useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const groupedWorkflows = React.useMemo(() => {
    if (!currentUserCollab || !collaborators.length) return {};

    const accessibleWorkflows = workflowDefinitions.filter(def => {
      if (!def.allowedUserIds || def.allowedUserIds.includes('all')) {
        return true;
      }
      return def.allowedUserIds.includes(currentUserCollab.id3a);
    });

    const groups: GroupedWorkflows = {};
    const collaboratorMap = new Map(collaborators.map(c => [c.email, c]));

    accessibleWorkflows.forEach(def => {
      const owner = collaboratorMap.get(def.ownerEmail);
      const area = owner?.area || 'Outros';
      if (!groups[area]) {
        groups[area] = [];
      }
      groups[area].push(def);
    });
    
    // Sort workflows within each group alphabetically
    for (const area in groups) {
      groups[area].sort((a, b) => a.name.localeCompare(b.name));
    }

    return groups;
  }, [workflowDefinitions, currentUserCollab, collaborators]);

  const sortedGroupKeys = React.useMemo(() => {
      return Object.keys(groupedWorkflows).sort((a, b) => a.localeCompare(b));
  }, [groupedWorkflows]);

  const handleAppClick = (group: WorkflowDefinition[]) => {
    if (group.length === 1) {
      setActiveWorkflow(group[0]);
    } else {
      setActiveGroup(group);
    }
  };

  const handleWorkflowSelectedFromGroup = (workflow: WorkflowDefinition) => {
    setActiveGroup(null);
    setActiveWorkflow(workflow);
  };

  const handleCloseModal = () => {
    setActiveWorkflow(null);
  };

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <PageHeader 
            title="Workflows" 
            description="Inicie processos e acesse as ferramentas da empresa."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {sortedGroupKeys.map((area) => {
              const group = groupedWorkflows[area];
              const representativeIcon = group[0]?.icon || 'Folder';
              const Icon = getIcon(representativeIcon);
              const content = (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Icon className="mb-2 h-7 w-7 text-muted-foreground" />
                  <span className="font-semibold font-body text-sm text-card-foreground">{area}</span>
                </div>
              );

              return (
                <Card 
                  key={area}
                  className="h-32 flex items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAppClick(group)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAppClick(group)}
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

      {activeGroup && (
        <WorkflowGroupModal
          open={!!activeGroup}
          onOpenChange={() => setActiveGroup(null)}
          group={activeGroup}
          onWorkflowSelect={handleWorkflowSelectedFromGroup}
        />
      )}
    </>
  );
}
