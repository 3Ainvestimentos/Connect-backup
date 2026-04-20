'use client';

import { Button } from '@/components/ui/button';
import { formatManagementDetailValue } from '@/lib/workflows/management/presentation';
import type {
  RequesterUnifiedRequestDetailAttachment,
  RequesterUnifiedRequestDetailField,
} from '@/lib/workflows/requester/unified-types';

type RequesterSubmittedDataSectionProps = {
  fields: RequesterUnifiedRequestDetailField[];
  attachments: RequesterUnifiedRequestDetailAttachment[];
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

export function RequesterSubmittedDataSection({
  fields,
  attachments,
}: RequesterSubmittedDataSectionProps) {
  const attachmentFieldIds = new Set(attachments.map((attachment) => attachment.fieldId));
  const visibleFields = fields.filter((field) => !attachmentFieldIds.has(field.fieldId));
  const hasFields = visibleFields.length > 0;
  const hasAttachments = attachments.length > 0;
  const submittedItems: SubmittedDataItem[] = [
    ...visibleFields.map((field, index) => ({
      kind: 'field' as const,
      key: `field:${field.fieldId}:${index}`,
      label: field.label,
      order: field.order ?? index,
      value: formatManagementDetailValue({
        type: field.type as
          | 'text'
          | 'textarea'
          | 'select'
          | 'date'
          | 'date-range'
          | 'file',
        value: field.value,
      }),
    })),
    ...attachments.map((attachment, index) => ({
      kind: 'attachment' as const,
      key: `attachment:${attachment.fieldId}:${index}`,
      label: attachment.label,
      order: attachment.order ?? fields.length + index,
      url: attachment.url,
      fileName: attachment.fileName || getAttachmentFileName(attachment.url),
    })),
  ].sort((left, right) => left.order - right.order);

  return (
    <section className="space-y-4 border-t pt-6" aria-labelledby="requester-submitted-data-title">
      <div className="space-y-1">
        <h3 id="requester-submitted-data-title" className="text-lg font-semibold text-foreground">
          Dados enviados
        </h3>
        <p className="text-sm text-muted-foreground">
          Campos e anexos enviados na abertura original do chamado.
        </p>
      </div>

      {!hasFields && !hasAttachments ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum campo nem anexo da submissão inicial foi exposto para esta solicitação.
        </div>
      ) : null}

      {submittedItems.length > 0 ? (
        <div className="rounded-md border">
          {submittedItems.map((item, index) =>
            item.kind === 'field' ? (
              <div
                key={item.key}
                className={[
                  'space-y-1 px-4 py-3',
                  index < submittedItems.length - 1 ? 'border-b' : '',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {item.value}
                </p>
              </div>
            ) : (
              <div
                key={item.key}
                className={[
                  'flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                  index < submittedItems.length - 1 ? 'border-b' : '',
                ].join(' ')}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.fileName}</p>
                </div>

                <Button asChild type="button" variant="outline" size="sm">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Ver anexo
                  </a>
                </Button>
              </div>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}
