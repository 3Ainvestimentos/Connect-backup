import type {
  ManagementAssignmentsSubtabDefinition,
  ManagementAssignmentsSubtab,
  ManagementCurrentQueueFilter,
  ManagementSlaState,
  ManagementTabDefinition,
  ManagementTabId,
} from './types';

export const WORKFLOW_MANAGEMENT_ROUTE = '/gestao-de-chamados';
export const WORKFLOW_MANAGEMENT_TITLE = 'Gestao de chamados';
export const WORKFLOW_MANAGEMENT_DESCRIPTION =
  'Painel oficial da operacao para acompanhar chamados atuais, atribuicoes em andamento e historico concluido no mesmo fluxo.';

export const MANAGEMENT_DEFAULT_TAB: ManagementTabId = 'assignments';
export const MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB: ManagementAssignmentsSubtab = 'assigned';
export const MANAGEMENT_DEFAULT_CURRENT_FILTER: ManagementCurrentQueueFilter = 'all';

export const MANAGEMENT_TAB_DEFINITIONS: readonly ManagementTabDefinition[] = [
  {
    tab: 'current',
    title: 'Chamados atuais',
    description: 'Fila do owner governada por ownership explicito.',
  },
  {
    tab: 'assignments',
    title: 'Atribuicoes e acoes',
    description: 'Separacao explicita entre atribuicoes e acoes pendentes.',
  },
  {
    tab: 'completed',
    title: 'Concluidas',
    description: 'Historico operacional agrupado por fechamento.',
  },
];

export const MANAGEMENT_ASSIGNMENTS_SUBTAB_DEFINITIONS: readonly ManagementAssignmentsSubtabDefinition[] =
  [
    {
      tab: 'assigned',
      title: 'Atribuidos a mim',
    },
    {
      tab: 'pending',
      title: 'Acoes pendentes para mim',
    },
  ];

export const MANAGEMENT_CURRENT_FILTER_LABELS: Record<ManagementCurrentQueueFilter, string> = {
  all: 'Todos',
  waiting_assignment: 'Aguardando atribuicao',
  in_progress: 'Em andamento',
  waiting_action: 'Aguardando acao',
};

export const MANAGEMENT_SLA_LABELS: Record<ManagementSlaState, string> = {
  on_track: 'No prazo',
  at_risk: 'Em risco',
  overdue: 'Em atraso',
};
