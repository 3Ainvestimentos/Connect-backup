'use client';

import { Badge } from '@/components/ui/badge';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  formatManagementDate,
  getManagementProgressStateLabel,
  getManagementProgressStateVariant,
} from '@/lib/workflows/management/presentation';
import type { WorkflowManagementRequestStepHistoryItem } from '@/lib/workflows/management/types';

type RequestStepHistoryItemProps = {
  step: WorkflowManagementRequestStepHistoryItem;
};

function getStepKindLabel(kind: WorkflowManagementRequestStepHistoryItem['kind']) {
  if (kind === 'start') {
    return 'Início';
  }

  if (kind === 'final') {
    return 'Final';
  }

  return 'Operacional';
}

function getActionResponseLabel(status: WorkflowManagementRequestStepHistoryItem['actionResponses'][number]['status']) {
  switch (status) {
    case 'approved':
      return 'Aprovada';
    case 'rejected':
      return 'Rejeitada';
    case 'acknowledged':
      return 'Registrada';
    case 'executed':
      return 'Executada';
    default:
      return 'Pendente';
  }
}

export function RequestStepHistoryItem({ step }: RequestStepHistoryItemProps) {
  return (
    <AccordionItem value={step.stepId} className="rounded-xl border px-4 data-[state=open]:bg-muted/20">
      <AccordionTrigger className="gap-4 py-4 text-left hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              Etapa {step.order}: {step.stepName}
            </p>
            <Badge variant="outline">{getStepKindLabel(step.kind)}</Badge>
            <Badge variant={getManagementProgressStateVariant(step.state)}>
              {getManagementProgressStateLabel(step.state)}
            </Badge>
            {step.isCurrent ? <Badge variant="default">Etapa atual</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Eventos e respostas oficiais registrados nesta etapa do fluxo.
          </p>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-4">
        {step.events.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Eventos da etapa</p>
            {step.events.map((event, index) => (
              <div
                key={`${event.action}-${event.userId}-${index}`}
                className="rounded-lg border bg-background p-3"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-foreground">{event.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatManagementDate(event.timestamp)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.userName || event.userId || 'Sistema'}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {step.actionResponses.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Respostas de action</p>
            {step.actionResponses.map((response) => (
              <div key={response.actionRequestId} className="rounded-lg border bg-background p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {response.respondedByName || response.respondedByUserId || response.recipientUserId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {response.respondedAt
                        ? `Resposta registrada em ${formatManagementDate(response.respondedAt)}`
                        : 'Resposta ainda não registrada'}
                    </p>
                  </div>
                  <Badge variant="outline">{getActionResponseLabel(response.status)}</Badge>
                </div>

                {response.responseComment ? (
                  <p className="mt-3 text-sm text-muted-foreground">{response.responseComment}</p>
                ) : null}

                {response.responseAttachmentUrl ? (
                  <a
                    className="mt-3 inline-flex text-sm font-medium text-admin-primary underline-offset-4 hover:underline"
                    href={response.responseAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir anexo da resposta
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {step.events.length === 0 && step.actionResponses.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Esta etapa ainda não possui eventos nem respostas registradas.
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}
