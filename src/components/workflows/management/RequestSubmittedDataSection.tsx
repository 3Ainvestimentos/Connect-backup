'use client';

import { Button } from '@/components/ui/button';
import { formatManagementDetailValue } from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';

type RequestSubmittedDataSectionProps = {
  formData: WorkflowManagementRequestDetailData['formData'];
  attachments: WorkflowManagementRequestDetailData['attachments'];
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

      {hasFields ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Campos enviados</p>
          {formData.fields.map((field) => (
            <div key={field.fieldId} className="rounded-lg border bg-background p-3">
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

      {hasAttachments ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Anexos da abertura</p>
            <p className="text-sm text-muted-foreground">
              Estes anexos pertencem a submissao inicial, nao ao historico operacional da etapa.
            </p>
          </div>

          {attachments.map((attachment) => (
            <div
              key={attachment.fieldId}
              className="flex flex-col gap-3 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{attachment.label}</p>
                <p className="text-xs text-muted-foreground">
                  {getAttachmentFileName(attachment.url)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    Ver anexo
                  </a>
                </Button>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={attachment.url} download>
                    Baixar anexo
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
