import {
  DEFAULT_FACILITIES_PILOT_WORKFLOW_TYPE_ID,
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

  it('accepts the two workflow ids enabled in etapa 6', () => {
    expect(
      resolveFacilitiesPilotWorkflowTypeId('facilities_manutencao_solicitacoes_gerais'),
    ).toBe('facilities_manutencao_solicitacoes_gerais');
    expect(resolveFacilitiesPilotWorkflowTypeId('facilities_solicitacao_suprimentos')).toBe(
      'facilities_solicitacao_suprimentos',
    );
  });
});
