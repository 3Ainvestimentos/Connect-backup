'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileClock, Inbox, Eye, Timer } from 'lucide-react';
import { useMyRequests } from '@/hooks/use-requester-workflows';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import type { WorkflowReadSummary } from '@/lib/workflows/read/types';
import type { TimestampLike } from '@/lib/workflows/read/types';

type MyRequestsV2SectionProps = {
  onSelectRequest: (requestId: number) => void;
};

function formatExpectedCompletion(expectedCompletionAt: TimestampLike): string {
  const date = normalizeReadTimestamp(expectedCompletionAt);
  if (!date) return '-';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusPresentation(item: WorkflowReadSummary): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const fallbackLabel =
    item.statusCategory === 'archived'
      ? 'Arquivado'
      : item.statusCategory === 'finalized'
        ? 'Concluido'
        : item.statusCategory === 'waiting_action'
          ? 'Aguardando acao'
          : item.statusCategory === 'open' && !item.hasResponsible
            ? 'Aguardando atribuicao'
            : 'Em andamento';

  return {
    label: item.currentStepName?.trim() || fallbackLabel,
    variant:
      item.statusCategory === 'archived'
        ? 'outline'
        : item.statusCategory === 'finalized'
          ? 'secondary'
          : item.statusCategory === 'open' && !item.hasResponsible
            ? 'destructive'
            : 'default',
  };
}

export function MyRequestsV2Section({ onSelectRequest }: MyRequestsV2SectionProps) {
  const { data, isLoading, error } = useMyRequests();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock className="h-6 w-6" />
            Minhas Solicitacoes
          </CardTitle>
          <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock className="h-6 w-6" />
            Minhas Solicitacoes
          </CardTitle>
          <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Nao foi possivel carregar suas solicitacoes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock className="h-6 w-6" />
            Minhas Solicitacoes
          </CardTitle>
          <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma solicitacao encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileClock className="h-6 w-6" />
          Minhas Solicitacoes
        </CardTitle>
        <CardDescription>
          Acompanhe o status das suas solicitacoes aqui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Previsao de Conclusao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const status = getStatusPresentation(item);
                return (
                  <TableRow key={item.docId}>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {item.requestId}
                    </TableCell>
                    <TableCell className="font-medium">{item.workflowName}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="font-semibold">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.expectedCompletionAt ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {formatExpectedCompletion(item.expectedCompletionAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectRequest(item.requestId)}
                        aria-label={`Ver detalhes da solicitacao ${item.requestId}`}
                        className="hover:bg-muted"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
