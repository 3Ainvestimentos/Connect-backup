'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManagementDetailValue } from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';

type RequestFormDataProps = {
  formData: WorkflowManagementRequestDetailData['formData'];
};

export function RequestFormData({ formData }: RequestFormDataProps) {
  const hasFields = formData.fields.length > 0;
  const hasExtraFields = formData.extraFields.length > 0;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Dados enviados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasFields && !hasExtraFields ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum campo preenchido foi exposto pelo contrato oficial.
          </div>
        ) : null}

        {hasFields ? (
          <div className="space-y-3">
            {formData.fields.map((field) => (
              <div key={field.fieldId} className="rounded-lg border p-3">
                <p className="text-sm font-medium text-foreground">{field.label}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {formatManagementDetailValue(field)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {hasExtraFields ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Campos extras</p>
            {formData.extraFields.map((field) => (
              <div key={field.key} className="rounded-lg border border-dashed p-3">
                <p className="text-sm font-medium text-foreground">{field.key}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {typeof field.value === 'object' && field.value !== null
                    ? JSON.stringify(field.value)
                    : String(field.value)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
