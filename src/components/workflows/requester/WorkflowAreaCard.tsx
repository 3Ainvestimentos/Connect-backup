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
  const workflowCount = area.workflows.length;

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
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
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-none">{area.areaName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {workflowCount === 1
                ? '1 tipo de solicitacao'
                : `${workflowCount} tipos de solicitacao`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {area.workflows.slice(0, 3).map((wf) => (
            <span
              key={wf.workflowTypeId}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {wf.name}
            </span>
          ))}
          {area.workflows.length > 3 && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              +{area.workflows.length - 3} mais
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
