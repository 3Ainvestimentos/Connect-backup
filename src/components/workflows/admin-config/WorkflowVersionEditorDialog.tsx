"use client";

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowDraftEditorPage } from './editor/WorkflowDraftEditorPage';
import type { WorkflowDraftDirtyState } from './editor/types';

export function WorkflowVersionEditorDialog({
  workflowTypeId,
  version,
  open,
  onClose,
  onRefresh,
}: {
  workflowTypeId: string;
  version: number;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [dirtyState, setDirtyState] = useState<WorkflowDraftDirtyState>({
    isDirty: false,
    isReadOnly: false,
  });

  const requestClose = useCallback(() => {
    if (
      !dirtyState.isReadOnly &&
      dirtyState.isDirty &&
      !window.confirm('Existem alteracoes nao salvas. Deseja fechar mesmo assim?')
    ) {
      return false;
    }

    onClose();
    return true;
  }, [dirtyState.isDirty, dirtyState.isReadOnly, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          requestClose();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
          requestClose();
        }}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Editor de versao</DialogTitle>
          <DialogDescription>
            Ajuste ou consulte a configuracao sem sair da tela de definicoes.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <WorkflowDraftEditorPage
            workflowTypeId={workflowTypeId}
            version={version}
            onClose={onClose}
            onRefresh={onRefresh}
            embedded
            onDirtyStateChange={setDirtyState}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
