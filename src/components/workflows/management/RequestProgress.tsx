'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getManagementProgressStateLabel,
  getManagementProgressStateVariant,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';

type RequestProgressProps = {
  progress: WorkflowManagementRequestDetailData['progress'];
};

export function RequestProgress({ progress }: RequestProgressProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Progresso</CardTitle>
        <p className="text-sm text-muted-foreground">
          {progress.completedSteps} de {progress.totalSteps} etapas concluidas.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress.items.map((item) => (
          <div
            key={item.stepId}
            className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{item.stepName}</p>
                {item.isCurrent ? <Badge variant="outline">Etapa atual</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Ordem {item.order} • status `{item.statusKey}`
              </p>
            </div>

            <Badge variant={getManagementProgressStateVariant(item.state)}>
              {getManagementProgressStateLabel(item.state)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
