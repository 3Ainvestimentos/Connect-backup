'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PilotApiError } from '@/lib/workflows/pilot/api-client';
import type {
  DynamicFormValue,
  OpenPilotRequestInput,
  PilotWorkflowCatalog,
} from '@/lib/workflows/pilot/types';
import {
  WorkflowFileTransferError,
  WorkflowUploadRequestError,
  type WorkflowUploadFileInput,
  type WorkflowUploadFileResult,
} from '@/lib/workflows/upload/types';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

type DynamicFormValues = Record<string, DynamicFormValue>;
type UploadFile = (input: WorkflowUploadFileInput) => Promise<WorkflowUploadFileResult>;

type OpenWorkflowCardProps = {
  catalog?: PilotWorkflowCatalog;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  requesterName: string;
  uploadFile: UploadFile;
  onSubmit: (payload: OpenPilotRequestInput) => Promise<unknown>;
};

function buildDefaultValues(catalog?: PilotWorkflowCatalog): DynamicFormValues {
  if (!catalog) {
    return {};
  }

  return catalog.fields.reduce<DynamicFormValues>((accumulator, field) => {
    accumulator[field.id] = field.type === 'file' ? null : '';
    return accumulator;
  }, {});
}

function normalizeScalarValue(value: DynamicFormValue): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

async function buildFormDataForCatalog(params: {
  catalog: PilotWorkflowCatalog;
  values: DynamicFormValues;
  uploadFile: UploadFile;
}): Promise<Record<string, unknown>> {
  const formData: Record<string, unknown> = {};

  for (const field of params.catalog.fields) {
    const rawValue = params.values[field.id];

    if (field.type === 'file') {
      const file = rawValue instanceof File ? rawValue : null;

      if (field.required && !file) {
        throw new Error('Campo obrigatorio.');
      }

      if (file) {
        const { fileUrl } = await params.uploadFile({
          workflowTypeId: params.catalog.workflowTypeId,
          fieldId: field.id,
          file,
        });

        formData[field.id] = fileUrl;
      }

      continue;
    }

    const normalized = normalizeScalarValue(rawValue);

    if (normalized !== undefined) {
      formData[field.id] = normalized;
    }
  }

  return formData;
}

function getSubmissionErrorMessage(error: unknown): string {
  if (error instanceof WorkflowUploadRequestError) {
    if (error.httpStatus === 401 || error.httpStatus === 403) {
      return 'Falha ao preparar o upload do anexo. Verifique sua permissao e tente novamente.';
    }

    return error.message;
  }

  if (error instanceof WorkflowFileTransferError) {
    return 'Falha ao transferir o anexo para o Storage. Tente novamente com o mesmo arquivo.';
  }

  if (error instanceof PilotApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return 'Nao foi possivel enviar a solicitacao.';
}

export function OpenWorkflowCard({
  catalog,
  isLoading,
  isSubmitting,
  errorMessage,
  requesterName,
  uploadFile,
  onSubmit,
}: OpenWorkflowCardProps) {
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState<string | undefined>(undefined);
  const [isPreparingSubmission, setIsPreparingSubmission] = React.useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DynamicFormValues>({
    defaultValues: buildDefaultValues(catalog),
  });

  React.useEffect(() => {
    reset(buildDefaultValues(catalog));
    setSubmitErrorMessage(undefined);
  }, [catalog, reset]);

  const isBusy = isSubmitting || isPreparingSubmission;

  const handleOpenWorkflow = handleSubmit(async (values) => {
    if (!catalog) {
      return;
    }

    setSubmitErrorMessage(undefined);
    setIsPreparingSubmission(true);

    try {
      const formData = await buildFormDataForCatalog({
        catalog,
        values,
        uploadFile,
      });

      await onSubmit({
        workflowTypeId: catalog.workflowTypeId,
        requesterName,
        formData,
      });

      reset(buildDefaultValues(catalog));
    } catch (error) {
      setSubmitErrorMessage(getSubmissionErrorMessage(error));
    } finally {
      setIsPreparingSubmission(false);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova solicitacao</CardTitle>
        <CardDescription>
          {catalog
            ? `${catalog.workflowName} - versao ${catalog.version}`
            : 'O catalogo publicado do workflow sera carregado aqui.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {submitErrorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {submitErrorMessage}
          </div>
        ) : null}

        {catalog ? (
          <>
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>{catalog.description || 'Workflow publicado para abertura do piloto de Facilities.'}</p>
              <p className="mt-2">
                Fluxo: {catalog.steps.map((step) => step.stepName).join(' -> ')}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleOpenWorkflow} noValidate>
              {catalog.fields.map((field) => (
                <Controller
                  key={`${catalog.workflowTypeId}:${field.id}`}
                  control={control}
                  name={field.id}
                  rules={
                    field.type === 'file'
                      ? {
                          validate: (value) =>
                            !field.required || value instanceof File || 'Campo obrigatorio.',
                        }
                      : {
                          required: field.required ? 'Campo obrigatorio.' : false,
                        }
                  }
                  render={({ field: rhfField }) => (
                    <DynamicFieldRenderer
                      definition={field}
                      value={rhfField.value}
                      onChange={rhfField.onChange}
                      disabled={isBusy}
                      error={errors[field.id]?.message as string | undefined}
                    />
                  )}
                />
              ))}

              <Button type="submit" disabled={isBusy}>
                {isBusy ? 'Enviando...' : 'Enviar solicitacao'}
              </Button>
            </form>
          </>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum catalogo publicado disponivel para este workflow.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
