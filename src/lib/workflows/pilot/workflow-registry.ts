export const FACILITIES_PILOT_WORKFLOWS = [
  {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    label: 'Manutencao e solicitacoes gerais',
    shortLabel: 'Manutencao geral',
    description: 'Chamados operacionais gerais de Facilities.',
    isDefault: true,
  },
  {
    workflowTypeId: 'facilities_solicitacao_suprimentos',
    label: 'Solicitacao de suprimentos',
    shortLabel: 'Suprimentos',
    description: 'Pedidos de suprimentos com anexo de planilha.',
    isDefault: false,
  },
] as const;

export type FacilitiesPilotWorkflowTypeId =
  (typeof FACILITIES_PILOT_WORKFLOWS)[number]['workflowTypeId'];

export const DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID: FacilitiesPilotWorkflowTypeId =
  'facilities_manutencao_solicitacoes_gerais';

export function resolveFacilitiesPilotWorkflowTypeId(
  input?: string | null,
): FacilitiesPilotWorkflowTypeId {
  if (
    input === 'facilities_manutencao_solicitacoes_gerais' ||
    input === 'facilities_solicitacao_suprimentos'
  ) {
    return input;
  }

  return DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID;
}

export function getFacilitiesPilotWorkflowConfig(workflowTypeId: string) {
  return FACILITIES_PILOT_WORKFLOWS.find((workflow) => workflow.workflowTypeId === workflowTypeId);
}
