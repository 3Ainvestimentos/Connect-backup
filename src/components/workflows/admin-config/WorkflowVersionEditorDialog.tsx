"use client";

import { useCallback, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { WorkflowDraftEditorPage } from './editor/WorkflowDraftEditorPage';
import type { WorkflowDraftDirtyState, WorkflowDraftEditorShellState } from './editor/types';

const INITIAL_SHELL_STATE: WorkflowDraftEditorShellState = {
  submitDraft: () => {},
  publishVersion: () => {},
  isSaving: false,
  isPublishing: false,
  canPublish: false,
  isReadOnly: false,
};

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
  const [shellState, setShellState] = useState<WorkflowDraftEditorShellState>(INITIAL_SHELL_STATE);

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
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="space-y-1">
            <DialogTitle>Editor de versao</DialogTitle>
            <DialogDescription>
              Ajuste ou consulte a configuracao sem sair da tela de definicoes.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-muted"
            aria-label="Fechar editor"
            onClick={() => {
              requestClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <WorkflowDraftEditorPage
            workflowTypeId={workflowTypeId}
            version={version}
            onClose={onClose}
            onRefresh={onRefresh}
            embedded
            hidePrimaryActions
            onDirtyStateChange={setDirtyState}
            onShellStateChange={setShellState}
          />
        </div>
        {!shellState.isReadOnly ? (
          <div className="border-t bg-background px-6 py-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => requestClose()}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
                disabled={shellState.isSaving}
                onClick={shellState.submitDraft}
              >
                {shellState.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar rascunho
              </Button>
              <Button
                type="button"
                className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
                disabled={!shellState.canPublish || shellState.isPublishing || dirtyState.isDirty}
                onClick={shellState.publishVersion}
              >
                {shellState.isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publicar versao
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
