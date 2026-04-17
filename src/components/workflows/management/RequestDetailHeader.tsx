'use client';

import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { RequestDetailShellViewModel } from '@/lib/workflows/management/request-detail-view-model';

type RequestDetailHeaderProps = {
  header: RequestDetailShellViewModel['header'];
};

export function RequestDetailHeader({ header }: RequestDetailHeaderProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Cabecalho do chamado
      </p>
      <DialogTitle className="text-2xl">{header.title}</DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        {header.description}
      </DialogDescription>
    </div>
  );
}
