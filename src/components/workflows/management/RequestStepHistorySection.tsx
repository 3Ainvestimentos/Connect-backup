'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Accordion } from '@/components/ui/accordion';
import type { WorkflowManagementRequestDetailData } from '@/lib/workflows/management/types';
import { RequestProgress } from './RequestProgress';
import { RequestStepHistoryItem } from './RequestStepHistoryItem';
import { RequestTimeline } from './RequestTimeline';

type RequestStepHistorySectionProps = {
  stepsHistory?: WorkflowManagementRequestDetailData['stepsHistory'];
  progress: WorkflowManagementRequestDetailData['progress'];
  timeline: WorkflowManagementRequestDetailData['timeline'];
  hasLegacyFallback: boolean;
  hideHeader?: boolean;
};

function buildInitialExpandedStepIds(
  stepsHistory?: WorkflowManagementRequestDetailData['stepsHistory'],
): string[] {
  if (!stepsHistory || stepsHistory.length === 0) {
    return [];
  }

  const currentStepIds = stepsHistory.filter((step) => step.isCurrent).map((step) => step.stepId);
  return currentStepIds.length > 0 ? currentStepIds : [stepsHistory[0].stepId];
}

export function RequestStepHistorySection({
  stepsHistory,
  progress,
  timeline,
  hasLegacyFallback,
  hideHeader = false,
}: RequestStepHistorySectionProps) {
  const [expandedStepIds, setExpandedStepIds] = React.useState<string[]>(() =>
    buildInitialExpandedStepIds(stepsHistory),
  );

  React.useEffect(() => {
    setExpandedStepIds(buildInitialExpandedStepIds(stepsHistory));
  }, [stepsHistory]);

  return (
    <section className="space-y-4" aria-labelledby="request-step-history-title">
      {!hideHeader ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="request-step-history-title" className="text-sm font-semibold text-foreground">
              Histórico do chamado
            </h2>
            {hasLegacyFallback ? <Badge variant="outline">Compatibilidade temporária</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Histórico oficial por etapa do fluxo, com a etapa atual expandida por padrão.
          </p>
        </div>
      ) : (
        <h2 id="request-step-history-title" className="sr-only">
          Histórico do chamado
        </h2>
      )}

      {hasLegacyFallback ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            O detalhe ainda não trouxe <code>stepsHistory</code>; exibindo progresso e timeline
            legados dentro da zona oficial de histórico.
          </div>
          <RequestProgress progress={progress} />
          <RequestTimeline timeline={timeline} />
        </div>
      ) : stepsHistory && stepsHistory.length > 0 ? (
        <Accordion
          type="multiple"
          value={expandedStepIds}
          onValueChange={setExpandedStepIds}
          className="space-y-3"
        >
          {stepsHistory.map((step) => (
            <RequestStepHistoryItem key={step.stepId} step={step} />
          ))}
        </Accordion>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Nenhuma etapa oficial foi exposta pelo payload enriquecido.
        </div>
      )}
    </section>
  );
}
