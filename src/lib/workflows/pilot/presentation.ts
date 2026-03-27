import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  PilotCurrentQueueFilter,
  PilotRequestPresentation,
  PilotRequestSummary,
} from './types';

export function derivePilotRequestPresentation(
  item: PilotRequestSummary,
  actorUserId: string,
): PilotRequestPresentation {
  const isOwner = item.ownerUserId === actorUserId;

  if (item.statusCategory === 'archived') {
    return {
      situationKey: 'archived',
      label: 'Arquivado',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: false,
      canArchive: false,
    };
  }

  if (item.statusCategory === 'finalized') {
    return {
      situationKey: 'finalized',
      label: 'Concluido',
      badgeVariant: 'secondary',
      canAssign: false,
      canFinalize: false,
      canArchive: isOwner,
    };
  }

  if (item.statusCategory === 'waiting_action') {
    return {
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: false,
      canArchive: false,
    };
  }

  if (item.statusCategory === 'open' && !item.hasResponsible) {
    return {
      situationKey: 'awaiting_assignment',
      label: 'Aguardando atribuicao',
      badgeVariant: 'destructive',
      canAssign: isOwner,
      canFinalize: false,
      canArchive: false,
    };
  }

  return {
    situationKey: 'in_progress',
    label: 'Em andamento',
    badgeVariant: 'default',
    canAssign: isOwner,
    canFinalize:
      item.statusCategory === 'in_progress' &&
      (isOwner || item.responsibleUserId === actorUserId),
    canArchive: false,
  };
}

export function getPilotCurrentFilterLabel(filter: PilotCurrentQueueFilter): string {
  switch (filter) {
    case 'waiting_assignment':
      return 'Aguardando atribuicao';
    case 'in_progress':
      return 'Em andamento';
    case 'waiting_action':
      return 'Aguardando acao';
    case 'all':
    default:
      return 'Todos';
  }
}

export function formatPilotDate(date: Date | null, fallback = '-'): string {
  if (!date) {
    return fallback;
  }

  return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatPilotMonthKey(monthKey: string): string {
  if (!monthKey || monthKey === 'unknown') {
    return 'Sem referencia mensal';
  }

  const parsed = parse(monthKey, 'yyyy-MM', new Date());
  if (Number.isNaN(parsed.getTime())) {
    return monthKey;
  }

  return format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
}
