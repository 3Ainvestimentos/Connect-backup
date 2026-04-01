import type { ManagementShellPlaceholderContent, ManagementShellTabId } from './types';

export const WORKFLOW_MANAGEMENT_ROUTE = '/gestao-de-chamados';
export const WORKFLOW_MANAGEMENT_TITLE = 'Gestao de chamados';
export const WORKFLOW_MANAGEMENT_DESCRIPTION =
  'Nova central oficial da operacao, entregue de forma incremental a partir da Fase 2A.';
export const WORKFLOW_MANAGEMENT_TRANSITION_TITLE = 'Transicao da superficie operacional';
export const WORKFLOW_MANAGEMENT_TRANSITION_DESCRIPTION =
  'A rota oficial ja esta disponivel. Os atalhos legados seguem operacionais enquanto bootstrap, listas oficiais e detalhe rico chegam nas proximas subetapas.';
export const MANAGEMENT_PLACEHOLDER_DISCLAIMER =
  'Sem dados reais nesta etapa: este shell nao simula lista vazia, contadores ou detalhe operacional.';

export const MANAGEMENT_DEFAULT_TAB: ManagementShellTabId = 'current';

export const MANAGEMENT_SHELL_TABS: readonly ManagementShellPlaceholderContent[] = [
  {
    tab: 'current',
    title: 'Chamados atuais',
    description: 'Ownership explicito, bootstrap e fila oficial entram na 2A.2.',
    nextStepLabel: 'Proxima entrega: bootstrap e lista do owner.',
  },
  {
    tab: 'assignments',
    title: 'Atribuicoes e acoes',
    description: 'As listas oficiais e a separacao por subtabs chegam na 2A.2.',
    nextStepLabel: 'Proxima entrega: atribuicoes e acoes pendentes oficiais.',
  },
  {
    tab: 'completed',
    title: 'Concluidas',
    description: 'O historico oficial sera conectado na 2A.2.',
    nextStepLabel: 'Proxima entrega: lista concluida oficial.',
  },
];
