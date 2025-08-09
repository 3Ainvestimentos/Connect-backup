
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { getIcon } from '@/lib/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WorkflowGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaName: string;
  group: WorkflowDefinition[];
  onWorkflowSelect: (workflow: WorkflowDefinition) => void;
}

export function WorkflowGroupModal({ open, onOpenChange, areaName, group, onWorkflowSelect }: WorkflowGroupModalProps) {
  if (!group || group.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{areaName}</DialogTitle>
          <DialogDescription>
            Selecione um dos processos abaixo para iniciar uma nova solicitação.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 py-4">
            {group.map((workflow) => {
              const Icon = getIcon(workflow.icon);
              return (
                <Card
                  key={workflow.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onWorkflowSelect(workflow)}
                  onKeyDown={(e) => e.key === 'Enter' && onWorkflowSelect(workflow)}
                  tabIndex={0}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="font-semibold font-body text-sm text-card-foreground">{workflow.name}</p>
                        <div className="prose prose-sm dark:prose-invert text-xs text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {workflow.description}
                            </ReactMarkdown>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
