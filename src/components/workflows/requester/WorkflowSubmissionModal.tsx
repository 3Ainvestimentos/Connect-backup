'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { usePublishedWorkflow, useOpenRequesterWorkflow } from '@/hooks/use-requester-workflows';
import { DynamicFieldRendererV2 } from './DynamicFieldRendererV2';
import { uploadWorkflowFile } from '@/lib/workflows/upload/client';
import { RequesterApiError } from '@/lib/workflows/requester/api-client';
import type { RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import type { WorkflowUploadFileResult } from '@/lib/workflows/upload/types';

type DynamicFormValues = Record<string, unknown>;

type WorkflowSubmissionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: RequesterCatalogWorkflow | null;
  onSuccess: (requestId: number) => void;
};

function buildDefaultValues(metadata?: WorkflowPublishedMetadata): DynamicFormValues {
  if (!metadata) {
    return {};
  }

  return metadata.fields.reduce<DynamicFormValues>((accumulator, field) => {
    if (field.type === 'file') {
      accumulator[field.id] = null;
    } else if (field.type === 'date-range') {
      accumulator[field.id] = { startDate: '', endDate: '' };
    } else {
      accumulator[field.id] = '';
    }
    return accumulator;
  }, {});
}

function getSubmissionErrorMessage(error: unknown): string {
  if (error instanceof RequesterApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return 'Nao foi possivel enviar a solicitacao.';
}

export function WorkflowSubmissionModal({
  open,
  onOpenChange,
  workflow,
  onSuccess,
}: WorkflowSubmissionModalProps) {
  const { user, currentUserCollab } = useAuth();
  const workflowTypeId = workflow?.workflowTypeId ?? '';
  const { data: metadata, isLoading: isLoadingMetadata } = usePublishedWorkflow(
    open ? workflowTypeId : null,
  );
  const openMutation = useOpenRequesterWorkflow();
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState<string | undefined>(undefined);
  const [isPreparingSubmission, setIsPreparingSubmission] = React.useState(false);
  const uploadProgressRef = React.useRef<Map<string, boolean>>(new Map());

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DynamicFormValues>({
    defaultValues: buildDefaultValues(metadata),
  });

  React.useEffect(() => {
    if (open && metadata) {
      reset(buildDefaultValues(metadata));
      setSubmitErrorMessage(undefined);
      uploadProgressRef.current.clear();
    }
  }, [open, metadata, reset]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  };

  const isBusy = openMutation.isPending || isPreparingSubmission;

  const handleUpload = React.useCallback(
    async (workflowTypeId: string, fieldId: string, file: File): Promise<WorkflowUploadFileResult> => {
      if (!user) throw new Error('Usuario nao autenticado');

      uploadProgressRef.current.set(fieldId, true);
      try {
        const result = await uploadWorkflowFile(user, { workflowTypeId, fieldId, file });
        return result;
      } finally {
        uploadProgressRef.current.set(fieldId, false);
      }
    },
    [user],
  );

  const handleSubmission = handleSubmit(async (values) => {
    if (!metadata || !user || !workflow) {
      return;
    }

    setSubmitErrorMessage(undefined);
    setIsPreparingSubmission(true);

    try {
      const formData: Record<string, unknown> = {};

      for (const field of metadata.fields) {
        const rawValue = values[field.id];

        if (field.type === 'file') {
          const file = rawValue instanceof File ? rawValue : null;

          if (field.required && !file) {
            throw new Error(`O campo "${field.label}" e obrigatorio.`);
          }

          if (file) {
            const uploadResult = await handleUpload(workflow.workflowTypeId, field.id, file);
            formData[field.id] = {
              fileUrl: uploadResult.fileUrl,
              storagePath: uploadResult.storagePath,
              uploadId: uploadResult.uploadId,
              fileName: uploadResult.fileName,
              contentType: uploadResult.contentType,
            };
          }
          continue;
        }

        if (field.type === 'text' || field.type === 'textarea') {
          const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
          if (field.required && trimmed === '') {
            throw new Error(`O campo "${field.label}" e obrigatorio.`);
          }
          if (trimmed !== '') {
            formData[field.id] = trimmed;
          }
          continue;
        }

        if (field.type === 'select') {
          const value = typeof rawValue === 'string' ? rawValue : '';
          if (field.required && value === '') {
            throw new Error(`O campo "${field.label}" e obrigatorio.`);
          }
          if (value !== '') {
            formData[field.id] = value;
          }
          continue;
        }

        if (field.type === 'date') {
          const value = typeof rawValue === 'string' ? rawValue : '';
          if (field.required && value === '') {
            throw new Error(`O campo "${field.label}" e obrigatorio.`);
          }
          if (value !== '') {
            formData[field.id] = value;
          }
          continue;
        }

        if (field.type === 'date-range') {
          const rangeValue =
            typeof rawValue === 'object' && rawValue !== null
              ? (rawValue as { startDate?: string; endDate?: string })
              : {};
          const startDate = typeof rangeValue.startDate === 'string' ? rangeValue.startDate.trim() : '';
          const endDate = typeof rangeValue.endDate === 'string' ? rangeValue.endDate.trim() : '';

          if (field.required && (!startDate || !endDate)) {
            throw new Error(`O campo "${field.label}" e obrigatorio.`);
          }
          if (startDate && endDate) {
            formData[field.id] = { startDate, endDate };
          }
          continue;
        }
      }

      const canonicalRequesterName = currentUserCollab?.name?.trim() || '';

      const result = await openMutation.mutateAsync({
        workflowTypeId: workflow.workflowTypeId,
        requesterName: canonicalRequesterName,
        formData,
      });

      reset(buildDefaultValues(metadata));
      onSuccess(result.requestId);
    } catch (error) {
      setSubmitErrorMessage(getSubmissionErrorMessage(error));
    } finally {
      setIsPreparingSubmission(false);
    }
  });

  if (!workflow) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workflow.name}</DialogTitle>
          <DialogDescription>
            {workflow.description || 'Preencha os campos abaixo para abrir sua solicitacao.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingMetadata ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : metadata ? (
          <form onSubmit={handleSubmission} noValidate className="space-y-6">
            {submitErrorMessage ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {submitErrorMessage}
              </div>
            ) : null}

            {metadata.fields.map((field) => (
              <Controller
                key={`${metadata.workflowTypeId}:${field.id}`}
                control={control}
                name={field.id}
                render={({ field: rhfField }) => (
                  <DynamicFieldRendererV2
                    definition={field}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    disabled={isBusy}
                    error={errors[field.id]?.message as string | undefined}
                  />
                )}
              />
            ))}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
                className="bg-admin-primary hover:bg-admin-primary/90"
              >
                {isBusy ? 'Enviando...' : 'Enviar solicitacao'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nao foi possivel carregar os campos deste workflow.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
