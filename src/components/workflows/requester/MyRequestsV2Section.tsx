'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileClock, Inbox, Eye, Timer, AlertCircle } from 'lucide-react';
import { useRequesterUnifiedRequests } from '@/hooks/use-requester-unified-requests';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';

type MyRequestsV2SectionProps = {
  onSelectRequest: (item: RequesterUnifiedRequestListItem) => void;
};

export function MyRequestsV2Section({ onSelectRequest }: MyRequestsV2SectionProps) {
  const { items, status } = useRequesterUnifiedRequests();

  const header = (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileClock className="h-6 w-6" />
        Minhas Solicitacoes
      </CardTitle>
      <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
    </CardHeader>
  );

  if (status === 'loading') {
    return (
      <Card>
        {header}
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

  if (status === 'error') {
    return (
      <Card>
        {header}
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

  return (
    <Card>
      {header}
      <CardContent className="space-y-3">
        {status === 'partial' ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Algumas solicitacoes podem estar desatualizadas. Exibindo dados disponiveis.
            </AlertDescription>
          </Alert>
        ) : null}

        {items.length === 0 ? (
          <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma solicitacao encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.
            </p>
          </div>
        ) : (
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
                {items.map((item) => (
                  <TableRow key={item.detailKey}>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {item.displayRequestId}
                    </TableCell>
                    <TableCell className="font-medium">{item.workflowName}</TableCell>
                    <TableCell>
                      <Badge variant={item.statusVariant} className="font-semibold">
                        {item.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.expectedCompletionAt ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {item.expectedCompletionAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectRequest(item)}
                        aria-label={`Ver detalhes da solicitacao ${item.displayRequestId}`}
                        className="hover:bg-muted"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
