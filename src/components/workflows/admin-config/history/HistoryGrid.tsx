'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminHistoryListData, AdminHistoryOrigin } from '@/lib/workflows/admin-config/types';

type HistoryGridProps = {
  items: AdminHistoryListData['items'];
  totalVisible: number;
  emptyStateTitle: string;
  emptyStateDescription: string;
  onOpenDetail: (origin: AdminHistoryOrigin, requestKey: string) => void;
};

function formatHistoryDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function HistoryGrid({
  items,
  totalVisible,
  emptyStateTitle,
  emptyStateDescription,
  onOpenDetail,
}: HistoryGridProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-base font-semibold">{emptyStateTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{emptyStateDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{totalVisible} item(ns) visivel(is) para os filtros atuais.</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Chamado</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Detalhe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.origin}:${item.requestKey}`}>
                <TableCell>
                  <Badge variant={item.origin === 'v2' ? 'default' : 'outline'}>
                    {item.origin === 'v2' ? 'V2' : 'Legado'}
                  </Badge>
                </TableCell>
                <TableCell>{item.requestIdLabel}</TableCell>
                <TableCell>{item.areaLabel}</TableCell>
                <TableCell>{item.workflowLabel}</TableCell>
                <TableCell>{item.statusLabel}</TableCell>
                <TableCell>{item.ownerLabel}</TableCell>
                <TableCell>{item.requesterLabel}</TableCell>
                <TableCell>{item.responsibleLabel || 'Nao atribuido'}</TableCell>
                <TableCell>{formatHistoryDate(item.periodReferenceAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDetail(item.origin, item.requestKey)}
                  >
                    Ver detalhe
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
