'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import type { OpenPilotRequestInput, PilotWorkflowCatalog } from '@/lib/workflows/pilot/types';

type DynamicFormValues = Record<string, unknown>;

type OpenWorkflowCardProps = {
  catalog?: PilotWorkflowCatalog;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  requesterName: string;
  onSubmit: (payload: OpenPilotRequestInput) => Promise<unknown>;
};

function buildDefaultValues(catalog?: PilotWorkflowCatalog): DynamicFormValues {
  if (!catalog) {
    return {};
  }

  return catalog.fields.reduce<DynamicFormValues>((accumulator, field) => {
    accumulator[field.id] = '';
    return accumulator;
  }, {});
}

function buildFormData(values: DynamicFormValues): Record<string, unknown> {
  return Object.entries(values).reduce<Record<string, unknown>>((accumulator, [key, rawValue]) => {
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed !== '') {
        accumulator[key] = trimmed;
      }
      return accumulator;
    }

    if (rawValue != null && rawValue !== '') {
      accumulator[key] = rawValue;
    }

    return accumulator;
  }, {});
}

export function OpenWorkflowCard({
  catalog,
  isLoading,
  isSubmitting,
  errorMessage,
  requesterName,
  onSubmit,
}: OpenWorkflowCardProps) {
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
  }, [catalog, reset]);

  const handleOpenWorkflow = handleSubmit(async (values) => {
    if (!catalog) {
      return;
    }

    await onSubmit({
      workflowTypeId: catalog.workflowTypeId,
      requesterName,
      formData: buildFormData(values),
    });

    reset(buildDefaultValues(catalog));
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
                  key={field.id}
                  control={control}
                  name={field.id}
                  rules={{
                    required: field.required ? 'Campo obrigatorio.' : false,
                  }}
                  render={({ field: rhfField }) => (
                    <DynamicFieldRenderer
                      definition={field}
                      value={rhfField.value}
                      onChange={rhfField.onChange}
                      disabled={isSubmitting}
                      error={errors[field.id]?.message as string | undefined}
                    />
                  )}
                />
              ))}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar solicitacao'}
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
