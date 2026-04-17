'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RequestOperationalViewModel } from '@/lib/workflows/management/request-detail-view-model';
import { cn } from '@/lib/utils';

type RequestOperationalHeroProps = {
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
  viewModel,
  onAdvance,
  onFinalize,
  isAdvancing = false,
  isFinalizing = false,
}: RequestOperationalHeroProps) {
  return (
    <section aria-labelledby="request-operational-hero-title">
      <Card className={cn('rounded-xl border shadow-sm', getToneClasses(viewModel.tone))}>
        <CardHeader className="space-y-1">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Estado atual e proximo passo
            </p>
            <CardTitle id="request-operational-hero-title" className="text-xl">
              {viewModel.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{viewModel.description}</p>
            {viewModel.statusNote ? (
              <p className="text-sm font-medium text-foreground/80">{viewModel.statusNote}</p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {viewModel.primaryAction ? (
            <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
              {viewModel.primaryAction.kind === 'advance' ? (
                <Button
                  type="button"
                  className="bg-admin-primary hover:bg-admin-primary/90"
                  onClick={onAdvance}
                  disabled={isAdvancing}
                  aria-disabled={isAdvancing}
                >
                  {isAdvancing ? viewModel.primaryAction.busyLabel : viewModel.primaryAction.label}
                </Button>
              ) : null}
              {viewModel.primaryAction.kind === 'finalize' ? (
                <Button
                  type="button"
                  className="bg-admin-primary hover:bg-admin-primary/90"
                  onClick={onFinalize}
                  disabled={isFinalizing}
                  aria-disabled={isFinalizing}
                >
                  {isFinalizing ? viewModel.primaryAction.busyLabel : viewModel.primaryAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
