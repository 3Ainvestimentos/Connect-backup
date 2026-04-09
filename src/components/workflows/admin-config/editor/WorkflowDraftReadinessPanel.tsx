"use client";

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkflowDraftReadiness } from './types';

export function WorkflowDraftReadinessPanel({ issues }: { issues: WorkflowDraftReadiness }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendencias para publicar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma pendencia informativa encontrada no momento.
          </p>
        ) : null}

        {issues.map((issue) => (
          <div key={`${issue.code}-${issue.path || 'root'}`} className="flex gap-3 rounded-lg border p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{issue.category}</Badge>
                <Badge variant="secondary">{issue.severity}</Badge>
              </div>
              <p className="text-sm">{issue.message}</p>
              {issue.path ? <p className="text-xs text-muted-foreground">path={issue.path}</p> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
