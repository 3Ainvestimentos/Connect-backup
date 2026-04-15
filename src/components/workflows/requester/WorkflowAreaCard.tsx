'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getIcon } from '@/lib/icons';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';

type WorkflowAreaCardProps = {
  area: RequesterCatalogArea;
  onClick: () => void;
};

export function WorkflowAreaCard({ area, onClick }: WorkflowAreaCardProps) {
  const Icon = getIcon(area.areaIcon || 'FolderOpen');

  return (
    <Card
      className="flex h-32 w-48 cursor-pointer items-center justify-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
        <Icon className="mb-2 h-7 w-7 text-muted-foreground" />
        <h3 className="font-body text-sm font-semibold text-card-foreground">{area.areaName}</h3>
      </CardContent>
    </Card>
  );
}
