'use client';

import { Button } from '@/components/ui/button';
import type { RequesterUnifiedRequestDetailAttachment } from '@/lib/workflows/requester/unified-types';

type RequesterRequestAttachmentsProps = {
  attachments: RequesterUnifiedRequestDetailAttachment[];
};

function getAttachmentFileName(url: string): string {
  const rawName = url.split('/').pop()?.split('?')[0] ?? 'Arquivo';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function RequesterRequestAttachments({
  attachments,
}: RequesterRequestAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Anexos</h3>
        <p className="text-sm text-muted-foreground">
          Arquivos enviados junto com a solicitação.
        </p>
      </div>

      <div className="rounded-md border">
        {attachments.map((attachment, index) => (
          <div
            key={`${attachment.fieldId}-${index}`}
            className={[
              'flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
              index < attachments.length - 1 ? 'border-b' : '',
            ].join(' ')}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{attachment.label}</p>
              <p className="text-xs text-muted-foreground">
                {getAttachmentFileName(attachment.url)}
              </p>
            </div>

            <Button asChild type="button" variant="outline" size="sm">
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                Abrir anexo
              </a>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
