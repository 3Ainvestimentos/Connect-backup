'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RequestCollapsibleSectionProps = {
  title: string;
  description: string;
  defaultExpanded?: boolean;
  badge?: string;
  children: React.ReactNode;
  className?: string;
};

export function RequestCollapsibleSection({
  title,
  description,
  defaultExpanded = false,
  badge,
  children,
  className,
}: RequestCollapsibleSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  return (
    <section className={cn('rounded-xl border bg-background', className)}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {badge ? (
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Recolher' : 'Expandir'}
        </Button>
      </div>

      {expanded ? <div id={contentId} className="border-t px-4 pb-4 pt-4">{children}</div> : null}
    </section>
  );
}
