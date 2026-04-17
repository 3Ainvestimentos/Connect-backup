'use client';

import { Button } from '@/components/ui/button';
import { formatManagementDetailValue } from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';

type RequestSubmittedDataSectionProps = {
  formData: WorkflowManagementRequestDetailData['formData'];
  attachments: WorkflowManagementRequestDetailData['attachments'];
};

type SubmittedDataItem =
  | {
      kind: 'field';
      key: string;
      label: string;
      order: number;
      value: string;
    }
  | {
      kind: 'attachment';
      key: string;
      label: string;
      order: number;
      url: string;
      fileName: string;
    };

function getAttachmentFileName(url: string): string {
  const rawName = url.split('/').pop()?.split('?')[0] ?? 'Arquivo';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function RequestSubmittedDataSection({
  formData,
  attachments,
}: RequestSubmittedDataSectionProps) {
  const hasFields = formData.fields.length > 0;
  const hasExtraFields = formData.extraFields.length > 0;
  const hasAttachments = attachments.length > 0;
  const submittedItems: SubmittedDataItem[] = [
    ...formData.fields.map((field, index) => ({
      kind: 'field' as const,
      key: `field:${field.fieldId}:${index}`,
      label: field.label,
      order: field.order ?? index,
      value: formatManagementDetailValue(field),
    })),
    ...attachments.map((attachment, index) => ({
      kind: 'attachment' as const,
      key: `attachment:${attachment.fieldId}:${index}`,
      label: attachment.label,
      order: attachment.order ?? formData.fields.length + index,
      url: attachment.url,
      fileName: attachment.fileName || getAttachmentFileName(attachment.url),
    })),
  ].sort((left, right) => left.order - right.order);

  return (
    <section className="space-y-4" aria-labelledby="request-submitted-data-title">
      <div className="space-y-1">
        <h2 id="request-submitted-data-title" className="text-sm font-semibold text-foreground">
          Dados enviados
        </h2>
        <p className="text-sm text-muted-foreground">
          Campos e anexos enviados na abertura original do chamado.
        </p>
      </div>

      {!hasFields && !hasExtraFields && !hasAttachments ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum campo nem anexo da submissao inicial foi exposto pelo contrato oficial.
        </div>
      ) : null}

      {submittedItems.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Campos enviados</p>
          {submittedItems.map((item) =>
            item.kind === 'field' ? (
              <div key={item.key} className="rounded-lg border bg-background p-3">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {item.value}
                </p>
              </div>
            ) : (
              <div
                key={item.key}
                className="flex flex-col gap-3 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.fileName}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Ver anexo
                    </a>
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {hasExtraFields ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Campos extras</p>
          {formData.extraFields.map((field) => (
            <div key={field.key} className="rounded-lg border border-dashed bg-background p-3">
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

    </section>
  );
}
