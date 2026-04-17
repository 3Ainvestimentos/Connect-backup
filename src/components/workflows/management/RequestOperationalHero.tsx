'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  deriveManagementRequestPresentation,
  getManagementSlaBadgeVariant,
  getManagementSlaLabel,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';
import type { RequestOperationalViewModel } from '@/lib/workflows/management/request-detail-view-model';
import { cn } from '@/lib/utils';

type RequestOperationalHeroProps = {
  detail: WorkflowManagementRequestDetailData;
  viewModel: RequestOperationalViewModel;
  onAdvance: () => Promise<unknown>;
  onFinalize: () => Promise<unknown>;
  isAdvancing?: boolean;
  isFinalizing?: boolean;
};

function getToneClasses(tone: RequestOperationalViewModel['tone']) {
  switch (tone) {
    case 'respond-action':
      return 'border-admin-primary/30 bg-admin-primary/5';
    case 'ready-to-advance':
      return 'border-emerald-500/30 bg-emerald-500/5';
    case 'ready-to-finalize':
      return 'border-sky-500/30 bg-sky-500/5';
    case 'request-action':
      return 'border-amber-500/30 bg-amber-500/5';
    default:
      return 'border-border bg-muted/20';
  }
}

export function RequestOperationalHero({
  detail,
  viewModel,
  onAdvance,
  onFinalize,
  isAdvancing = false,
  isFinalizing = false,
}: RequestOperationalHeroProps) {
  const presentation = deriveManagementRequestPresentation(detail.summary);
  const slaLabel = getManagementSlaLabel(detail.summary.slaState);

  return (
    <section aria-labelledby="request-operational-hero-title">
      <Card className={cn('rounded-xl border shadow-sm', getToneClasses(viewModel.tone))}>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={presentation.badgeVariant}>{presentation.label}</Badge>
            <Badge variant="outline">{detail.summary.currentStepName}</Badge>
            {viewModel.highlightLabel ? <Badge variant="outline">{viewModel.highlightLabel}</Badge> : null}
            {slaLabel ? (
              <Badge variant={getManagementSlaBadgeVariant(detail.summary.slaState)}>
                SLA: {slaLabel}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Estado atual e proximo passo
            </p>
            <CardTitle id="request-operational-hero-title" className="text-xl">
              {viewModel.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{viewModel.description}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Solicitante
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {detail.summary.requesterName || '-'}
              </p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Responsavel atual
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {detail.summary.responsibleName || 'Nao atribuido'}
              </p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workflow
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {detail.summary.workflowName || detail.summary.workflowTypeId}
              </p>
            </div>
          </div>

          {viewModel.primaryAction ? (
            <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
              {viewModel.primaryAction.kind === 'advance' ? (
                <Button type="button" onClick={onAdvance} disabled={isAdvancing}>
                  {isAdvancing ? 'Avancando...' : viewModel.primaryAction.label}
                </Button>
              ) : null}
              {viewModel.primaryAction.kind === 'finalize' ? (
                <Button type="button" onClick={onFinalize} disabled={isFinalizing}>
                  {isFinalizing ? 'Finalizando...' : viewModel.primaryAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
