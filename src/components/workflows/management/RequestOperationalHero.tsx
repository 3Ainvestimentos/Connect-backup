'use client';

import { Button } from '@/components/ui/button';
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
  if (!viewModel.shouldRenderOperationalSummary) {
    return null;
  }

  return (
    <section aria-labelledby="request-operational-summary-title">
      <div className={cn('rounded-xl border p-4 shadow-sm', getToneClasses(viewModel.tone))}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Resumo operacional
              </p>
              <h3 id="request-operational-summary-title" className="text-base font-semibold text-foreground">
                {viewModel.title}
              </h3>
              <p className="text-sm text-muted-foreground">{viewModel.contextLine}</p>
            </div>

            {viewModel.informationalState ? (
              <div className="rounded-lg border bg-background/70 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{viewModel.informationalState.label}</p>
                <p className="text-muted-foreground">{viewModel.informationalState.value}</p>
              </div>
            ) : null}
          </div>

          {viewModel.primaryAction ? (
            <div className="flex flex-wrap justify-end gap-3 lg:justify-start">
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
        </div>
      </div>
    </section>
  );
}
