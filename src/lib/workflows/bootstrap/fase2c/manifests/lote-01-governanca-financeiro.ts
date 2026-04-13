import type { Fase2cManifestEntry } from '../shared/types';

export const LOTE_01_GOVERNANCA_FINANCEIRO_MANIFEST: Fase2cManifestEntry[] = [
  {
    legacyWorkflowId: '2bnzgKX37heY7P9jK6LP',
    workflowTypeId: 'governanca_espelhamento_caso_unico',
    lotId: 'lote_01_governanca_financeiro',
    lotStatus: 'enabled',
    stepStrategy: 'canonical_3_steps',
    fieldIdOverrides: {
      campo_3: ['email_lider_visualizado'],
      campo_4: ['email_lider_visualiza'],
      campo_5: ['codigo_assessor_visualizado'],
      campo_6: ['codigo_assessor_visualiza'],
    },
  },
  {
    legacyWorkflowId: 'a5M0z8iYLJquGmr2VSqO',
    workflowTypeId: 'governanca_espelhamento_em_lote',
    lotId: 'lote_01_governanca_financeiro',
    lotStatus: 'enabled',
    stepStrategy: 'canonical_3_steps',
    fieldIdOverrides: {
      email_lider: ['email_lider_visualizado', 'email_lider_visualiza'],
    },
  },
  {
    legacyWorkflowId: 'anUoZTYU9wxa2cEQCjlJ',
    workflowTypeId: 'financeiro_solicitacao_pagamentos',
    lotId: 'lote_01_governanca_financeiro',
    lotStatus: 'enabled',
    stepStrategy: 'preserve_legacy',
  },
];
