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
  {
    workflowTypeId: 'facilities_solicitacao_compras',
    label: 'Solicitacao de compras',
    shortLabel: 'Compras',
    description: 'Pedidos de compras com anexo complementar opcional.',
    isDefault: false,
  },
] as const;

export type FacilitiesPilotWorkflowTypeId =
  (typeof FACILITIES_PILOT_WORKFLOWS)[number]['workflowTypeId'];

export const DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID: FacilitiesPilotWorkflowTypeId =
  'facilities_manutencao_solicitacoes_gerais';

const FACILITIES_PILOT_WORKFLOW_IDS = FACILITIES_PILOT_WORKFLOWS.map(
  (workflow) => workflow.workflowTypeId,
);

export function resolveFacilitiesPilotWorkflowTypeId(
  input?: string | null,
): FacilitiesPilotWorkflowTypeId {
  if (
    input &&
    FACILITIES_PILOT_WORKFLOW_IDS.includes(input as FacilitiesPilotWorkflowTypeId)
  ) {
    return input as FacilitiesPilotWorkflowTypeId;
  }

  return DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID;
}

export function getFacilitiesPilotWorkflowConfig(workflowTypeId: string) {
  return FACILITIES_PILOT_WORKFLOWS.find((workflow) => workflow.workflowTypeId === workflowTypeId);
}
