'use client';

import * as React from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { resolveOperationalIdentity } from '@/lib/workflows/management/request-identity';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';
import { cn } from '@/lib/utils';

type RespondActionPayload = {
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
  comment?: string;
  attachmentFile?: File | null;
};

type RequestActionCardProps = {
  detail: WorkflowManagementRequestDetailData;
  collaborators: Collaborator[];
  requestTargetRecipients?: string[];
  onRequestAction: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onRespondAction: (
    summary: WorkflowManagementRequestSummary,
    payload: RespondActionPayload,
  ) => Promise<unknown>;
  isRequestingAction?: boolean;
  isRespondingAction?: boolean;
  variant?: 'default' | 'primary';
};

function formatRecipientList(recipients: string[]): string {
  if (recipients.length === 0) {
    return '';
  }

  if (recipients.length === 1) {
    return recipients[0];
  }

  if (recipients.length === 2) {
    return `${recipients[0]} e ${recipients[1]}`;
  }

  return `${recipients.slice(0, -1).join(', ')} e ${recipients[recipients.length - 1]}`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovada';
    case 'rejected':
      return 'Rejeitada';
    case 'acknowledged':
      return 'Registrada';
    case 'executed':
      return 'Executada';
    default:
      return status;
  }
}

function getActionStateLabel(state: WorkflowManagementRequestDetailData['action']['state']): string {
  switch (state) {
    case 'pending':
      return 'pendente';
    case 'completed':
      return 'concluída';
    default:
      return 'disponível';
  }
}

function getActionTypeLabel(type: WorkflowManagementRequestDetailData['action']['type']): string | null {
  switch (type) {
    case 'approval':
      return 'Aprovação';
    case 'acknowledgement':
      return 'Ciência';
    case 'execution':
      return 'Execução';
    default:
      return null;
  }
}

export function RequestActionCard({
  detail,
  collaborators,
  requestTargetRecipients = [],
  onRequestAction,
  onRespondAction,
  isRequestingAction = false,
  isRespondingAction = false,
  variant = 'default',
}: RequestActionCardProps) {
  const { summary, action } = detail;
  const [comment, setComment] = React.useState('');
  const [approvalResponse, setApprovalResponse] = React.useState<'approved' | 'rejected'>('approved');
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setComment('');
    setApprovalResponse('approved');
    setAttachmentFile(null);
  }, [summary.requestId, action.state, action.type]);

  if (!action.available && !action.configurationError) {
    return null;
  }

  const isBusy = isRequestingAction || isRespondingAction;
  const canRequest = detail.permissions.canRequestAction && action.canRequest;
  const canRespond = detail.permissions.canRespondAction && action.canRespond;
  const effectiveComment = comment.trim();
  const actionTypeLabel = getActionTypeLabel(action.type);

  const handleRequestAction = async () => {
    try {
      await onRequestAction(summary);
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  const handleRespondAction = async (response: RespondActionPayload['response']) => {
    try {
      await onRespondAction(summary, {
        response,
        ...(effectiveComment ? { comment: effectiveComment } : {}),
        ...(attachmentFile ? { attachmentFile } : {}),
      });
    } catch {
      // The page-level handler already emits the destructive toast.
    }
  };

  return (
    <div
      data-variant={variant}
      className={cn(
        'rounded-lg border p-4',
        variant === 'primary' ? 'border-admin-primary/25 bg-admin-primary/5 shadow-sm' : 'bg-background',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {action.label || 'Action operacional'}
          </p>
          <p className="text-sm text-muted-foreground">
            {actionTypeLabel
              ? `Tipo: ${actionTypeLabel} • estado ${getActionStateLabel(action.state)}.`
              : 'A etapa atual pode abrir uma action operacional.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actionTypeLabel ? <Badge variant="outline">{actionTypeLabel}</Badge> : null}
          {action.attachmentRequired ? <Badge variant="outline">Anexo obrigatório</Badge> : null}
        </div>
      </div>

      {action.configurationError ? (
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
          {action.configurationError}
        </div>
      ) : null}

      {action.state === 'pending' || action.state === 'completed' ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
            Solicitada por{' '}
            {
              resolveOperationalIdentity({
                collaborators,
                userId: action.requestedByUserId,
                fallbackName: action.requestedByName,
              }).displayLabel
            }{' '}
            em{' '}
            {formatManagementDate(action.requestedAt)}
            {action.state === 'completed' && action.completedAt
              ? `. Concluída em ${formatManagementDate(action.completedAt)}.`
              : '.'}
          </div>

          <div className="space-y-2">
            {action.recipients.map((recipient) => (
              <div
                key={recipient.actionRequestId}
                className="rounded-md border bg-background p-3 text-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {
                        resolveOperationalIdentity({
                          collaborators,
                          userId: recipient.recipientUserId,
                        }).displayLabel
                      }
                    </p>
                    <p className="text-muted-foreground">
                      {recipient.respondedByName || recipient.respondedByUserId
                        ? `Resposta de ${
                            resolveOperationalIdentity({
                              collaborators,
                              userId: recipient.respondedByUserId,
                              fallbackName: recipient.respondedByName,
                            }).displayLabel
                          }`
                        : 'Sem resposta registrada'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{getStatusLabel(recipient.status)}</Badge>
                    {recipient.respondedAt ? (
                      <Badge variant="outline">{formatManagementDate(recipient.respondedAt)}</Badge>
                    ) : null}
                  </div>
                </div>

                {recipient.responseComment ? (
                  <p className="mt-2 text-muted-foreground">{recipient.responseComment}</p>
                ) : null}

                {recipient.responseAttachmentUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-medium text-admin-primary underline-offset-4 hover:underline"
                    href={recipient.responseAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir anexo da resposta
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhuma action aberta nesta etapa.
        </div>
      )}

      {canRequest ? (
        <div className="mt-4 space-y-3">
          {requestTargetRecipients.length > 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
              {requestTargetRecipients.length === 1
                ? `A solicitação será enviada para ${requestTargetRecipients[0]}.`
                : `A solicitação será enviada para ${formatRecipientList(requestTargetRecipients)}.`}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              className={variant === 'primary' ? 'bg-admin-primary hover:bg-admin-primary/90' : undefined}
              onClick={handleRequestAction}
              disabled={isBusy}
              aria-disabled={isBusy}
            >
              {isRequestingAction ? 'Solicitando...' : `Solicitar ${action.label || 'action'}`}
            </Button>
          </div>
        </div>
      ) : null}

      {canRespond ? (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Responder ação</p>
            <p className="text-sm text-muted-foreground">
              Preencha apenas o necessário para a action atual.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="management-action-comment">
              Comentário{action.commentRequired ? ' *' : ''}
            </Label>
            <Textarea
              id="management-action-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={action.commentPlaceholder || 'Adicionar contexto para a resposta'}
              disabled={isBusy}
              aria-disabled={isBusy}
            />
          </div>

          {action.type === 'execution' ? (
            <div className="space-y-2">
              <Label htmlFor="management-action-attachment">
                Anexo{action.attachmentRequired ? ' *' : ''}
              </Label>
              <Input
                id="management-action-attachment"
                type="file"
                onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                disabled={isBusy}
                aria-disabled={isBusy}
              />
              <p className="text-xs text-muted-foreground">
                {action.attachmentPlaceholder || 'Envie a evidência da execução quando aplicável.'}
              </p>
            </div>
          ) : null}

          {action.type === 'approval' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={approvalResponse === 'approved' ? 'default' : 'outline'}
                disabled={isBusy}
                aria-disabled={isBusy}
                onClick={() => setApprovalResponse('approved')}
              >
                Aprovar
              </Button>
              <Button
                type="button"
                variant={approvalResponse === 'rejected' ? 'default' : 'outline'}
                disabled={isBusy}
                aria-disabled={isBusy}
                onClick={() => setApprovalResponse('rejected')}
              >
                Rejeitar
              </Button>
              <Button
                type="button"
                className={variant === 'primary' ? 'bg-admin-primary hover:bg-admin-primary/90' : undefined}
                disabled={
                  isBusy ||
                  (action.commentRequired && effectiveComment === '')
                }
                aria-disabled={
                  isBusy ||
                  (action.commentRequired && effectiveComment === '')
                }
                onClick={() => handleRespondAction(approvalResponse)}
              >
                {isRespondingAction ? 'Enviando...' : 'Registrar resposta'}
              </Button>
            </div>
          ) : null}

          {action.type === 'acknowledgement' ? (
            <Button
              type="button"
              className={variant === 'primary' ? 'bg-admin-primary hover:bg-admin-primary/90' : undefined}
              disabled={isBusy || (action.commentRequired && effectiveComment === '')}
              aria-disabled={isBusy || (action.commentRequired && effectiveComment === '')}
              onClick={() => handleRespondAction('acknowledged')}
            >
              {isRespondingAction ? 'Enviando...' : 'Registrar ciente'}
            </Button>
          ) : null}

          {action.type === 'execution' ? (
            <Button
              type="button"
              className={variant === 'primary' ? 'bg-admin-primary hover:bg-admin-primary/90' : undefined}
              disabled={
                isBusy ||
                (action.commentRequired && effectiveComment === '') ||
                (action.attachmentRequired && attachmentFile == null)
              }
              aria-disabled={
                isBusy ||
                (action.commentRequired && effectiveComment === '') ||
                (action.attachmentRequired && attachmentFile == null)
              }
              onClick={() => handleRespondAction('executed')}
            >
              {isRespondingAction ? 'Enviando...' : 'Registrar execução'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
