import {
  DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
  FACILITIES_PILOT_WORKFLOWS,
  getFacilitiesPilotWorkflowConfig,
  resolveFacilitiesPilotWorkflowTypeId,
} from '../workflow-registry';

describe('workflow-registry', () => {
  it('resolves the default workflow when the input is missing or unsupported', () => {
    expect(resolveFacilitiesPilotWorkflowTypeId(undefined)).toBe(
      DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
    );
    expect(resolveFacilitiesPilotWorkflowTypeId('workflow_invalido')).toBe(
      DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
    );
  });

  it('accepts every workflow id registered for the pilot', () => {
    expect(
      resolveFacilitiesPilotWorkflowTypeId('facilities_manutencao_solicitacoes_gerais'),
    ).toBe('facilities_manutencao_solicitacoes_gerais');
    expect(resolveFacilitiesPilotWorkflowTypeId('facilities_solicitacao_suprimentos')).toBe(
      'facilities_solicitacao_suprimentos',
    );
    expect(resolveFacilitiesPilotWorkflowTypeId('facilities_solicitacao_compras')).toBe(
      'facilities_solicitacao_compras',
    );
    expect(FACILITIES_PILOT_WORKFLOWS).toHaveLength(3);
  });

  it('keeps getFacilitiesPilotWorkflowConfig as a pure optional lookup', () => {
    expect(
      getFacilitiesPilotWorkflowConfig('facilities_solicitacao_compras'),
    ).toMatchObject({
      workflowTypeId: 'facilities_solicitacao_compras',
      shortLabel: 'Compras',
    });
    expect(getFacilitiesPilotWorkflowConfig('workflow_invalido')).toBeUndefined();
  });
});
