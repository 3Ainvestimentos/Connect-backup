import type { Fase2cManifestEntry } from '../shared/types';

export const LOTE_05_GENTE_CICLO_VIDA_MOVIMENTACOES_MANIFEST: Fase2cManifestEntry[] = [
  {
    legacyWorkflowId: '98fUoidQBMm3MPW4NTic',
    workflowTypeId: 'gente_comunicacao_analise_pre_desligamento_acesso_lideres',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
    statusIdOverrides: {
      em_analise: [
        'iniciar_processo_analise',
        'em_analise_bi',
        'em_analise_financeiro',
        'em_analise_juridico',
        'em_analise_governanca',
        'reanalise_juridico',
      ],
    },
  },
  {
    legacyWorkflowId: 'Eqlgq3ZBINFo6TLONl9g',
    workflowTypeId: 'gente_comunicacao_alteracao_cargo_remuneracao_time_ou_equipe',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
    fieldIdOverrides: {
      email: ['email_lider', 'email_colaborador'],
    },
  },
  {
    legacyWorkflowId: 'IPWhvTC82Dv4nn9vC2Xa',
    workflowTypeId: 'gente_comunicacao_cadastro_novos_entrantes_demais_areas',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
  {
    legacyWorkflowId: 'Vz53Sn7cdupJpFVNA7X6',
    workflowTypeId: 'gente_comunicacao_solicitacao_desligamento_demais_areas_nao_comerciais',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
  {
    legacyWorkflowId: 'd3MLICQmG7qtsQMKMUUu',
    workflowTypeId: 'gente_comunicacao_cadastro_novos_entrantes_associado',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'preserve_legacy',
  },
  {
    legacyWorkflowId: 'jyH7H6FCjPMJ2MjCefQN',
    workflowTypeId: 'gente_comunicacao_alteracao_cadastral',
    lotId: 'lote_05_gente_ciclo_vida_movimentacoes',
    lotStatus: 'validated',
    stepStrategy: 'canonical_3_steps',
  },
];
