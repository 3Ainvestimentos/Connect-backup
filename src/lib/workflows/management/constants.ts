import type {
  ManagementAssignmentsSubtabDefinition,
  ManagementAssignmentsSubtab,
  ManagementCurrentQueueFilter,
  ManagementSlaState,
  ManagementTabDefinition,
  ManagementTabId,
} from './types';

export const WORKFLOW_MANAGEMENT_ROUTE = '/gestao-de-chamados';
export const WORKFLOW_MANAGEMENT_TITLE = 'Gestão de chamados';
export const WORKFLOW_MANAGEMENT_DESCRIPTION =
  'Painel oficial da operação para acompanhar chamados atuais, atribuições em andamento e histórico concluído no mesmo fluxo.';

export const MANAGEMENT_DEFAULT_TAB: ManagementTabId = 'assignments';
export const MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB: ManagementAssignmentsSubtab = 'assigned';
export const MANAGEMENT_DEFAULT_CURRENT_FILTER: ManagementCurrentQueueFilter = 'all';

export const MANAGEMENT_TAB_DEFINITIONS: readonly ManagementTabDefinition[] = [
  {
    tab: 'current',
    title: 'Chamados atuais',
    description: 'Fila do owner governada por ownership explícito.',
  },
  {
    tab: 'assignments',
    title: 'Atribuições e ações',
    description: 'Separação explícita entre atribuições e ações pendentes.',
  },
  {
    tab: 'completed',
    title: 'Concluídas',
    description: 'Histórico operacional agrupado por fechamento.',
  },
];

export const MANAGEMENT_ASSIGNMENTS_SUBTAB_DEFINITIONS: readonly ManagementAssignmentsSubtabDefinition[] =
  [
    {
      tab: 'assigned',
      title: 'Atribuídos a mim',
    },
    {
      tab: 'pending',
      title: 'Ações pendentes para mim',
    },
  ];

export const MANAGEMENT_CURRENT_FILTER_LABELS: Record<ManagementCurrentQueueFilter, string> = {
  all: 'Todos',
  waiting_assignment: 'Aguardando atribuição',
  in_progress: 'Em andamento',
  waiting_action: 'Aguardando ação',
};

export const MANAGEMENT_SLA_LABELS: Record<ManagementSlaState, string> = {
  on_track: 'No prazo',
  at_risk: 'Em risco',
  overdue: 'Em atraso',
};
