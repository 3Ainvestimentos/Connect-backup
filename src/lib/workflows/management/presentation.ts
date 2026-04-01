import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BadgeProps } from '@/components/ui/badge';
import { MANAGEMENT_CURRENT_FILTER_LABELS, MANAGEMENT_SLA_LABELS } from './constants';
import type {
  ManagementCurrentQueueFilter,
  ManagementSlaState,
  WorkflowManagementRequestSummary,
} from './types';

type RequestPresentation = {
  label: string;
  badgeVariant: BadgeProps['variant'];
};

export function formatManagementDate(date: Date | null, fallback = '-'): string {
  if (!date) {
    return fallback;
  }

  return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatManagementMonthKey(monthKey: string): string {
  if (!monthKey || monthKey === 'unknown') {
    return 'Sem referencia mensal';
  }

  const parsed = parse(monthKey, 'yyyy-MM', new Date());
  if (Number.isNaN(parsed.getTime())) {
    return monthKey;
  }

  return format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
}

export function getManagementCurrentFilterLabel(filter: ManagementCurrentQueueFilter): string {
  return MANAGEMENT_CURRENT_FILTER_LABELS[filter];
}

export function getManagementSlaLabel(slaState?: ManagementSlaState): string | null {
  if (!slaState) {
    return null;
  }

  return MANAGEMENT_SLA_LABELS[slaState];
}

export function getManagementSlaBadgeVariant(
  slaState?: ManagementSlaState,
): BadgeProps['variant'] {
  if (slaState === 'overdue') {
    return 'destructive';
  }

  if (slaState === 'at_risk') {
    return 'outline';
  }

  return 'secondary';
}

export function deriveManagementRequestPresentation(
  item: WorkflowManagementRequestSummary,
): RequestPresentation {
  if (item.statusCategory === 'archived') {
    return {
      label: 'Arquivado',
      badgeVariant: 'outline',
    };
  }

  if (item.statusCategory === 'finalized') {
    return {
      label: 'Concluido',
      badgeVariant: 'secondary',
    };
  }

  if (item.statusCategory === 'waiting_action') {
    return {
      label: 'Aguardando acao',
      badgeVariant: 'outline',
    };
  }

  if (item.statusCategory === 'open' && !item.hasResponsible) {
    return {
      label: 'Aguardando atribuicao',
      badgeVariant: 'destructive',
    };
  }

  return {
    label: 'Em andamento',
    badgeVariant: 'default',
  };
}
