'use client';

import { formatManagementDetailValue } from '@/lib/workflows/management/presentation';
import type { RequesterUnifiedRequestDetailField } from '@/lib/workflows/requester/unified-types';

type RequesterRequestFormDataProps = {
  fields: RequesterUnifiedRequestDetailField[];
};

export function RequesterRequestFormData({ fields }: RequesterRequestFormDataProps) {
  return (
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Dados enviados</h3>
        <p className="text-sm text-muted-foreground">
          Informações preenchidas pelo solicitante no envio do chamado.
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum campo preenchido foi exposto para esta solicitação.
        </div>
      ) : (
        <div className="rounded-md border">
          {fields.map((field, index) => (
            <div
              key={field.fieldId}
              className={[
                'space-y-1 px-4 py-3',
                index < fields.length - 1 ? 'border-b' : '',
              ].join(' ')}
            >
              <p className="text-sm font-medium text-foreground">{field.label}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {formatManagementDetailValue({
                  type: field.type as
                    | 'text'
                    | 'textarea'
                    | 'select'
                    | 'date'
                    | 'date-range'
                    | 'file',
                  value: field.value,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
