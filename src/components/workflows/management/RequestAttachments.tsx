'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFileNameFromUrl } from '@/lib/files/get-file-name-from-url';
import type { WorkflowManagementRequestAttachment } from '@/lib/workflows/management/types';

type RequestAttachmentsProps = {
  attachments: WorkflowManagementRequestAttachment[];
  showDownloadAction?: boolean;
};

export function RequestAttachments({
  attachments,
  showDownloadAction = false,
}: RequestAttachmentsProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Anexos</CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum anexo oficial associado a este chamado.
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.fieldId}
                className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{attachment.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFileNameFromUrl(attachment.url)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm">
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      {showDownloadAction ? 'Ver anexo' : 'Abrir anexo'}
                    </a>
                  </Button>
                  {showDownloadAction ? (
                    <Button asChild type="button" variant="outline" size="sm">
                      <a href={attachment.url} download>
                        Baixar anexo
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
