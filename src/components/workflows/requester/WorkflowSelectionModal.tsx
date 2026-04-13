'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area?.areaName}</DialogTitle>
          <DialogDescription>
            Selecione o tipo de solicitacao que deseja abrir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {area?.workflows.map((workflow) => {
            const Icon = getIcon(workflow.icon);
            return (
              <button
                key={workflow.workflowTypeId}
                type="button"
                className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                onClick={() => handleSelect(workflow)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{workflow.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workflow.description || 'Sem descricao.'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
