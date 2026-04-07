'use client';

import * as React from 'react';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import type {
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';

type RespondActionPayload = {
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
  comment?: string;
  attachmentFile?: File | null;
};

type RequestActionCardProps = {
  detail: WorkflowManagementRequestDetailData;
  collaborators: Collaborator[];
  onRequestAction: (summary: WorkflowManagementRequestSummary) => Promise<unknown>;
  onRespondAction: (
    summary: WorkflowManagementRequestSummary,
    payload: RespondActionPayload,
  ) => Promise<unknown>;
  isRequestingAction?: boolean;
  isRespondingAction?: boolean;
};

function resolveRecipientLabel(
  collaborators: Collaborator[],
  recipientUserId: string,
): string {
  return (
    collaborators.find((collaborator) => collaborator.id3a === recipientUserId)?.name ??
    recipientUserId
  );
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

export function RequestActionCard({
  detail,
  collaborators,
  onRequestAction,
  onRespondAction,
  isRequestingAction = false,
  isRespondingAction = false,
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

  const handleRequestAction = async () => {
    await onRequestAction(summary);
  };

  const handleRespondAction = async (response: RespondActionPayload['response']) => {
    await onRespondAction(summary, {
      response,
      ...(effectiveComment ? { comment: effectiveComment } : {}),
      ...(attachmentFile ? { attachmentFile } : {}),
    });
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {action.label || 'Action operacional'}
          </p>
          <p className="text-sm text-muted-foreground">
            {action.type
              ? `Tipo: ${action.type} • estado ${action.state === 'pending' ? 'pendente' : 'idle'}.`
              : 'A etapa atual pode abrir uma action operacional.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {action.type ? <Badge variant="outline">{action.type}</Badge> : null}
          {action.state === 'pending' ? <Badge variant="outline">Batch pendente</Badge> : null}
          {action.commentRequired ? <Badge variant="outline">Comentario obrigatorio</Badge> : null}
          {action.attachmentRequired ? <Badge variant="outline">Anexo obrigatorio</Badge> : null}
        </div>
      </div>

      {action.configurationError ? (
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
          {action.configurationError}
        </div>
      ) : null}

      {action.state === 'pending' ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
            Solicitada por {action.requestedByName || action.requestedByUserId || 'Sistema'} em{' '}
            {formatManagementDate(action.requestedAt)}.
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
                      {resolveRecipientLabel(collaborators, recipient.recipientUserId)}
                    </p>
                    <p className="text-muted-foreground">
                      {recipient.respondedByName || recipient.respondedByUserId
                        ? `Resposta de ${recipient.respondedByName || recipient.respondedByUserId}`
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
          Nenhum batch pendente nesta etapa.
        </div>
      )}

      {canRequest ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={handleRequestAction} disabled={isBusy}>
            {isRequestingAction ? 'Solicitando...' : `Solicitar ${action.label || 'action'}`}
          </Button>
        </div>
      ) : null}

      {canRespond ? (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Responder action</p>
            <p className="text-sm text-muted-foreground">
              Preencha somente o necessario para a action atual.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="management-action-comment">
              Comentario{action.commentRequired ? ' *' : ''}
            </Label>
            <Textarea
              id="management-action-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={action.commentPlaceholder || 'Adicionar contexto para a resposta'}
              disabled={isBusy}
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
              />
              <p className="text-xs text-muted-foreground">
                {action.attachmentPlaceholder || 'Envie a evidencia da execucao quando aplicavel.'}
              </p>
            </div>
          ) : null}

          {action.type === 'approval' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={approvalResponse === 'approved' ? 'default' : 'outline'}
                disabled={isBusy}
                onClick={() => setApprovalResponse('approved')}
              >
                Aprovar
              </Button>
              <Button
                type="button"
                variant={approvalResponse === 'rejected' ? 'default' : 'outline'}
                disabled={isBusy}
                onClick={() => setApprovalResponse('rejected')}
              >
                Rejeitar
              </Button>
              <Button
                type="button"
                disabled={
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
              disabled={isBusy || (action.commentRequired && effectiveComment === '')}
              onClick={() => handleRespondAction('acknowledged')}
            >
              {isRespondingAction ? 'Enviando...' : 'Registrar ciente'}
            </Button>
          ) : null}

          {action.type === 'execution' ? (
            <Button
              type="button"
              disabled={
                isBusy ||
                (action.commentRequired && effectiveComment === '') ||
                (action.attachmentRequired && attachmentFile == null)
              }
              onClick={() => handleRespondAction('executed')}
            >
              {isRespondingAction ? 'Enviando...' : 'Registrar execucao'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
