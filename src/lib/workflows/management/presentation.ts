import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BadgeProps } from '@/components/ui/badge';
import { MANAGEMENT_CURRENT_FILTER_LABELS, MANAGEMENT_SLA_LABELS } from './constants';
import type {
  ManagementCurrentQueueFilter,
  ManagementSlaState,
  ManagementTabId,
  WorkflowManagementFilterOptions,
  WorkflowManagementMonthGroup,
  WorkflowManagementFilters,
  WorkflowManagementRequestDetailField,
  WorkflowManagementRequestProgressItem,
  WorkflowManagementRequestSummary,
} from './types';

type RequestPresentation = {
  label: string;
  badgeVariant: BadgeProps['variant'];
};

type ManagementEmptyStateCopyInput = {
  activeTab: ManagementTabId;
  hasActiveFilters: boolean;
  canViewTab: boolean;
};

type ManagementEmptyStateCopy = {
  title: string;
  description: string;
};

export type ManagementActiveFilterChip = {
  key: keyof WorkflowManagementFilters;
  label: string;
};

export function formatManagementDate(date: Date | null, fallback = '-'): string {
  if (!date) {
    return fallback;
  }

  return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatManagementShortDate(date: Date | null, fallback = '-'): string {
  if (!date) {
    return fallback;
  }

  return format(date, 'dd/MM/yyyy', { locale: ptBR });
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

function parseManagementDateOnly(value: string): Date | null {
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getManagementMonthSortValue(monthKey: string): number | null {
  if (!monthKey || monthKey === 'unknown') {
    return null;
  }

  const parsed = parse(monthKey, 'yyyy-MM', new Date());
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getTime();
}

export function hasManagementActiveFilters(
  filters: WorkflowManagementFilters,
): boolean {
  return Boolean(
    filters.requestId ||
      filters.workflowTypeId ||
      filters.areaId ||
      filters.requesterQuery ||
      filters.slaState ||
      filters.periodFrom ||
      filters.periodTo,
  );
}

export function getManagementActiveFilterChips(
  filters: WorkflowManagementFilters,
  filterOptions?: WorkflowManagementFilterOptions,
): ManagementActiveFilterChip[] {
  const workflowLabel = filters.workflowTypeId
    ? filterOptions?.workflows.find(
        (workflow) => workflow.workflowTypeId === filters.workflowTypeId,
      )?.workflowName ?? filters.workflowTypeId
    : null;
  const areaLabel = filters.areaId
    ? filterOptions?.areas.find((area) => area.areaId === filters.areaId)?.label ?? filters.areaId
    : null;
  const periodFrom = filters.periodFrom
    ? formatManagementShortDate(
        parseManagementDateOnly(filters.periodFrom),
        filters.periodFrom,
      )
    : null;
  const periodTo = filters.periodTo
    ? formatManagementShortDate(parseManagementDateOnly(filters.periodTo), filters.periodTo)
    : null;

  return [
    filters.requestId
      ? { key: 'requestId', label: `Chamado: #${filters.requestId}` }
      : null,
    filters.requesterQuery
      ? { key: 'requesterQuery', label: `Solicitante: ${filters.requesterQuery}` }
      : null,
    workflowLabel ? { key: 'workflowTypeId', label: `Workflow: ${workflowLabel}` } : null,
    areaLabel ? { key: 'areaId', label: `Area: ${areaLabel}` } : null,
    filters.slaState
      ? { key: 'slaState', label: `SLA: ${getManagementSlaLabel(filters.slaState)}` }
      : null,
    periodFrom ? { key: 'periodFrom', label: `De: ${periodFrom}` } : null,
    periodTo ? { key: 'periodTo', label: `Ate: ${periodTo}` } : null,
  ].filter((chip): chip is ManagementActiveFilterChip => chip !== null);
}

export function sortManagementMonthGroups(
  groups: WorkflowManagementMonthGroup[],
): WorkflowManagementMonthGroup[] {
  return [...groups].sort((left, right) => {
    const leftValue = getManagementMonthSortValue(left.monthKey);
    const rightValue = getManagementMonthSortValue(right.monthKey);

    if (leftValue !== null && rightValue !== null) {
      return rightValue - leftValue;
    }

    if (leftValue !== null) {
      return -1;
    }

    if (rightValue !== null) {
      return 1;
    }

    if (left.monthKey === 'unknown') {
      return 1;
    }

    if (right.monthKey === 'unknown') {
      return -1;
    }

    return left.monthKey.localeCompare(right.monthKey);
  });
}

export function getManagementEmptyStateCopy({
  activeTab,
  hasActiveFilters,
  canViewTab,
}: ManagementEmptyStateCopyInput): ManagementEmptyStateCopy {
  if (!canViewTab) {
    return {
      title: 'Aba indisponivel para este perfil',
      description:
        'Esta visao depende de ownership ou capability operacional que nao esta ativa para voce.',
    };
  }

  if (hasActiveFilters) {
    return {
      title: 'Nenhum resultado para os filtros aplicados',
      description: 'Ajuste ou limpe os filtros para ampliar a busca nesta visao.',
    };
  }

  if (activeTab === 'current') {
    return {
      title: 'Nenhum chamado na fila atual',
      description:
        'Quando surgirem itens neste escopo operacional, eles aparecerao aqui.',
    };
  }

  if (activeTab === 'completed') {
    return {
      title: 'Nenhum chamado concluido neste escopo',
      description:
        'Concluidos e arquivados aparecem aqui assim que houver historico dentro do seu recorte operacional.',
    };
  }

  return {
    title: 'Nenhuma atribuicao ou acao pendente',
    description:
      'Quando algum fluxo depender de voce ou for atribuido ao seu usuario, ele aparecera aqui.',
  };
}

export function getManagementTabErrorMessage(activeTab: ManagementTabId): string {
  if (activeTab === 'current') {
    return 'Falha ao carregar a fila atual.';
  }

  if (activeTab === 'completed') {
    return 'Falha ao carregar a lista de concluidas.';
  }

  return 'Falha ao carregar atribuicoes e acoes.';
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

export function getManagementProgressStateLabel(
  state: WorkflowManagementRequestProgressItem['state'],
): string {
  if (state === 'completed') {
    return 'Concluida';
  }

  if (state === 'active') {
    return 'Atual';
  }

  if (state === 'skipped') {
    return 'Ignorada';
  }

  return 'Pendente';
}

export function getManagementProgressStateVariant(
  state: WorkflowManagementRequestProgressItem['state'],
): BadgeProps['variant'] {
  if (state === 'completed') {
    return 'secondary';
  }

  if (state === 'active') {
    return 'default';
  }

  if (state === 'skipped') {
    return 'outline';
  }

  return 'outline';
}

export function formatManagementDetailValue(
  field: Pick<WorkflowManagementRequestDetailField, 'type' | 'value'>,
): string {
  const { type, value } = field;

  if (value == null) {
    return '-';
  }

  if (type === 'date' && typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : formatManagementShortDate(parsed, value);
  }

  if (type === 'date-range' && typeof value === 'object' && value !== null) {
    const from = 'from' in value && typeof value.from === 'string' ? value.from : null;
    const to = 'to' in value && typeof value.to === 'string' ? value.to : null;

    if (!from && !to) {
      return JSON.stringify(value);
    }

    const formattedFrom = from ? formatManagementShortDate(new Date(from), from) : '-';
    const formattedTo = to ? formatManagementShortDate(new Date(to), to) : '-';
    return `${formattedFrom} a ${formattedTo}`;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
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
