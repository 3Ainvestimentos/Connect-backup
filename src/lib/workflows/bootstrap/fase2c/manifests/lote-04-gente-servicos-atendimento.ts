import type { Fase2cManifestEntry } from '../shared/types';

export const LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST: Fase2cManifestEntry[] = [
  {
    legacyWorkflowId: '1tmzWIwCC21zxB3vaV5J',
    workflowTypeId: 'gente_comunicacao_fale_com_a_gente',
    lotId: 'lote_04_gente_servicos_atendimento',
    lotStatus: 'validated',
    stepStrategy: 'canonical_3_steps',
  },
  {
    legacyWorkflowId: 'NA1cQ6ejRgZhoB0ZMPY2',
    workflowTypeId: 'gente_comunicacao_servicos_plano_saude',
    lotId: 'lote_04_gente_servicos_atendimento',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
  {
    legacyWorkflowId: 'RABkxl7grAbuECLvvyWa',
    workflowTypeId: 'gente_comunicacao_comprovacao_ancord',
    lotId: 'lote_04_gente_servicos_atendimento',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
  {
    legacyWorkflowId: 'YVfXjlFxZciT4zaD5UAP',
    workflowTypeId: 'gente_comunicacao_solicitacao_abertura_vaga',
    lotId: 'lote_04_gente_servicos_atendimento',
    lotStatus: 'validated',
    stepStrategy: 'canonical_3_steps',
  },
  {
    legacyWorkflowId: 'q55MFr8p9Tbcbsh6kpm1',
    workflowTypeId: 'gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas',
    lotId: 'lote_04_gente_servicos_atendimento',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
];
