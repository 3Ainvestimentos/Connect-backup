import type { Fase2cManifestEntry } from '../shared/types';

export const LOTE_02_MARKETING_MANIFEST: Fase2cManifestEntry[] = [
  {
    legacyWorkflowId: '0zUsgLc1UFRHVZQtFQ3o',
    workflowTypeId: 'marketing_evento',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: '8SlrLRDUXs86Kz7lNwu9',
    workflowTypeId: 'marketing_sugestao_3a_riva_store',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'MLAqXidcqSfg6dtdynVl',
    workflowTypeId: 'marketing_arte_material_grafico',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
    fieldIdOverrides: {
      imagem_referencia: ['possui_imagem_referencia', 'imagem_referencia_arquivo'],
    },
  },
  {
    legacyWorkflowId: 'OA1RjWNmKby613e6YgQ9',
    workflowTypeId: 'marketing_revisao_materiais_apresentacoes',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'VOs3jGJHQl18xyj4XrES',
    workflowTypeId: 'marketing_assinatura_email_cartao_visita_cartao_visita_digital',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'Z415O27iyMAOS9xp7Vw4',
    workflowTypeId: 'marketing_acoes_marketing',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
  {
    legacyWorkflowId: 'xFcNgbswYXnaB1gxqMvf',
    workflowTypeId: 'marketing_solicitacao_patrocinios',
    lotId: 'lote_02_marketing',
    lotStatus: 'enabled',
  },
];

