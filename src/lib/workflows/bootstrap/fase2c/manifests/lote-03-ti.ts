import type { Fase2cManifestEntry } from '../shared/types';

export const LOTE_03_TI_MANIFEST: Fase2cManifestEntry[] = [
  {
    legacyWorkflowId: '1FEfsHnEALOAETwq6H3S',
    workflowTypeId: 'ti_problemas_hardware',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: '2bsVIVhd22bV3bN5rp7W',
    workflowTypeId: 'ti_solicitacao_compra_equipamento',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
    statusIdOverrides: {
      em_execucao: ['em_aprovacao', 'em_execucao'],
    },
  },
  {
    legacyWorkflowId: 'BhCq9faCPTmGEXjYCg1t',
    workflowTypeId: 'ti_problemas_rede',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'L1E0hJpRaJ3xFYufilyG',
    workflowTypeId: 'ti_sugestoes_3a_riva_connect',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'LL9f3hMXcv4xVbyy3Nne',
    workflowTypeId: 'ti_problemas_software',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'bKomJE5rZo7T4jV6xebF',
    workflowTypeId: 'ti_solicitacao_compra_software_sistema',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'j6DVhDS9mVQXmwDjptNs',
    workflowTypeId: 'ti_alteracao_email_xp',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'ryj6rF4H2gBJUJiaKe8t',
    workflowTypeId: 'ti_padronizacao_email_codigo_xp',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'sgL9XCECAOreWgGalI2m',
    workflowTypeId: 'ti_reset_senha',
    lotId: 'lote_03_ti',
    lotStatus: 'enabled',
  },
];

