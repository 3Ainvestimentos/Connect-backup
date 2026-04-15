'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getIcon } from '@/lib/icons';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';

type WorkflowSelectionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: RequesterCatalogArea | null;
  onWorkflowSelect: (workflow: RequesterCatalogWorkflow) => void;
};

export function WorkflowSelectionModal({
  open,
  onOpenChange,
  area,
  onWorkflowSelect,
}: WorkflowSelectionModalProps) {
  const handleSelect = (workflow: RequesterCatalogWorkflow) => {
    onWorkflowSelect(workflow);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{area?.areaName}</DialogTitle>
          <DialogDescription>
            Selecione um dos processos abaixo para iniciar uma nova solicitacao.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 py-4">
          {area?.workflows.map((workflow) => {
            const Icon = getIcon(workflow.icon);
            return (
              <Card
                key={workflow.workflowTypeId}
                className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => handleSelect(workflow)}
                role="button"
                tabIndex={0}
                aria-label={workflow.name}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(workflow);
                  }
                }}
              >
                <CardContent className="flex items-center gap-4 p-4 text-left">
                  <Icon className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-grow">
                    <p className="font-body text-sm font-semibold text-card-foreground">
                      {workflow.name}
                    </p>
                    {workflow.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {workflow.description}
                      </p>
                    ) : null}
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
