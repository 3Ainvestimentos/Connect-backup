"use client";

import { AlertTriangle, Loader2, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorkflowDraftReadiness } from './types';

export function WorkflowDraftReadinessPanel({
  issues,
  canPublish,
  isPublishing,
  hasUnsavedChanges,
  onPublish,
  readOnly = false,
}: {
  issues: WorkflowDraftReadiness;
  canPublish: boolean;
  isPublishing: boolean;
  hasUnsavedChanges: boolean;
  onPublish: () => void;
  readOnly?: boolean;
}) {
  const blockingIssues = issues.filter((issue) => issue.severity === 'blocking');
  const warnings = issues.filter((issue) => issue.severity !== 'blocking');

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Pendencias para publicar</CardTitle>
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? 'Esta versao esta publicada e disponivel apenas para consulta neste editor.'
              : blockingIssues.length > 0
              ? 'Resolva os bloqueios abaixo antes de publicar esta versao.'
              : hasUnsavedChanges
                ? 'Salve o rascunho atual antes de publicar esta versao.'
                : 'A versao esta pronta para publicacao.'}
          </p>
        </div>
        <Button type="button" onClick={onPublish} disabled={readOnly || !canPublish || isPublishing || hasUnsavedChanges}>
          {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Publicar versao
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma pendencia encontrada no momento.
          </p>
        ) : null}

        {blockingIssues.map((issue) => (
          <div key={`${issue.code}-${issue.path || 'root'}`} className="flex gap-3 rounded-lg border p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-red-500" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{issue.category}</Badge>
                <Badge variant="destructive">{issue.severity}</Badge>
              </div>
              <p className="text-sm">{issue.message}</p>
              {issue.path ? <p className="text-xs text-muted-foreground">path={issue.path}</p> : null}
            </div>
          </div>
        ))}

        {warnings.map((issue) => (
          <div key={`${issue.code}-${issue.path || 'root'}-warning`} className="flex gap-3 rounded-lg border p-3">
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
