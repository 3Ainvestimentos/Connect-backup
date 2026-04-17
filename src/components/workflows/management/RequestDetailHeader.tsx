'use client';

import { Badge } from '@/components/ui/badge';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { RequestDetailShellViewModel } from '@/lib/workflows/management/request-detail-view-model';

type RequestDetailHeaderProps = {
  header: RequestDetailShellViewModel['header'];
};

export function RequestDetailHeader({ header }: RequestDetailHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Cabecalho do chamado
        </p>
        <DialogTitle className="text-2xl">{header.title}</DialogTitle>
        <p className="text-sm font-medium text-foreground/80">{header.subtitle}</p>
        <DialogDescription className="text-sm text-muted-foreground">
          {header.description}
        </DialogDescription>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {header.badges.map((badge) => (
          <Badge key={`${badge.label}-${badge.variant ?? 'default'}`} variant={badge.variant}>
            {badge.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
